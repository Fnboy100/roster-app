import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import * as outletsApi from '../api/outlets';
import * as presenceApi from '../api/presence';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../api/roles';
import ViolationCard from '../components/ViolationCard';
import { pageStyle, btn, selectStyle, labelStyle, inputStyle, errorBoxStyle, emptyStateStyle } from '../components/inventory/ui';
import { VIOLATION_STATUS_LABELS } from '../api/presence';

function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PresenceReports() {
  const { user } = useAuth();
  const isMultiOutlet = user?.role?.name === ROLES.ADMIN;
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id;
  const canManage = [ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER].includes(user?.role?.name);

  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState(myOutletId || '');
  const [dateFrom, setDateFrom] = useState(daysAgoISO(7));
  const [dateTo, setDateTo] = useState(todayISO());
  const [statusFilter, setStatusFilter] = useState('');
  const [violations, setViolations] = useState([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isMultiOutlet) outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, [isMultiOutlet]);

  const load = useCallback(async () => {
    try {
      setViolations(
        await presenceApi.listViolations({
          outletId: outletId ? Number(outletId) : undefined,
          dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
          dateTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
          status: statusFilter || undefined,
        })
      );
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load violations.'));
    }
  }, [outletId, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (violationId, payload) => {
    try {
      await presenceApi.updateViolation(violationId, payload);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the violation.'));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await presenceApi.exportViolationsCSV({
        outletId: outletId ? Number(outletId) : undefined,
        dateFrom: dateFrom ? `${dateFrom}T00:00:00Z` : undefined,
        dateTo: dateTo ? `${dateTo}T23:59:59Z` : undefined,
        status: statusFilter || undefined,
      });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not export the CSV.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Presence</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Presence Reports</h1>
        </div>
        <button style={btn(exporting ? '#94a3b8' : '#0f172a', '#fff')} disabled={exporting} onClick={handleExport}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {isMultiOutlet && (
          <div>
            <label style={labelStyle}>Outlet</label>
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} style={selectStyle}>
              <option value="">All outlets</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
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
        <div>
          <label style={labelStyle}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="">All statuses</option>
            {Object.entries(VIOLATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {violations.length === 0 ? (
        <div style={emptyStateStyle}>No violations found for this filter.</div>
      ) : (
        <div>
          {violations.map((v) => (
            <ViolationCard key={v.id} violation={v} onUpdate={handleUpdate} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}
