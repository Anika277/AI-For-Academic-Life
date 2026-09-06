// UI-only. Derived entirely from the completeness result already in
// state — no separate backend call, no persistence.
export default function ProgressTracker({ result }) {
  const percent = result?.percent ?? 0;
  const missing = (result?.checklist ?? []).filter((item) => !item.passed);

  return (
    <div className="tracker">
      <div className="tracker__head">
        <h3>Draft progress</h3>
        <span className="tracker__percent">{percent}%</span>
      </div>

      <div className="tracker__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="tracker__bar-fill" style={{ width: `${percent}%` }} />
      </div>

      {result ? (
        missing.length > 0 ? (
          <ul className="tracker__missing">
            {missing.map((item) => (
              <li key={item.label}>{item.label}</li>
            ))}
          </ul>
        ) : (
          <p className="tracker__complete">All structural requirements are filled in.</p>
        )
      ) : (
        <p className="tracker__idle">Run a check to see how complete this draft is.</p>
      )}
    </div>
  );
}
