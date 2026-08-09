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

// Roles that see across more than one department without being pinned to
// one (matches app/services/access_scope.py: admin is fully unrestricted;
// outlet_manager/storekeeper are outlet-wide, not truly global. manager is
// deliberately NOT in this list — it used to be treated as HQ-wide/
// unrestricted, but that was reversed so a manager only sees and acts on
// their own single department, same as supervisor).
export const MULTI_DEPARTMENT_ROLES = [ROLES.ADMIN, ROLES.OUTLET_MANAGER, ROLES.STOREKEEPER];
