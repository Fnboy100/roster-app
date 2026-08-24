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

  // Self-service "set my PIN" (first time — no PIN exists yet)
  const [settingUpPin, setSettingUpPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinSetupError, setPinSetupError] = useState('');
  const [pinSetupBusy, setPinSetupBusy] = useState(false);
  const [skippedPinSetup, setSkippedPinSetup] = useState(false);

  // Forgot-PIN reset — requires the device operator's own password
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [approverPassword, setApproverPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

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
    setSettingUpPin(false);
    setNewPin('');
    setConfirmNewPin('');
    setPinSetupError('');
    setSkippedPinSetup(false);
    setShowForgotPin(false);
    setResetNewPin('');
    setResetConfirmPin('');
    setApproverPassword('');
    setResetError('');
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

  const handleSetupPin = async () => {
    setPinSetupError('');
    if (!/^\d{4,8}$/.test(newPin)) {
      setPinSetupError('PIN must be 4-8 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinSetupError('PINs do not match.');
      return;
    }
    setPinSetupBusy(true);
    try {
      await presenceApi.selfServiceSetPin(selectedStaff.roster_staff_id, newPin);
      setSettingUpPin(false);
      setNewPin('');
      setConfirmNewPin('');
      load(); // refreshes has_pin so the PIN-entry field shows up immediately
    } catch (err) {
      setPinSetupError(apiErrorMessage(err, 'Could not set the PIN.'));
    } finally {
      setPinSetupBusy(false);
    }
  };

  const handleResetPin = async () => {
    setResetError('');
    if (!/^\d{4,8}$/.test(resetNewPin)) {
      setResetError('New PIN must be 4-8 digits.');
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      setResetError('PINs do not match.');
      return;
    }
    if (!approverPassword) {
      setResetError("Enter the device's login password to approve this reset.");
      return;
    }
    setResetBusy(true);
    try {
      await presenceApi.resetStaffPin(selectedStaff.roster_staff_id, resetNewPin, approverPassword);
      setShowForgotPin(false);
      setResetNewPin('');
      setResetConfirmPin('');
      setApproverPassword('');
      setPin(resetNewPin); // pre-fill so they can clock in immediately with the new PIN
    } catch (err) {
      setResetError(apiErrorMessage(err, 'Could not reset the PIN.'));
    } finally {
      setResetBusy(false);
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

          {selectedStaff.has_pin ? (
            <div style={{ marginBottom: 12 }}>
              {!showForgotPin ? (
                <>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    style={{ width: '100%', padding: '16px', fontSize: 20, textAlign: 'center', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={() => setShowForgotPin(true)}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Forgot PIN?
                  </button>
                </>
              ) : (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
                    Reset {selectedStaff.full_name}'s PIN
                  </div>
                  <div style={{ fontSize: 11.5, color: '#7f1d1d', marginBottom: 10 }}>
                    Requires this device's own login password — a supervisor or manager must be the one approving this, right now.
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="New PIN (4-8 digits)"
                    value={resetNewPin}
                    onChange={(e) => setResetNewPin(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: 14, textAlign: 'center', borderRadius: 8, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', marginBottom: 8 }}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    placeholder="Confirm new PIN"
                    value={resetConfirmPin}
                    onChange={(e) => setResetConfirmPin(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: 14, textAlign: 'center', borderRadius: 8, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', marginBottom: 8 }}
                  />
                  <input
                    type="password"
                    placeholder="Your own login password"
                    value={approverPassword}
                    onChange={(e) => setApproverPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: 14, borderRadius: 8, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', marginBottom: 8 }}
                  />
                  {resetError && <div style={{ ...errorBoxStyle, marginBottom: 8 }}>{resetError}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleResetPin} disabled={resetBusy} style={{ ...btn('#b91c1c', '#fff'), flex: 1 }}>
                      {resetBusy ? 'Resetting…' : 'Approve & Reset'}
                    </button>
                    <button onClick={() => setShowForgotPin(false)} disabled={resetBusy} style={btn('#f1f5f9', '#334155')}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !skippedPinSetup ? (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                Set up a PIN
              </div>
              <div style={{ fontSize: 11.5, color: '#166534', marginBottom: 10 }}>
                A PIN confirms it's really you clocking in — recommended, especially during a rush when tiles get tapped fast.
              </div>
              <input
                type="password"
                inputMode="numeric"
                placeholder="Choose a PIN (4-8 digits)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: 14, textAlign: 'center', borderRadius: 8, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', marginBottom: 8 }}
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: 14, textAlign: 'center', borderRadius: 8, border: '1.5px solid #e2e8f0', boxSizing: 'border-box', marginBottom: 8 }}
              />
              {pinSetupError && <div style={{ ...errorBoxStyle, marginBottom: 8 }}>{pinSetupError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSetupPin} disabled={pinSetupBusy} style={{ ...btn('#16a34a', '#fff'), flex: 1 }}>
                  {pinSetupBusy ? 'Saving…' : 'Save PIN'}
                </button>
                <button onClick={() => setSkippedPinSetup(true)} disabled={pinSetupBusy} style={btn('#f1f5f9', '#334155')}>
                  Skip
                </button>
              </div>
            </div>
          ) : null}

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
