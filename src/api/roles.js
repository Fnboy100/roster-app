// Mirrors app/models/role.py's RoleName enum. Keep these two files in sync —
// this is the single place the frontend hardcodes backend role strings.
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OUTLET_MANAGER: 'outlet_manager',
  SUPERVISOR: 'supervisor',
  STOREKEEPER: 'storekeeper',
  STAFF: 'staff',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.OUTLET_MANAGER]: 'Outlet Manager',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.STOREKEEPER]: 'Storekeeper',
  [ROLES.STAFF]: 'Staff',
};

// Roles that see across every department without being pinned to one
// (matches app/services/access_scope.py's admin/manager/outlet_manager/
// storekeeper branches — outlet_manager and storekeeper are outlet-wide,
// not truly global, but the frontend just needs to know "this role gets a
// department picker instead of a fixed department").
export const MULTI_DEPARTMENT_ROLES = [ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER, ROLES.STOREKEEPER];
