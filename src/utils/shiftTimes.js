// ─── roster-app/src/utils/shiftTimes.js ──────────────────────────────────────
//
// Pure helpers for the configurable AM / PM shift times (persisted per
// department by the backend — GET/PUT /roster/shift-times). No imports on
// purpose: data/constants.js and the PDF/CSV exporters all use these.
//
// Time convention (same as the rest of the app and the API): wall-clock
// "HH:MM" strings in the outlet's local time, no timezone conversion. The
// API may answer "HH:MM:SS"; toHHMM() trims that.
//
// Overnight: PM may end earlier than it starts (e.g. 16:00 -> 00:00 ends
// the next day) or have no end time ("until close"). AM may do neither.
// These mirror the backend rules in app/services/shift_time_rules.py — the
// backend is authoritative; this only gives instant feedback.

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "11:00:00" | "11:00" -> "11:00"; null/invalid -> "". */
export function toHHMM(value) {
  if (typeof value !== 'string') return '';
  const m = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value.trim());
  if (!m) return '';
  const hhmm = `${m[1]}:${m[2]}`;
  return HHMM.test(hhmm) ? hhmm : '';
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** "11:00" -> "11am", "16:30" -> "4:30pm", "00:00" -> "12am", "12:00" -> "12pm". */
export function formatClock(value) {
  const hhmm = toHHMM(value);
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

/** ("11:00","18:00") -> "11am–6pm"; end null -> "4pm–Close". */
export function formatRange(start, end) {
  const s = formatClock(start);
  if (!s) return '';
  const e = end ? formatClock(end) : 'Close';
  return `${s}–${e}`;
}

/** True when the shift finishes the next day (end earlier than start) or runs to close. */
export function isOvernight(start, end) {
  const s = toHHMM(start);
  if (!s) return false;
  const e = toHHMM(end);
  return !e || toMinutes(e) < toMinutes(s);
}

/** API response -> { am: 'AM = 11am–6pm', pm: 'PM = 4pm–12am' } (same wording as the legacy legend). */
export function legendFromShiftTimes(shiftTimes) {
  if (!shiftTimes?.am || !shiftTimes?.pm) return null;
  return {
    am: `AM = ${formatRange(shiftTimes.am.start_time, shiftTimes.am.end_time)}`,
    pm: `PM = ${formatRange(shiftTimes.pm.start_time, shiftTimes.pm.end_time)}`,
  };
}

/** Tooltip text for a roster cell: ("AM", times) -> "11am–6pm"; Off / unknown -> undefined. */
export function shiftTitle(shiftTimes, shift) {
  const range = shift === 'AM' ? shiftTimes?.am : shift === 'PM' ? shiftTimes?.pm : null;
  if (!range) return undefined;
  return formatRange(range.start_time, range.end_time) || undefined;
}

// ── Edit form <-> API ───────────────────────────────────────────────────────

/** API response -> editable form state (all strings; pmUntilClose boolean). */
export function timesToForm(shiftTimes) {
  return {
    amStart: toHHMM(shiftTimes?.am?.start_time),
    amEnd: toHHMM(shiftTimes?.am?.end_time),
    pmStart: toHHMM(shiftTimes?.pm?.start_time),
    pmEnd: toHHMM(shiftTimes?.pm?.end_time),
    pmUntilClose: !!shiftTimes && !shiftTimes?.pm?.end_time,
  };
}

/** Form state -> PUT body. */
export function formToPayload(form) {
  return {
    am: { start_time: form.amStart, end_time: form.amEnd },
    pm: { start_time: form.pmStart, end_time: form.pmUntilClose ? null : form.pmEnd },
  };
}

export function formsEqual(a, b) {
  return a.amStart === b.amStart && a.amEnd === b.amEnd && a.pmStart === b.pmStart
    && a.pmUntilClose === b.pmUntilClose && (a.pmUntilClose || a.pmEnd === b.pmEnd);
}

/**
 * Instant client-side validation. Returns { amStart?, amEnd?, pmStart?, pmEnd? }
 * mapping a field to its message; an empty object means valid.
 */
export function validateShiftTimesForm(form) {
  const errors = {};
  const need = (field, value, label) => {
    if (!value) errors[field] = `${label} is required`;
    else if (!HHMM.test(value)) errors[field] = `${label} must be a valid time (HH:MM)`;
  };
  need('amStart', form.amStart, 'AM start');
  need('amEnd', form.amEnd, 'AM end');
  need('pmStart', form.pmStart, 'PM start');
  if (!form.pmUntilClose) need('pmEnd', form.pmEnd, 'PM end');

  if (!errors.amStart && !errors.amEnd) {
    if (toMinutes(form.amEnd) === toMinutes(form.amStart)) errors.amEnd = 'AM end must be different from its start';
    else if (toMinutes(form.amEnd) < toMinutes(form.amStart)) errors.amEnd = 'AM end must be later than its start (AM cannot run overnight)';
  }
  if (!form.pmUntilClose && !errors.pmStart && !errors.pmEnd && toMinutes(form.pmEnd) === toMinutes(form.pmStart)) {
    errors.pmEnd = 'PM end must be different from its start';
  }
  return errors;
}
