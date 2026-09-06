import { useEffect, useRef, useState } from "react"

const GREETING = {
  role: "assistant",
  content: "Hi! I'm a general assistant — not tied to any specific course draft. Ask me anything.",
}

// Placeholder chatbot: echoes back for now. Swap handleSend's body for a
// real api/client.js call (e.g. sendChatbotMessage(history)) once the
// backend endpoint exists — everything else here stays the same.
const ChatbotPage = () => {
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    setMessages((prev) => [...prev, { role: "user", content: text }])
    setInput("")
    setSending(true)

    // TODO: replace with a real API call once the chatbot backend exists.
    await new Promise((resolve) => setTimeout(resolve, 500))
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "(Placeholder reply — connect this to a real chatbot endpoint.)" },
    ])
    setSending(false)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-6 py-12" style={{ minHeight: "70vh" }}>
      <h1 className="mb-1 text-xl font-semibold text-ink">General Chatbot</h1>
      <p className="mb-6 text-sm text-slate-500">Free-form Q&A, separate from the Curriculum Desk assistant.</p>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4"
        style={{ minHeight: "50vh" }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "ml-auto bg-ink text-white" : "bg-slate-100 text-ink"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <div className="max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-ink">Thinking…</div>}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatbotPage