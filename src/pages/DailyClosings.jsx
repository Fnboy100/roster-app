import { useCallback, useEffect, useState } from 'react';
import { useDepartmentScope } from '../hooks/useDepartmentScope';
import { apiErrorMessage } from '../api/client';
import * as dailyClosingsApi from '../api/dailyClosings';
import { pageStyle, cardStyle, btn, inputStyle, labelStyle, selectStyle, errorBoxStyle, emptyStateStyle, formatQty, MovementTypeBadge } from '../components/inventory/ui';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyClosings() {
  const { isMultiDept, departments, departmentId, setDepartmentId } = useDepartmentScope();
  const [closingDate, setClosingDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState(null);
  const [pastClosings, setPastClosings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const canPreview = isMultiDept ? !!departmentId : true;

  const loadSummary = useCallback(async () => {
    if (!canPreview) {
      setSummary(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await dailyClosingsApi.getClosingSummary({ closingDate, departmentId });
      setSummary(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load the closing summary.'));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [closingDate, departmentId, canPreview]);

  const loadPast = useCallback(async () => {
    try {
      const data = await dailyClosingsApi.listClosings({ departmentId });
      setPastClosings(data);
    } catch {
      // Non-critical secondary list; the summary/close flow above surfaces the real errors.
    }
  }, [departmentId]);

  useEffect(() => {
    loadSummary();
    loadPast();
  }, [loadSummary, loadPast]);

  const handleClose = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await dailyClosingsApi.createClosing({
        department_id: isMultiDept ? departmentId : undefined,
        closing_date: closingDate,
        notes: notes || undefined,
      });
      setSuccess('Day closed.');
      setNotes('');
      loadSummary();
      loadPast();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not close the day.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
          Inventory
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Daily closings</h1>
      </div>

      <div style={{ ...cardStyle, padding: 18, marginBottom: 24, maxWidth: 520 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {isMultiDept && (
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}>Department</label>
              <select value={departmentId ?? ''} onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)} style={{ ...selectStyle, width: '100%' }}>
                <option value="">Select a department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Date</label>
            <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>

        {error && <div style={errorBoxStyle}>{error}</div>}
        {success && <div style={{ ...errorBoxStyle, background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d' }}>{success}</div>}

        {loading ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</div>
        ) : summary ? (
          <>
            <div style={{ marginBottom: 12 }}>
              {Object.keys(summary.movement_totals).length === 0 ? (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>No stock activity recorded for this day yet.</div>
              ) : (
                Object.entries(summary.movement_totals).map(([type, qty]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                    <MovementTypeBadge type={type} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: Number(qty) < 0 ? '#dc2626' : '#15803d' }}>
                      {Number(qty) > 0 ? '+' : ''}
                      {formatQty(qty)}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div style={{ fontSize: 12, color: summary.low_stock_alert_count > 0 ? '#dc2626' : '#94a3b8', marginBottom: 14 }}>
              {summary.low_stock_alert_count} item{summary.low_stock_alert_count === 1 ? '' : 's'} currently below threshold
            </div>

            {summary.already_closed ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>✓ Already closed for this date</div>
            ) : (
              <>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }}
                />
                <button onClick={handleClose} disabled={submitting} style={btn(submitting ? '#94a3b8' : '#0f172a', '#fff')}>
                  {submitting ? 'Closing…' : 'Close this day'}
                </button>
              </>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Select a department to preview its day.</div>
        )}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Past closings</h2>
      {pastClosings.length === 0 ? (
        <div style={emptyStateStyle}>No closings recorded yet.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {pastClosings.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', fontSize: 13, borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{c.closing_date}</span>
              <span style={{ color: '#64748b' }}>{c.notes || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
