import { useState, useCallback } from 'react';
import { INITIAL_STAFF, DEFAULT_RULES, SHIFT_STYLES, WEEKEND_DAYS } from '../data/constants';
import { generateRoster } from '../utils/generateRoster';
import { exportCSV } from '../utils/exportCSV';
import { exportPDF } from '../utils/exportPDF';
import StatsBar    from '../components/StatsBar';
import RosterTable from '../components/RosterTable';
import RulesPanel  from '../components/RulesPanel';
import AddStaffForm from '../components/AddStaffForm';

const btn = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '8px 15px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
});

export default function RosterApp() {
  const [staff, setStaff]         = useState(INITIAL_STAFF);
  const [roster, setRoster]       = useState(() => generateRoster(INITIAL_STAFF, DEFAULT_RULES));
  const [rules, setRules]         = useState(DEFAULT_RULES);
  const [editMode, setEditMode]   = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [weekLabel, setWeekLabel] = useState('June 22 – 28');
  const [toast, setToast]         = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const regenerate = useCallback(() => {
    setRoster(generateRoster(staff, rules));
    showToast('Roster generated!');
  }, [staff, rules]);

  const updateCell = (staffId, day, value) => {
    setRoster(prev => ({ ...prev, [staffId]: { ...prev[staffId], [day]: value } }));
  };

  const addStaff = (member, defaultRow) => {
    setStaff(prev => [...prev, member]);
    setRoster(prev => ({ ...prev, [member.id]: defaultRow }));
    showToast(`${member.name} added!`);
  };

  const removeStaff = id => {
    setStaff(prev => prev.filter(s => s.id !== id));
    setRoster(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleExport = () => {
    exportCSV(staff, roster, weekLabel);
    showToast('CSV exported!');
  };

  const handleExportPDF = () => {
    exportPDF(staff, roster, weekLabel);
    showToast('PDF exported!');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: '#0f172a', color: '#fff',
          padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}>{toast}</div>
      )}

      <div style={{ maxWidth: 1140, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
              Auto Roster Generator
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Shift Roster - Bar Team</h1>
            <p style={{ fontSize: 12, color: '#64748b' }}>
              🔒 No Off on <strong>Fri · Sat · Sun</strong> &nbsp;·&nbsp;
              No PM→AM back-to-back &nbsp;·&nbsp;
              Min 1 AM + 1 PM per position/day
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={weekLabel}
              onChange={e => setWeekLabel(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#334155', width: 158 }}
            />
            <button onClick={() => setShowRules(v => !v)} style={btn('#f1f5f9', '#334155')}>⚙ Rules</button>
            <button onClick={() => setEditMode(v => !v)} style={btn(editMode ? '#dbeafe' : '#f1f5f9', editMode ? '#1e3a8a' : '#334155')}>
              {editMode ? '✓ Done' : '✏ Edit'}
            </button>
            <button onClick={regenerate}    style={btn('#0f172a', '#fff')}>⟳ Generate</button>
            <button onClick={handleExport}  style={btn('#16a34a', '#fff')}>↓ CSV</button>
            <button onClick={handleExportPDF}  style={btn('#dc2626', '#fff')}>↓ PDF</button>
          </div>
        </div>

        {/* ── Legend ── */}
        <div style={{ display: 'flex', gap: 10, margin: '10px 0 14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(SHIFT_STYLES).map(([k, v]) => (
            <span key={k} style={{ padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: v.bg, color: v.text, border: `1.5px solid ${v.border}` }}>
              {k === 'AM' ? 'AM · 11am–6pm' : k === 'PM' ? 'PM · 4pm–12am' : 'Off'}
            </span>
          ))}
          <span style={{ fontSize: 12, color: '#e11d48', fontWeight: 600, background: '#fff1f2', border: '1.5px solid #fda4af', borderRadius: 20, padding: '2px 12px' }}>
            🔒 Fri · Sat · Sun = No Off
          </span>
        </div>

        {/* ── Rules panel ── */}
        {showRules && <RulesPanel rules={rules} onChange={setRules} />}

        {/* ── Stats ── */}
        <StatsBar staff={staff} roster={roster} />

        {/* ── Table ── */}
        <RosterTable
          staff={staff}
          roster={roster}
          rules={rules}
          editMode={editMode}
          onCellChange={updateCell}
          onRemove={removeStaff}
        />

        {/* ── Add staff ── */}
        <AddStaffForm onAdd={addStaff} />

        <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', paddingBottom: 16 }}>
          Constraint-based scheduling · AM = 11am–6pm · PM = 4pm–12am · Fri/Sat/Sun = all hands on deck
        </p>
      </div>
    </div>
  );
}
