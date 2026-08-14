import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import * as outletsApi from '../api/outlets';
import * as departmentsApi from '../api/departments';
import * as rosterApi from '../api/roster';
import * as presenceApi from '../api/presence';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../api/roles';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle } from '../components/inventory/ui';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DutyRoster() {
  const { user } = useAuth();
  const isMultiOutlet = user?.role?.name === ROLES.ADMIN;
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id;

  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState(myOutletId || '');
  const [departments, setDepartments] = useState([]);
  const [staffByDept, setStaffByDept] = useState([]);
  const [posts, setPosts] = useState([]);
  const [shiftDate, setShiftDate] = useState(todayISO());
  const [assignments, setAssignments] = useState([]);

  const [rosterStaffId, setRosterStaffId] = useState('');
  const [dutyPostId, setDutyPostId] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isMultiOutlet) outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, [isMultiOutlet]);

  useEffect(() => {
    if (!outletId) return;
    departmentsApi.listDepartments({ outletId: Number(outletId) }).then(setDepartments).catch(() => {});
    presenceApi.listDutyPosts({ outletId: Number(outletId) }).then(setPosts).catch(() => {});
  }, [outletId]);

  useEffect(() => {
    if (departments.length === 0) {
      setStaffByDept([]);
      return;
    }
    Promise.all(departments.map((d) => rosterApi.listRosterStaff({ departmentId: d.id })))
      .then((lists) => setStaffByDept(lists.flat()))
      .catch(() => setStaffByDept([]));
  }, [departments]);

  const load = useCallback(async () => {
    if (!outletId) return;
    try {
      setAssignments(await presenceApi.listAssignments({ outletId: Number(outletId), shiftDate }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load assignments.'));
    }
  }, [outletId, shiftDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!rosterStaffId || !dutyPostId) {
      setFormError('Select a staff member and a duty post.');
      return;
    }
    setSubmitting(true);
    try {
      await presenceApi.createAssignment({
        outlet_id: Number(outletId),
        duty_post_id: Number(dutyPostId),
        roster_staff_id: Number(rosterStaffId),
        shift_date: shiftDate,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
        scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
      });
      setRosterStaffId('');
      setDutyPostId('');
      setScheduledStart('');
      setScheduledEnd('');
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create the assignment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Presence</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Duty Roster</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Assign staff to a duty post/section for a specific date.</p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
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
          <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {outletId && (
        <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 18, marginBottom: 24, maxWidth: 560 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>New assignment</h3>
          {formError && <div style={errorBoxStyle}>{formError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Staff</label>
              <select value={rosterStaffId} onChange={(e) => setRosterStaffId(e.target.value)} style={{ ...selectStyle, width: '100%' }} required>
                <option value="">Select staff…</option>
                {staffByDept.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.position})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Duty post</label>
              <select value={dutyPostId} onChange={(e) => setDutyPostId(e.target.value)} style={{ ...selectStyle, width: '100%' }} required>
                <option value="">Select post…</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Scheduled start (optional)</label>
              <input type="time" value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value ? `${shiftDate}T${e.target.value}` : '')} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Scheduled end (optional)</label>
              <input type="time" value={scheduledEnd} onChange={(e) => setScheduledEnd(e.target.value ? `${shiftDate}T${e.target.value}` : '')} style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>
          <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
            {submitting ? 'Assigning…' : 'Assign to post'}
          </button>
        </form>
      )}

      {error && <div style={errorBoxStyle}>{error}</div>}
      {!outletId ? (
        <div style={emptyStateStyle}>Select an outlet to manage duty assignments.</div>
      ) : assignments.length === 0 ? (
        <div style={emptyStateStyle}>No one is assigned to a post for {shiftDate} yet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {assignments.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{a.staff.full_name}</span>
              <span style={{ color: '#64748b' }}>{a.duty_post.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
