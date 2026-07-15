import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDepartmentScope } from '../hooks/useDepartmentScope';
import { apiErrorMessage } from '../api/client';
import * as requisitionsApi from '../api/requisitions';
import RequisitionFormModal from '../components/inventory/RequisitionFormModal';
import {
  pageStyle,
  cardStyle,
  selectStyle,
  btn,
  errorBoxStyle,
  emptyStateStyle,
  formatDateTime,
  RequisitionStatusBadge,
} from '../components/inventory/ui';

export default function Requisitions() {
  const { isMultiDept, departments, departmentId, setDepartmentId } = useDepartmentScope();
  const [status, setStatus] = useState('');
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await requisitionsApi.listRequisitions({ departmentId, status: status || undefined });
      setRequisitions(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load requisitions.'));
    } finally {
      setLoading(false);
    }
  }, [departmentId, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
            Inventory
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Requisitions</h1>
        </div>
        <button onClick={() => setShowForm(true)} style={btn('#0f172a', '#fff')}>
          + New requisition
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {isMultiDept && (
          <select value={departmentId ?? ''} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)} style={selectStyle}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="issued">Issued</option>
          <option value="partially_issued">Partially issued</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : requisitions.length === 0 ? (
        <div style={emptyStateStyle}>No requisitions match these filters.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {requisitions.map((r, i) => (
            <Link
              key={r.id}
              to={`/inventory/requisitions/${r.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '13px 16px',
                borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                  #{r.id} · {r.items.length} item{r.items.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {r.requested_by.full_name} · {formatDateTime(r.created_at)}
                </div>
              </div>
              <RequisitionStatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <RequisitionFormModal
          departments={departments}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
