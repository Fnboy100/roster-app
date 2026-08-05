const TONES = {
  draft: { bg: '#f1f5f9', text: '#334155' },
  pending_approval: { bg: '#fffbeb', text: '#b45309' },
  pending: { bg: '#fffbeb', text: '#b45309' },
  approved: { bg: '#f0fdf4', text: '#15803d' },
  rejected: { bg: '#fef2f2', text: '#b91c1c' },
};

const LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function RosterStatusBadge({ status }) {
  const tone = TONES[status] || TONES.draft;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: tone.bg,
        color: tone.text,
        whiteSpace: 'nowrap',
      }}
    >
      {LABELS[status] || status}
    </span>
  );
}
