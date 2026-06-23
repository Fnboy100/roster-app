import { DAYS, POSITION_COLORS } from '../data/constants';

export default function StatsBar({ staff, roster }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
      {staff.map(s => {
        const am  = DAYS.filter(d => roster[s.id]?.[d] === 'AM').length;
        const pm  = DAYS.filter(d => roster[s.id]?.[d] === 'PM').length;
        const off = DAYS.filter(d => roster[s.id]?.[d] === 'Off').length;
        const pc  = POSITION_COLORS[s.position];
        return (
          <div key={s.id} style={{
            background: pc.bg, border: `1.5px solid ${pc.border}`,
            borderRadius: 8, padding: '6px 12px', fontSize: 12, minWidth: 110,
          }}>
            <div style={{ fontWeight: 700, color: pc.text, marginBottom: 2 }}>{s.name}</div>
            <div style={{ color: '#64748b' }}>
              <span style={{ color: '#854d0e' }}>AM:{am}</span>
              {' · '}
              <span style={{ color: '#1e3a8a' }}>PM:{pm}</span>
              {' · '}
              <span style={{ color: '#94a3b8' }}>Off:{off}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
