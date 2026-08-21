// ─── roster-app/src/utils/exportCSV.js ───────────────────────────────────────
//
// exportCSV(staff, roster, weekLabel, departmentCode)
//
// `departmentCode` is optional — passing e.g. "STEWARDING" drops the
// outlet suffix from each cell (that department doesn't use outlet tags;
// see DEPARTMENT_SHIFT_LEGEND in data/constants.js), matching whatever
// exportPDF.js and the on-screen table show for the same roster.

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

export function exportCSV(staff, roster, weekLabel, departmentCode) {
  const legend = shiftLegendForDepartment(departmentCode);

  const header = toCsvRow(['Name', 'Position', ...DAYS]);
  const rows = staff.map(s =>
    toCsvRow([s.name, s.position, ...DAYS.map(d => cellLabel(roster[s.id]?.[d], legend.showOutlet))])
  );
  const csv = [header, ...rows].join('\n');

  // UTF-8 with BOM so Excel opens accented names correctly instead of
  // guessing the wrong encoding.
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `roster-${weekLabel.replace(/\s/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
