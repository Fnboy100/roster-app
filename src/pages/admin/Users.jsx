import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../../api/client';
import { ROLES, ROLE_LABELS } from '../../api/roles';
import * as usersApi from '../../api/users';
import * as outletsApi from '../../api/outlets';
import * as departmentsApi from '../../api/departments';
import * as authApi from '../../api/auth';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle } from '../../components/inventory/ui';

const emptyForm = { full_name: '', email: '', password: '', role_name: '', department_id: '', outlet_id: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
            <label style={labelStyle}>Department (optional)</label>
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
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.full_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                <div>{ROLE_LABELS[u.role?.name] || u.role?.name}</div>
                <div>{u.department?.name || u.outlet?.name || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
