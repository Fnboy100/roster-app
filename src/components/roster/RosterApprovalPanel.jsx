import { useState } from 'react';
import * as rosterApi from '../../api/roster';
import { apiErrorMessage } from '../../api/client';

const btn = (bg, color) => ({
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
});

export default function RosterApprovalPanel({ period, onDecided }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const decide = async (decision) => {
    setBusy(true);
    setError('');
    try {
      const updated = await rosterApi.decideRosterPeriod(period.id, { decision, comment: comment || undefined });
      onDecided(updated);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record that decision.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#92400e', marginBottom: 8 }}>
        This roster is awaiting your approval
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 10 }}>
          {error}
        </div>
      )}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional comment"
        rows={2}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #fde68a', fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={busy} onClick={() => decide('approved')} style={btn('#16a34a', '#fff')}>
          Approve
        </button>
        <button disabled={busy} onClick={() => decide('rejected')} style={btn('#dc2626', '#fff')}>
          Reject
        </button>
      </div>
    </div>
  );
}
