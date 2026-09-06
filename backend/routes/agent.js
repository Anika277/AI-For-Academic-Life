import express from "express";
import { callGrokJSON } from "../services/grokClient.js";
import { existingCourses } from "../data/existingCourses.js";
import { validateAgentPayload, ACTION_TYPES } from "../utils/agentSchema.js";

const router = express.Router();

// Same reference table used by the CLO checker, so the agent judges/edits
// Bloom's levels the exact same way the rest of the app does.
const BLOOM_REFERENCE = `Bloom's Taxonomy levels and their typical action verbs:
1 = Remember (define, list, recall, name, identify)
2 = Understand (explain, summarize, describe, classify, discuss)
3 = Apply (apply, implement, use, execute, demonstrate, solve)
4 = Analyze (analyze, differentiate, compare, examine, break down)
5 = Evaluate (evaluate, justify, critique, assess, argue)
6 = Create (design, develop, construct, formulate, propose, compose)`;

// The ONLY things the agent is allowed to do to the draft. Kept flat
// (no nested objects) because flat JSON is far more reliable to get out
// of an LLM in json_object mode than deep nesting. This list is mirrored
// in frontend/src/utils/agentActions.js, which is what actually mutates
// React state — this route only checks that Grok's output roughly fits
// the shape before it's ever sent to the browser.
const ACTION_SCHEMA_DOC = `You may propose changes to the course draft ONLY using this exact set of action objects.
Every action must have a "type" field set to one of: ${ACTION_TYPES.join(", ")}.

- set_field            { "type": "set_field", "field": "code" | "title" | "credit_hours" | "objectives", "value": <string or number matching the field> }
- set_prerequisites    { "type": "set_prerequisites", "value": ["CSE 3117", ...] }   // full replacement list
- add_clo              { "type": "add_clo", "text": "string", "po": "e.g. 1(a)", "bloom_level": 1-6 }
- update_clo           { "type": "update_clo", "id": "CLO2", "text"?: "string", "po"?: "string", "bloom_level"?: 1-6 }
- remove_clo           { "type": "remove_clo", "id": "CLO2" }
- add_week             { "type": "add_week", "weeks": "e.g. 9-10", "topics": "string", "clos"?: ["CLO1"] }
- update_week          { "type": "update_week", "week_position": 1-based position of the row in the weekly plan, "weeks"?: "string", "topics"?: "string", "clos"?: ["CLO1"] }
- remove_week          { "type": "remove_week", "week_position": 1-based position of the row to remove }
- set_assessment       { "type": "set_assessment", "class_performance"?: number, "quizzes"?: number, "mid"?: number, "final"?: number }
- load_sample          { "type": "load_sample" }   // replaces the whole draft with the built-in demo course
- clear_course         { "type": "clear_course" }  // resets the whole draft to blank

Rules for actions:
- Only emit an action when the teacher's message is clearly an instruction to change the draft (e.g. "add a CLO for...", "set credit hours to 4", "change CLO2 to...", "remove week 3", "start over"). Answering a question is NOT an instruction — emit no actions for those.
- Never invent a CLO id, week position, or field value that wasn't either given by the teacher or already present in the current draft JSON below.
- If a request is ambiguous (e.g. "fix the weak CLO" without saying which one), do not guess — ask a clarifying question in "reply" and emit no actions.
- "credit_hours" is a number. "bloom_level" is an integer 1-6. Assessment fields are numbers 0-100.
- Prefer several small, precise actions over one large one, e.g. two update_clo actions rather than rewriting the whole clos array in prose.`;

function buildSystemPrompt() {
  return `You are the in-app assistant for "Curriculum Desk", an OBE (Outcome-Based Education) new-course drafting tool for the AUST CSE department. A course coordinator/teacher is drafting a new course syllabus and chatting with you while they work.

Your two jobs, and only these two jobs:
1. Answer questions accurately — about OBE/CLOs/Bloom's Taxonomy, about how this tool works, or about the specific course draft currently on their screen (given to you as JSON below on every turn). Ground every factual claim about "their course" strictly in that JSON — never invent CLOs, weeks, or values that aren't in it.
2. When the teacher gives an explicit editing instruction, translate it into the smallest correct set of actions from the schema below, and briefly confirm in "reply" what you changed.

${BLOOM_REFERENCE}

${ACTION_SCHEMA_DOC}

You do not have access to anything about the department, students, or policies beyond what's given to you here — if asked something you can't ground in this context (e.g. "will the department approve this?"), say so plainly rather than guessing.

Respond ONLY with a JSON object of this exact shape, nothing else, no markdown fences:
{
  "reply": "string — what you say back to the teacher in the chat",
  "actions": []  // array of zero or more action objects from the schema above, in the order they should be applied
}`;
}

function buildUserPrompt({ course, history }) {
  return JSON.stringify({
    current_course_draft: course,
    // Small curriculum context so questions like "does this overlap with
    // anything?" can get a sane conversational answer without a full
    // overlap-check call. This is informational only — the agent should
    // still point teachers to the real "Analyze draft" overlap check for
    // an authoritative score.
    existing_courses_reference: existingCourses.map((c) => ({
      code: c.code,
      title: c.title,
    })),
    conversation_so_far: history,
  });
}

/**
 * Asks Grok for a chat turn and validates the shape of what comes back.
 * On a malformed (but successfully-returned) response, gives the model
 * exactly one chance to correct itself before giving up gracefully.
 */
async function getAgentTurn({ course, history }) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({ course, history });

  let parsed = await callGrokJSON(systemPrompt, userPrompt);
  let validation = validateAgentPayload(parsed);

  if (!validation.ok) {
    const repairPrompt = `Your previous reply did not match the required JSON shape. Error: ${validation.error}
Here is exactly what you sent: ${JSON.stringify(parsed)}
Send ONLY a corrected JSON object of the shape { "reply": string, "actions": [...] }, following the action schema exactly. If you're unsure an edit is warranted, send an empty "actions" array and explain in "reply" instead of guessing.`;

    parsed = await callGrokJSON(systemPrompt, `${userPrompt}\n\n${repairPrompt}`);
    validation = validateAgentPayload(parsed);
  }

  if (!validation.ok) {
    // Fail safe: never let a malformed model response reach the browser
    // as actions. Degrade to a plain reply with no actions instead of
    // erroring the whole chat out.
    return {
      reply:
        "Sorry — I wasn't able to put that into a safe, structured change. Could you rephrase, or make the edit directly in the form?",
      actions: [],
      degraded: true,
    };
  }

  return { reply: validation.value.reply, actions: validation.value.actions, degraded: false };
}

// POST /api/agent/chat
// Body: { course: {...}, history: [{ role: "user"|"assistant", content: "string" }] }
//   `history` should include the latest user message as the last entry.
// Returns: { reply: string, actions: [...], degraded: boolean }
router.post("/chat", async (req, res) => {
  const { course, history } = req.body;

  if (!course || typeof course !== "object") {
    return res.status(400).json({
      error: "Request body must include a 'course' object.",
    });
  }
  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({
      error: "Request body must include a non-empty 'history' array.",
    });
  }
  const last = history[history.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string" || !last.content.trim()) {
    return res.status(400).json({
      error: "The last entry in 'history' must be a user message with non-empty 'content'.",
    });
  }

  try {
    const result = await getAgentTurn({ course, history });
    return res.json(result);
  } catch (err) {
    console.error("[agent/chat] error:", err);
    return res.status(502).json({
      error: "Agent chat failed (Grok call or parsing error).",
      detail: err.message,
    });
  }
});

export default router;
