// ─── roster-app/src/utils/exportCSV.js ───────────────────────────────────────
//
// exportCSV(staff, roster, weekLabel, departmentCode, departmentName)
//
// `departmentCode` (optional) drops the outlet suffix from each cell for
// departments that don't use outlet tags (see DEPARTMENT_SHIFT_LEGEND in
// data/constants.js). `departmentName` (optional, falls back to
// departmentCode or "Roster") is written as a title line at the top of
// the file — every export leads with the department name.

import { DAYS, cellLabel, shiftLegendForDepartment } from '../data/constants';

// Proper CSV escaping — a name or position containing a comma or quote
// used to silently corrupt the file when rows were built with a plain
// `.join(',')`. Any field needing escaping gets wrapped in quotes with
// internal quotes doubled, per RFC 4180.
function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(escapeCsvField).join(',');
}

export function exportCSV(staff, roster, weekLabel, departmentCode, departmentName) {
  const legend = shiftLegendForDepartment(departmentCode);
  const title = (departmentName || departmentCode || 'Roster').toUpperCase();

  const lines = [
    toCsvRow([`${title} — STAFF WEEKLY ROSTER`]),
    toCsvRow([`Week: ${weekLabel}`]),
    '',
    toCsvRow(['Name', 'Position', ...DAYS]),
    ...staff.map(s =>
      toCsvRow([s.name, s.position, ...DAYS.map(d => cellLabel(roster[s.id]?.[d], legend.showOutlet))])
    ),
  ];
  const csv = lines.join('\n');

  // UTF-8 with BOM so Excel opens accented names correctly instead of
  // guessing the wrong encoding.
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `roster-${title.replace(/\s/g, '_')}-${weekLabel.replace(/\s/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
