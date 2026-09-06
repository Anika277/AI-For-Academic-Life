// Applies a single AI-agent action to the live course draft.
//
// This is the last line of defense before anything the model said ends
// up in React state: the backend already checked the *shape* of each
// action (see backend/utils/agentSchema.js), but only this layer has
// the actual, current course object, so this is where we check
// *semantic* validity — does CLO2 really exist, is week_position in
// range, is bloom_level sane — right before mutating anything.
//
// Every applier either returns a brand-new course object (never mutates
// the input) or throws a short, teacher-readable Error. Throwing never
// corrupts `course`: the caller applies actions one at a time against
// the previous good state, so a single bad action just gets skipped.

import { emptyCLO, emptyWeek, sampleCourse, emptyCourse } from "./course";

const VALID_BLOOM = [1, 2, 3, 4, 5, 6];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clampAssessmentNumber(n, label) {
  assert(typeof n === "number" && Number.isFinite(n), `${label} must be a number.`);
  return Math.min(100, Math.max(0, Math.round(n)));
}

const appliers = {
  set_field(course, action) {
    const { field, value } = action;
    assert(["code", "title", "credit_hours", "objectives"].includes(field), `Unknown field "${field}".`);
    if (field === "credit_hours") {
      assert(typeof value === "number" && Number.isFinite(value) && value >= 0, "Credit hours must be a non-negative number.");
    } else {
      assert(typeof value === "string", `${field} must be text.`);
    }
    return { ...course, [field]: value };
  },

  set_prerequisites(course, action) {
    assert(Array.isArray(action.value), "Prerequisites must be a list.");
    const cleaned = action.value.map((v) => String(v).trim()).filter(Boolean);
    return { ...course, prerequisites: cleaned };
  },

  add_clo(course, action) {
    assert(typeof action.text === "string" && action.text.trim(), "New CLO needs wording.");
    assert(typeof action.po === "string" && action.po.trim(), "New CLO needs a PO mapping.");
    assert(VALID_BLOOM.includes(action.bloom_level), "New CLO needs a Bloom's level 1-6.");
    const base = emptyCLO(course.clos);
    const newClo = { ...base, text: action.text.trim(), po: action.po.trim(), bloom_level: action.bloom_level };
    return { ...course, clos: [...course.clos, newClo] };
  },

  update_clo(course, action) {
    const idx = course.clos.findIndex((c) => c.id === action.id);
    assert(idx !== -1, `No CLO with id "${action.id}" exists in the current draft.`);
    if (action.bloom_level !== undefined) {
      assert(VALID_BLOOM.includes(action.bloom_level), "bloom_level must be 1-6.");
    }
    const patch = {};
    if (typeof action.text === "string" && action.text.trim()) patch.text = action.text.trim();
    if (typeof action.po === "string" && action.po.trim()) patch.po = action.po.trim();
    if (action.bloom_level !== undefined) patch.bloom_level = action.bloom_level;
    const clos = course.clos.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    return { ...course, clos };
  },

  remove_clo(course, action) {
    assert(course.clos.length > 1, "Can't remove the last remaining CLO — the draft needs at least one.");
    const exists = course.clos.some((c) => c.id === action.id);
    assert(exists, `No CLO with id "${action.id}" exists in the current draft.`);
    const removedId = action.id;
    const clos = course.clos.filter((c) => c.id !== removedId);
    // Keep the weekly plan internally consistent: drop references to a
    // CLO that no longer exists rather than leaving a dangling tag that
    // would silently fail the completeness check with no clear cause.
    const weekly_plan = course.weekly_plan.map((w) => ({
      ...w,
      clos: (w.clos || []).filter((id) => id !== removedId),
    }));
    return { ...course, clos, weekly_plan };
  },

  add_week(course, action) {
    assert(typeof action.weeks === "string" && action.weeks.trim(), "New week entry needs a week label.");
    assert(typeof action.topics === "string" && action.topics.trim(), "New week entry needs topics.");
    const knownIds = new Set(course.clos.map((c) => c.id));
    const clos = Array.isArray(action.clos) ? action.clos.filter((id) => knownIds.has(id)) : [];
    const newWeek = { ...emptyWeek(), weeks: action.weeks.trim(), topics: action.topics.trim(), clos };
    return { ...course, weekly_plan: [...course.weekly_plan, newWeek] };
  },

  update_week(course, action) {
    const idx = action.week_position - 1;
    assert(idx >= 0 && idx < course.weekly_plan.length, `There is no week entry at position ${action.week_position}.`);
    const patch = {};
    if (typeof action.weeks === "string" && action.weeks.trim()) patch.weeks = action.weeks.trim();
    if (typeof action.topics === "string" && action.topics.trim()) patch.topics = action.topics.trim();
    if (Array.isArray(action.clos)) {
      const knownIds = new Set(course.clos.map((c) => c.id));
      patch.clos = action.clos.filter((id) => knownIds.has(id));
    }
    const weekly_plan = course.weekly_plan.map((w, i) => (i === idx ? { ...w, ...patch } : w));
    return { ...course, weekly_plan };
  },

  remove_week(course, action) {
    const idx = action.week_position - 1;
    assert(idx >= 0 && idx < course.weekly_plan.length, `There is no week entry at position ${action.week_position}.`);
    const weekly_plan = course.weekly_plan.filter((_, i) => i !== idx);
    return { ...course, weekly_plan };
  },

  set_assessment(course, action) {
    const patch = {};
    for (const key of ["class_performance", "quizzes", "mid", "final"]) {
      if (action[key] !== undefined) {
        patch[key] = clampAssessmentNumber(action[key], key);
      }
    }
    assert(Object.keys(patch).length > 0, "No assessment fields were provided.");
    return { ...course, assessment_breakdown: { ...course.assessment_breakdown, ...patch } };
  },

  load_sample() {
    return sampleCourse();
  },

  clear_course() {
    return emptyCourse();
  },
};

/**
 * Applies one action to `course`, returning a new course object.
 * Throws an Error with a short, teacher-readable message on any
 * malformed or semantically invalid action — callers should catch this
 * per-action so one bad action doesn't stop the rest from applying.
 */
export function applyAgentAction(course, action) {
  if (!action || typeof action !== "object" || typeof action.type !== "string") {
    throw new Error("Received a malformed action.");
  }
  const applier = appliers[action.type];
  if (!applier) {
    throw new Error(`Unknown action type "${action.type}".`);
  }
  return applier(course, action);
}

/**
 * Applies a list of actions in order against a starting course object.
 * Returns { course, applied, failures } where `applied` is a list of
 * short human-readable descriptions of what changed, and `failures` is
 * a list of { action, message } for anything that was skipped.
 * A failure never rolls back or blocks the actions after it.
 */
export function applyAgentActions(startingCourse, actions) {
  let course = startingCourse;
  const applied = [];
  const failures = [];

  for (const action of actions || []) {
    try {
      course = applyAgentAction(course, action);
      applied.push(describeAction(action));
    } catch (err) {
      failures.push({ action, message: err.message });
    }
  }

  return { course, applied, failures };
}

function describeAction(action) {
  switch (action.type) {
    case "set_field":
      return `set ${action.field} to "${action.value}"`;
    case "set_prerequisites":
      return `updated prerequisites`;
    case "add_clo":
      return `added a new CLO`;
    case "update_clo":
      return `updated ${action.id}`;
    case "remove_clo":
      return `removed ${action.id}`;
    case "add_week":
      return `added a weekly plan entry (${action.weeks})`;
    case "update_week":
      return `updated weekly plan entry #${action.week_position}`;
    case "remove_week":
      return `removed weekly plan entry #${action.week_position}`;
    case "set_assessment":
      return `updated assessment breakdown`;
    case "load_sample":
      return `loaded the sample course`;
    case "clear_course":
      return `cleared the draft`;
    default:
      return action.type;
  }
}
