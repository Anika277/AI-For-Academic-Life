import { bloomLabel } from "../utils/course";

export default function CLOQualityPanel({ result, loading, error, clos }) {
  if (loading) {
    return (
      <section className="panel">
        <h3>CLO wording &amp; Bloom&rsquo;s check</h3>
        <p className="panel__status">Reviewing CLO wording against claimed Bloom&rsquo;s levels&hellip;</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <h3>CLO wording &amp; Bloom&rsquo;s check</h3>
        <p className="panel__status panel__status--error">{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="panel">
        <h3>CLO wording &amp; Bloom&rsquo;s check</h3>
        <p className="panel__status panel__status--idle">
          AI-assisted — flags CLOs whose verbs don&rsquo;t match their claimed level.
        </p>
      </section>
    );
  }

  const cloById = Object.fromEntries((clos ?? []).map((c) => [c.id, c]));

  return (
    <section className="panel">
      <h3>CLO wording &amp; Bloom&rsquo;s check</h3>
      <ul className="clo-feedback-list">
        {result.feedback.map((f) => {
          const clo = cloById[f.clo_id];
          return (
            <li
              key={f.clo_id}
              className={`clo-feedback ${f.bloom_valid ? "clo-feedback--ok" : "clo-feedback--flag"}`}
            >
              <div className="clo-feedback__head">
                <span className="clo-feedback__id">{f.clo_id}</span>
                {clo && <span className="clo-feedback__bloom">{bloomLabel(clo.bloom_level)}</span>}
                <span className="clo-feedback__verdict">
                  {f.bloom_valid ? "Wording matches level" : "Wording may not match level"}
                </span>
              </div>
              {f.suggestion && <p className="clo-feedback__suggestion">Suggestion: {f.suggestion}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
