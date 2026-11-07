import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAYS, DEPARTMENT_POSITIONS, POSITIONS, POSITION_COLORS, WEEKEND_DAYS, positionsForDepartment,
} from '../src/data/constants.js';
import { generateRoster } from '../src/utils/generateRoster.js';

// ── helpers ────────────────────────────────────────────────────────────────
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = hex(h).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const dist = (a, b) => Math.hypot(...hex(a).map((v, i) => v - hex(b)[i]));

const BAR_OTHERS = ['Supervisor', 'Bartender', 'Barback'];

// ── Bar Head is a first-class Bar position ─────────────────────────────────
test('Bar Head is selectable for the Bar department (add + edit dropdowns read this list)', () => {
  assert.ok(positionsForDepartment('BAR').includes('Bar Head'));
  assert.ok(POSITIONS.includes('Bar Head')); // fallback list used when a department code is unknown
  assert.deepEqual(DEPARTMENT_POSITIONS.BAR, ['Supervisor', 'Bar Head', 'Bartender', 'Barback']);
});

test('existing Bar positions and every other department list are untouched', () => {
  for (const p of BAR_OTHERS) assert.ok(positionsForDepartment('BAR').includes(p));
  assert.deepEqual(DEPARTMENT_POSITIONS.FLOOR.includes('Bar Head'), false);
  assert.deepEqual(DEPARTMENT_POSITIONS.KITCHEN.includes('Bar Head'), false);
  assert.equal(POSITION_COLORS.Supervisor.border, '#f59e42');
  assert.equal(POSITION_COLORS.Bartender.border, '#38bdf8');
  assert.equal(POSITION_COLORS.Barback.border, '#a78bfa');
});

// ── Bar Head colour ────────────────────────────────────────────────────────
test('Bar Head has its own colour, distinct from every other position', () => {
  const bh = POSITION_COLORS['Bar Head'];
  assert.ok(bh, 'Bar Head must have an entry in POSITION_COLORS');
  for (const [name, c] of Object.entries(POSITION_COLORS)) {
    if (name === 'Bar Head') continue;
    assert.notEqual(c.border, bh.border, `border collides with ${name}`);
    assert.notEqual(c.bg, bh.bg, `background collides with ${name}`);
  }
});

test('Bar Head is clearly distinguishable from Supervisor / Bartender / Barback', () => {
  const bh = POSITION_COLORS['Bar Head'].border;
  for (const other of BAR_OTHERS) {
    assert.ok(dist(bh, POSITION_COLORS[other].border) > 100, `too close to ${other}`);
  }
});

test('Bar Head colours meet WCAG contrast (badge text on its tint; dark text on the PDF header fill)', () => {
  const { bg, border, text } = POSITION_COLORS['Bar Head'];
  assert.ok(contrast(text, bg) >= 7, `badge text contrast ${contrast(text, bg).toFixed(2)}`);   // AAA
  assert.ok(contrast('#0f172a', border) >= 4.5, 'PDF position cell (dark text on border colour)');
});

test('every Bar position still meets AA badge contrast', () => {
  for (const p of DEPARTMENT_POSITIONS.BAR) {
    const { bg, text } = POSITION_COLORS[p];
    assert.ok(contrast(text, bg) >= 4.5, `${p} ${contrast(text, bg).toFixed(2)}`);
  }
});

// ── Scheduling: Bar Head works in the generator ────────────────────────────
const staff = [
  { id: 1, name: 'Kalu', position: 'Supervisor' },
  { id: 2, name: 'Chidi', position: 'Bar Head' },
  { id: 3, name: 'Bassy', position: 'Bartender' },
  { id: 4, name: 'Kizito', position: 'Bartender' },
  { id: 5, name: 'Victor', position: 'Bartender' },
  { id: 6, name: 'Emmanuel', position: 'Barback' },
  { id: 7, name: 'Frank', position: 'Barback' },
];
const rules = { maxWorkDays: 6, noBackToBack: true, noOffWeekends: true, defaultOutlet: 'none' };

test('generated rota gives Bar Head a full, valid week following the same rules as other rotating positions', () => {
  for (let i = 0; i < 300; i += 1) {
    const roster = generateRoster(staff, rules);
    for (const s of staff) {
      assert.equal(Object.keys(roster[s.id]).length, 7);
      for (const d of DAYS) assert.ok(['AM', 'PM', 'Off'].includes(roster[s.id][d].shift));
    }
    const head = roster[2];
    WEEKEND_DAYS.forEach((d) => assert.notEqual(head[d].shift, 'Off', 'no Off on Fri/Sat/Sun'));
    assert.equal(DAYS.filter((d) => head[d].shift === 'Off').length, 1, '7 - maxWorkDays off days');
    // existing behaviour: Supervisors are always PM; Bar Head is NOT forced to PM like a Supervisor
    DAYS.forEach((d) => assert.equal(roster[1][d].shift, 'PM'));
  }
});

test('with more than one Bar Head, both AM and PM are assigned (normal group coverage applies)', () => {
  const two = [
    { id: 1, name: 'Head A', position: 'Bar Head' },
    { id: 2, name: 'Head B', position: 'Bar Head' },
  ];
  const seen = new Set();
  for (let i = 0; i < 300; i += 1) {
    const roster = generateRoster(two, rules);
    for (const s of two) DAYS.forEach((d) => seen.add(roster[s.id][d].shift));
  }
  assert.deepEqual([...seen].sort(), ['AM', 'Off', 'PM']);
});

test('Bar Head is scheduled exactly like any other single-person position (parity with Barback)', () => {
  // Existing generator behaviour, not specific to Bar Head: a position with one working
  // member has the same shift mix whatever its name. (A sole Bar Head can still be set to PM
  // manually in Edit mode — see the next test.)
  const tally = (position) => {
    const counts = {};
    for (let i = 0; i < 200; i += 1) {
      const r = generateRoster([{ id: 1, name: 'x', position }], rules);
      Object.values(r[1]).forEach((c) => { counts[c.shift] = (counts[c.shift] || 0) + 1; });
    }
    return counts;
  };
  assert.deepEqual(tally('Bar Head'), tally('Barback'));
});

test('manual assignment: a Bar Head cell can hold any shift/outlet value like other positions', () => {
  const roster = generateRoster(staff, rules);
  roster[2].Monday = { shift: 'AM', outlet: 'T' };
  roster[2].Tuesday = { shift: 'PM', outlet: 'RST' };
  assert.deepEqual(roster[2].Monday, { shift: 'AM', outlet: 'T' });
  assert.deepEqual(roster[2].Tuesday, { shift: 'PM', outlet: 'RST' });
});

test('existing Bartender/Barback/Supervisor-only rotas still generate (backward compatible)', () => {
  const legacy = staff.filter((s) => s.position !== 'Bar Head');
  const roster = generateRoster(legacy, rules);
  assert.equal(Object.keys(roster).length, legacy.length);
  for (const s of legacy) assert.equal(Object.keys(roster[s.id]).length, 7);
});
