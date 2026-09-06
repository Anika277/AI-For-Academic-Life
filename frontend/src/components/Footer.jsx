const Footer = () => (
  <footer className="border-t border-slate-200 bg-parchment py-6">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 text-sm text-slate-500 sm:flex-row">
      <p>© {new Date().getFullYear()} AUST CSE · Curriculum Desk</p>
      <p>A second pair of eyes on structure, overlap, and CLO wording.</p>
    </div>
  </footer>
)

export default Footer