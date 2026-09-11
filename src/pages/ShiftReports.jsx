import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import * as outletsApi from '../api/outlets';
import * as departmentsApi from '../api/departments';
import * as presenceApi from '../api/presence';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../api/roles';
import { pageStyle, btn, selectStyle, labelStyle, inputStyle, errorBoxStyle, emptyStateStyle, cardStyle } from '../components/inventory/ui';
import { SHIFT_LABELS } from '../api/presence';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function scheduleLabel(schedule) {
  if (!schedule) return '—';
  const bits = [schedule.shift];
  if (schedule.is_split) bits.push('Split');
  if (schedule.schedule_label) bits.push(schedule.schedule_label);
  else if (schedule.expected_start) bits.push(schedule.expected_start);
  return bits.filter(Boolean).join(' · ');
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
}

export default function ShiftReports() {
  const { user } = useAuth();
  const isMultiOutlet = user?.role?.name === ROLES.ADMIN;
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id;

  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState(myOutletId || '');
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [shift, setShift] = useState('AM');
  const [reportType, setReportType] = useState('start'); // 'start' | 'end'

  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    if (isMultiOutlet) outletsApi.listOutlets().then(setOutlets).catch(() => {});
  }, [isMultiOutlet]);

  useEffect(() => {
    if (!outletId) return;
    departmentsApi.listDepartments({ outletId: Number(outletId) }).then(setDepartments).catch(() => {});
  }, [outletId]);

  const load = useCallback(async () => {
    if (!outletId) return;
    setLoading(true);
    setError('');
    try {
      const fetcher = reportType === 'start' ? presenceApi.getStartOfShiftReport : presenceApi.getEndOfShiftReport;
      setReport(
        await fetcher({
          outletId: Number(outletId),
          reportDate,
          shift,
          departmentId: departmentId ? Number(departmentId) : undefined,
        })
      );
    } catch (err) {
      setReport(null);
      setError(apiErrorMessage(err, 'Could not load this report.'));
    } finally {
      setLoading(false);
    }
  }, [outletId, reportDate, shift, departmentId, reportType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const exporter = reportType === 'start' ? presenceApi.exportStartOfShiftReport : presenceApi.exportEndOfShiftReport;
      await exporter({
        outletId: Number(outletId),
        reportDate,
        shift,
        departmentId: departmentId ? Number(departmentId) : undefined,
        format,
      });
    } catch (err) {
      setError(apiErrorMessage(err, `Could not export the ${format.toUpperCase()}.`));
    } finally {
      setExporting(null);
    }
  };

  const departmentGroups = report?.departments || [];
  const totalStaff = departmentGroups.reduce((sum, g) => sum + g.staff.length, 0);

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Presence</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Shift Reports</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn(exporting === 'csv' ? '#94a3b8' : '#0f172a', '#fff')} disabled={!!exporting || !outletId} onClick={() => handleExport('csv')}>
            {exporting === 'csv' ? 'Exporting…' : '\u2193 CSV'}
          </button>
          <button style={btn(exporting === 'pdf' ? '#94a3b8' : '#b91c1c', '#fff')} disabled={!!exporting || !outletId} onClick={() => handleExport('pdf')}>
            {exporting === 'pdf' ? 'Exporting…' : '\u2193 PDF'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          style={btn(reportType === 'start' ? '#0f172a' : '#f1f5f9', reportType === 'start' ? '#fff' : '#334155')}
          onClick={() => setReportType('start')}
        >
          Start of Shift (Attendance)
        </button>
        <button
          style={btn(reportType === 'end' ? '#0f172a' : '#f1f5f9', reportType === 'end' ? '#fff' : '#334155')}
          onClick={() => setReportType('end')}
        >
          End of Shift (Closing)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {isMultiOutlet && (
          <div>
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
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Shift</label>
          <select value={shift} onChange={(e) => setShift(e.target.value)} style={selectStyle}>
            {Object.entries(SHIFT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} style={selectStyle}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {!outletId ? (
        <div style={emptyStateStyle}>Select an outlet to view the report.</div>
      ) : loading ? (
        <div style={emptyStateStyle}>Loading…</div>
      ) : totalStaff === 0 ? (
        <div style={emptyStateStyle}>
          {reportType === 'start'
            ? 'No staff have clocked in for this shift yet.'
            : 'No staff have completed this shift yet.'}
        </div>
      ) : (
        departmentGroups.map((group) => (
          <div key={group.department_id} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1B1A17', marginBottom: 10 }}>{group.department_name}</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {group.staff.map((row) => (
                <div key={row.roster_staff_id} style={{ ...cardStyle, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{row.full_name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {row.duty_post_name || 'No post assigned'} · {scheduleLabel(row.schedule)}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#334155', textAlign: 'right' }}>
                      <div>In: {fmtTime(row.clock_in_time)}</div>
                      {reportType === 'end' && <div>Out: {fmtTime(row.clock_out_time)}</div>}
                    </div>
                  </div>

                  {reportType === 'end' && (
                    <div style={{ marginTop: 10, fontSize: 12.5, color: '#475569' }}>
                      {row.post_events.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <strong>Post activity:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                            {row.post_events.map((e, i) => (
                              <li key={i}>
                                {fmtTime(e.occurred_at)} — {e.event_type === 'post_check_in' ? 'Checked in' : 'Checked out'}
                                {e.duty_post_name ? ` at ${e.duty_post_name}` : ''}
                                {e.notes ? `: "${e.notes}"` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {row.breaks.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          <strong>Breaks:</strong>{' '}
                          {row.breaks
                            .map((b) => (b.break_end ? `${fmtTime(b.break_start)}–${fmtTime(b.break_end)} (${b.duration_minutes}m)` : `${fmtTime(b.break_start)}–(not ended)`))
                            .join(', ')}
                        </div>
                      )}
                      {row.violations.length > 0 && (
                        <div style={{ color: '#b91c1c' }}>
                          <strong>Violations:</strong>{' '}
                          {row.violations.map((v) => `${v.violation_type.replace(/_/g, ' ')} (${v.severity})`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
