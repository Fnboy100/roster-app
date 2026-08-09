import { useState, useEffect } from 'react';
import { POSITIONS, POSITION_COLORS, WEEKEND_DAYS, DAYS, makeCell } from '../data/constants';

export default function AddStaffForm({ onAdd, positions = POSITIONS }) {
  const [name, setName] = useState('');
  const [pos, setPos]   = useState(positions[0]);

  // If the available positions change (e.g. switching department), make
  // sure the selected one is still valid instead of silently keeping a
  // stale value from a different department's list.
  useEffect(() => {
    if (!positions.includes(pos)) setPos(positions[0]);
  }, [positions]); // eslint-disable-line react-hooks/exhaustive-deps

  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a' };

  const handleAdd = () => {
    if (!name.trim()) return;
    const color = POSITION_COLORS[pos]?.border || '#94a3b8';
    const member = { id: Date.now(), name: name.trim(), position: pos, color };
    // Default: Off on weekdays, AM on weekends
    const row = {};
    DAYS.forEach(d => { row[d] = makeCell(WEEKEND_DAYS.includes(d) ? 'AM' : 'Off', 'none'); });
    onAdd(member, row);
    setName('');
  };

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#0f172a' }}>Add Staff Member</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ ...inp, width: 190 }}
        />
        <select value={pos} onChange={e => setPos(e.target.value)} style={{ ...inp, width: 175 }}>
          {positions.map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={handleAdd} style={{
          background: '#0f172a', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>+ Add</button>
      </div>
    </div>
  );
}
