/**
 * exportPDF.js
 * Place this file at: roster-app/src/utils/exportPDF.js
 *
 * Requires two packages — run once in your project root:
 *   npm install jspdf jspdf-autotable
 *
 * Usage:
 *   import { exportPDF } from './utils/exportPDF';
 *   exportPDF(staff, roster, weekLabel, departmentCode, departmentName);
 *
 * `departmentCode` (optional) switches the AM/PM legend text and outlet
 * visibility per DEPARTMENT_SHIFT_LEGEND in data/constants.js.
 * `departmentName` (optional, falls back to departmentCode or "Roster")
 * is what's printed as the large bold title at the top of the page —
 * every export must lead with the department name, per this feature's
 * requirements.
 *
 * Two defects fixed here that were specific to this file:
 *   1. The day-header lock emoji (🔒) was embedded directly in doc.text()
 *      calls. jsPDF's built-in Helvetica font can't render that Unicode
 *      codepoint and silently substitutes garbled characters instead
 *      (visible as "Ø=Ý" in a broken export) — replaced with a plain
 *      ASCII marker.
 *   2. The AM/PM legend line was drawn with a single doc.text() call and
 *      no width check, so a longer legend (e.g. Stewarding's) ran off
 *      the right edge of the page instead of wrapping. Now wrapped with
 *      splitTextToSize and the table's startY is computed from however
 *      many lines that actually took, instead of a fixed offset.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAYS, WEEKEND_DAYS, DEPARTMENT_POSITIONS, POSITION_COLORS, cellLabel, shiftLegendForDepartment } from '../data/constants';

const SHIFT_FILL = {
  AM:  [254, 249, 195],
  PM:  [219, 234, 254],
  Off: [241, 245, 249],
};
const SHIFT_TEXT = {
  AM:  [133,  77,  14],
  PM:  [ 30,  58, 138],
  Off: [148, 163, 184],
};

const ALL_KNOWN_POSITIONS = Object.values(DEPARTMENT_POSITIONS).flat();
const FALLBACK_HEADER_FILL = [148, 163, 184];
const PAGE_MARGIN = 40;

function hexToRgb(hex) {
  const clean = (hex || '').replace('#', '');
  if (clean.length !== 6) return FALLBACK_HEADER_FILL;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function exportPDF(staff, roster, weekLabel, departmentCode, departmentName, rules) {
  const legend = shiftLegendForDepartment(departmentCode);
  // Only true when this roster was actually generated with the "No Off
  // Fri/Sat/Sun" rule turned on — previously the weekend marker and its
  // legend line were always shown regardless of the rule, which was
  // actively misleading when the rule had been unticked.
  const noOffWeekends = !!(rules && rules.noOffWeekends);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - PAGE_MARGIN * 2;

  // ── Department name — large and bold, always the first thing on the page ──
  const title = (departmentName || departmentCode || 'Roster').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text(title, PAGE_MARGIN, 44);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Staff Weekly Roster', PAGE_MARGIN, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Week: ${weekLabel}`, PAGE_MARGIN, 76);

  // Legend — wrapped to the page width instead of a single unbounded line,
  // and built from plain ASCII only (no emoji) so jsPDF's default font
  // renders it correctly.
  const legendLine = [
    legend.am,
    legend.pm,
    ...(legend.showOutlet ? ['T = Terraces', 'RST = Restaurant'] : []),
    ...(noOffWeekends ? ['(*) Fri/Sat/Sun = No Off allowed'] : []),
  ].join('  |  ');
  const legendLines = doc.splitTextToSize(legendLine, usableWidth);
  doc.text(legendLines, PAGE_MARGIN, 90);

  const tableStartY = 90 + legendLines.length * 12 + 10;

  const head = [['Position', 'Name', ...DAYS.map(d =>
    noOffWeekends && WEEKEND_DAYS.includes(d) ? `${d.slice(0, 3)} (*)` : d.slice(0, 3)
  )]];

  const body = [];
  const cellStyles = [];

  // Group by whatever positions are actually present on this roster,
  // ordered via the canonical DEPARTMENT_POSITIONS lists when a position
  // is recognized (any position not in a known list still renders, just
  // grouped after the known ones, rather than being silently dropped).
  const presentPositions = [...new Set(staff.map(s => s.position))];
  const orderedPositions = [
    ...ALL_KNOWN_POSITIONS.filter(p => presentPositions.includes(p)),
    ...presentPositions.filter(p => !ALL_KNOWN_POSITIONS.includes(p)),
  ];

  orderedPositions.forEach(pos => {
    const members = staff.filter(s => s.position === pos);
    if (!members.length) return;
    const headerFill = hexToRgb((POSITION_COLORS[pos] || {}).border) || FALLBACK_HEADER_FILL;

    members.forEach((s, idx) => {
      const row = [
        idx === 0 ? pos : '',
        s.name,
        ...DAYS.map(d => cellLabel(roster[s.id]?.[d], legend.showOutlet)),
      ];
      body.push(row);

      const rowCellStyles = {};
      if (idx === 0) {
        rowCellStyles[0] = { fillColor: headerFill, textColor: [15, 23, 42], fontStyle: 'bold' };
      }
      DAYS.forEach((d, i) => {
        const cell = roster[s.id]?.[d];
        const shift = cell?.shift || 'Off';
        rowCellStyles[i + 2] = {
          fillColor: SHIFT_FILL[shift],
          textColor: SHIFT_TEXT[shift],
          fontStyle: 'bold',
        };
      });
      cellStyles.push(rowCellStyles);
    });
  });

  autoTable(doc, {
    head,
    body,
    startY: tableStartY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    tableWidth: usableWidth,
    styles: {
      fontSize: 8,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
      valign: 'middle',
      halign: 'center',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 68 },
      1: { halign: 'left', cellWidth: 70 },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        const s = cellStyles[data.row.index]?.[data.column.index];
        if (s) {
          if (s.fillColor) data.cell.styles.fillColor = s.fillColor;
          if (s.textColor) data.cell.styles.textColor = s.textColor;
          if (s.fontStyle) data.cell.styles.fontStyle = s.fontStyle;
        }
      }
    },
    // Repeats the department title on every page of a long roster, so a
    // multi-page export never loses context of which department it is.
    didDrawPage() {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(title, PAGE_MARGIN, doc.internal.pageSize.getHeight() - 20);
    },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    pageWidth - PAGE_MARGIN, pageHeight - 20, { align: 'right' }
  );

  doc.save(`roster-${title.replace(/\s/g, '_')}-${weekLabel.replace(/\s/g, '_')}.pdf`);
}
