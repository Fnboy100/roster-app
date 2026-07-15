import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MULTI_DEPARTMENT_ROLES } from '../api/roles';
import * as departmentsApi from '../api/departments';

/**
 * Resolves the department picker every multi-department role (admin,
 * manager, outlet_manager, storekeeper) needs, and the fixed department
 * every single-department role (staff, supervisor) is pinned to.
 *
 * outlet_manager/storekeeper are scoped server-side to their own outlet
 * (see backend app/services/access_scope.py) — passing their outlet_id
 * here just makes the picker itself only show departments they could
 * actually select without a 403.
 */
export function useDepartmentScope() {
  const { user } = useAuth();
  const isMultiDept = MULTI_DEPARTMENT_ROLES.includes(user?.role?.name);
  const myOutletId = user?.outlet?.id ?? user?.department?.outlet_id ?? undefined;

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(undefined);

  useEffect(() => {
    if (!isMultiDept) return;
    departmentsApi
      .listDepartments({ outletId: myOutletId })
      .then(setDepartments)
      .catch(() => {});
  }, [isMultiDept, myOutletId]);

  return {
    isMultiDept,
    departments,
    departmentId,
    setDepartmentId,
    // The actual filter value to send to the API: the picker's choice for
    // multi-department roles, or the user's own department otherwise
    // (sending it explicitly isn't required — the backend infers it — but
    // being explicit keeps the frontend's intent readable).
    effectiveDepartmentId: isMultiDept ? departmentId : user?.department?.id,
  };
}
