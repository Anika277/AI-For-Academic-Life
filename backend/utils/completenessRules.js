// Pure rule-based structural completeness checker.
// NO AI calls happen here — deliberately, per MVP scope. This must be
// deterministic, instant, and free to run on every keystroke if the
// frontend wants live progress feedback.
//
// Input: a course object matching the locked DATA SCHEMA.
// Output: { checklist: [...], percent: number }
//
// Each checklist item: { id, label, passed, detail }
// `detail` explains *why* something failed — this is what makes the
// Progress Tracker actionable instead of just a percentage.

const REQUIRED_TOP_LEVEL_FIELDS = [
  { key: "code", label: "Course code" },
  { key: "title", label: "Course title" },
  { key: "credit_hours", label: "Credit hours" },
  { key: "objectives", label: "Course objectives" },
];

const REQUIRED_ASSESSMENT_KEYS = [
  "class_performance",
  "quizzes",
  "mid",
  "final",
];

const VALID_BLOOM_LEVELS = [1, 2, 3, 4, 5, 6];

export function checkCompleteness(course) {
  const checklist = [];

  if (!course || typeof course !== "object") {
    return {
      checklist: [
        {
          id: "root",
          label: "Course object",
          passed: false,
          detail: "No course data submitted.",
        },
      ],
      percent: 0,
    };
  }

  // 1. Basic metadata fields present and non-empty
  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    const value = course[field.key];
    const passed =
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(typeof value === "number" && Number.isNaN(value));
    checklist.push({
      id: `field_${field.key}`,
      label: field.label,
      passed,
      detail: passed ? "" : `${field.label} is missing.`,
    });
  }

  // 2. Prerequisites is an array (can be empty, but must exist as array)
  const prereqsOk = Array.isArray(course.prerequisites);
  checklist.push({
    id: "prerequisites_array",
    label: "Prerequisites field present",
    passed: prereqsOk,
    detail: prereqsOk ? "" : "Prerequisites should be an array (can be empty).",
  });

  // 3. CLOs exist, and each is well-formed
  const clos = Array.isArray(course.clos) ? course.clos : [];
  const closExist = clos.length > 0;
  checklist.push({
    id: "clos_exist",
    label: "At least one CLO defined",
    passed: closExist,
    detail: closExist ? "" : "No CLOs (Course Learning Outcomes) defined.",
  });

  if (closExist) {
    const closIds = new Set();
    const malformedClos = [];

    for (const clo of clos) {
      const hasId = typeof clo.id === "string" && clo.id.trim() !== "";
      const hasText = typeof clo.text === "string" && clo.text.trim() !== "";
      const hasPO = typeof clo.po === "string" && clo.po.trim() !== "";
      const hasValidBloom =
        typeof clo.bloom_level === "number" &&
        VALID_BLOOM_LEVELS.includes(clo.bloom_level);

      if (hasId) closIds.add(clo.id);

      if (!hasId || !hasText || !hasPO || !hasValidBloom) {
        malformedClos.push(clo.id || "(missing id)");
      }
    }

    const closMappingOk = malformedClos.length === 0;
    checklist.push({
      id: "clo_po_bloom_mapping",
      label: "CLO → PO → Bloom's level mapping complete for all CLOs",
      passed: closMappingOk,
      detail: closMappingOk
        ? ""
        : `Incomplete mapping (missing id/text/po/bloom_level) for: ${malformedClos.join(
            ", "
          )}.`,
    });

    // 4. Weekly plan covers weeks AND every referenced CLO tag is real,
    //    AND every defined CLO is referenced at least once somewhere.
    const weeklyPlan = Array.isArray(course.weekly_plan)
      ? course.weekly_plan
      : [];
    const weeklyPlanExists = weeklyPlan.length > 0;
    checklist.push({
      id: "weekly_plan_exists",
      label: "Weekly plan defined",
      passed: weeklyPlanExists,
      detail: weeklyPlanExists ? "" : "No weekly plan entries found.",
    });

    if (weeklyPlanExists) {
      const referencedClos = new Set();
      const badWeekEntries = [];

      for (const week of weeklyPlan) {
        const hasWeeks =
          typeof week.weeks === "string" && week.weeks.trim() !== "";
        const hasTopics =
          typeof week.topics === "string" && week.topics.trim() !== "";
        const weekClos = Array.isArray(week.clos) ? week.clos : [];
        const hasClos = weekClos.length > 0;

        if (!hasWeeks || !hasTopics || !hasClos) {
          badWeekEntries.push(week.weeks || "(unlabeled week)");
        }

        for (const closRef of weekClos) {
          referencedClos.add(closRef);
        }
      }

      const weekEntriesOk = badWeekEntries.length === 0;
      checklist.push({
        id: "weekly_plan_entries_complete",
        label: "Every weekly plan entry has weeks, topics, and CLO tags",
        passed: weekEntriesOk,
        detail: weekEntriesOk
          ? ""
          : `Incomplete entries for week(s): ${badWeekEntries.join(", ")}.`,
      });

      // Every CLO referenced in weekly_plan must exist in clos[]
      const unknownRefs = [...referencedClos].filter(
        (ref) => !closIds.has(ref)
      );
      const noUnknownRefs = unknownRefs.length === 0;
      checklist.push({
        id: "weekly_plan_clo_refs_valid",
        label: "Weekly plan CLO tags reference defined CLOs",
        passed: noUnknownRefs,
        detail: noUnknownRefs
          ? ""
          : `Weekly plan references undefined CLO id(s): ${unknownRefs.join(
              ", "
            )}.`,
      });

      // Every defined CLO should be covered by at least one week
      const uncoveredClos = [...closIds].filter(
        (id) => !referencedClos.has(id)
      );
      const allClosCovered = uncoveredClos.length === 0;
      checklist.push({
        id: "all_clos_covered_in_weeks",
        label: "Every CLO is covered by at least one week",
        passed: allClosCovered,
        detail: allClosCovered
          ? ""
          : `CLO(s) never appear in the weekly plan: ${uncoveredClos.join(
              ", "
            )}.`,
      });
    }
  }

  // 5. Assessment breakdown: all required keys present and sums to 100
  const assessment = course.assessment_breakdown || {};
  const missingAssessmentKeys = REQUIRED_ASSESSMENT_KEYS.filter(
    (key) => typeof assessment[key] !== "number"
  );
  const assessmentKeysOk = missingAssessmentKeys.length === 0;
  checklist.push({
    id: "assessment_keys_present",
    label: "Assessment breakdown has all required components",
    passed: assessmentKeysOk,
    detail: assessmentKeysOk
      ? ""
      : `Missing or non-numeric assessment field(s): ${missingAssessmentKeys.join(
          ", "
        )}.`,
  });

  if (assessmentKeysOk) {
    const total = REQUIRED_ASSESSMENT_KEYS.reduce(
      (sum, key) => sum + assessment[key],
      0
    );
    const sumsTo100 = total === 100;
    checklist.push({
      id: "assessment_sums_100",
      label: "Assessment marks sum to 100",
      passed: sumsTo100,
      detail: sumsTo100
        ? ""
        : `Assessment components sum to ${total}, not 100.`,
    });
  }

  const passedCount = checklist.filter((item) => item.passed).length;
  const percent = Math.round((passedCount / checklist.length) * 100);

  return { checklist, percent };
}