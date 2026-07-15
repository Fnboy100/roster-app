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
import { DAYS, WEEKEND_DAYS, POSITIONS, cellLabel } from '../data/constants';

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
const OUTLET_SUFFIX_COLOR = {
  T:   [22, 101, 52],
  RST: [107, 33, 168],
};
const POSITION_HEADER_FILL = {
  Supervisor: [251, 191,  36],
  Bartender:  [ 56, 189, 248],
  Barback:    [167, 139, 250],
};

export function exportPDF(staff, roster, weekLabel) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Staff Weekly Roster', 40, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Week: ${weekLabel}`, 40, 62);
  doc.text('AM = 11am–6pm   |   PM = 4pm–12am   |   T = Terraces   |   RST = Restaurant   |   🔒 Fri·Sat·Sun = No Off', 40, 76);

  const head = [['Position', 'Name', ...DAYS.map(d =>
    WEEKEND_DAYS.includes(d) ? `${d.slice(0, 3)} 🔒` : d.slice(0, 3)
  )]];

  const body = [];
  const cellStyles = [];

  POSITIONS.forEach(pos => {
    const members = staff.filter(s => s.position === pos);
    if (!members.length) return;

    members.forEach((s, idx) => {
      const row = [
        idx === 0 ? pos : '',
        s.name,
        ...DAYS.map(d => cellLabel(roster[s.id]?.[d])),
      ];
      body.push(row);

      const rowCellStyles = {};
      if (idx === 0) {
        rowCellStyles[0] = { fillColor: POSITION_HEADER_FILL[pos], textColor: [15, 23, 42], fontStyle: 'bold' };
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

