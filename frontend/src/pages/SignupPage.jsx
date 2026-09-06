import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../hooks/useAuth"

const SignupPage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("faculty")
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in every field.")
      return
    }
    // No backend — signing up just creates the same fake session as login.
    login({ name, email, role })
    navigate("/dashboard")
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-parchment px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold text-ink">Sign up</h1>
        <p className="mb-6 text-sm text-slate-500">Create a local session — no real account is stored anywhere.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@aust.edu"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-ink">I am a</legend>
            <div className="flex gap-4">
              {["faculty", "admin"].map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm capitalize text-slate-600">
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={role === option}
                    onChange={() => setRole(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="mt-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-ink underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default SignupPage