import { createContext, useState, useCallback } from "react"

const STORAGE_KEY = "curriculum_desk_session"

const readSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const AuthContext = createContext(null)

// No real authentication — this only stores a fake session in localStorage
// so the UI can branch on role (admin / faculty). Do not use for anything
// that needs real security.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readSession)

  const login = useCallback(({ name, email, role }) => {
    const session = { name, email, role }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = { user, login, logout, isAuthenticated: Boolean(user) }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}