import client from './client';

/** GET /roster/staff?department_id= -> List[RosterStaffOut] */
export async function listRosterStaff({ departmentId } = {}) {
  const { data } = await client.get('/roster/staff', { params: { department_id: departmentId } });
  return data;
}

/** POST /roster/staff -> RosterStaffOut. payload: { department_id?, full_name, position } */
export async function createRosterStaff(payload) {
  const { data } = await client.post('/roster/staff', payload);
  return data;
}

/**
 * POST /roster/periods -> RosterPeriodOut. Submits a client-generated roster for approval.
 * payload: { department_id?, week_start, week_end, week_label, rules_snapshot?,
 *            entries: [{ roster_staff_id, day, shift, outlet }] }
 */
export async function submitRoster(payload) {
  const { data } = await client.post('/roster/periods', payload);
  return data;
}

/** GET /roster/periods?department_id=&status= -> List[RosterPeriodSummaryOut] */
export async function listRosterPeriods({ departmentId, status } = {}) {
  const { data } = await client.get('/roster/periods', { params: { department_id: departmentId, status } });
  return data;
}

/** GET /roster/periods/{id} -> RosterPeriodOut (full, with entries) */
export async function getRosterPeriod(periodId) {
  const { data } = await client.get(`/roster/periods/${periodId}`);
  return data;
}

/** POST /roster/periods/{id}/decision (manager/admin only) -> RosterPeriodOut. payload: { decision: 'approved'|'rejected', comment? } */
export async function decideRosterPeriod(periodId, payload) {
  const { data } = await client.post(`/roster/periods/${periodId}/decision`, payload);
  return data;
}

/**
 * POST /roster/change-requests -> RosterChangeRequestOut.
 * payload: { roster_period_id, change_type: 'edit'|'swap', target_entry_id,
 *            proposed_shift?, proposed_outlet?, swap_with_entry_id?, reason? }
 */
export async function createChangeRequest(payload) {
  const { data } = await client.post('/roster/change-requests', payload);
  return data;
}

/** GET /roster/change-requests?department_id=&status= -> List[RosterChangeRequestOut] */
export async function listChangeRequests({ departmentId, status } = {}) {
  const { data } = await client.get('/roster/change-requests', { params: { department_id: departmentId, status } });
  return data;
}

/** POST /roster/change-requests/{id}/decision (manager/admin only) -> RosterChangeRequestOut. payload: { decision, comment? } */
export async function decideChangeRequest(requestId, payload) {
  const { data } = await client.post(`/roster/change-requests/${requestId}/decision`, payload);
  return data;
}

export const ROSTER_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const ROSTER_STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const CHANGE_REQUEST_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};
