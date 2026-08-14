import { Badge } from './inventory/ui';
import { PRESENCE_STATUS_LABELS } from '../api/presence';

const STATUS_TONE = {
  off_duty: 'slate',
  on_shift_at_post: 'green',
  on_shift_on_break: 'amber',
  unknown: 'red',
};

export default function PresenceStatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] || 'slate'}>{PRESENCE_STATUS_LABELS[status] || status}</Badge>;
}
