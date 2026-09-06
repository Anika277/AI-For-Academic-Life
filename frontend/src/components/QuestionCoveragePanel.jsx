/**
 * Question paper coverage panel.
 * Pure display component. Input lives in CurriculumDeskPage.
 */
export default function QuestionCoveragePanel({
  result,
  loading,
  error,
  paperProvided,
}) {
  return (
    <section className="panel">
      <h3>Question paper coverage</h3>

      {!paperProvided && !loading && !result && !error && (
        <p className="panel__status panel__status--idle">
          Paste a draft exam in the box on the left, then click <strong>Check exam coverage</strong>.
        </p>
      )}

      {paperProvided && !loading && !result && !error && (
        <p className="panel__status panel__status--idle">
          Click <strong>Check exam coverage</strong> to analyze the pasted paper.
        </p>
      )}

      {loading && (
        <p className="panel__status">Analyzing question paper…</p>
      )}

      {error && (
        <p className="panel__status panel__status--error">{error}</p>
      )}

      {result && (
        <div className="qcov">
          {result.verdict && (
            <p className="qcov__verdict">{result.verdict}</p>
          )}

          <h4 className="qcov__section-head">CLO coverage</h4>
          <ul className="qcov-list">
            {result.clo_coverage.map((row) => (
              <li
                key={row.clo_id}
                className={`qcov-row qcov-row--${row.status}`}
              >
                <div className="qcov-row__head">
                  <span className="qcov-row__id">{row.clo_id}</span>
                  <span className="qcov-row__count">
                    {row.question_count} question{row.question_count === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="qcov-row__status">{formatStatus(row.status)}</p>
              </li>
            ))}
          </ul>

          <h4 className="qcov__section-head">Bloom's distribution</h4>
          <div className="qcov-bloom">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const count = result.bloom_distribution?.[lvl] ?? 0
              const max = Math.max(
                ...Object.values(result.bloom_distribution || {}),
                1
              )
              const widthPct = (count / max) * 100
              return (
                <div key={lvl} className="qcov-bloom__row">
                  <span className="qcov-bloom__label">
                    L{lvl} · {bloomName(lvl)}
                  </span>
                  <div className="qcov-bloom__track">
                    <div
                      className="qcov-bloom__fill"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="qcov-bloom__count">{count}</span>
                </div>
              )
            })}
          </div>

          <h4 className="qcov__section-head">Per-question breakdown</h4>
          <ol className="qcov-questions">
            {result.questions.map((q) => (
              <li key={q.index} className="qcov-question">
                <p className="qcov-question__text">{q.text}</p>
                <p className="qcov-question__meta">
                  Tests: {q.clo_ids?.length ? q.clo_ids.join(", ") : "— none"}
                  {"  ·  "}
                  Bloom's L{q.bloom_level} ({bloomName(q.bloom_level)})
                </p>
              </li>
            ))}
          </ol>

          <p className="panel__footnote">
            AI-assisted analysis — verify mappings before finalizing the paper.
          </p>
        </div>
      )}
    </section>
  )
}

function formatStatus(status) {
  switch (status) {
    case "well_covered":
      return "Well covered"
    case "under_covered":
      return "Under covered — consider adding another question"
    case "not_covered":
      return "Not covered — no question tests this CLO"
    default:
      return status
  }
}

function bloomName(level) {
  const names = {
    1: "Remember",
    2: "Understand",
    3: "Apply",
    4: "Analyze",
    5: "Evaluate",
    6: "Create",
  }
  return names[level] || "Unknown"
}