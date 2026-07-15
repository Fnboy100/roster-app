import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { MULTI_DEPARTMENT_ROLES } from '../api/roles';
import * as reportsApi from '../api/reports';
import * as itemsApi from '../api/items';
import * as departmentsApi from '../api/departments';

const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: '16px 18px',
  border: '1px solid #e2e8f0',
  flex: '1 1 160px',
  minWidth: 160,
};

function Card({ label, value, tone }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: tone || '#0f172a' }}>{value}</div>
    </div>
  );
}

export default function InventoryDashboard() {
  const { user } = useAuth();
  const isMultiDept = MULTI_DEPARTMENT_ROLES.includes(user?.role?.name);
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id ?? undefined;

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(undefined);
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isMultiDept) return;
    departmentsApi
      .listDepartments({ outletId: myOutletId })
      .then(setDepartments)
      .catch(() => {});
  }, [isMultiDept, myOutletId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, alerts] = await Promise.all([
        reportsApi.getDashboardSummary({ departmentId }),
        itemsApi.getLowStockAlerts({ departmentId }),
      ]);
      setSummary(dash);
      setLowStock(alerts);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
            Inventory
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Dashboard</h1>
        </div>

        {isMultiDept && departments.length > 0 && (
          <select
            value={departmentId ?? ''}
            onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#334155' }}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <Card label="Pending requisitions" value={summary?.pending_requisitions ?? '—'} />
            <Card label="Approved, awaiting issue" value={summary?.approved_awaiting_issue ?? '—'} />
            <Card label="Low stock items" value={summary?.low_stock_count ?? '—'} tone={summary?.low_stock_count > 0 ? '#dc2626' : undefined} />
            <Card label="Wastage today" value={summary?.today_wastage_qty ?? '—'} />
            <Card label="Issued today" value={summary?.today_issued_qty ?? '—'} />
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Low stock alerts</h2>
          {lowStock.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, textAlign: 'center' }}>
              Nothing below threshold right now.
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              {lowStock.map((alert, i) => (
                <div
                  key={`${alert.item_id}-${alert.department_id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{alert.item_name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {alert.sku} · {alert.department_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#dc2626' }}>{String(alert.quantity)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>min {String(alert.min_quantity)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
