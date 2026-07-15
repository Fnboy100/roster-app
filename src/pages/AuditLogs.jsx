import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage } from '../api/client';
import * as auditLogsApi from '../api/auditLogs';
import { pageStyle, cardStyle, inputStyle, labelStyle, errorBoxStyle, emptyStateStyle, formatDateTime } from '../components/inventory/ui';

export default function AuditLogs() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await auditLogsApi.listAuditLogs({
        action: action || undefined,
        entityType: entityType || undefined,
        limit: 200,
      });
      setLogs(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load audit logs. This page requires an admin or manager account.'));
    } finally {
      setLoading(false);
    }
  }, [action, entityType]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>
          Inventory
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Audit log</h1>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Action contains</label>
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. requisition.approve" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Entity type</label>
          <input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. requisition" style={inputStyle} />
        </div>
      </div>

      {error && <div style={errorBoxStyle}>{error}</div>}

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : logs.length === 0 ? (
        !error && <div style={emptyStateStyle}>No audit entries match these filters.</div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {logs.map((log, i) => (
            <div key={log.id} style={{ padding: '10px 16px', borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{log.action}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{formatDateTime(log.created_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {log.entity_type}
                {log.entity_id ? ` #${log.entity_id}` : ''} · user #{log.user_id ?? '—'}
              </div>
              {log.details && (
                <pre style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {JSON.stringify(log.details)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
