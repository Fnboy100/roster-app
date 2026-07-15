// ─── roster-app/src/components/RulesPanel.jsx ────────────────────────────────

export default function RulesPanel({ rules, onChange }) {
  const inp = { padding: '6px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a' };
  const lbl = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: '#334155', fontWeight: 600 };

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#0f172a' }}>Scheduling Rules</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>

        <label style={lbl}>
          Max work days / week
          <input type="number" min={3} max={7} value={rules.maxWorkDays}
            onChange={e => onChange({ ...rules, maxWorkDays: +e.target.value })}
            style={{ ...inp, width: 70 }} />
        </label>

        <label style={{ ...lbl, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={rules.noBackToBack}
            onChange={e => onChange({ ...rules, noBackToBack: e.target.checked })} />
          No PM → AM back-to-back
        </label>

        <label style={{ ...lbl, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={rules.noOffWeekends}
            onChange={e => onChange({ ...rules, noOffWeekends: e.target.checked })} />
          No Off on Fri / Sat / Sun
        </label>

        {/* ── Outlet rule ── */}
        <label style={lbl}>
          Auto-assign outlet tag
          <select
            value={rules.defaultOutlet}
            onChange={e => onChange({ ...rules, defaultOutlet: e.target.value })}
            style={{ ...inp, width: 150 }}
          >
            <option value="none">None (plain AM/PM)</option>
            <option value="T">All → T (Terraces)</option>
            <option value="RST">All → RST (Restaurant)</option>
            <option value="random">Random (T or RST)</option>
          </select>
        </label>

      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>
        Changes apply on next Generate. Outlet tags can also be changed per-cell in Edit mode.
      </div>
    </div>
  );
}
