// Thin fetch wrappers around the backend endpoints.
// Requests go through the Vite dev proxy (see vite.config.js), so
// relative paths work in both dev and a same-origin production build.

const BASE = "/api";

async function postJSON(path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the backend at ${BASE}${path}. Is the Express server running? (${networkErr.message})`
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody?.error || errBody?.message || "";
    } catch {
      /* response wasn't JSON — ignore */
    }
    throw new Error(
      `${path} failed with ${res.status}${detail ? `: ${detail}` : ""}`
    );
  }

  return res.json();
}

/** Rule-based structural check. Returns { checklist, percent }. */
export function checkCompleteness(course) {
  return postJSON("/check-completeness", { course });
}

/** Grok-backed overlap check. Returns { results: [...] }. */
export function checkOverlap(course) {
  return postJSON("/check-overlap", { course });
}

/** Grok-backed CLO/Bloom's quality review. Returns { feedback: [...] }. */
export function checkCLO(course) {
  return postJSON("/check-clo", { course });
}

/**
 * Grok-backed chat agent turn.
 * `history` is the full conversation so far, oldest first, each entry
 * `{ role: "user" | "assistant", content: string }`, with the newest
 * user message last.
 * Returns { reply, actions, degraded }.
 */
export function sendAgentMessage(course, history) {
  return postJSON("/agent/chat", { course, history });
}
