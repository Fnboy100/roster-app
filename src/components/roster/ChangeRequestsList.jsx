import { useState } from 'react';
import * as rosterApi from '../../api/roster';
import { apiErrorMessage } from '../../api/client';
import RosterStatusBadge from './RosterStatusBadge';

const btn = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
});

function describe(req) {
  const who = req.target_entry.staff.full_name;
  const day = req.target_entry.day;
  if (req.change_type === 'swap' && req.swap_with_entry) {
    return `Swap ${who} (${day}) with ${req.swap_with_entry.staff.full_name} (${req.swap_with_entry.day})`;
  }
  return `Change ${who}'s ${day} shift to ${req.proposed_shift}${req.proposed_outlet && req.proposed_outlet !== 'none' ? ` <${req.proposed_outlet}>` : ''}`;
}

export default function ChangeRequestsList({ requests, canDecide, onDecided }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const decide = async (id, decision) => {
    setBusyId(id);
    setError('');
    try {
      const updated = await rosterApi.decideChangeRequest(id, { decision });
      onDecided(updated);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record that decision.'));
    } finally {
      setBusyId(null);
    }
  };

  if (requests.length === 0) {
    return <div style={{ color: '#94a3b8', fontSize: 13, padding: '10px 0' }}>No change requests yet.</div>;
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '8px 14px', fontSize: 12.5 }}>{error}</div>}
      {requests.map((req, i) => (
        <div key={req.id} style={{ padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{describe(req)}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                Requested by {req.requested_by.full_name}
                {req.reason ? ` — ${req.reason}` : ''}
              </div>
            </div>
            <RosterStatusBadge status={req.status} />
          </div>
          {canDecide && req.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button disabled={busyId === req.id} onClick={() => decide(req.id, 'approved')} style={btn('#16a34a', '#fff')}>
                Approve
              </button>
              <button disabled={busyId === req.id} onClick={() => decide(req.id, 'rejected')} style={btn('#fef2f2', '#b91c1c')}>
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
