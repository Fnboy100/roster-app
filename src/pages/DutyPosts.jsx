import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import * as outletsApi from '../api/outlets';
import * as presenceApi from '../api/presence';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../api/roles';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle, Badge } from '../components/inventory/ui';

export default function DutyPosts() {
  const { user } = useAuth();
  const isMultiOutlet = user?.role?.name === ROLES.ADMIN;
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id;

  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState(myOutletId || '');
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isMultiOutlet) outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, [isMultiOutlet]);

  const load = useCallback(async () => {
    if (!outletId) return;
    try {
      setPosts(await presenceApi.listDutyPosts({ outletId: Number(outletId), includeInactive: true }));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load duty posts.'));
    }
  }, [outletId]);

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
      await presenceApi.createDutyPost({ outlet_id: Number(outletId), name, description: description || undefined });
      setName('');
      setDescription('');
      load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create the duty post.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (post) => {
    try {
      await presenceApi.updateDutyPost(post.id, { is_active: !post.is_active });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the duty post.'));
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Presence</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Duty Posts</h1>
      </div>

      {isMultiOutlet && (
        <div style={{ marginBottom: 16 }}>
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

      {outletId && (
        <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 18, marginBottom: 24, maxWidth: 460 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>New duty post</h3>
          {formError && <div style={errorBoxStyle}>{formError}</div>}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Bar" style={{ ...inputStyle, width: '100%' }} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Front bar station + service well" style={{ ...inputStyle, width: '100%' }} />
          </div>
          <button type="submit" disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
            {submitting ? 'Creating…' : 'Create duty post'}
          </button>
        </form>
      )}

      {error && <div style={errorBoxStyle}>{error}</div>}
      {!outletId ? (
        <div style={emptyStateStyle}>Select an outlet to manage its duty posts.</div>
      ) : posts.length === 0 ? (
        <div style={emptyStateStyle}>No duty posts yet for this outlet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {posts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 12, color: '#64748b' }}>{p.description}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge tone={p.is_active ? 'green' : 'slate'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                <button style={btn('#f1f5f9', '#334155')} onClick={() => toggleActive(p)}>
                  {p.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
