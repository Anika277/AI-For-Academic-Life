export default function CompletenessPanel({ result, loading }) {
  if (loading) {
    return (
      <section className="panel">
        <h3>Structural completeness</h3>
        <p className="panel__status">Checking required sections&hellip;</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel">
        <h3>Structural completeness</h3>
        <p className="panel__status panel__status--idle">
          Rule-based — runs instantly, no AI involved.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h3>Structural completeness</h3>
      <ul className="checklist">
        {result.checklist.map((item) => (
          <li
            key={item.label}
            className={`checklist__item ${item.passed ? "checklist__item--pass" : "checklist__item--fail"}`}
          >
            <span className="checklist__mark" aria-hidden="true">
              {item.passed ? "✓" : "✕"}
            </span>
            <span>
              {item.label}
              {item.detail && <span className="checklist__detail"> — {item.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
