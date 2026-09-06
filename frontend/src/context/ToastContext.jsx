import { createContext, useContext, useState, useCallback } from "react"

/**
 * Toast notification context.
 *
 * Anywhere in the app you can:
 *   const toast = useToast()
 *   toast.success("Draft loaded")
 *   toast.error("Analysis failed", "Grok call timed out")
 *   toast.info("Sample draft loaded")
 *
 * Toasts auto-dismiss after 3-4 seconds (errors linger longer since
 * they need to be read). Multiple toasts stack vertically.
 *
 * Deliberately uses simple in-app DOM instead of the browser Notification
 * API — no permission popup, no OS integration, works the same everywhere.
 */

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (variant, title, detail) => {
      const id = nextId++
      const duration = variant === "error" ? 5000 : 3200
      setToasts((current) => [
        ...current,
        { id, variant, title, detail },
      ])
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  const api = {
    success: (title, detail) => push("success", title, detail),
    error: (title, detail) => push("error", title, detail),
    info: (title, detail) => push("info", title, detail),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>")
  }
  return ctx
}

/**
 * The visible stack of toasts. Fixed to the bottom-right corner so it
 * never covers the primary content or the "Ask the assistant" button.
 */
function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.variant}`}
          onClick={() => onDismiss(t.id)}
        >
          <span className="toast__icon" aria-hidden="true">
            {iconFor(t.variant)}
          </span>
          <div className="toast__body">
            <div className="toast__title">{t.title}</div>
            {t.detail && <div className="toast__detail">{t.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function iconFor(variant) {
  if (variant === "success") return "✓"
  if (variant === "error") return "✗"
  return "•"
}