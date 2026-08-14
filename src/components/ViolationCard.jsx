import { Badge, btn, cardStyle, formatDateTime } from './inventory/ui';
import { VIOLATION_STATUS_LABELS, VIOLATION_TYPE_LABELS } from '../api/presence';

const SEVERITY_TONE = { low: 'slate', medium: 'amber', high: 'red' };
const STATUS_TONE = { open: 'red', acknowledged: 'amber', resolved: 'green' };

export default function ViolationCard({ violation, onUpdate, canManage }) {
  const v = violation;

  return (
    <div style={{ ...cardStyle, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{v.staff?.full_name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {VIOLATION_TYPE_LABELS[v.violation_type] || v.violation_type}
            {v.duty_post ? ` · ${v.duty_post.name}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Badge tone={SEVERITY_TONE[v.severity] || 'slate'}>{v.severity}</Badge>
          <Badge tone={STATUS_TONE[v.status] || 'slate'}>{VIOLATION_STATUS_LABELS[v.status] || v.status}</Badge>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
        {formatDateTime(v.started_at)}
        {v.ended_at ? ` – ${formatDateTime(v.ended_at)}` : ''}
        {v.duration_minutes ? ` · ${v.duration_minutes} min` : ''}
      </div>

      {v.manager_notes && <div style={{ fontSize: 13, color: '#334155', marginTop: 8 }}>{v.manager_notes}</div>}

      {canManage && v.status !== 'resolved' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {v.status === 'open' && (
            <button style={btn('#f1f5f9', '#334155')} onClick={() => onUpdate(v.id, { status: 'acknowledged' })}>
              Acknowledge
            </button>
          )}
          <button style={btn('#0f172a', '#fff')} onClick={() => onUpdate(v.id, { status: 'resolved' })}>
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}
