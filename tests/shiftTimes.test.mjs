import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatClock, formatRange, formToPayload, formsEqual, isOvernight, legendFromShiftTimes,
  shiftTitle, timesToForm, toHHMM, validateShiftTimesForm,
} from '../src/utils/shiftTimes.js';
import { shiftLegendForDepartment } from '../src/data/constants.js';

// What the backend returns (HH:MM:SS) for a department that saved its own times.
const saved = {
  department_id: 1, is_default: false,
  am: { start_time: '10:30:00', end_time: '17:00:00', label: '10:30-17:00', is_overnight: false },
  pm: { start_time: '15:00:00', end_time: '23:30:00', label: '15:00-23:30', is_overnight: false },
};
const defaults = {
  department_id: 1, is_default: true,
  am: { start_time: '11:00:00', end_time: '18:00:00' },
  pm: { start_time: '16:00:00', end_time: '00:00:00' },
};

test('toHHMM trims seconds and rejects junk', () => {
  assert.equal(toHHMM('11:00:00'), '11:00');
  assert.equal(toHHMM('09:05'), '09:05');
  for (const bad of ['', null, undefined, '25:00', '11-00', 'noon', '9:00', '11:60']) assert.equal(toHHMM(bad), '');
});

test('formatClock / formatRange reproduce the legacy legend wording', () => {
  assert.equal(formatClock('11:00'), '11am');
  assert.equal(formatClock('18:00'), '6pm');
  assert.equal(formatClock('00:00'), '12am');
  assert.equal(formatClock('12:00'), '12pm');
  assert.equal(formatClock('16:30'), '4:30pm');
  assert.equal(formatRange('11:00', '18:00'), '11am–6pm');
  assert.equal(formatRange('16:00', '00:00'), '4pm–12am');
  assert.equal(formatRange('17:00', null), '5pm–Close');
});

test('legend from the backend defaults is character-identical to the old hard-coded legend', () => {
  assert.deepEqual(legendFromShiftTimes(defaults), { am: 'AM = 11am–6pm', pm: 'PM = 4pm–12am' });
});

test('shiftLegendForDepartment: unchanged until times are saved, then follows the persisted times', () => {
  const bar = shiftLegendForDepartment('BAR');
  assert.deepEqual(bar, { am: 'AM = 11am–6pm', pm: 'PM = 4pm–12am', showOutlet: true });
  assert.deepEqual(shiftLegendForDepartment('BAR', null), bar);
  assert.deepEqual(shiftLegendForDepartment('BAR', defaults), bar); // is_default -> legacy text, untouched

  const edited = shiftLegendForDepartment('BAR', saved);
  assert.equal(edited.am, 'AM = 10:30am–5pm');
  assert.equal(edited.pm, 'PM = 3pm–11:30pm');
  assert.equal(edited.showOutlet, true); // outlet behaviour is never affected

  // Stewarding keeps its legacy wording until edited, and still has no outlet tags afterwards.
  assert.match(shiftLegendForDepartment('STEWARDING').am, /8:00 AM/);
  const steward = shiftLegendForDepartment('STEWARDING', saved);
  assert.equal(steward.am, 'AM = 10:30am–5pm');
  assert.equal(steward.showOutlet, false);
});

test('shiftTitle gives the tooltip for AM/PM and nothing for Off', () => {
  assert.equal(shiftTitle(saved, 'AM'), '10:30am–5pm');
  assert.equal(shiftTitle(saved, 'PM'), '3pm–11:30pm');
  assert.equal(shiftTitle(saved, 'Off'), undefined);
  assert.equal(shiftTitle(null, 'AM'), undefined);
});

test('form <-> payload round trip survives a "refresh" (HH:MM:SS from the API -> HH:MM for the inputs)', () => {
  const form = timesToForm(saved);
  assert.deepEqual(form, { amStart: '10:30', amEnd: '17:00', pmStart: '15:00', pmEnd: '23:30', pmUntilClose: false });
  assert.deepEqual(formToPayload(form), {
    am: { start_time: '10:30', end_time: '17:00' },
    pm: { start_time: '15:00', end_time: '23:30' },
  });
  assert.ok(formsEqual(form, timesToForm(saved)));
  assert.ok(!formsEqual(form, { ...form, amEnd: '17:30' }));
});

test('PM "until close" round-trips as a null end time', () => {
  const closing = { ...saved, pm: { start_time: '17:00:00', end_time: null } };
  const form = timesToForm(closing);
  assert.equal(form.pmUntilClose, true);
  assert.equal(formToPayload(form).pm.end_time, null);
  assert.equal(legendFromShiftTimes(closing).pm, 'PM = 5pm–Close');
});

test('validation: valid sets pass, including a PM that ends after midnight', () => {
  assert.deepEqual(validateShiftTimesForm(timesToForm(saved)), {});
  assert.deepEqual(validateShiftTimesForm(timesToForm(defaults)), {}); // 16:00 -> 00:00 is overnight and valid
  assert.deepEqual(validateShiftTimesForm({ ...timesToForm(saved), pmEnd: '01:30' }), {});
  assert.deepEqual(validateShiftTimesForm({ ...timesToForm(saved), pmEnd: '', pmUntilClose: true }), {});
  assert.equal(isOvernight('16:00', '00:00'), true);
  assert.equal(isOvernight('11:00', '18:00'), false);
  assert.equal(isOvernight('17:00', null), true);
});

test('validation: invalid values are caught with field-level messages', () => {
  const base = timesToForm(saved);
  assert.match(validateShiftTimesForm({ ...base, amEnd: '09:00' }).amEnd, /later than its start/);   // end before start
  assert.match(validateShiftTimesForm({ ...base, amEnd: '10:30' }).amEnd, /different/);               // zero length
  assert.match(validateShiftTimesForm({ ...base, pmEnd: '15:00' }).pmEnd, /different/);
  assert.match(validateShiftTimesForm({ ...base, amStart: '' }).amStart, /required/);                 // missing
  assert.match(validateShiftTimesForm({ ...base, pmStart: '99:99' }).pmStart, /valid time/);          // malformed
  assert.match(validateShiftTimesForm({ ...base, amEnd: 'noon' }).amEnd, /valid time/);
  assert.match(validateShiftTimesForm({ ...base, pmEnd: '' }).pmEnd, /required/);                     // PM end needed unless until-close
  // AM cannot run overnight
  assert.ok(validateShiftTimesForm({ ...base, amStart: '11:00', amEnd: '00:00' }).amEnd);
});
