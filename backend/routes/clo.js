import express from "express";
import { callGrokJSON } from "../services/grokClient.js";

const router = express.Router();

// Standard Bloom's Taxonomy verb reference, given to Grok as grounding
// so its judgment is consistent and explainable rather than vibes-based.
const BLOOM_REFERENCE = `Bloom's Taxonomy levels and their typical action verbs:
1 = Remember (define, list, recall, name, identify)
2 = Understand (explain, summarize, describe, classify, discuss)
3 = Apply (apply, implement, use, execute, demonstrate, solve)
4 = Analyze (analyze, differentiate, compare, examine, break down)
5 = Evaluate (evaluate, justify, critique, assess, argue)
6 = Create (design, develop, construct, formulate, propose, compose)`;

const SYSTEM_PROMPT = `You are an OBE (Outcome-Based Education) curriculum quality reviewer for a university CSE department. You review Course Learning Outcomes (CLOs) to check whether each CLO's wording actually matches its claimed Bloom's Taxonomy level.

${BLOOM_REFERENCE}

For each CLO given:
- Judge whether the verb and cognitive demand of the CLO's wording genuinely matches its claimed bloom_level. A CLO claiming level 6 ("Create") but only asking students to "list" components is a mismatch. A CLO claiming level 2 ("Understand") that actually asks students to design a system is also a mismatch (understated, not just overstated).
- If bloom_valid is false, or the wording is vague/weak even if technically valid, provide a concrete improved rewording in "suggestion" that uses an appropriate Bloom-aligned verb for the claimed level. If the CLO is already excellent, suggestion can be an empty string.

Respond ONLY with a JSON object of this exact shape, one entry per CLO, in the same order given:
{
  "feedback": [
    { "clo_id": "string", "bloom_valid": true, "suggestion": "string" }
  ]
}`;

function buildUserPrompt(course) {
  const clos = (course.clos || []).map((c) => ({
    id: c.id,
    text: c.text,
    claimed_bloom_level: c.bloom_level,
  }));

  return JSON.stringify({ clos });
}

// POST /api/check-clo
// Body: { course: {...} }
// Returns: { feedback: [{ clo_id, bloom_valid, suggestion }] }
router.post("/", async (req, res) => {
  const { course } = req.body;

  if (!course || !Array.isArray(course.clos) || course.clos.length === 0) {
    return res.status(400).json({
      error: "Request body must include a 'course' object with a non-empty 'clos' array.",
    });
  }

  try {
    const userPrompt = buildUserPrompt(course);
    const parsed = await callGrokJSON(SYSTEM_PROMPT, userPrompt);

    if (!Array.isArray(parsed.feedback)) {
      throw new Error("Grok response missing 'feedback' array.");
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[check-clo] error:", err);
    return res.status(502).json({
      error: "CLO quality check failed (Grok call or parsing error).",
      detail: err.message,
    });
  }
});

export default router;