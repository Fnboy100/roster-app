import client from './client';

// --- Duty posts -----------------------------------------------------------

/** GET /presence/duty-posts?outlet_id=&include_inactive= -> List[DutyPostOut] */
export async function listDutyPosts({ outletId, includeInactive } = {}) {
  const { data } = await client.get('/presence/duty-posts', {
    params: { outlet_id: outletId, include_inactive: includeInactive },
  });
  return data;
}

/** POST /presence/duty-posts (admin/manager/outlet_manager) -> DutyPostOut. payload: { outlet_id, name, description? } */
export async function createDutyPost(payload) {
  const { data } = await client.post('/presence/duty-posts', payload);
  return data;
}

/** PATCH /presence/duty-posts/{id} -> DutyPostOut. payload: { name?, description?, is_active? } */
export async function updateDutyPost(postId, payload) {
  const { data } = await client.patch(`/presence/duty-posts/${postId}`, payload);
  return data;
}

// --- Duty assignments -------------------------------------------------------

/** GET /presence/assignments?outlet_id=&shift_date=&duty_post_id= -> List[DutyAssignmentOut] */
export async function listAssignments({ outletId, shiftDate, dutyPostId } = {}) {
  const { data } = await client.get('/presence/assignments', {
    params: { outlet_id: outletId, shift_date: shiftDate, duty_post_id: dutyPostId },
  });
  return data;
}

/**
 * POST /presence/assignments -> DutyAssignmentOut.
 * payload: { outlet_id, duty_post_id, roster_staff_id, shift_date, scheduled_start?, scheduled_end?, notes? }
 */
export async function createAssignment(payload) {
  const { data } = await client.post('/presence/assignments', payload);
  return data;
}

// --- Staff PIN -----------------------------------------------------------

/** POST /presence/roster-staff/{id}/pin (admin/manager/outlet_manager) -> 204. payload: { pin } */
export async function setStaffPin(rosterStaffId, pin) {
  await client.post(`/presence/roster-staff/${rosterStaffId}/pin`, { pin });
}

// --- Section device (shared tablet) -----------------------------------------

/** GET /presence/section-device/staff?outlet_id=&duty_post_id=&shift_date= -> List[SectionDeviceStaffOut] */
export async function listSectionDeviceStaff({ outletId, dutyPostId, shiftDate } = {}) {
  const { data } = await client.get('/presence/section-device/staff', {
    params: { outlet_id: outletId, duty_post_id: dutyPostId, shift_date: shiftDate },
  });
  return data;
}

function sectionDeviceAction(action) {
  return async (outletId, { rosterStaffId, pin, dutyPostId, assignmentId, notes } = {}) => {
    const { data } = await client.post(
      `/presence/section-device/${action}`,
      { roster_staff_id: rosterStaffId, pin, duty_post_id: dutyPostId, assignment_id: assignmentId, notes },
      { params: { outlet_id: outletId } }
    );
    return data;
  };
}

/** POST /presence/section-device/clock-in -> PresenceEventOut */
export const clockIn = sectionDeviceAction('clock-in');
/** POST /presence/section-device/clock-out -> PresenceEventOut */
export const clockOut = sectionDeviceAction('clock-out');
/** POST /presence/section-device/break-start -> PresenceEventOut */
export const breakStart = sectionDeviceAction('break-start');
/** POST /presence/section-device/break-end -> PresenceEventOut */
export const breakEnd = sectionDeviceAction('break-end');
/** POST /presence/section-device/post-check-in -> PresenceEventOut */
export const postCheckIn = sectionDeviceAction('post-check-in');
/** POST /presence/section-device/post-check-out -> PresenceEventOut */
export const postCheckOut = sectionDeviceAction('post-check-out');

// --- Events (timeline + manager overrides) -----------------------------------

/** GET /presence/events?outlet_id=&roster_staff_id=&on_date= -> List[PresenceEventOut] */
export async function listEvents({ outletId, rosterStaffId, onDate } = {}) {
  const { data } = await client.get('/presence/events', {
    params: { outlet_id: outletId, roster_staff_id: rosterStaffId, on_date: onDate },
  });
  return data;
}

/**
 * POST /presence/events/manager -> PresenceEventOut. Manager spot-check override
 * (not the shared-tablet flow). payload: { roster_staff_id, duty_post_id?, assignment_id?, event_type, notes? }
 */
export async function createManagerEvent(outletId, payload) {
  const { data } = await client.post('/presence/events/manager', payload, { params: { outlet_id: outletId } });
  return data;
}

// --- Live monitoring ---------------------------------------------------------

/** GET /presence/live-status?outlet_id=&shift_date= -> List[LivePostStatusOut] */
export async function getLiveStatus({ outletId, shiftDate } = {}) {
  const { data } = await client.get('/presence/live-status', { params: { outlet_id: outletId, shift_date: shiftDate } });
  return data;
}

// --- Rules -----------------------------------------------------------

/** GET /presence/rules?outlet_id= -> PresenceRuleOut */
export async function getRules(outletId) {
  const { data } = await client.get('/presence/rules', { params: { outlet_id: outletId } });
  return data;
}

/** PUT /presence/rules?outlet_id= -> PresenceRuleOut. payload: { require_break_logging?, max_break_minutes?, max_breaks_per_shift? } */
export async function updateRules(outletId, payload) {
  const { data } = await client.put('/presence/rules', payload, { params: { outlet_id: outletId } });
  return data;
}

// --- Violations -----------------------------------------------------------

/**
 * POST /presence/violations (admin/manager/outlet_manager) -> ViolationOut.
 * payload: { roster_staff_id, duty_post_id?, assignment_id?, outlet_id, note? }
 */
export async function createViolation(payload) {
  const { data } = await client.post('/presence/violations', payload);
  return data;
}

/** GET /presence/violations?outlet_id=&date_from=&date_to=&roster_staff_id=&status= -> List[ViolationOut] */
export async function listViolations({ outletId, dateFrom, dateTo, rosterStaffId, status } = {}) {
  const { data } = await client.get('/presence/violations', {
    params: { outlet_id: outletId, date_from: dateFrom, date_to: dateTo, roster_staff_id: rosterStaffId, status },
  });
  return data;
}

/** Triggers a browser download of violations as CSV (same filters as listViolations). */
export async function exportViolationsCSV({ outletId, dateFrom, dateTo, rosterStaffId, status } = {}) {
  const { data } = await client.get('/presence/violations', {
    params: { outlet_id: outletId, date_from: dateFrom, date_to: dateTo, roster_staff_id: rosterStaffId, status, format: 'csv' },
    responseType: 'blob',
  });
  const blob = new Blob([data], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'presence_violations.csv';
  a.click();
}

/** PATCH /presence/violations/{id} -> ViolationOut. payload: { status?, manager_notes? } */
export async function updateViolation(violationId, payload) {
  const { data } = await client.patch(`/presence/violations/${violationId}`, payload);
  return data;
}

export const PRESENCE_STATUS_LABELS = {
  off_duty: 'Off duty',
  on_shift_at_post: 'On shift — at post',
  on_shift_on_break: 'On shift — on break',
  unknown: 'Unknown / No recent activity',
};

export const VIOLATION_STATUS_LABELS = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};

export const VIOLATION_TYPE_LABELS = {
  manager_observed_absence: 'Manager-observed absence',
  long_break: 'Long break',
  excessive_breaks: 'Excessive breaks',
  other: 'Other',
};
