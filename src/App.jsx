import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import RosterApp from './pages/RosterApp';
import InventoryDashboard from './pages/InventoryDashboard';
import Requisitions from './pages/Requisitions';
import RequisitionDetail from './pages/RequisitionDetail';
import Stock from './pages/Stock';
import MovementHistory from './pages/MovementHistory';
import DailyClosings from './pages/DailyClosings';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import AdminOutlets from './pages/admin/Outlets';
import AdminDepartments from './pages/admin/Departments';
import AdminItems from './pages/admin/Items';
import AdminUsers from './pages/admin/Users';

// The roster tool has no backend dependency, so it sits outside the login
// wall entirely. This thin bar is the only chrome it gets (RosterApp itself
// already renders a full-page layout) — just a way back to the rest of the
// app, whichever direction is relevant.
function RosterPublicBar() {
  const { isAuthenticated } = useAuth();
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0',
      }}
    >
      {isAuthenticated ? (
        <Link to="/inventory" style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
          &larr; Back to Inventory
        </Link>
      ) : (
        <Link to="/login" style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
          Log in for Inventory &rarr;
        </Link>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — no login required, no backend dependency */}
          <Route
            path="/roster"
            element={
              <>
                <RosterPublicBar />
                <RosterApp />
              </>
            }
          />
          <Route path="/login" element={<Login />} />

          {/* Everything else requires login */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/inventory" replace />} />

            <Route path="inventory" element={<InventoryDashboard />} />
            <Route path="inventory/requisitions" element={<Requisitions />} />
            <Route path="inventory/requisitions/:requisitionId" element={<RequisitionDetail />} />
            <Route path="inventory/stock" element={<Stock />} />
            <Route path="inventory/movements" element={<MovementHistory />} />
            <Route path="inventory/closings" element={<DailyClosings />} />
            <Route path="inventory/reports" element={<Reports />} />
            <Route path="inventory/audit-log" element={<AuditLogs />} />

            <Route path="admin/outlets" element={<AdminOutlets />} />
            <Route path="admin/departments" element={<AdminDepartments />} />
            <Route path="admin/items" element={<AdminItems />} />
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/roster" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
