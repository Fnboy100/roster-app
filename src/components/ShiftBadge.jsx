import { SHIFT_STYLES, SHIFTS } from '../data/constants';

export default function ShiftBadge({ value, editable, locked, onChange }) {
  const style = SHIFT_STYLES[value] || SHIFT_STYLES['Off'];
  const availableShifts = locked ? ['AM', 'PM'] : SHIFTS;

  const baseStyle = {
    padding: '2px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    background: style.bg,
    color: style.text,
    border: `1.5px solid ${style.border}`,
  };

  if (!editable) {
    return <span style={{ display: 'inline-block', ...baseStyle }}>{value}</span>;
  }

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...baseStyle, cursor: 'pointer', outline: 'none' }}
    >
      {availableShifts.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
