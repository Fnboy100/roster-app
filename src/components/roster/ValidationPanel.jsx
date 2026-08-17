const SECTIONS = [
  { key: 'missing_coverage', label: 'Missing coverage', tone: 'red' },
  { key: 'consecutive_violations', label: 'Consecutive-shift violations', tone: 'red' },
  { key: 'split_violations', label: 'Split-shift eligibility issues', tone: 'red' },
  { key: 'manual_override_conflicts', label: 'Manual override conflicts', tone: 'violet' },
  { key: 'over_hours', label: 'Over target hours', tone: 'amber' },
  { key: 'under_hours', label: 'Under target hours', tone: 'amber' },
];

const TONE_STYLES = {
  red: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
  amber: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  violet: { bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6' },
};

export default function ValidationPanel({ report }) {
  if (!report) return null;

  const sectionsWithIssues = SECTIONS.map((s) => ({ ...s, issues: report[s.key] || [] })).filter((s) => s.issues.length > 0);

  if (report.is_valid && sectionsWithIssues.length === 0) {
    return (
      <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#15803d', marginBottom: 14 }}>
        ✓ Coverage satisfied, everyone within their hour targets, no rotation violations.
      </div>
    );
  }

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 18, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: report.is_valid ? '#0f172a' : '#b91c1c' }}>
          {report.is_valid ? 'Roster valid — fairness notes below' : 'Roster has coverage or hard-limit issues'}
        </span>
      </div>

      {sectionsWithIssues.length === 0 ? (
        <div style={{ fontSize: 13, color: '#64748b' }}>No issues to report.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sectionsWithIssues.map(({ key, label, tone, issues }) => {
            const t = TONE_STYLES[tone];
            return (
              <div key={key} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: t.text, marginBottom: 4 }}>
                  {label} ({issues.length})
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {issues.map((issue, i) => (
                    <li key={i} style={{ fontSize: 12, color: t.text, marginBottom: 2 }}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
