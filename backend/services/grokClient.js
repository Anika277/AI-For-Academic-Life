import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

/*
 * The project uses an OpenAI-compatible API.
 *
 * This supports the common environment-variable names so the backend
 * doesn't silently use the wrong key:
 *
 * GROQ_API_KEY  -> preferred for Groq
 * XAI_API_KEY   -> supported if using xAI
 * OPENAI_API_KEY -> supported as a fallback
 */

const API_KEY =
  process.env.GROQ_API_KEY ||
  process.env.XAI_API_KEY ||
  process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.warn(
    "[AI client] WARNING: No API key found. Set GROQ_API_KEY, XAI_API_KEY, or OPENAI_API_KEY in backend/.env"
  );
}

/*
 * Your current model is:
 * llama-3.3-70b-versatile
 *
 * That is a Groq model, so the default base URL is Groq's
 * OpenAI-compatible endpoint.
 *
 * If you later switch to xAI, change AI_BASE_URL in .env.
 */
const AI_BASE_URL =
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";

export const grok = new OpenAI({
  apiKey: API_KEY,
  baseURL: AI_BASE_URL,
});

export const GROK_MODEL =
  process.env.GROK_MODEL || "llama-3.3-70b-versatile";

/**
 * Send a request to the AI model and return parsed JSON.
 *
 * The agent and the other AI checks depend on this function.
 */
export async function callGrokJSON(
  systemPrompt,
  userPrompt,
  options = {}
) {
  const {
    temperature = 0.2,
  } = options;

  if (!API_KEY) {
    throw new Error(
      "No AI API key configured. Add GROQ_API_KEY to backend/.env."
    );
  }

  if (!systemPrompt || typeof systemPrompt !== "string") {
    throw new Error("systemPrompt must be a non-empty string.");
  }

  if (!userPrompt || typeof userPrompt !== "string") {
    throw new Error("userPrompt must be a non-empty string.");
  }

  const completion = await grok.chat.completions.create({
    model: GROK_MODEL,
    temperature,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    response_format: {
      type: "json_object",
    },
  });

  const raw = completion.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("AI model returned an empty response.");
  }

  return parseJSONSafe(raw);
}

/**
 * Remove markdown fences if the model returns them accidentally,
 * then parse the result as JSON.
 */
function parseJSONSafe(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse AI response as JSON. Raw content: ${text.slice(
        0,
        500
      )}`
    );
  }
}