import { DAYS } from '../data/constants';

export function exportCSV(staff, roster, weekLabel) {
  const header = ['Name', 'Position', ...DAYS].join(',');
  const rows = staff.map(s =>
    [s.name, s.position, ...DAYS.map(d => roster[s.id]?.[d] || 'Off')].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `roster-${weekLabel.replace(/\s/g, '_')}.csv`;
  a.click();
}
