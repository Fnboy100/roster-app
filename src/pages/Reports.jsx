import { useCallback, useEffect, useState } from 'react';
import { useDepartmentScope } from '../hooks/useDepartmentScope';
import { apiErrorMessage } from '../api/client';
import * as reportsApi from '../api/reports';
import {
  pageStyle,
  cardStyle,
  btn,
  inputStyle,
  labelStyle,
  selectStyle,
  errorBoxStyle,
  emptyStateStyle,
  formatQty,
  formatDateTime,
  MovementTypeBadge,
  RequisitionStatusBadge,
} from '../components/inventory/ui';

function SectionHeader({ title, onDownload }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{title}</h2>
      {onDownload && (
        <button onClick={onDownload} style={{ ...btn('#f1f5f9', '#334155'), padding: '6px 12px', fontSize: 12 }}>
          ↓ CSV
        </button>
      )}
    </div>
  );
}

export default function Reports() {
  const { isMultiDept, departments, departmentId, setDepartmentId } = useDepartmentScope();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [movements, setMovements] = useState([]);
  const [requisitionStatuses, setRequisitionStatuses] = useState([]);
  const [wastage, setWastage] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const filters = { departmentId, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };
    try {
      const [m, r, w] = await Promise.all([
        reportsApi.getMovementSummary(filters),
        reportsApi.getRequisitionStatusSummary(filters),
        reportsApi.getWastageReport(filters),
      ]);
      setMovements(m);
      setRequisitionStatuses(r);
      setWastage(w);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load reports.'));
    } finally {
      setLoading(false);
    }
  }, [departmentId, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const download = (key) => {
    reportsApi.downloadReportCsv(key, { departmentId, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }).catch(() => {
      setError('Could not download the CSV.');
    });
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
          Inventory
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Reports</h1>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {isMultiDept && (
          <div>
            <label style={labelStyle}>Department</label>
            <select value={departmentId ?? ''} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)} style={selectStyle}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label style={labelStyle}>From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          <SectionHeader title="Stock movement totals" onDownload={() => download('movements')} />
          {movements.length === 0 ? (
            <div style={{ ...emptyStateStyle, marginBottom: 28 }}>No movements in this range.</div>
          ) : (
            <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 28 }}>
              {movements.map((m, i) => (
                <div key={m.movement_type} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
                  <MovementTypeBadge type={m.movement_type} />
                  <span style={{ fontSize: 13, color: '#334155' }}>
                    {formatQty(m.total_quantity)} total · {m.movement_count} movement{m.movement_count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          <SectionHeader title="Requisitions by status" onDownload={() => download('requisitions')} />
          {requisitionStatuses.length === 0 ? (
            <div style={{ ...emptyStateStyle, marginBottom: 28 }}>No requisitions in this range.</div>
          ) : (
            <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 28 }}>
              {requisitionStatuses.map((r, i) => (
                <div key={r.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
                  <RequisitionStatusBadge status={r.status} />
                  <span style={{ fontSize: 13, color: '#334155' }}>{r.count}</span>
                </div>
              ))}
            </div>
          )}

          <SectionHeader title="Wastage log" onDownload={() => download('wastage')} />
          {wastage.length === 0 ? (
            <div style={emptyStateStyle}>No wastage recorded in this range.</div>
          ) : (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              {wastage.map((w, i) => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{w.item_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {w.department_name} · {w.performed_by_name} · {formatDateTime(w.created_at)}
                    </div>
                    {w.reason && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{w.reason}</div>}
                  </div>
                  <span style={{ fontWeight: 800, color: '#dc2626', fontSize: 14 }}>{formatQty(w.quantity)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
