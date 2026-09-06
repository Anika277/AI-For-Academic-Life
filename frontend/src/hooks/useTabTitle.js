import { useEffect } from "react"

/**
 * Temporarily set the browser tab title.
 *
 * Pass a string to change the title. Pass `null` to revert.
 * When `revertAfterMs` is provided, the title auto-reverts to the
 * original after that many milliseconds — useful for status flashes
 * like "✓ Analysis ready" that should fade back to "Curriculum Desk".
 *
 * Example:
 *   useTabTitle(status, status === "done" ? 5000 : null)
 */
export function useTabTitle(newTitle, revertAfterMs) {
  useEffect(() => {
    if (!newTitle) return

    const original = document.title
    document.title = newTitle

    let timer
    if (revertAfterMs) {
      timer = setTimeout(() => {
        document.title = original
      }, revertAfterMs)
    }

    return () => {
      if (timer) clearTimeout(timer)
      document.title = original
    }
  }, [newTitle, revertAfterMs])
}