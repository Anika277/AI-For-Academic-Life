import { useState } from "react";
import { checkQuestions } from "../api/client";

/**
 * Question Paper Coverage panel.
 *
 * Faculty pastes a draft exam. We POST it (plus the current course's CLOs)
 * to /api/check-questions and render:
 *   - CLO coverage table (which CLOs are well/under/not covered)
 *   - Bloom's distribution bars (visualizes cognitive-demand balance)
 *   - Per-question breakdown (what each question tests)
 *   - Overall verdict (AI's 1-2 sentence summary)
 *
 * Renders nothing intrusive when idle — just a textarea + button. Only
 * populates results after the faculty clicks "Check coverage."
 */
export default function QuestionCoveragePanel({ course }) {
  const [paper, setPaper] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const cloReady =
    course && Array.isArray(course.clos) && course.clos.length > 0;

  async function handleCheck() {
    setError("");
    setResult(null);

    if (!cloReady) {
      setError("Fill in the course CLOs above before checking questions.");
      return;
    }
    if (paper.trim().length < 5) {
      setError("Paste the question paper first (one question per line).");
      return;
    }

    setLoading(true);
    try {
      const data = await checkQuestions(course, paper);
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel question-coverage-panel">
      <h2>Question paper coverage</h2>
      <p className="panel-subtitle">
        Paste a draft exam. We check which CLOs each question tests and
        whether Bloom's levels are balanced.
      </p>

      <textarea
        className="question-paper-input"
        placeholder={`Paste your questions here, one per line. e.g.\n1. Define what an IoT sensor is.\n2. Explain how I2C differs from SPI.\n3. Design an air-quality monitoring system.`}
        rows={8}
        value={paper}
        onChange={(e) => setPaper(e.target.value)}
      />

      <button
        className="check-button"
        onClick={handleCheck}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Check coverage"}
      </button>

      {error && <p className="panel-error">{error}</p>}

      {result && (
        <div className="qcoverage-results">
          {/* Verdict — the headline finding */}
          <div className="qcoverage-verdict">
            <strong>Verdict:</strong> {result.verdict}
          </div>

          {/* CLO coverage — which learning outcomes are tested */}
          <h3>CLO coverage</h3>
          <table className="qcoverage-table">
            <thead>
              <tr>
                <th>CLO</th>
                <th>Questions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.clo_coverage.map((row) => (
                <tr key={row.clo_id} className={`status-${row.status}`}>
                  <td>{row.clo_id}</td>
                  <td>{row.question_count}</td>
                  <td>{formatStatus(row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bloom's distribution — cognitive-level balance */}
          <h3>Bloom's distribution</h3>
          <div className="bloom-bars">
            {[1, 2, 3, 4, 5, 6].map((lvl) => {
              const count = result.bloom_distribution[lvl] ?? 0;
              const max = Math.max(
                ...Object.values(result.bloom_distribution),
                1
              );
              const widthPct = (count / max) * 100;
              return (
                <div key={lvl} className="bloom-bar-row">
                  <span className="bloom-bar-label">
                    L{lvl} · {bloomName(lvl)}
                  </span>
                  <div className="bloom-bar-track">
                    <div
                      className="bloom-bar-fill"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="bloom-bar-count">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Per-question breakdown — audit trail */}
          <h3>Per-question breakdown</h3>
          <ol className="qcoverage-questions">
            {result.questions.map((q) => (
              <li key={q.index}>
                <div className="qtext">{q.text}</div>
                <div className="qmeta">
                  Tests: {q.clo_ids.length > 0 ? q.clo_ids.join(", ") : "—"}
                  {"  ·  "}
                  Bloom's L{q.bloom_level} ({bloomName(q.bloom_level)})
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function formatStatus(status) {
  switch (status) {
    case "well_covered":
      return "✓ Well covered";
    case "under_covered":
      return "⚠ Under covered";
    case "not_covered":
      return "✗ Not covered";
    default:
      return status;
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
  };
  return names[level] || "Unknown";
}