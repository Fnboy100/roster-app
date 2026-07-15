import client from './client';

/** POST /requisitions -> RequisitionOut. payload: { department_id?, note?, items: [{item_id, quantity_requested}] } */
export async function createRequisition(payload) {
  const { data } = await client.post('/requisitions', payload);
  return data;
}

/**
 * GET /requisitions -> List[RequisitionOut].
 * filters: departmentId, status ('pending'|'approved'|'rejected'|'issued'|'partially_issued'|'completed'|'cancelled'),
 * requestedById, itemId, dateFrom, dateTo (ISO datetime strings).
 */
export async function listRequisitions({ departmentId, status, requestedById, itemId, dateFrom, dateTo } = {}) {
  const { data } = await client.get('/requisitions', {
    params: {
      department_id: departmentId,
      status,
      requested_by_id: requestedById,
      item_id: itemId,
      date_from: dateFrom,
      date_to: dateTo,
    },
  });
  return data;
}

/** GET /requisitions/{id} -> RequisitionOut */
export async function getRequisition(requisitionId) {
  const { data } = await client.get(`/requisitions/${requisitionId}`);
  return data;
}

/**
 * POST /requisitions/{id}/decision (supervisor own dept, outlet_manager own outlet, manager, admin) -> RequisitionOut.
 * payload: { decision: 'approved'|'rejected', comment? }
 */
export async function decideRequisition(requisitionId, payload) {
  const { data } = await client.post(`/requisitions/${requisitionId}/decision`, payload);
  return data;
}

/**
 * POST /requisitions/{id}/issue (storekeeper, admin) -> RequisitionOut.
 * payload omitted -> issues every outstanding line in full.
 * payload: { lines: [{ requisition_item_id, quantity }] } -> issues exactly those quantities (partial issue OK).
 */
export async function issueRequisition(requisitionId, payload) {
  const { data } = await client.post(`/requisitions/${requisitionId}/issue`, payload ?? {});
  return data;
}

/** POST /requisitions/{id}/complete (requesting department, outlet_manager, manager, admin) -> RequisitionOut */
export async function completeRequisition(requisitionId) {
  const { data } = await client.post(`/requisitions/${requisitionId}/complete`);
  return data;
}

/** POST /requisitions/{id}/cancel (requester, supervisor own dept, outlet_manager own outlet, manager, admin) -> RequisitionOut */
export async function cancelRequisition(requisitionId) {
  const { data } = await client.post(`/requisitions/${requisitionId}/cancel`);
  return data;
}

// Mirrors app/models/requisition.py's RequisitionStatus enum exactly.
export const REQUISITION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ISSUED: 'issued',
  PARTIALLY_ISSUED: 'partially_issued',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const REQUISITION_STATUS_LABELS = {
  [REQUISITION_STATUS.PENDING]: 'Pending',
  [REQUISITION_STATUS.APPROVED]: 'Approved',
  [REQUISITION_STATUS.REJECTED]: 'Rejected',
  [REQUISITION_STATUS.ISSUED]: 'Issued',
  [REQUISITION_STATUS.PARTIALLY_ISSUED]: 'Partially issued',
  [REQUISITION_STATUS.COMPLETED]: 'Completed',
  [REQUISITION_STATUS.CANCELLED]: 'Cancelled',
};
