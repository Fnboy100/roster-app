import { useState } from 'react';
import { POSITION_COLORS } from '../data/constants';

const FALLBACK_COLOR = { bg: '#f8fafc', border: '#94a3b8', text: '#334155' };

function StaffRow({ member, positions, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.name);
  const [position, setPosition] = useState(member.position);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const pc = POSITION_COLORS[member.position] || FALLBACK_COLOR;
  const dirty = name.trim() !== member.name || position !== member.position;

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave(member.id, { full_name: name.trim(), position });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setName(member.name);
    setPosition(member.position);
    setEditing(false);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await onDelete(member.id);
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 10px', borderRadius: 8, background: '#f8fafc' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && dirty && save()}
          style={{ flex: 1, minWidth: 140, padding: '6px 9px', borderRadius: 7, border: '1.5px solid #cbd5e1', fontSize: 13 }}
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={{ padding: '6px 9px', borderRadius: 7, border: '1.5px solid #cbd5e1', fontSize: 13 }}
        >
          {positions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={!dirty || busy}
          style={{ background: dirty ? '#0f172a' : '#e2e8f0', color: dirty ? '#fff' : '#94a3b8', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: dirty ? 'pointer' : 'default' }}
        >
          {busy ? '…' : 'Save'}
        </button>
        <button onClick={cancel} disabled={busy} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 10px' }}>
      <span
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: pc.text, background: pc.bg,
          border: `1px solid ${pc.border}`, borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}
      >
        {member.position}
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{member.name}</span>

      {confirmingDelete ? (
        <>
          <span style={{ fontSize: 12, color: '#b91c1c' }}>Remove {member.name}?</span>
          <button onClick={confirmDelete} disabled={busy} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {busy ? '…' : 'Yes, remove'}
          </button>
          <button onClick={() => setConfirmingDelete(false)} disabled={busy} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} style={{ background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Edit
          </button>
          <button onClick={() => setConfirmingDelete(true)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Remove
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Always-visible roster staff list (not gated behind "generate a roster
 * first" like the old edit-mode-only delete button inside RosterTable
 * was) — fixes the "added someone to the wrong position and can't fix it
 * without touching the database" gap. Edit changes name/position in
 * place; Remove deletes outright if nothing references them yet, or
 * deactivates them (with an explanation) if they already have roster or
 * presence history to preserve.
 */
export default function StaffManagementPanel({ staff, positions, onUpdate, onDelete, message }) {
  if (staff.length === 0) return null;

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 24 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#0f172a' }}>
        Staff on this roster ({staff.length})
      </div>
      {message && (
        <div style={{ fontSize: 12, color: '#0369a1', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
          {message}
        </div>
      )}
      <div style={{ display: 'grid', gap: 4 }}>
        {staff.map((member) => (
          <StaffRow key={member.id} member={member} positions={positions} onSave={onUpdate} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
