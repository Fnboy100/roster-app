/**
 * exportPDF.js
 * Place this file at: roster-app/src/utils/exportPDF.js
 *
 * Requires two packages — run once in your project root:
 *   npm install jspdf jspdf-autotable
 *
 * Usage:
 *   import { exportPDF } from './utils/exportPDF';
 *   exportPDF(staff, roster, weekLabel, departmentCode);
 *
 * `departmentCode` is optional (defaults to the Bar-style legend/outlet
 * behavior this file always had) — passing e.g. "STEWARDING" switches the
 * AM/PM legend text and hides outlet tags entirely, per
 * DEPARTMENT_SHIFT_LEGEND in data/constants.js. Position grouping is
 * derived from the staff actually present (ordered via
 * DEPARTMENT_POSITIONS when possible) rather than a hardcoded list — this
 * is what previously made this file only work correctly for Bar: with a
 * fixed Bar-only position list, no other department's staff ever matched
 * a group, so the table came out empty.
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

function hexToRgb(hex) {
  const clean = (hex || '').replace('#', '');
  if (clean.length !== 6) return FALLBACK_HEADER_FILL;
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function exportPDF(staff, roster, weekLabel, departmentCode) {
  const legend = shiftLegendForDepartment(departmentCode);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Staff Weekly Roster', 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Week: ${weekLabel}`, 40, 62);
  const legendLine = legend.showOutlet
    ? `${legend.am}   |   ${legend.pm}   |   T = Terraces   |   RST = Restaurant   |   \ud83d\udd12 Fri\u00b7Sat\u00b7Sun = No Off`
    : `${legend.am}   |   ${legend.pm}   |   \ud83d\udd12 Fri\u00b7Sat\u00b7Sun = No Off`;
  doc.text(legendLine, 40, 76);

  const head = [['Position', 'Name', ...DAYS.map(d =>
    WEEKEND_DAYS.includes(d) ? `${d.slice(0, 3)} \ud83d\udd12` : d.slice(0, 3)
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
    startY: 92,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
      valign: 'middle',
      halign: 'center',
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
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
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    40, pageHeight - 20
  );

  doc.save(`roster-${weekLabel.replace(/\s/g, '_')}.pdf`);
}
