function overlapTier(percent) {
  if (percent >= 60) return "high";
  if (percent >= 30) return "medium";
  return "low";
}

export default function OverlapPanel({ result, loading, error }) {
  if (loading) {
    return (
      <section className="panel">
        <h3>Overlap with existing courses</h3>
        <p className="panel__status">Comparing against the existing-course corpus&hellip;</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h3>Overlap with existing courses</h3>
        <p className="panel__status panel__status--error">{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel">
        <h3>Overlap with existing courses</h3>
        <p className="panel__status panel__status--idle">
          AI-assisted — flags courses whose topics or CLOs look similar.
        </p>
      </section>
    );
  }

  const sorted = [...result.results].sort((a, b) => b.overlap_percent - a.overlap_percent);

  return (
    <section className="panel">
      <h3>Overlap with existing courses</h3>
      <ul className="overlap-list">
        {sorted.map((r) => (
          <li key={r.course_code} className={`overlap-row overlap-row--${overlapTier(r.overlap_percent)}`}>
            <div className="overlap-row__head">
              <span className="overlap-row__code">{r.course_code}</span>
              <span className="overlap-row__percent">{r.overlap_percent}%</span>
            </div>
            {r.overlapping_topics?.length > 0 && (
              <p className="overlap-row__topics">{r.overlapping_topics.join(" · ")}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="panel__footnote">
        These are prompts for faculty judgment, not a verdict — a coordinator should still review any high overlap directly.
      </p>
    </section>
  );
}
