import { useCallback, useEffect, useState } from 'react';
import { useDepartmentScope } from '../hooks/useDepartmentScope';
import { apiErrorMessage } from '../api/client';
import * as stockApi from '../api/stock';
import { pageStyle, cardStyle, selectStyle, errorBoxStyle, emptyStateStyle, formatQty, formatDateTime, MovementTypeBadge } from '../components/inventory/ui';

export default function MovementHistory() {
  const { isMultiDept, departments, departmentId, setDepartmentId } = useDepartmentScope();
  const [movementType, setMovementType] = useState('');
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await stockApi.listMovements({ departmentId, movementType: movementType || undefined });
      setMovements(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load movement history.'));
    } finally {
      setLoading(false);
    }
  }, [departmentId, movementType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
          Inventory
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Movement history</h1>
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
        <select value={movementType} onChange={(e) => setMovementType(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          <option value="issue">Issue</option>
          <option value="restock">Restock</option>
          <option value="return">Return</option>
          <option value="wastage">Wastage</option>
          <option value="adjustment">Adjustment</option>
        </select>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : movements.length === 0 ? (
        <div style={emptyStateStyle}>No stock movements match these filters.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>
            <span>Type</span>
            <span>Quantity</span>
            <span>Reason</span>
            <span>When</span>
          </div>
          {movements.map((m) => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 13, borderTop: '1px solid #f8fafc', alignItems: 'center' }}>
              <MovementTypeBadge type={m.movement_type} />
              <span style={{ fontWeight: 700, color: Number(m.quantity) < 0 ? '#dc2626' : '#15803d' }}>
                {Number(m.quantity) > 0 ? '+' : ''}
                {formatQty(m.quantity)}
              </span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{m.reason || '—'}</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatDateTime(m.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
