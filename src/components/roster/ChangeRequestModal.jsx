import { useState } from 'react';
import Modal from '../inventory/Modal';
import { btn, errorBoxStyle, inputStyle, labelStyle, selectStyle } from '../inventory/ui';
import { SHIFTS, OUTLETS, OUTLET_LABELS } from '../../data/constants';
import * as rosterApi from '../../api/roster';
import { apiErrorMessage } from '../../api/client';

/** entries: the approved period's RosterEntryOut[] (each has id, staff.full_name, day, shift, outlet) */
export default function ChangeRequestModal({ period, entries, onClose, onCreated }) {
  const [changeType, setChangeType] = useState('edit');
  const [targetEntryId, setTargetEntryId] = useState('');
  const [proposedShift, setProposedShift] = useState('AM');
  const [proposedOutlet, setProposedOutlet] = useState('none');
  const [swapWithEntryId, setSwapWithEntryId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const entryLabel = (e) => `${e.staff.full_name} — ${e.day} (${e.shift}${e.outlet !== 'none' ? ` <${e.outlet}>` : ''})`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!targetEntryId) {
      setError('Choose who and which day this change is about.');
      return;
    }
    if (changeType === 'swap' && !swapWithEntryId) {
      setError('Choose the other shift to swap with.');
      return;
    }
    if (changeType === 'swap' && swapWithEntryId === targetEntryId) {
      setError('Choose two different shifts to swap.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await rosterApi.createChangeRequest({
        roster_period_id: period.id,
        change_type: changeType,
        target_entry_id: Number(targetEntryId),
        proposed_shift: changeType === 'edit' ? proposedShift : undefined,
        proposed_outlet: changeType === 'edit' ? proposedOutlet : undefined,
        swap_with_entry_id: changeType === 'swap' ? Number(swapWithEntryId) : undefined,
        reason: reason || undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit this change request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Request a Roster Change" onClose={onClose} width={520}>
      <form onSubmit={handleSubmit}>
        {error && <div style={errorBoxStyle}>{error}</div>}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Type of change</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setChangeType('edit')}
              style={btn(changeType === 'edit' ? '#0f172a' : '#f1f5f9', changeType === 'edit' ? '#fff' : '#334155')}
            >
              Edit one shift
            </button>
            <button
              type="button"
              onClick={() => setChangeType('swap')}
              style={btn(changeType === 'swap' ? '#0f172a' : '#f1f5f9', changeType === 'swap' ? '#fff' : '#334155')}
            >
              Swap two shifts
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{changeType === 'swap' ? 'First shift' : 'Who and which day'}</label>
          <select value={targetEntryId} onChange={(e) => setTargetEntryId(e.target.value)} style={{ ...selectStyle, width: '100%' }} required>
            <option value="">Select…</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {entryLabel(e)}
              </option>
            ))}
          </select>
        </div>

        {changeType === 'edit' ? (
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>New shift</label>
              <select value={proposedShift} onChange={(e) => setProposedShift(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Outlet</label>
              <select value={proposedOutlet} onChange={(e) => setProposedOutlet(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
                {OUTLETS.map((o) => (
                  <option key={o} value={o}>{OUTLET_LABELS[o] || 'None'}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Second shift (swaps with the first)</label>
            <select value={swapWithEntryId} onChange={(e) => setSwapWithEntryId(e.target.value)} style={{ ...selectStyle, width: '100%' }} required>
              <option value="">Select…</option>
              {entries.map((e) => (
                <option key={e.id} value={e.id}>
                  {entryLabel(e)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Staff member requested to swap Friday for Saturday"
            style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={btn('#f1f5f9', '#334155')}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
            {submitting ? 'Submitting…' : 'Submit to Manager'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
