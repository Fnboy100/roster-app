// ─── roster-app/src/components/StatsBar.jsx ──────────────────────────────────

import { DAYS, POSITION_COLORS } from '../data/constants';

export default function StatsBar({ staff, roster }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
      {staff.map(s => {
        const am  = DAYS.filter(d => roster[s.id]?.[d]?.shift === 'AM').length;
        const pm  = DAYS.filter(d => roster[s.id]?.[d]?.shift === 'PM').length;
        const off = DAYS.filter(d => roster[s.id]?.[d]?.shift === 'Off').length;
        // Count outlet appearances
        const tCount   = DAYS.filter(d => roster[s.id]?.[d]?.outlet === 'T').length;
        const rstCount = DAYS.filter(d => roster[s.id]?.[d]?.outlet === 'RST').length;
        const pc = POSITION_COLORS[s.position];
        return (
          <div key={s.id} style={{
            background: pc.bg, border: `1.5px solid ${pc.border}`,
            borderRadius: 8, padding: '6px 12px', fontSize: 12, minWidth: 120,
          }}>
            <div style={{ fontWeight: 700, color: pc.text, marginBottom: 2 }}>{s.name}</div>
            <div style={{ color: '#64748b' }}>
              <span style={{ color: '#854d0e' }}>AM:{am}</span>
              {' · '}
              <span style={{ color: '#1e3a8a' }}>PM:{pm}</span>
              {' · '}
              <span style={{ color: '#94a3b8' }}>Off:{off}</span>
            </div>
            {(tCount > 0 || rstCount > 0) && (
              <div style={{ marginTop: 2, color: '#64748b' }}>
                {tCount > 0 && <span style={{ color: '#166534' }}>T:{tCount} </span>}
                {rstCount > 0 && <span style={{ color: '#6b21a8' }}>RST:{rstCount}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
