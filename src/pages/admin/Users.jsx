import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../api/client';
import { ROLES, ROLE_LABELS } from '../../api/roles';
import * as usersApi from '../../api/users';
import * as outletsApi from '../../api/outlets';
import * as departmentsApi from '../../api/departments';
import * as authApi from '../../api/auth';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle, Badge } from '../../components/inventory/ui';

const emptyForm = { full_name: '', email: '', password: '', role_name: '', department_id: '', outlet_id: '' };

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rowError, setRowError] = useState({});
  const [busyRowId, setBusyRowId] = useState(null);

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.listUsers());
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load users. This page requires an admin or manager account.'));
    }
  }, []);

  useEffect(() => {
    load();
    outletsApi.listOutlets().then(setOutlets).catch(() => {});
    departmentsApi.listDepartments().then(setDepartments).catch(() => {});
  }, [load]);

  const isOutletManager = form.role_name === ROLES.OUTLET_MANAGER;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (isOutletManager && !form.outlet_id) {
      setFormError('Outlet manager accounts require an outlet.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.registerUser({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role_name: form.role_name,
        department_id: form.department_id ? Number(form.department_id) : undefined,
        outlet_id: isOutletManager ? Number(form.outlet_id) : undefined,
      });
      setSuccess(`${form.full_name} created.`);
      setForm(emptyForm);
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create this user.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepartmentChange = async (userId, departmentId) => {
    setBusyRowId(userId);
    setRowError((prev) => ({ ...prev, [userId]: '' }));
    try {
      const updated = await usersApi.updateUser(userId, { department_id: departmentId ? Number(departmentId) : null });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setRowError((prev) => ({ ...prev, [userId]: apiErrorMessage(err, 'Could not update this user.') }));
    } finally {
      setBusyRowId(null);
    }
  };

  const handleDeactivate = async (userId) => {
    setBusyRowId(userId);
    setRowError((prev) => ({ ...prev, [userId]: '' }));
    try {
      const updated = await usersApi.deactivateUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setRowError((prev) => ({ ...prev, [userId]: apiErrorMessage(err, 'Could not deactivate this user.') }));
    } finally {
      setBusyRowId(null);
    }
  };

  const handleReactivate = async (userId) => {
    setBusyRowId(userId);
    setRowError((prev) => ({ ...prev, [userId]: '' }));
    try {
      const updated = await usersApi.reactivateUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      setRowError((prev) => ({ ...prev, [userId]: apiErrorMessage(err, 'Could not reactivate this user.') }));
    } finally {
      setBusyRowId(null);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Admin</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Users</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 18, marginBottom: 24, maxWidth: 460 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>New user</h3>
        {formError && <div style={errorBoxStyle}>{formError}</div>}
        {success && <div style={{ ...errorBoxStyle, background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d' }}>{success}</div>}

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Full name</label>
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, width: '100%' }} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Password</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ ...inputStyle, width: '100%' }} minLength={8} required />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Just a starting password — the person can change it themselves from their account menu once they log in.</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Role</label>
          <select value={form.role_name} onChange={(e) => setForm({ ...form, role_name: e.target.value })} style={{ ...selectStyle, width: '100%' }} required>
            <option value="">Select a role…</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          {form.role_name === ROLES.MANAGER && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Managers are scoped to one department — pick the department below, or they won't be able to see or approve anything until you do.
            </div>
          )}
        </div>

        {isOutletManager ? (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Outlet</label>
            <select value={form.outlet_id} onChange={(e) => setForm({ ...form, outlet_id: e.target.value })} style={{ ...selectStyle, width: '100%' }} required>
              <option value="">Select an outlet…</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Department{form.role_name === ROLES.MANAGER ? '' : ' (optional)'}</label>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} style={{ ...selectStyle, width: '100%' }}>
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
          {submitting ? 'Creating…' : 'Create user'}
        </button>
      </form>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {users.length === 0 ? (
        !error && <div style={emptyStateStyle}>No users found.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {users.map((u, i) => (
            <div key={u.id} style={{ padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{u.full_name}</span>
                    {!u.is_active && <Badge tone="red">Deactivated</Badge>}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
                </div>

                <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                  <div>{ROLE_LABELS[u.role?.name] || u.role?.name}</div>
                  <div>{u.outlet?.name || '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                {u.role?.name !== ROLES.OUTLET_MANAGER ? (
                  <select
                    value={u.department?.id ?? ''}
                    onChange={(e) => handleDepartmentChange(u.id, e.target.value)}
                    disabled={busyRowId === u.id}
                    style={{ ...selectStyle, fontSize: 12, padding: '5px 10px' }}
                  >
                    <option value="">No department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span />
                )}

                {u.id === me?.id ? (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>This is you</span>
                ) : u.is_active ? (
                  <button
                    onClick={() => handleDeactivate(u.id)}
                    disabled={busyRowId === u.id}
                    style={{ ...btn('#fef2f2', '#b91c1c'), padding: '5px 12px', fontSize: 12 }}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(u.id)}
                    disabled={busyRowId === u.id}
                    style={{ ...btn('#f0fdf4', '#15803d'), padding: '5px 12px', fontSize: 12 }}
                  >
                    Reactivate
                  </button>
                )}
              </div>

              {rowError[u.id] && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>{rowError[u.id]}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
