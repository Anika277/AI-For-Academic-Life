import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../hooks/useAuth"

const AI_OPTIONS = [
  {
    to: "/dashboard/curriculum",
    title: "Curriculum Desk AI",
    body: "Analyze a course draft: completeness, overlap with existing courses, and CLO wording against Bloom's levels.",
    cta: "Open Curriculum Desk",
  },
  {
    to: "/dashboard/chatbot",
    title: "General Chatbot",
    body: "Ask free-form questions — not tied to a specific course draft.",
    cta: "Open Chatbot",
  },
]

const DashboardPage = () => {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        {user?.role === "admin" ? "Admin dashboard" : "Faculty dashboard"}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-ink">Welcome, {user?.name}</h1>
      <p className="mt-2 max-w-xl text-slate-600">Choose an AI tool to work with.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {AI_OPTIONS.map((option, index) => (
          <motion.div
            key={option.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mb-2 font-semibold text-ink">{option.title}</h2>
            <p className="mb-6 flex-1 text-sm text-slate-600">{option.body}</p>
            <Link
              to={option.to}
              className="rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-white hover:bg-ink/90"
            >
              {option.cta}
            </Link>
          </motion.div>
        ))}
      </div>

      {user?.role === "admin" && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 p-6">
          <h3 className="mb-1 font-semibold text-ink">Admin controls</h3>
          <p className="text-sm text-slate-600">
            Placeholder area for admin-only settings (e.g. managing which courses are used for the overlap check).
          </p>
        </div>
      )}
    </div>
  )
}

export default DashboardPage