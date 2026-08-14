import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import * as outletsApi from '../api/outlets';
import * as presenceApi from '../api/presence';
import { usePresenceLive } from '../hooks/usePresenceLive';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../api/roles';
import Modal from '../components/inventory/Modal';
import PresenceStatusBadge from '../components/PresenceStatusBadge';
import { pageStyle, cardStyle, btn, selectStyle, labelStyle, errorBoxStyle, emptyStateStyle, formatDateTime } from '../components/inventory/ui';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PresenceMonitor() {
  const { user } = useAuth();
  const isMultiOutlet = user?.role?.name === ROLES.ADMIN;
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id;

  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState(myOutletId || '');
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  const [timelineStaff, setTimelineStaff] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);

  const [violationTarget, setViolationTarget] = useState(null);
  const [violationNote, setViolationNote] = useState('');
  const [violationError, setViolationError] = useState('');
  const [submittingViolation, setSubmittingViolation] = useState(false);

  useEffect(() => {
    if (isMultiOutlet) outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, [isMultiOutlet]);

  const load = useCallback(async () => {
    if (!outletId) return;
    try {
      setPosts(await presenceApi.getLiveStatus({ outletId: Number(outletId), shiftDate }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load live status.'));
    }
  }, [outletId, shiftDate]);

  useEffect(() => {
    load();
  }, [load]);

  // Live push: refresh whenever a clock action, break, or violation happens
  // anywhere in this outlet, so the dashboard updates without polling.
  usePresenceLive(() => load());

  const openTimeline = async (staffMember) => {
    setTimelineStaff(staffMember);
    setTimelineEvents([]);
    try {
      setTimelineEvents(
        await presenceApi.listEvents({ outletId: Number(outletId), rosterStaffId: staffMember.roster_staff_id, onDate: shiftDate })
      );
    } catch {
      // Timeline is a nice-to-have inside an already-successful load; a
      // failed fetch here shouldn't block the rest of the dashboard.
    }
  };

  const openViolationForm = (staffMember, post) => {
    setViolationTarget({ staffMember, post });
    setViolationNote('');
    setViolationError('');
  };

  const submitViolation = async () => {
    if (!violationTarget) return;
    setSubmittingViolation(true);
    setViolationError('');
    try {
      await presenceApi.createViolation({
        roster_staff_id: violationTarget.staffMember.roster_staff_id,
        duty_post_id: violationTarget.post.duty_post_id,
        assignment_id: violationTarget.staffMember.assignment_id,
        outlet_id: Number(outletId),
        note: violationNote || undefined,
      });
      setViolationTarget(null);
      load();
    } catch (err) {
      setViolationError(apiErrorMessage(err, 'Could not log the violation.'));
    } finally {
      setSubmittingViolation(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Presence</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Presence Monitor</h1>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {isMultiOutlet && (
          <div>
            <label style={labelStyle}>Outlet</label>
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} style={selectStyle}>
              <option value="">Select an outlet…</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} style={selectStyle} />
        </div>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {!outletId ? (
        <div style={emptyStateStyle}>Select an outlet to see live status.</div>
      ) : posts.length === 0 ? (
        <div style={emptyStateStyle}>No active duty posts for this outlet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {posts.map((post) => (
            <div key={post.duty_post_id} style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                {post.duty_post_name}
              </div>
              {post.staff.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: '#94a3b8' }}>No one assigned to this post today.</div>
              ) : (
                post.staff.map((s, i) => (
                  <div
                    key={s.roster_staff_id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', flexWrap: 'wrap', gap: 8 }}
                  >
                    <button onClick={() => openTimeline(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{s.full_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {s.last_event_type ? `${s.last_event_type.replace(/_/g, ' ')} – ${formatDateTime(s.last_event_at)}` : 'No activity yet today'}
                      </div>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PresenceStatusBadge status={s.status} />
                      <button style={btn('#fef2f2', '#b91c1c')} onClick={() => openViolationForm(s, post)}>
                        Log absence
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {timelineStaff && (
        <Modal title={`${timelineStaff.full_name} — ${shiftDate}`} onClose={() => setTimelineStaff(null)}>
          {timelineEvents.length === 0 ? (
            <div style={emptyStateStyle}>No events logged yet today.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {timelineEvents.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{e.event_type.replace(/_/g, ' ')}</span>
                  <span style={{ color: '#64748b' }}>{formatDateTime(e.occurred_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {violationTarget && (
        <Modal title={`Log absence — ${violationTarget.staffMember.full_name}`} onClose={() => setViolationTarget(null)}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            {violationTarget.staffMember.full_name} was not found at <strong>{violationTarget.post.duty_post_name}</strong> during a spot check.
          </p>
          {violationError && <div style={errorBoxStyle}>{violationError}</div>}
          <label style={labelStyle}>Note (optional)</label>
          <textarea
            value={violationNote}
            onChange={(e) => setViolationNote(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={btn('#f1f5f9', '#334155')} onClick={() => setViolationTarget(null)}>
              Cancel
            </button>
            <button style={btn(submittingViolation ? '#94a3b8' : '#b91c1c', '#fff')} disabled={submittingViolation} onClick={submitViolation}>
              {submittingViolation ? 'Logging…' : 'Log violation'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
