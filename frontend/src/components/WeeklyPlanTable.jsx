import { emptyWeek } from "../utils/course";

// Weeks are also a real sequence, so numbering the rows is informative,
// not decorative.
export default function WeeklyPlanTable({ weeklyPlan, cloIds, onChange }) {
  function updateRow(index, patch) {
    const next = weeklyPlan.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  }

  function toggleCLO(index, cloId) {
    const row = weeklyPlan[index];
    const has = row.clos.includes(cloId);
    const nextClos = has ? row.clos.filter((c) => c !== cloId) : [...row.clos, cloId];
    updateRow(index, { clos: nextClos });
  }

  function addRow() {
    onChange([...weeklyPlan, emptyWeek()]);
  }

  function removeRow(index) {
    if (weeklyPlan.length === 1) return;
    onChange(weeklyPlan.filter((_, i) => i !== index));
  }

  const taggableCLOs = cloIds.filter(Boolean);

  return (
    <div className="ledger-block">
      <div className="ledger-block__head">
        <h3>Week-wise plan</h3>
        <p className="ledger-block__hint">
          Cover every week of the term and tag each row with the CLOs it addresses.
        </p>
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th style={{ width: "14%" }}>Week(s)</th>
            <th style={{ width: "46%" }}>Topics</th>
            <th style={{ width: "30%" }}>CLOs covered</th>
            <th style={{ width: "10%" }}></th>
          </tr>
        </thead>
        <tbody>
          {weeklyPlan.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  type="text"
                  value={row.weeks}
                  placeholder="e.g. 1-2"
                  onChange={(e) => updateRow(i, { weeks: e.target.value })}
                  aria-label={`Row ${i + 1} week range`}
                />
              </td>
              <td>
                <textarea
                  rows={2}
                  value={row.topics}
                  placeholder="Topics covered this period"
                  onChange={(e) => updateRow(i, { topics: e.target.value })}
                  aria-label={`Row ${i + 1} topics`}
                />
              </td>
              <td>
                <div className="clo-tag-list">
                  {taggableCLOs.length === 0 && (
                    <span className="ledger-block__hint">Add CLOs above first</span>
                  )}
                  {taggableCLOs.map((cid) => (
                    <label key={cid} className="clo-tag">
                      <input
                        type="checkbox"
                        checked={row.clos.includes(cid)}
                        onChange={() => toggleCLO(i, cid)}
                      />
                      {cid}
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <button
                  type="button"
                  className="row-remove"
                  onClick={() => removeRow(i)}
                  disabled={weeklyPlan.length === 1}
                  aria-label={`Remove week row ${i + 1}`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="add-row" onClick={addRow}>
        + Add week row
      </button>
    </div>
  );
}
