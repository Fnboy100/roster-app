import { ROLES } from '../api/roles';
import { REQUISITION_STATUS } from '../api/requisitions';

export function canDecideRequisition(user) {
  return [ROLES.SUPERVISOR, ROLES.OUTLET_MANAGER, ROLES.MANAGER, ROLES.ADMIN].includes(user?.role?.name);
}

export function canIssueRequisition(user) {
  return [ROLES.STOREKEEPER, ROLES.ADMIN].includes(user?.role?.name);
}

export function canCompleteRequisition(user, requisition) {
  const role = user?.role?.name;
  if ([ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER].includes(role)) return true;
  return user?.department?.id === requisition?.department_id;
}

export function canCancelRequisition(user, requisition) {
  const role = user?.role?.name;
  if (requisition?.requested_by?.id === user?.id) return true;
  if ([ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER].includes(role)) return true;
  return role === ROLES.SUPERVISOR && user?.department?.id === requisition?.department_id;
}

// Status gates — mirror the exact guards in app/services/requisition_service.py
// so a button never appears for a transition the backend will reject.
export const isDecidable = (r) => r?.status === REQUISITION_STATUS.PENDING;
export const isIssuable = (r) => [REQUISITION_STATUS.APPROVED, REQUISITION_STATUS.PARTIALLY_ISSUED].includes(r?.status);
export const isCompletable = (r) => r?.status === REQUISITION_STATUS.ISSUED;
export const isCancellable = (r) => [REQUISITION_STATUS.PENDING, REQUISITION_STATUS.APPROVED].includes(r?.status);
