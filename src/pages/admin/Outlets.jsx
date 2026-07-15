import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../../api/client';
import * as outletsApi from '../../api/outlets';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, errorBoxStyle, emptyStateStyle } from '../../components/inventory/ui';

export default function AdminOutlets() {
  const [outlets, setOutlets] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setOutlets(await outletsApi.listOutlets());
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load outlets.'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await outletsApi.createOutlet({ name, code, address: address || undefined });
      setName('');
      setCode('');
      setAddress('');
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create the outlet.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Admin</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Outlets</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 18, marginBottom: 24, maxWidth: 460 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>New outlet</h3>
        {formError && <div style={errorBoxStyle}>{formError}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, width: '100%' }} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. DOWNTOWN" style={{ ...inputStyle, width: '100%' }} required />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Address (optional)</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
          {submitting ? 'Creating…' : 'Create outlet'}
        </button>
      </form>

      {error && <div style={errorBoxStyle}>{error}</div>}
      {outlets.length === 0 ? (
        <div style={emptyStateStyle}>No outlets yet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {outlets.map((o, i) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc', fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {o.name} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({o.code})</span>
              </span>
              <span style={{ color: '#64748b' }}>{o.address || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
