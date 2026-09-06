import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.XAI_API_KEY) {
  console.warn(
    "[grokClient] WARNING: XAI_API_KEY is not set in .env — AI routes will fail until it is."
  );
}

// xAI's Grok API is OpenAI-compatible: same request/response shape,
// just a different baseURL and API key. This lets us reuse the
// battle-tested `openai` SDK instead of hand-rolling HTTP calls.
export const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export const GROK_MODEL = process.env.GROK_MODEL || "grok-4-fast";

/**
 * Calls Grok and returns parsed JSON. Always requests JSON-only output
 * via response_format, and defends against the model wrapping its
 * answer in markdown code fences anyway (common failure mode).
 *
 * @param {string} systemPrompt - instructions + schema for the model
 * @param {string} userPrompt - the actual data/question for this call
 * @param {object} [options]
 * @param {number} [options.temperature=0.2] - low temp = more consistent structured output
 * @returns {Promise<object>} parsed JSON response
 */
export async function callGrokJSON(systemPrompt, userPrompt, options = {}) {
  const { temperature = 0.2 } = options;

  const completion = await grok.chat.completions.create({
    model: GROK_MODEL,
    temperature,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Grok returned an empty response.");
  }

  return parseJSONSafe(raw);
}

/**
 * Strips markdown code fences if present, then parses JSON.
 * Models sometimes wrap JSON in ```json ... ``` even when told not to.
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
      `Failed to parse Grok response as JSON. Raw content: ${text.slice(0, 300)}`
    );
  }
}