export const pageStyle = { maxWidth: 1140, margin: '0 auto', padding: '24px 16px' };

export const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
};

export const inputStyle = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid #e2e8f0',
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

export const selectStyle = { ...inputStyle, fontWeight: 600, color: '#334155' };

export const labelStyle = { fontSize: 12, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 };

export function btn(bg, color) {
  return {
    background: bg,
    color,
    border: 'none',
    borderRadius: 8,
    padding: '9px 16px',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  };
}

export const errorBoxStyle = {
  background: '#fef2f2',
  border: '1.5px solid #fecaca',
  color: '#b91c1c',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  marginBottom: 16,
};

export const emptyStateStyle = {
  color: '#94a3b8',
  fontSize: 13,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 24,
  textAlign: 'center',
};

// Shared across requisition status and stock movement type badges.
const PALETTE = {
  slate: { bg: '#f1f5f9', text: '#334155' },
  amber: { bg: '#fffbeb', text: '#b45309' },
  green: { bg: '#f0fdf4', text: '#15803d' },
  red: { bg: '#fef2f2', text: '#b91c1c' },
  blue: { bg: '#eff6ff', text: '#1d4ed8' },
  purple: { bg: '#faf5ff', text: '#7e22ce' },
};

export function Badge({ tone = 'slate', children }) {
  const { bg, text } = PALETTE[tone] || PALETTE.slate;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: bg,
        color: text,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function formatQty(value) {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const REQUISITION_STATUS_TONE = {
  pending: 'amber',
  approved: 'blue',
  rejected: 'red',
  issued: 'purple',
  partially_issued: 'purple',
  completed: 'green',
  cancelled: 'slate',
};

export function RequisitionStatusBadge({ status }) {
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    issued: 'Issued',
    partially_issued: 'Partially issued',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return <Badge tone={REQUISITION_STATUS_TONE[status] || 'slate'}>{labels[status] || status}</Badge>;
}

const MOVEMENT_TYPE_TONE = {
  issue: 'blue',
  restock: 'green',
  return: 'purple',
  wastage: 'red',
  adjustment: 'amber',
  transfer: 'slate',
};

export function MovementTypeBadge({ type }) {
  return <Badge tone={MOVEMENT_TYPE_TONE[type] || 'slate'}>{type}</Badge>;
}
