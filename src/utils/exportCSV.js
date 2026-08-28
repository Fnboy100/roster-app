// ─── roster-app/src/utils/exportCSV.js ───────────────────────────────────────
//
// exportCSV(staff, roster, weekLabel, departmentCode, departmentName, rules)
//
// `departmentCode` (optional) drops the outlet suffix from each cell for
// departments that don't use outlet tags (see DEPARTMENT_SHIFT_LEGEND in
// data/constants.js). `departmentName` (optional, falls back to
// departmentCode or "Roster") is written as a title line at the top of
// the file — every export leads with the department name. `rules`
// (optional) — specifically rules.noOffWeekends — controls whether the
// "No Off Fri/Sat/Sun" note appears in the title block, matching
// whatever was actually true when this roster was generated (see
// exportPDF.js for the same logic).

import { DAYS, WEEKEND_DAYS, cellLabel, shiftLegendForDepartment } from '../data/constants';

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

export function exportCSV(staff, roster, weekLabel, departmentCode, departmentName, rules) {
  const legend = shiftLegendForDepartment(departmentCode);
  const title = (departmentName || departmentCode || 'Roster').toUpperCase();
  const noOffWeekends = !!(rules && rules.noOffWeekends);

  const legendParts = [
    legend.am,
    legend.pm,
    ...(legend.showOutlet ? ['T = Terraces', 'RST = Restaurant'] : []),
    ...(noOffWeekends ? ['(*) Fri/Sat/Sun = No Off allowed'] : []),
  ];

  const lines = [
    toCsvRow([`${title} — STAFF WEEKLY ROSTER`]),
    toCsvRow([`Week: ${weekLabel}`]),
    toCsvRow([legendParts.join('  |  ')]),
    '',
    toCsvRow(['Name', 'Position', ...DAYS.map(d => (noOffWeekends && WEEKEND_DAYS.includes(d) ? `${d} (*)` : d))]),
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
