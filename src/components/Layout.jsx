import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../api/roles';
import NotificationBell from './NotificationBell';

const navLinkStyle = ({ isActive }) => ({
  padding: '7px 12px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
  color: isActive ? '#fff' : '#334155',
  background: isActive ? '#0f172a' : 'transparent',
  whiteSpace: 'nowrap',
});

const NAV_ITEMS = [
  { to: '/roster', label: 'Roster' },
  { to: '/inventory', label: 'Dashboard' },
  { to: '/inventory/requisitions', label: 'Requisitions' },
  { to: '/inventory/stock', label: 'Stock' },
  { to: '/inventory/movements', label: 'History' },
  { to: '/inventory/closings', label: 'Closings' },
  { to: '/inventory/reports', label: 'Reports' },
  { to: '/inventory/audit-log', label: 'Audit', roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { to: '/admin/outlets', label: 'Outlets', roles: [ROLES.ADMIN] },
  { to: '/admin/departments', label: 'Departments', roles: [ROLES.ADMIN] },
  { to: '/admin/items', label: 'Items', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.OUTLET_MANAGER, ROLES.STOREKEEPER] },
  { to: '/admin/users', label: 'Users', roles: [ROLES.ADMIN] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role?.name));

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginRight: 8 }}>🍽 Ops</span>
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/inventory'} style={navLinkStyle}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell />
          <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{user?.full_name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {ROLE_LABELS[user?.role?.name] || user?.role?.name}
              {user?.department ? ` · ${user.department.name}` : ''}
              {user?.outlet ? ` · ${user.outlet.name}` : ''}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <Outlet />
    </div>
  );
}
