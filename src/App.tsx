import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { PublicLayout, AdminLayout, StaffLayout } from './components/Layout';
import { PublicLanding, Shop } from './pages/PublicPages';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard, UserManagement, Inventory } from './pages/AdminPages';
import { CustomerDashboard } from './pages/CustomerPages';
import { Sales } from './pages/Sales';
import { Members } from './pages/Members';
import { Reports } from './pages/Reports';
import { Promos } from './pages/Promos';
import { Returns } from './pages/Returns';
import { Inquiries } from './pages/Inquiries';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { RiderPortal } from './pages/RiderPortal';
import { Profile } from './pages/Profile';
import { Chat } from './pages/Chat';
import './App.css';

// Guard for checking if user is authenticated and permitted
const RouteGuard: React.FC<{ 
  children: React.ReactNode; 
  adminOnly?: boolean;
  staffOnly?: boolean;
  riderOnly?: boolean;
}> = ({ children, adminOnly = false, staffOnly = false, riderOnly = false }) => {
  const { initialized, currentUser } = useAppContext();

  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 800, color: '#2563eb' }}>
        LOADING SYSTEM ACCESS...
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.enabled) {
    alert('YOUR ACCOUNT HAS BEEN DISABLED. PLEASE CONTACT THE ADMINISTRATOR.');
    return <Navigate to="/login" replace />;
  }

  // Strict Admin check
  if (adminOnly && currentUser.role !== 'ADMIN') {
    alert('UNAUTHORIZED ACCESS: Administrator privileges required.');
    if (currentUser.role === 'EMPLOYEE') {
      return <Navigate to="/staff/pos" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Staff POS Terminal check - strictly reserved for Staff Cashiers (EMPLOYEE)
  if (staffOnly && currentUser.role !== 'EMPLOYEE') {
    alert('UNAUTHORIZED ACCESS: Store Staff / Cashier privileges required for POS Terminal.');
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Delivery Rider or Admin check
  if (riderOnly && currentUser.role !== 'RIDER' && currentUser.role !== 'ADMIN') {
    alert('UNAUTHORIZED ACCESS: Delivery rider privileges required.');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index routing handler
const RootRoute = () => {
  const { currentUser, initialized } = useAppContext();

  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 800, color: '#2563eb' }}>
        STARTING BOSS RAP MOTOR SHOP PORTAL...
      </div>
    );
  }

  if (currentUser) {
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentUser.role === 'EMPLOYEE') {
      return <Navigate to="/staff/pos" replace />;
    }
    if (currentUser.role === 'RIDER') {
      return <Navigate to="/rider/deliveries" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <PublicLayout><PublicLanding /></PublicLayout>;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Main index / landing */}
          <Route path="/" element={<RootRoute />} />
          
          {/* Catalog & Public Pages */}
          <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          
          {/* Customer Route (Guarded) */}
          <Route path="/dashboard" element={
            <RouteGuard>
              <PublicLayout>
                <CustomerDashboard />
              </PublicLayout>
            </RouteGuard>
          } />

          {/* Account Profile Route (Guarded for All Roles) */}
          <Route path="/profile" element={
            <RouteGuard>
              <PublicLayout>
                <Profile />
              </PublicLayout>
            </RouteGuard>
          } />
          <Route path="/chat" element={<RouteGuard><PublicLayout><Chat /></PublicLayout></RouteGuard>} />

          {/* Staff POS Station (Staff & Admin) */}
          <Route path="/staff/pos" element={
            <RouteGuard staffOnly>
              <StaffLayout>
                <Sales />
              </StaffLayout>
            </RouteGuard>
          } />

          {/* Admin Dashboard Routes (Strictly Guarded) */}
          <Route path="/admin/dashboard" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </RouteGuard>
          } />
          
          <Route path="/admin/inventory" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/purchase-orders" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <PurchaseOrders />
              </AdminLayout>
            </RouteGuard>
          } />
          
          <Route path="/admin/sales" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </RouteGuard>
          } />
          
          <Route path="/admin/members" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Members />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/promos" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Promos />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/returns" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Returns />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/inquiries" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Inquiries />
              </AdminLayout>
            </RouteGuard>
          } />
          <Route path="/admin/chat" element={<RouteGuard adminOnly><AdminLayout><Chat admin /></AdminLayout></RouteGuard>} />

          <Route path="/admin/reports" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/users" element={
            <RouteGuard adminOnly>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </RouteGuard>
          } />

          {/* Delivery Rider Portal */}
          <Route path="/rider/deliveries" element={
            <RouteGuard riderOnly>
              <RiderPortal />
            </RouteGuard>
          } />
          <Route path="/rider/dashboard" element={<Navigate to="/rider/deliveries" replace />} />
          <Route path="/rider" element={<Navigate to="/rider/deliveries" replace />} />

          {/* Fallbacks */}
          <Route path="/pos" element={<Navigate to="/staff/pos" replace />} />
          <Route path="/staff" element={<Navigate to="/staff/pos" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
