import { useEffect, useRef, useState } from "react";
import "../styles/agentChat.css";
import { sendAgentMessage } from "../api/client";
import { applyAgentActions } from "../utils/agentActions";

const GREETING = {
  role: "assistant",
  content:
    "Hi — I'm the Curriculum Desk assistant. Ask me about OBE, Bloom's levels, or this draft, or tell me what to change (e.g. \"add a CLO about testing\" or \"set credit hours to 4\").",
};

/**
 * Floating chat widget. Owns its own conversation state; reads/writes the
 * shared course draft via `course` / `onChange` props, exactly like the
 * form components do — the agent is just another editor of the same
 * state, never a separate source of truth.
 */
export default function AgentChat({ course, onChange }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [undoStack, setUndoStack] = useState([]); // previous course snapshots
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function pushMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    const nextHistory = [...messages, { role: "user", content: text }];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    try {
      // Only send role/content to the backend, not any local-only fields.
      const history = nextHistory.map((m) => ({ role: m.role, content: m.content }));
      const result = await sendAgentMessage(course, history);

      if (Array.isArray(result.actions) && result.actions.length > 0) {
        const beforeCourse = course;
        const { course: nextCourse, applied, failures } = applyAgentActions(course, result.actions);

        if (applied.length > 0) {
          setUndoStack((prev) => [...prev.slice(-9), beforeCourse]); // cap undo depth at 10
          onChange(nextCourse);
        }

        pushMessage({ role: "assistant", content: result.reply });

        if (applied.length > 0) {
          pushMessage({
            role: "system",
            content: `Applied: ${applied.join("; ")}.`,
          });
        }
        if (failures.length > 0) {
          pushMessage({
            role: "system",
            content: `Couldn't apply ${failures.length} change${failures.length > 1 ? "s" : ""}: ${failures
              .map((f) => f.message)
              .join("; ")}`,
            isWarning: true,
          });
        }
      } else {
        pushMessage({ role: "assistant", content: result.reply });
      }

      if (result.degraded) {
        pushMessage({
          role: "system",
          content: "(The assistant's response needed a fallback — no changes were made this turn.)",
          isWarning: true,
        });
      }
    } catch (err) {
      setError(err.message);
      pushMessage({
        role: "system",
        content: `Something went wrong reaching the assistant: ${err.message}`,
        isWarning: true,
      });
    } finally {
      setSending(false);
    }
  }

  function handleUndo() {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      onChange(last);
      pushMessage({ role: "system", content: "Undid the last agent change." });
      return prev.slice(0, -1);
    });
  }

  return (
    <div className="agent-chat">
      {open && (
        <div className="agent-chat__panel" role="dialog" aria-label="Curriculum Desk assistant">
          <div className="agent-chat__head">
            <div>
              <strong>Curriculum Desk assistant</strong>
              <p className="agent-chat__subtitle">Answers questions · edits your draft on command</p>
            </div>
            <button type="button" className="agent-chat__close" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="agent-chat__messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`agent-chat__bubble agent-chat__bubble--${m.role}${m.isWarning ? " agent-chat__bubble--warning" : ""}`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="agent-chat__bubble agent-chat__bubble--assistant agent-chat__bubble--pending">Thinking…</div>}
          </div>

          {error && <p className="panel__status panel__status--error agent-chat__error">{error}</p>}

          <div className="agent-chat__toolbar">
            <button type="button" className="ghost-button agent-chat__undo" onClick={handleUndo} disabled={undoStack.length === 0}>
              Undo last agent change
            </button>
          </div>

          <form className="agent-chat__form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question, or tell me what to change…"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="agent-chat__launcher"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Close assistant" : "Ask the assistant"}
      </button>
    </div>
  );
}
