import { BLOOM_LEVELS, emptyCLO } from "../utils/course";

// CLOs are a genuine numbered sequence (CLO1, CLO2, ...), so row numbering
// here documents real structure rather than decorating the table.
export default function CLOTable({ clos, onChange }) {
  function updateRow(index, patch) {
    const next = clos.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  }

  function addRow() {
    onChange([...clos, emptyCLO(clos)]);
  }

  function removeRow(index) {
    if (clos.length === 1) return; // keep at least one CLO row
    onChange(clos.filter((_, i) => i !== index));
  }

  return (
    <div className="ledger-block">
      <div className="ledger-block__head">
        <h3>Course learning outcomes</h3>
        <p className="ledger-block__hint">
          Map each CLO to a Programme Outcome and its intended Bloom&rsquo;s level.
        </p>
      </div>

      <table className="ledger-table">
        <thead>
          <tr>
            <th style={{ width: "8%" }}>ID</th>
            <th style={{ width: "44%" }}>CLO statement</th>
            <th style={{ width: "16%" }}>PO mapping</th>
            <th style={{ width: "22%" }}>Bloom&rsquo;s level</th>
            <th style={{ width: "10%" }}></th>
          </tr>
        </thead>
        <tbody>
          {clos.map((clo, i) => (
            <tr key={clo.id || i}>
              <td>
                <input
                  type="text"
                  value={clo.id}
                  onChange={(e) => updateRow(i, { id: e.target.value })}
                  aria-label={`CLO ${i + 1} identifier`}
                />
              </td>
              <td>
                <textarea
                  rows={2}
                  value={clo.text}
                  placeholder="Students will be able to..."
                  onChange={(e) => updateRow(i, { text: e.target.value })}
                  aria-label={`CLO ${i + 1} statement`}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={clo.po}
                  placeholder="e.g. 1(a)"
                  onChange={(e) => updateRow(i, { po: e.target.value })}
                  aria-label={`CLO ${i + 1} PO mapping`}
                />
              </td>
              <td>
                <select
                  value={clo.bloom_level}
                  onChange={(e) => updateRow(i, { bloom_level: Number(e.target.value) })}
                  aria-label={`CLO ${i + 1} Bloom's level`}
                >
                  {BLOOM_LEVELS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  type="button"
                  className="row-remove"
                  onClick={() => removeRow(i)}
                  disabled={clos.length === 1}
                  aria-label={`Remove CLO ${i + 1}`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" className="add-row" onClick={addRow}>
        + Add CLO
      </button>
    </div>
  );
}
