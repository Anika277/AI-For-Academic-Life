import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "../hooks/useAuth"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const FEATURES = [
  {
    title: "Structural completeness",
    body: "Rule-based checks catch missing fields instantly — no AI involved.",
  },
  {
    title: "Overlap with existing courses",
    body: "AI-assisted flags for courses whose topics or CLOs look similar.",
  },
  {
    title: "CLO wording & Bloom's check",
    body: "AI-assisted flags for CLOs whose verbs don't match their claimed level.",
  },
]

const LandingPage = () => {
  const { user } = useAuth()

  return (
    <div className="bg-parchment">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500"
        >
          AUST CSE · Curriculum Desk
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-3xl text-4xl font-bold text-ink sm:text-5xl"
        >
          Review new course syllabi with a second pair of eyes
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-xl text-lg text-slate-600"
        >
          Structure, overlap, and CLO wording — checked automatically. The coordinator still decides.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex gap-3"
        >
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-ink hover:bg-slate-100"
              >
                Log in
              </Link>
            </>
          )}
        </motion.div>
      </section>

      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-3"
      >
        {FEATURES.map((feature) => (
          <motion.div
            key={feature.title}
            variants={fadeUp}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h3 className="mb-2 font-semibold text-ink">{feature.title}</h3>
            <p className="text-sm text-slate-600">{feature.body}</p>
          </motion.div>
        ))}
      </motion.section>
    </div>
  )
}

export default LandingPage