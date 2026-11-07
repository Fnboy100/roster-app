import test from 'node:test';
import assert from 'node:assert/strict';

import { exportCSV } from '../src/utils/exportCSV.js';

// exportCSV downloads via a Blob + <a>; capture the Blob instead of touching a real DOM.
async function csvFor(...args) {
  let captured;
  globalThis.document = { createElement: () => ({ click() {}, set href(v) {}, get href() { return 'blob:x'; } }) };
  globalThis.URL.createObjectURL = (blob) => { captured = blob; return 'blob:x'; };
  globalThis.URL.revokeObjectURL = () => {};
  exportCSV(...args);
  return captured.text();
}

const staff = [{ id: 1, name: 'Chidi', position: 'Bar Head' }];
const roster = { 1: { Monday: { shift: 'AM', outlet: 'T' } } };
const saved = {
  is_default: false,
  am: { start_time: '10:30:00', end_time: '17:00:00' },
  pm: { start_time: '15:00:00', end_time: '01:30:00' },
};

test('CSV includes Bar Head and the unchanged legacy legend until times are saved', async () => {
  const csv = await csvFor(staff, roster, 'Nov 2 - 8', 'BAR', 'Bar', undefined, { is_default: true, am: saved.am, pm: saved.pm });
  assert.match(csv, /Chidi,Bar Head,/);
  assert.match(csv, /AM = 11am–6pm {2}\| {2}PM = 4pm–12am/);
});

test('CSV legend follows the persisted AM/PM times once saved', async () => {
  const csv = await csvFor(staff, roster, 'Nov 2 - 8', 'BAR', 'Bar', undefined, saved);
  assert.match(csv, /AM = 10:30am–5pm {2}\| {2}PM = 3pm–1:30am/);
  assert.doesNotMatch(csv, /11am–6pm/);
});
