// Structural validation for what Grok sends back from /api/agent/chat.
//
// This is deliberately a *shallow* check: "is this JSON well-formed and
// does each action look like one of the allowed shapes with the right
// primitive types". It does NOT check semantic validity against the
// actual course draft (e.g. "does CLO2 exist") — that happens on the
// frontend, right before the action is applied to real React state,
// because that's the only place the authoritative live draft lives.
//
// Two layers of validation (here + frontend) means a malformed or
// hallucinated action gets caught before it can corrupt the teacher's
// draft, no matter which layer would have missed it alone.

export const ACTION_TYPES = [
  "set_field",
  "set_prerequisites",
  "add_clo",
  "update_clo",
  "remove_clo",
  "add_week",
  "update_week",
  "remove_week",
  "set_assessment",
  "load_sample",
  "clear_course",
];

const SET_FIELD_KEYS = ["code", "title", "credit_hours", "objectives"];
const ASSESSMENT_KEYS = ["class_performance", "quizzes", "mid", "final"];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim() !== "";
}

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Validates a single action object's shape. Returns an error string, or
 * null if it looks well-formed.
 */
function validateAction(action, index) {
  if (!isPlainObject(action)) {
    return `actions[${index}] is not an object.`;
  }
  if (!ACTION_TYPES.includes(action.type)) {
    return `actions[${index}].type "${action.type}" is not one of the allowed action types.`;
  }

  switch (action.type) {
    case "set_field":
      if (!SET_FIELD_KEYS.includes(action.field)) {
        return `actions[${index}].field must be one of ${SET_FIELD_KEYS.join(", ")}.`;
      }
      if (action.field === "credit_hours" && typeof action.value !== "number") {
        return `actions[${index}].value must be a number for credit_hours.`;
      }
      if (action.field !== "credit_hours" && typeof action.value !== "string") {
        return `actions[${index}].value must be a string for ${action.field}.`;
      }
      return null;

    case "set_prerequisites":
      if (!Array.isArray(action.value) || !action.value.every((v) => typeof v === "string")) {
        return `actions[${index}].value must be an array of strings.`;
      }
      return null;

    case "add_clo":
      if (!isNonEmptyString(action.text)) return `actions[${index}].text is required.`;
      if (!isNonEmptyString(action.po)) return `actions[${index}].po is required.`;
      if (!Number.isInteger(action.bloom_level) || action.bloom_level < 1 || action.bloom_level > 6) {
        return `actions[${index}].bloom_level must be an integer 1-6.`;
      }
      return null;

    case "update_clo":
      if (!isNonEmptyString(action.id)) return `actions[${index}].id is required.`;
      if (
        action.bloom_level !== undefined &&
        (!Number.isInteger(action.bloom_level) || action.bloom_level < 1 || action.bloom_level > 6)
      ) {
        return `actions[${index}].bloom_level must be an integer 1-6 if provided.`;
      }
      return null;

    case "remove_clo":
      if (!isNonEmptyString(action.id)) return `actions[${index}].id is required.`;
      return null;

    case "add_week":
      if (!isNonEmptyString(action.weeks)) return `actions[${index}].weeks is required.`;
      if (!isNonEmptyString(action.topics)) return `actions[${index}].topics is required.`;
      if (action.clos !== undefined && (!Array.isArray(action.clos) || !action.clos.every((c) => typeof c === "string"))) {
        return `actions[${index}].clos must be an array of strings if provided.`;
      }
      return null;

    case "update_week":
    case "remove_week":
      if (!Number.isInteger(action.week_position) || action.week_position < 1) {
        return `actions[${index}].week_position must be a positive integer.`;
      }
      return null;

    case "set_assessment":
      if (!ASSESSMENT_KEYS.some((k) => action[k] !== undefined)) {
        return `actions[${index}] must set at least one of ${ASSESSMENT_KEYS.join(", ")}.`;
      }
      for (const k of ASSESSMENT_KEYS) {
        if (action[k] !== undefined && typeof action[k] !== "number") {
          return `actions[${index}].${k} must be a number.`;
        }
      }
      return null;

    case "load_sample":
    case "clear_course":
      return null;

    default:
      return `actions[${index}] has unhandled type.`;
  }
}

/**
 * Validates the full { reply, actions } payload returned by Grok.
 * Returns { ok: true, value } or { ok: false, error }.
 */
export function validateAgentPayload(payload) {
  if (!isPlainObject(payload)) {
    return { ok: false, error: "Top-level response must be a JSON object." };
  }
  if (!isNonEmptyString(payload.reply)) {
    return { ok: false, error: "'reply' must be a non-empty string." };
  }
  if (payload.actions === undefined) {
    payload.actions = [];
  }
  if (!Array.isArray(payload.actions)) {
    return { ok: false, error: "'actions' must be an array." };
  }
  for (let i = 0; i < payload.actions.length; i++) {
    const err = validateAction(payload.actions[i], i);
    if (err) {
      return { ok: false, error: err };
    }
  }
  return { ok: true, value: { reply: payload.reply, actions: payload.actions } };
}
