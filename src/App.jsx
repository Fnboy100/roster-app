import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

// The roster tool moved back behind login: generating/submitting a roster
// is now role-gated (supervisor/manager/admin) and department-scoped, which
// requires knowing who's logged in — the earlier "public, no backend
// dependency" version no longer applies now that rosters are backend-
// approved data, not just a client-side scheduling toy.
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/inventory" replace />} />

            <Route path="roster" element={<RosterApp />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
