import ShiftBadge from './ShiftBadge';
import { DAYS, WEEKEND_DAYS, POSITION_COLORS, POSITIONS, makeCell } from '../data/constants';

export default function RosterTable({ staff, roster, rules, editMode, onCellChange, onRemove }) {
  const grouped = POSITIONS
    .map(pos => ({ pos, members: staff.filter(s => s.position === pos) }))
    .filter(g => g.members.length > 0);

  const th = (bg, color, w) => ({
    background: bg, color,
    padding: '10px 6px', textAlign: 'center',
    fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
    minWidth: w, textTransform: 'uppercase',
    borderBottom: '2px solid #1e293b',
  });

  return (
    <div style={{ overflowX: 'auto', borderRadius: 14, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', background: '#fff', marginBottom: 20 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
        <thead>
          <tr>
            <th style={th('#0f172a', '#fff', 145)}>Position / Name</th>
            {DAYS.map(d => {
              const isWknd = WEEKEND_DAYS.includes(d);
              return (
                <th key={d} style={th(isWknd ? '#7f1d1d' : '#0f172a', '#fff', 88)}>
                  {d.slice(0, 3)}{isWknd ? ' 🔒' : ''}
                </th>
              );
            })}
            {editMode && <th style={th('#0f172a', '#fff', 55)}>Del</th>}
          </tr>
        </thead>
        <tbody>
          {grouped.map(({ pos, members }) => {
            const pc = POSITION_COLORS[pos];
            return members.map((s, idx) => (
              <tr key={s.id} style={{ background: idx % 2 === 0 ? pc.bg : '#fff' }}>
                {/* Name cell */}
                <td style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  {idx === 0 && (
                    <span style={{
                      display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 1,
                      color: pc.text, background: pc.bg, border: `1px solid ${pc.border}`,
                      borderRadius: 4, padding: '1px 6px', marginBottom: 3, textTransform: 'uppercase',
                    }}>{pos}</span>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{s.name}</div>
                </td>

                {/* Shift cells */}
                {DAYS.map(day => {
                  const isWknd = WEEKEND_DAYS.includes(day);
                  return (
                    <td key={day} style={{
                      padding: '7px 5px', borderBottom: '1px solid #f1f5f9', textAlign: 'center',
                      background: isWknd ? 'rgba(254,226,226,0.2)' : 'transparent',
                    }}>
                      <ShiftBadge
                        value={roster[s.id]?.[day] || makeCell('Off', 'none')}
                        editable={editMode}
                        locked={isWknd && rules.noOffWeekends}
                        onChange={v => onCellChange(s.id, day, v)}
                      />
                    </td>
                  );
                })}

                {/* Delete cell */}
                {editMode && (
                  <td style={{ padding: '7px 5px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <button onClick={() => onRemove(s.id)} style={{
                      background: '#fee2e2', color: '#dc2626', border: 'none',
                      borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontWeight: 700,
                    }}>✕</button>
                  </td>
                )}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
