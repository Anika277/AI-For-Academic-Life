import { assessmentTotal } from "../utils/course";

const FIELDS = [
  { key: "class_performance", label: "Class performance" },
  { key: "quizzes", label: "Quizzes" },
  { key: "mid", label: "Mid" },
  { key: "final", label: "Final" },
];

export default function AssessmentBreakdown({ breakdown, onChange }) {
  const total = assessmentTotal(breakdown);
  const isValid = total === 100;

  function updateField(key, value) {
    onChange({ ...breakdown, [key]: value === "" ? "" : Number(value) });
  }

  return (
    <div className="ledger-block">
      <div className="ledger-block__head">
        <h3>Assessment breakdown</h3>
        <p className="ledger-block__hint">Marks across all components must sum to 100.</p>
      </div>

      <div className="assessment-grid">
        {FIELDS.map((f) => (
          <label key={f.key} className="assessment-field">
            <span>{f.label}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={breakdown[f.key]}
              onChange={(e) => updateField(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className={`assessment-total ${isValid ? "assessment-total--ok" : "assessment-total--bad"}`}>
        <span>Total</span>
        <strong>{total}</strong>
        <span>{isValid ? "sums to 100" : "must equal 100"}</span>
      </div>
    </div>
  );
}
