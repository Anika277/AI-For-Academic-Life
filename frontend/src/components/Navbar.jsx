import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "text-ink border-b-2 border-ink" : "text-slate-500 hover:text-ink"
  }`

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-parchment/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex flex-col leading-tight" aria-label="Curriculum Desk home">
          <span className="text-[11px] uppercase tracking-wide text-slate-500">AUST CSE</span>
          <span className="text-base font-semibold text-ink">Curriculum Desk</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/dashboard/curriculum" className={navLinkClass}>Curriculum Desk AI</NavLink>
              <NavLink to="/dashboard/chatbot" className={navLinkClass}>Chatbot</NavLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                {user.name} · <span className="capitalize">{user.role}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                onKeyDown={(e) => e.key === "Enter" && handleLogout()}
                tabIndex={0}
                aria-label="Log out"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar