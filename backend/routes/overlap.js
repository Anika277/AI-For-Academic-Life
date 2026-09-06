import express from "express";
import { callGrokJSON } from "../services/grokClient.js";
import { existingCourses } from "../data/existingCourses.js";

const router = express.Router();

const SYSTEM_PROMPT = `You are an academic curriculum reviewer at a Computer Science and Engineering department. Your job is to compare a proposed new course against a list of existing courses and identify topical/CLO overlap.

For EACH existing course provided, estimate an overlap_percent (0-100, integer) representing how much the new course's topics and CLOs duplicate that existing course's content. Also list the specific overlapping_topics (short phrases, max 5 per course) that justify the score. If there is no meaningful overlap, return overlap_percent: 0 and an empty overlapping_topics array for that course — do not skip it.

Be a rigorous, conservative reviewer. Genuinely overlapping foundational topics (e.g. both courses teach "process scheduling") should be flagged even if course titles differ. Superficial keyword matches without real conceptual overlap should NOT be flagged.

Respond ONLY with a JSON object of this exact shape, one entry per existing course, in the same order given:
{
  "results": [
    { "course_code": "string", "overlap_percent": 0, "overlapping_topics": ["string"] }
  ]
}`;

function buildUserPrompt(newCourse) {
  const newCourseSummary = {
    code: newCourse.code,
    title: newCourse.title,
    topics: (newCourse.weekly_plan || [])
      .map((w) => w.topics)
      .filter(Boolean)
      .join("; "),
    clos: (newCourse.clos || []).map((c) => c.text).filter(Boolean).join("; "),
  };

  return JSON.stringify({
    new_course: newCourseSummary,
    existing_courses: existingCourses,
  });
}

// POST /api/check-overlap
// Body: { course: {...} }
// Returns: { results: [{ course_code, overlap_percent, overlapping_topics }] }
router.post("/", async (req, res) => {
  const { course } = req.body;

  if (!course) {
    return res.status(400).json({
      error: "Request body must include a 'course' object.",
    });
  }

  try {
    const userPrompt = buildUserPrompt(course);
    const parsed = await callGrokJSON(SYSTEM_PROMPT, userPrompt);

    if (!Array.isArray(parsed.results)) {
      throw new Error("Grok response missing 'results' array.");
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[check-overlap] error:", err);
    return res.status(502).json({
      error: "Overlap check failed (Grok call or parsing error).",
      detail: err.message,
    });
  }
});

export default router;