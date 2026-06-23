import { useState } from 'react';
import { POSITIONS, WEEKEND_DAYS, DAYS } from '../data/constants';

export default function AddStaffForm({ onAdd }) {
  const [name, setName] = useState('');
  const [pos, setPos]   = useState('Bartender');

  const inp = { padding: '7px 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a' };

  const handleAdd = () => {
    if (!name.trim()) return;
    const colMap = { Supervisor: '#f59e42', Bartender: '#38bdf8', Barback: '#a78bfa' };
    const member = { id: Date.now(), name: name.trim(), position: pos, color: colMap[pos] };
    // Default: Off on weekdays, AM on weekends
    const row = {};
    DAYS.forEach(d => { row[d] = WEEKEND_DAYS.includes(d) ? 'AM' : 'Off'; });
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
        <select value={pos} onChange={e => setPos(e.target.value)} style={{ ...inp, width: 145 }}>
          {POSITIONS.map(p => <option key={p}>{p}</option>)}
        </select>
        <button onClick={handleAdd} style={{
          background: '#0f172a', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>+ Add</button>
      </div>
    </div>
  );
}
