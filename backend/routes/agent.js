import express from "express";
import { callGrokJSON } from "../services/grokClient.js";
import { existingCourses } from "../data/existingCourses.js";
import {
  validateAgentPayload,
  ACTION_TYPES,
} from "../utils/agentSchema.js";

const router = express.Router();

const BLOOM_REFERENCE = `
Bloom's Taxonomy levels and their typical action verbs:

1 = Remember
Typical verbs: define, list, recall, name, identify

2 = Understand
Typical verbs: explain, summarize, describe, classify, discuss

3 = Apply
Typical verbs: apply, implement, use, execute, demonstrate, solve

4 = Analyze
Typical verbs: analyze, differentiate, compare, examine, break down

5 = Evaluate
Typical verbs: evaluate, justify, critique, assess, argue

6 = Create
Typical verbs: design, develop, construct, formulate, propose, compose
`;

const ACTION_SCHEMA_DOC = `
You may propose changes to the course draft ONLY using these action objects.

Every action MUST have a "type" field.

Allowed actions:

1. set_field

{
  "type": "set_field",
  "field": "code" | "title" | "credit_hours" | "objectives",
  "value": <string or number>
}

2. set_prerequisites

{
  "type": "set_prerequisites",
  "value": ["CSE 3117", "CSE 2213"]
}

This completely replaces the prerequisite list.

3. add_clo

{
  "type": "add_clo",
  "text": "string",
  "po": "e.g. 1(a)",
  "bloom_level": 1
}

bloom_level must be an integer from 1 to 6.

4. update_clo

{
  "type": "update_clo",
  "id": "CLO2",
  "text": "optional new text",
  "po": "optional new PO",
  "bloom_level": 1
}

Only include fields that should actually change.

5. remove_clo

{
  "type": "remove_clo",
  "id": "CLO2"
}

6. add_week

{
  "type": "add_week",
  "weeks": "9-10",
  "topics": "Testing and debugging",
  "clos": ["CLO1"]
}

7. update_week

{
  "type": "update_week",
  "week_position": 1,
  "weeks": "1-2",
  "topics": "Introduction",
  "clos": ["CLO1"]
}

Only include fields that should actually change.

8. remove_week

{
  "type": "remove_week",
  "week_position": 3
}

9. set_assessment

{
  "type": "set_assessment",
  "class_performance": 10,
  "quizzes": 10,
  "mid": 30,
  "final": 50
}

10. load_sample

{
  "type": "load_sample"
}

11. clear_course

{
  "type": "clear_course"
}

IMPORTANT ACTION RULES:

- Only emit actions when the teacher explicitly asks you to modify the draft.
- If the teacher asks a question, return an empty actions array.
- Never invent a CLO ID.
- Never invent a week position.
- Only modify fields that exist in the current draft or are explicitly requested.
- If the teacher says something ambiguous such as "fix the weak CLO", ask which CLO they mean.
- credit_hours must be a number.
- bloom_level must be an integer from 1 to 6.
- Assessment values must be numbers from 0 to 100.
- Prefer several small precise actions rather than one huge action.
`;

function buildSystemPrompt() {
  return `
You are the in-app assistant for "Curriculum Desk", an OBE
(Outcome-Based Education) new-course drafting tool for an AUST CSE department.

You have TWO jobs only.

JOB 1 — ANSWER QUESTIONS

Answer questions about:

- OBE
- CLOs
- Bloom's Taxonomy
- curriculum design
- how this tool works
- the specific course draft currently shown to the teacher

When discussing the teacher's actual course, use ONLY the current
course JSON supplied in the user message.

Never invent information about their course.

JOB 2 — EDIT THE COURSE

When the teacher gives an explicit instruction to modify the course,
translate that instruction into the smallest correct set of actions.

After making a change, briefly confirm what was changed.

${BLOOM_REFERENCE}

${ACTION_SCHEMA_DOC}

IMPORTANT:

- Do not claim that the department will approve a course.
- Do not invent university policies.
- Do not invent CLOs, weeks, marks, prerequisites, or course values.
- If information is not available, say that it is not available.
- If an edit request is ambiguous, ask a clarification question.
- Questions should produce no actions.
- Editing instructions should produce the appropriate actions.

Return ONLY valid JSON.

The exact required response format is:

{
  "reply": "string",
  "actions": []
}
`;
}

function buildUserPrompt({ course, history }) {
  return JSON.stringify({
    current_course_draft: course,

    existing_courses_reference: existingCourses.map((course) => ({
      code: course.code,
      title: course.title,
      topics: course.topics,
      clos: course.clos,
    })),

    conversation_so_far: history,
  });
}

async function getAgentTurn({ course, history }) {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = buildUserPrompt({
    course,
    history,
  });

  let parsed = await callGrokJSON(
    systemPrompt,
    userPrompt,
    {
      temperature: 0.2,
    }
  );

  let validation = validateAgentPayload(parsed);

  /*
   * If the model returned valid JSON but the structure is wrong,
   * give it one opportunity to repair its response.
   */
  if (!validation.ok) {
    const repairPrompt = `
Your previous response did not satisfy the required agent JSON schema.

Validation error:

${validation.error}

Your previous response was:

${JSON.stringify(parsed)}

Return ONLY a corrected JSON object in exactly this shape:

{
  "reply": "string",
  "actions": []
}

Follow the allowed action schema exactly.

If you are unsure whether an edit should be performed,
return an empty actions array and explain the issue in reply.
`;

    parsed = await callGrokJSON(
      systemPrompt,
      `${userPrompt}\n\n${repairPrompt}`,
      {
        temperature: 0.1,
      }
    );

    validation = validateAgentPayload(parsed);
  }

  /*
   * Fail safely.
   *
   * A malformed AI response should NEVER reach the frontend
   * as executable course-editing actions.
   */
  if (!validation.ok) {
    return {
      reply:
        "I couldn't safely convert that request into a structured change. Please rephrase it or make the edit directly in the form.",
      actions: [],
      degraded: true,
    };
  }

  return {
    reply: validation.value.reply,
    actions: validation.value.actions,
    degraded: false,
  };
}

/*
 * POST /api/agent/chat
 *
 * Request:
 *
 * {
 *   "course": {...},
 *   "history": [
 *     {
 *       "role": "user",
 *       "content": "..."
 *     },
 *     {
 *       "role": "assistant",
 *       "content": "..."
 *     }
 *   ]
 * }
 */
router.post("/chat", async (req, res) => {
  const { course, history } = req.body;

  if (!course || typeof course !== "object" || Array.isArray(course)) {
    return res.status(400).json({
      error: "Request body must include a 'course' object.",
    });
  }

  if (!Array.isArray(history) || history.length === 0) {
    return res.status(400).json({
      error: "Request body must include a non-empty 'history' array.",
    });
  }

  /*
   * The newest history item must be the teacher's message.
   */
  const last = history[history.length - 1];

  if (
    !last ||
    last.role !== "user" ||
    typeof last.content !== "string" ||
    !last.content.trim()
  ) {
    return res.status(400).json({
      error:
        "The last history entry must be a user message with non-empty content.",
    });
  }

  /*
   * Prevent excessively large history payloads.
   * This also protects the model context during a demo.
   */
  if (history.length > 50) {
    return res.status(400).json({
      error: "Conversation history is too long. Start a new chat.",
    });
  }

  try {
    const result = await getAgentTurn({
      course,
      history,
    });

    return res.json(result);
  } catch (err) {
    console.error("[agent/chat] error:", err);

    return res.status(502).json({
      error: "Agent chat failed.",
      detail: err.message,
    });
  }
});

export default router;