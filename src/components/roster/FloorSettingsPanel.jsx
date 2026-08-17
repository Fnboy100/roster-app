import { useState } from 'react';
import * as rosterEngineApi from '../../api/rosterEngine';
import { apiErrorMessage } from '../../api/client';

const inputStyle = { width: '100%', padding: '5px 7px', borderRadius: 6, border: '1.5px solid #e2e8f0', fontSize: 12, boxSizing: 'border-box' };
const th = { padding: '6px 8px', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' };
const td = { padding: '5px 8px', borderTop: '1px solid #f1f5f9' };

function RuleRow({ rule, onSave }) {
  const [form, setForm] = useState(rule);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(rule);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td style={{ ...td, fontWeight: 700 }}>{rule.role}</td>
      <td style={td}><input type="number" min={0} value={form.min_staff_per_day} onChange={set('min_staff_per_day')} style={inputStyle} /></td>
      <td style={td}><input type="number" min={0} max={7} value={form.off_days_per_week} onChange={set('off_days_per_week')} style={inputStyle} /></td>
      <td style={td}><input type="number" min={0} value={form.target_weekly_hours} onChange={set('target_weekly_hours')} style={inputStyle} /></td>
      <td style={td}><input type="number" min={0} value={form.max_weekly_hours} onChange={set('max_weekly_hours')} style={inputStyle} /></td>
      <td style={td}><input type="number" min={0} max={7} value={form.max_consecutive_closing} onChange={set('max_consecutive_closing')} style={inputStyle} /></td>
      <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={form.allow_split} onChange={set('allow_split')} /></td>
      <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={form.is_senior_rotation} onChange={set('is_senior_rotation')} /></td>
      <td style={td}>
        <button
          disabled={!dirty || saving}
          onClick={save}
          style={{ background: dirty ? '#0f172a' : '#e2e8f0', color: dirty ? '#fff' : '#94a3b8', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: dirty ? 'pointer' : 'default' }}
        >
          {saving ? '…' : 'Save'}
        </button>
      </td>
    </tr>
  );
}

/**
 * Compact inline settings surface for the Floor engine — shift catalog
 * (read-only summary; codes are seeded from the reference roster image
 * and rarely need day-to-day editing) and coverage rules (fully editable
 * per role: coverage minimums, weekly hour targets, rotation limits).
 * Business rules live entirely in this data, never in the table
 * component's rendering logic.
 */
export default function FloorSettingsPanel({ shiftTemplates, coverageRules, departmentId, onRulesChanged }) {
  const [error, setError] = useState('');

  const handleSaveRule = async (form) => {
    setError('');
    try {
      const updated = await rosterEngineApi.upsertCoverageRule(departmentId, {
        role: form.role,
        min_staff_per_day: form.min_staff_per_day,
        off_days_per_week: form.off_days_per_week,
        target_weekly_hours: form.target_weekly_hours,
        max_weekly_hours: form.max_weekly_hours,
        max_consecutive_closing: form.max_consecutive_closing,
        allow_split: form.allow_split,
        is_senior_rotation: form.is_senior_rotation,
      });
      onRulesChanged((prev) => prev.map((r) => (r.role === updated.role ? updated : r)));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save this rule.'));
    }
  };

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 18, background: '#fff' }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 10 }}>Shift Catalog</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {shiftTemplates.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', opacity: t.is_active ? 1 : 0.4 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: t.color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
            <span style={{ fontWeight: 700, fontSize: 12 }}>{t.label}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.nominal_hours}h</span>
            {t.is_closing && <span style={{ fontSize: 10, color: '#0369a1' }}>closing</span>}
            {t.is_split && <span style={{ fontSize: 10, color: '#c2410c' }}>split</span>}
            {t.counts_as_off && <span style={{ fontSize: 10, color: '#64748b' }}>off</span>}
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 10 }}>Coverage Rules by Role</div>
      {error && <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '6px 10px', fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={th}>Role</th>
              <th style={th}>Min/Day</th>
              <th style={th}>Off Days/Wk</th>
              <th style={th}>Target Hrs</th>
              <th style={th}>Max Hrs</th>
              <th style={th}>Max Closing Streak</th>
              <th style={th}>Split OK</th>
              <th style={th}>Senior</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {coverageRules.map((rule) => (
              <RuleRow key={rule.role} rule={rule} onSave={handleSaveRule} />
            ))}
          </tbody>
        </table>
      </div>
      {coverageRules.length === 0 && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          No coverage rules yet — generate a roster once to auto-seed defaults for each role currently on staff.
        </div>
      )}
    </div>
  );
}
