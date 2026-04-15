import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <header style={{ 
        borderBottom: '2px solid #000', 
        padding: '15px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: '#000',
        color: '#fff',
        zIndex: 1000,
        flexWrap: 'wrap'
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '1.2rem', margin: 0, lineHeight: 1 }}>BOSS RAP</h1>
          <p style={{ fontSize: '0.5rem', letterSpacing: '2px', margin: 0 }}>MOTOR SHOP</p>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ 
            display: 'none', 
            background: 'none', 
            color: '#fff', 
            border: 'none', 
            fontSize: '1.5rem',
            padding: '5px'
          }}
          className="mobile-toggle"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <nav style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center',
        }} className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link" style={{ color: '#fff' }} onClick={() => setIsMenuOpen(false)}>HOME</Link>
          <Link to="/shop" className="nav-link" style={{ color: '#fff' }} onClick={() => setIsMenuOpen(false)}>SHOP</Link>
          <Link to="/services" className="nav-link" style={{ color: '#fff' }} onClick={() => setIsMenuOpen(false)}>SERVICES</Link>
          <Link to="/about" className="nav-link" style={{ color: '#fff' }} onClick={() => setIsMenuOpen(false)}>ABOUT</Link>
          <Link to="/contact" className="nav-link" style={{ color: '#fff' }} onClick={() => setIsMenuOpen(false)}>CONTACT</Link>
          
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'center', 
            borderLeft: '1px solid #333', 
            paddingLeft: '20px',
          }} className="nav-auth">
            {currentUser ? (
              <>
                <span className="badge" style={{ borderColor: '#fff', color: '#fff' }}>{currentUser.role}</span>
                {currentUser.role === 'CUSTOMER' ? (
                  <button onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} style={{ fontSize: '0.7rem', color: '#fff', borderColor: '#fff' }}>MY DASHBOARD</button>
                ) : (
                  <button onClick={() => { navigate('/admin/dashboard'); setIsMenuOpen(false); }} style={{ fontSize: '0.7rem', color: '#fff', borderColor: '#fff' }}>ADMIN PANEL</button>
                )}
                <button onClick={() => { logout(); setIsMenuOpen(false); }} style={{ fontSize: '0.7rem', color: '#fff', borderColor: '#fff' }}>LOGOUT</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <button className="primary" style={{ backgroundColor: '#fff', color: '#000', border: 'none' }}>LOGIN</button>
              </Link>
            )}
          </div>
        </nav>

        <style>{`
          @media (max-width: 900px) {
            .mobile-toggle { display: block !important; }
            .main-nav {
              display: none !important;
              width: 100%;
              flex-direction: column;
              padding: 20px 0;
              gap: 15px !important;
              align-items: flex-start !important;
            }
            .main-nav.open { display: flex !important; }
            .nav-auth { border-left: none !important; padding-left: 0 !important; border-top: 1px solid #333; padding-top: 15px; width: 100%; }
          }
        `}</style>
      </header>

      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      <footer style={{ borderTop: '2px solid #000', padding: '30px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
        <p style={{ fontSize: '0.7rem' }}>© 2024 BOSS RAP MOTOR SHOP. ALL RIGHTS RESERVED.</p>
        <p style={{ fontSize: '0.5rem', marginTop: '5px' }}>PREMIUM MINIMALIST EXPERIENCE</p>
      </footer>
    </div>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'EMPLOYEE')) {
    navigate('/login');
    return null;
  }

  const TabButton = ({ id, label }: { id: string, label: string }) => {
    const isActive = location.pathname.includes(id);
    return (
      <Link to={`/admin/${id}`} style={{ textDecoration: 'none' }} onClick={() => setIsSidebarVisible(false)}>
        <button 
          style={{ 
            textAlign: 'left', 
            width: '100%',
            padding: '12px 24px', 
            border: 'none', 
            borderBottom: '1px solid #eee',
            borderLeft: isActive ? '4px solid #000' : 'none',
            background: isActive ? '#f9f9f9' : 'transparent',
            fontSize: '0.7rem',
            borderRadius: 0,
            cursor: 'pointer'
          }}
        >
          {label}
        </button>
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', flexDirection: 'row' }} className="admin-container">
      {/* Mobile Sidebar Toggle Header */}
      <div style={{ 
        display: 'none', 
        padding: '10px 20px', 
        borderBottom: '2px solid #000', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fff',
        zIndex: 1100
      }} className="admin-mobile-header">
        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>ADMIN PANEL</h4>
        <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} style={{ fontSize: '0.8rem' }}>MENU</button>
      </div>

      <aside style={{ 
        width: '240px', 
        borderRight: '2px solid #000', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '24px 0',
        backgroundColor: '#fff',
        flexShrink: 0
      }} className={`admin-sidebar ${isSidebarVisible ? 'visible' : ''}`}>
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.2rem', lineHeight: '1', margin: 0 }}>BOSS RAP</h1>
          <p style={{ fontSize: '0.6rem', letterSpacing: '2px', margin: 0 }}>ADMINISTRATION</p>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <TabButton id="dashboard" label="DASHBOARD" />
          <TabButton id="inventory" label="INVENTORY" />
          <TabButton id="sales" label="SALES" />
          <TabButton id="members" label="MEMBERS" />
          <TabButton id="reports" label="REPORTS" />
          {currentUser.role === 'ADMIN' && <TabButton id="users" label="USERS" />}
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 24px' }}>
          <p style={{ fontSize: '0.6rem', color: '#666' }}>USER:</p>
          <p style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{currentUser.name}</p>
          <button 
            style={{ width: '100%', marginTop: '16px', fontSize: '0.65rem' }}
            onClick={() => { logout(); navigate('/'); }}
          >
            LOGOUT
          </button>
        </div>
      </aside>
      
      <main style={{ flex: 1, backgroundColor: '#fff', overflowY: 'auto', padding: '20px' }} className="admin-main">
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-container { flex-direction: column !important; }
          .admin-mobile-header { display: flex !important; }
          .admin-sidebar { 
            display: none !important; 
            width: 100% !important; 
            border-right: none !important; 
            border-bottom: 2px solid #000 !important;
            position: fixed;
            top: 52px;
            left: 0;
            right: 0;
            background: #fff;
            z-index: 1050;
            height: calc(100vh - 52px);
          }
          .admin-sidebar.visible { display: flex !important; }
          .admin-main { padding: 15px !important; }
        }
      `}</style>
    </div>
  );
};

