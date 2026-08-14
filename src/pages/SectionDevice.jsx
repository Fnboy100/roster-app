import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '../api/client';
import * as outletsApi from '../api/outlets';
import * as presenceApi from '../api/presence';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../api/roles';
import PresenceStatusBadge from '../components/PresenceStatusBadge';
import BreakButtonGroup from '../components/BreakButtonGroup';
import { cardStyle, btn, selectStyle, errorBoxStyle, emptyStateStyle } from '../components/inventory/ui';

const ACTION_FN = {
  clock_in: presenceApi.clockIn,
  clock_out: presenceApi.clockOut,
  break_start: presenceApi.breakStart,
  break_end: presenceApi.breakEnd,
  post_check_in: presenceApi.postCheckIn,
  post_check_out: presenceApi.postCheckOut,
};

export default function SectionDevice() {
  const { user, logout } = useAuth();
  const isMultiOutlet = user?.role?.name === ROLES.ADMIN;
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id;

  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState(myOutletId || '');
  const [posts, setPosts] = useState([]);
  const [dutyPostId, setDutyPostId] = useState('');
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null); // roster_staff_id selected on the picker
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (isMultiOutlet) outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, [isMultiOutlet]);

  useEffect(() => {
    if (!outletId) return;
    presenceApi.listDutyPosts({ outletId: Number(outletId) }).then(setPosts).catch(() => {});
  }, [outletId]);

  const load = useCallback(async () => {
    if (!outletId) return;
    try {
      setStaff(await presenceApi.listSectionDeviceStaff({ outletId: Number(outletId), dutyPostId: dutyPostId || undefined }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load staff for this section.'));
    }
  }, [outletId, dutyPostId]);

  useEffect(() => {
    load();
    // A shared tablet stays open all shift — refresh periodically so a
    // status change made by someone else at this device (or a manager
    // override) is picked up without anyone needing to reload the page.
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const selectedStaff = staff.find((s) => s.roster_staff_id === selected);

  const openStaff = (rosterStaffId) => {
    setSelected(rosterStaffId);
    setPin('');
    setActionError('');
  };

  const runAction = async (action) => {
    if (!selectedStaff) return;
    setActionError('');
    setBusy(true);
    try {
      await ACTION_FN[action](Number(outletId), {
        rosterStaffId: selectedStaff.roster_staff_id,
        pin: pin || undefined,
        dutyPostId: selectedStaff.duty_post_id || (dutyPostId ? Number(dutyPostId) : undefined),
        assignmentId: selectedStaff.assignment_id,
      });
      setSelected(null);
      setPin('');
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'That action could not be completed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase' }}>Section Device</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Clock In / Out</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: 12, color: '#64748b' }}>
            Exit device mode
          </Link>
          <button style={btn('#f1f5f9', '#334155')} onClick={logout}>
            Log out device
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        {isMultiOutlet && (
          <select value={outletId} onChange={(e) => setOutletId(e.target.value)} style={selectStyle}>
            <option value="">Select an outlet…</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
        {outletId && (
          <select value={dutyPostId} onChange={(e) => setDutyPostId(e.target.value)} style={selectStyle}>
            <option value="">All posts / today's roster</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {selectedStaff ? (
        <div style={{ ...cardStyle, padding: 24, maxWidth: 420, margin: '0 auto' }}>
          <button style={{ ...btn('transparent', '#64748b'), padding: '4px 0', marginBottom: 10 }} onClick={() => setSelected(null)}>
            ← Back
          </button>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{selectedStaff.full_name}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{selectedStaff.position}</div>
          <div style={{ marginBottom: 16 }}>
            <PresenceStatusBadge status={selectedStaff.status} />
          </div>

          {selectedStaff.has_pin && (
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: '100%', padding: '16px', fontSize: 20, textAlign: 'center', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {actionError && <div style={errorBoxStyle}>{actionError}</div>}

          <BreakButtonGroup status={selectedStaff.status} onAction={runAction} busy={busy} showPostCheck />
        </div>
      ) : !outletId ? (
        <div style={emptyStateStyle}>Select an outlet to see today's staff.</div>
      ) : staff.length === 0 ? (
        <div style={emptyStateStyle}>No staff scheduled here today.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {staff.map((s) => (
            <button
              key={s.roster_staff_id}
              onClick={() => openStaff(s.roster_staff_id)}
              style={{
                ...cardStyle,
                cursor: 'pointer',
                textAlign: 'left',
                padding: 18,
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{s.full_name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {s.position}
                  {s.duty_post_name ? ` · ${s.duty_post_name}` : ''}
                </div>
              </div>
              <PresenceStatusBadge status={s.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
