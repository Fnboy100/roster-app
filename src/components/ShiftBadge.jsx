// ─── roster-app/src/components/ShiftBadge.jsx ────────────────────────────────

import { SHIFTS, OUTLETS, OUTLET_LABELS, SHIFT_STYLES, OUTLET_BADGE_STYLES, cellLabel, makeCell } from '../data/constants';

/**
 * Renders a shift cell.
 * In view mode  → coloured badge showing e.g. "PM <RST>"
 * In edit mode  → two dropdowns: one for shift (AM/PM/Off), one for outlet (none/T/RST)
 *
 * Props:
 *  value    → { shift, outlet }
 *  editable → boolean
 *  locked   → boolean (weekends: hide Off option)
 *  onChange → (newCell: { shift, outlet }) => void
 */
export default function ShiftBadge({ value, editable, locked, onChange }) {
  const cell       = value || makeCell('Off', 'none');
  const shiftStyle = SHIFT_STYLES[cell.shift] || SHIFT_STYLES['Off'];
  const outletStyle = OUTLET_BADGE_STYLES[cell.outlet] || OUTLET_BADGE_STYLES['none'];

  const availableShifts = locked ? ['AM', 'PM'] : SHIFTS;

  // ── View mode ──────────────────────────────────────────────────────────
  if (!editable) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        <span style={{
          padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
          background: shiftStyle.bg, color: shiftStyle.text, border: `1.5px solid ${shiftStyle.border}`,
        }}>
          {cell.shift}
        </span>
        {cell.shift !== 'Off' && cell.outlet !== 'none' && (
          <span style={{
            padding: '2px 6px', borderRadius: 5, fontSize: 10, fontWeight: 700,
            background: outletStyle.bg, color: outletStyle.text, border: `1.5px solid ${outletStyle.border}`,
          }}>
            {OUTLET_LABELS[cell.outlet]}
          </span>
        )}
      </div>
    );
  }

  // ── Edit mode: two dropdowns ───────────────────────────────────────────
  const dropBase = {
    padding: '2px 5px', borderRadius: 6, fontSize: 11, fontWeight: 700,
    cursor: 'pointer', outline: 'none', border: '1.5px solid',
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {/* Shift dropdown */}
      <select
        value={cell.shift}
        onChange={e => onChange(makeCell(e.target.value, e.target.value === 'Off' ? 'none' : cell.outlet))}
        style={{ ...dropBase, background: shiftStyle.bg, color: shiftStyle.text, borderColor: shiftStyle.border }}
      >
        {availableShifts.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Outlet dropdown — only visible when not Off */}
      {cell.shift !== 'Off' && (
        <select
          value={cell.outlet}
          onChange={e => onChange(makeCell(cell.shift, e.target.value))}
          style={{
            ...dropBase,
            background: outletStyle.bg,
            color: cell.outlet === 'none' ? '#94a3b8' : outletStyle.text,
            borderColor: cell.outlet === 'none' ? '#cbd5e1' : outletStyle.border,
          }}
        >
          {OUTLETS.map(o => (
            <option key={o} value={o}>{o === 'none' ? '—' : o}</option>
          ))}
        </select>
      )}
    </div>
  );
}
