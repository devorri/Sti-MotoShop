import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { PublicLayout, AdminLayout } from './components/Layout';
import { PublicLanding } from './pages/PublicPages';
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
import './App.css';

// Guard for checking if user is enabled
const RouteGuard: React.FC<{ children: React.ReactNode, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { currentUser } = useAppContext();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.enabled) {
    alert('YOUR ACCOUNT HAS BEEN DISABLED. PLEASE CONTACT THE ADMINISTRATOR.');
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser.role !== 'ADMIN') {
    alert('UNAUTHORIZED ACCESS.');
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Single scrollable public landing page */}
          <Route path="/" element={<PublicLayout><PublicLanding /></PublicLayout>} />
          
          {/* Redirect old individual routes to hash sections on the landing page */}
          <Route path="/shop" element={<Navigate to="/#shop" replace />} />
          <Route path="/services" element={<Navigate to="/#services" replace />} />
          <Route path="/about" element={<Navigate to="/#about" replace />} />
          <Route path="/contact" element={<Navigate to="/#contact" replace />} />
          
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

          {/* Admin Dashboard Routes (Guarded) */}
          <Route path="/admin/dashboard" element={
            <RouteGuard>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </RouteGuard>
          } />
          
          <Route path="/admin/inventory" element={
            <RouteGuard>
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            </RouteGuard>
          } />
          
          <Route path="/admin/sales" element={
            <RouteGuard>
              <AdminLayout>
                <Sales />
              </AdminLayout>
            </RouteGuard>
          } />
          
          <Route path="/admin/members" element={
            <RouteGuard>
              <AdminLayout>
                <Members />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/promos" element={
            <RouteGuard>
              <AdminLayout>
                <Promos />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/returns" element={
            <RouteGuard>
              <AdminLayout>
                <Returns />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/inquiries" element={
            <RouteGuard>
              <AdminLayout>
                <Inquiries />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/reports" element={
            <RouteGuard>
              <AdminLayout>
                <Reports />
              </AdminLayout>
            </RouteGuard>
          } />

          <Route path="/admin/users" element={
            <RouteGuard adminOnly={true}>
              <AdminLayout>
                <UserManagement />
              </AdminLayout>
            </RouteGuard>
          } />

          {/* Fallbacks */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
