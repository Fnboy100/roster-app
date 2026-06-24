/**
 * exportPDF.js
 * Place this file at: roster-app/src/utils/exportPDF.js
 *
 * Requires two packages — run once in your project root:
 *   npm install jspdf jspdf-autotable
 *
 * Usage (already wired into App.jsx — see instructions below):
 *   import { exportPDF } from './utils/exportPDF';
 *   exportPDF(staff, roster, weekLabel);
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAYS, WEEKEND_DAYS, POSITIONS } from '../data/constants';

// Colour map used for cell backgrounds in the PDF
const SHIFT_FILL = {
  AM:  [254, 249, 195], // warm yellow
  PM:  [219, 234, 254], // soft blue
  Off: [241, 245, 249], // light grey
};

const SHIFT_TEXT = {
  AM:  [133,  77,  14],
  PM:  [ 30,  58, 138],
  Off: [148, 163, 184],
};

const POSITION_HEADER_FILL = {
  Supervisor: [251, 191,  36],  // amber
  Bartender:  [ 56, 189, 248],  // sky blue
  Barback:    [167, 139, 250],  // violet
};

export function exportPDF(staff, roster, weekLabel) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  // ── Title block ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Staff Weekly Roster', 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Week: ${weekLabel}`, 40, 62);
  doc.text(
    'AM = 11am–6pm   |   PM = 4pm–12am   |   🔒 Fri · Sat · Sun = No Off',
    40, 76
  );

  // ── Build table rows grouped by position ──────────────────────────────────
  const head = [['Position', 'Name', ...DAYS.map(d =>
    WEEKEND_DAYS.includes(d) ? `${d.slice(0,3)} 🔒` : d.slice(0, 3)
  )]];

  const body = [];
  const cellStyles = []; // parallel array: one object per body row → per-cell styles

  POSITIONS.forEach(pos => {
    const members = staff.filter(s => s.position === pos);
    if (!members.length) return;

    members.forEach((s, idx) => {
      const row = [
        idx === 0 ? pos : '',   // position label only on first row of the group
        s.name,
        ...DAYS.map(d => roster[s.id]?.[d] || 'Off'),
      ];
      body.push(row);

      // Per-cell colour info: columns 0-1 are text, columns 2+ are shift cells
      const rowCellStyles = {};
      // Position column — colour the first row of each group
      if (idx === 0) {
        rowCellStyles[0] = {
          fillColor: POSITION_HEADER_FILL[pos],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
        };
      }
      // Shift columns
      DAYS.forEach((d, i) => {
        const shift = roster[s.id]?.[d] || 'Off';
        rowCellStyles[i + 2] = {
          fillColor: SHIFT_FILL[shift],
          textColor: SHIFT_TEXT[shift],
          fontStyle: 'bold',
        };
      });
      cellStyles.push(rowCellStyles);
    });
  });

  // ── Render table ──────────────────────────────────────────────────────────
  autoTable(doc, {
    head,
    body,
    startY: 92,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 6, right: 6 },
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
      0: { halign: 'left', cellWidth: 70 },  // Position
      1: { halign: 'left', cellWidth: 72 },  // Name
      // Days auto-distribute remaining width
    },
    // Apply per-cell styles
    didParseCell(data) {
      if (data.section === 'body') {
        const rowStyles = cellStyles[data.row.index];
        if (rowStyles && rowStyles[data.column.index]) {
          const s = rowStyles[data.column.index];
          if (s.fillColor) data.cell.styles.fillColor = s.fillColor;
          if (s.textColor) data.cell.styles.textColor = s.textColor;
          if (s.fontStyle) data.cell.styles.fontStyle = s.fontStyle;
        }
      }
    },
    // Zebra stripe on name column for readability
    didDrawCell(data) {
      // nothing extra needed — colour handled above
    },
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    40,
    pageHeight - 20
  );

  // ── Save ──────────────────────────────────────────────────────────────────
  doc.save(`roster-${weekLabel.replace(/\s/g, '_')}.pdf`);
}
