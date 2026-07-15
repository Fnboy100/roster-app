import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../../api/client';
import * as outletsApi from '../../api/outlets';
import * as departmentsApi from '../../api/departments';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle } from '../../components/inventory/ui';

export default function AdminDepartments() {
  const [outlets, setOutlets] = useState([]);
  const [outletFilter, setOutletFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  const [outletId, setOutletId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setDepartments(await departmentsApi.listDepartments({ outletId: outletFilter || undefined }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load departments.'));
    }
  }, [outletFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!outletId) {
      setFormError('Select an outlet.');
      return;
    }
    setSubmitting(true);
    try {
      await departmentsApi.createDepartment({ outlet_id: Number(outletId), name, code });
      setName('');
      setCode('');
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create the department.'));
    } finally {
      setSubmitting(false);
    }
  };

  const outletName = (id) => outlets.find((o) => o.id === id)?.name || `Outlet ${id}`;

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Admin</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Departments</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 18, marginBottom: 24, maxWidth: 460 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>New department</h3>
        {formError && <div style={errorBoxStyle}>{formError}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Outlet</label>
          <select value={outletId} onChange={(e) => setOutletId(e.target.value)} style={{ ...selectStyle, width: '100%' }} required>
            <option value="">Select an outlet…</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bar" style={{ ...inputStyle, width: '100%' }} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. BAR" style={{ ...inputStyle, width: '100%' }} required />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Only needs to be unique within the selected outlet — a second outlet can reuse "BAR".
          </div>
        </div>
        <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
          {submitting ? 'Creating…' : 'Create department'}
        </button>
      </form>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Filter by outlet</label>
        <select value={outletFilter} onChange={(e) => setOutletFilter(e.target.value)} style={selectStyle}>
          <option value="">All outlets</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {departments.length === 0 ? (
        <div style={emptyStateStyle}>No departments yet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {departments.map((d, i) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {d.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({d.code})</span>
              </span>
              <span style={{ color: '#64748b' }}>{outletName(d.outlet_id)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
