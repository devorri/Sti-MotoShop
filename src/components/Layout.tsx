import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Monitor,
  Shield, 
  LogOut, 
  LogIn, 
  UserPlus, 
  RefreshCw, 
  Menu, 
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Package,
  Truck,
  History,
  Clock,
  RotateCcw,
  Mail,
  Tag,
  BarChart2,
  Download
} from 'lucide-react';

// ==========================================
// 1. Public Layout (Storefront & Visitors)
// ==========================================
export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      {/* Top Banner Notice */}
      <div style={{
        backgroundColor: '#2563eb',
        color: '#ffffff',
        fontSize: '0.75rem',
        fontWeight: 700,
        textAlign: 'center',
        padding: '6px 12px',
        letterSpacing: '0.04em'
      }}>
        🏁 BOSS RAP MOTOR SHOP • BALIUAG, BULACAN • HIGH-PERFORMANCE TUNING & SPARES • EARN 1 PT PER ₱100 ⚡
      </div>

      {/* Main Header */}
      <header style={{ 
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0', 
        padding: '12px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/boss-rap-logo.png" 
            alt="BOSS RAP MOTOR SHOP" 
            style={{ 
              height: '40px', 
              objectFit: 'contain'
            }} 
          />
          <div>
            <span style={{ 
              fontSize: '1.2rem', 
              fontWeight: 900, 
              color: '#0f172a', 
              display: 'block',
              lineHeight: 1.1,
              letterSpacing: '0.02em'
            }}>
              BOSS RAP MOTOR SHOP
            </span>
            <span style={{ 
              fontSize: '0.7rem', 
              color: '#64748b', 
              fontWeight: 600
            }}>
              Sales, Inventory & Membership Portal
            </span>
          </div>
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="btn"
          style={{ display: 'none', padding: '6px 10px' }}
          id="public-mobile-toggle"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }} className="public-nav-links">
          <Link to="/shop" style={{ textDecoration: 'none' }}>
            <button 
              className={`btn ${location.pathname === '/shop' ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.82rem', fontWeight: 700 }}
            >
              <ShoppingBag size={15} />
              <span>Catalog & Shop</span>
            </button>
          </Link>

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right', marginRight: '4px' }}>
                <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, display: 'block' }}>{currentUser.name}</span>
                <span className={`badge ${currentUser.role === 'ADMIN' ? 'badge-red' : currentUser.role === 'EMPLOYEE' ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                  {currentUser.role === 'EMPLOYEE' ? 'STAFF' : currentUser.role}
                </span>
              </div>

              {currentUser.role === 'CUSTOMER' && (
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className={`btn ${location.pathname === '/dashboard' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  <LayoutDashboard size={14} />
                  <span>My Dashboard</span>
                </button>
              )}

              {currentUser.role === 'EMPLOYEE' && (
                <button 
                  onClick={() => navigate('/staff/pos')} 
                  className="btn-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  <Monitor size={14} />
                  <span>POS Terminal</span>
                </button>
              )}

              {currentUser.role === 'ADMIN' && (
                <>
                  <button 
                    onClick={() => navigate('/admin/dashboard')} 
                    className="btn-primary"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Shield size={14} />
                    <span>Admin Dashboard</span>
                  </button>
                  <button 
                    onClick={() => navigate('/staff/pos')} 
                    className="btn"
                    style={{ fontSize: '0.8rem' }}
                  >
                    <Monitor size={14} />
                    <span>POS Terminal</span>
                  </button>
                </>
              )}

              <button 
                onClick={() => { logout(); navigate('/login'); }} 
                className="btn-danger"
                style={{ fontSize: '0.8rem' }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button 
                  className={`btn ${location.pathname === '/login' ? 'btn-primary' : ''}`} 
                  style={{ fontSize: '0.8rem' }}
                >
                  <LogIn size={14} />
                  <span>Login</span>
                </button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button 
                  className={`btn ${location.pathname === '/register' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  <UserPlus size={14} />
                  <span>Register</span>
                </button>
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Main Page Area */}
      <main style={{ flex: 1, width: '100%', padding: '0' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0', 
        padding: '24px 28px', 
        color: '#64748b',
        fontSize: '0.78rem',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong style={{ color: '#0f172a' }}>Boss Rap Motor Shop</strong> • JP Rizal St., Baliuag, Bulacan
          </div>
          <div style={{ color: '#64748b' }}>
            Web-Based Sales & Inventory System with Membership Management • Boss Rap Motor Shop
          </div>
        </div>
      </footer>
    </div>
  );
};

// ==========================================
// 2. Staff POS Layout (Cashier Station)
// ==========================================
export const StaffLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, syncWithSupabase } = useAppContext();
  const navigate = useNavigate();

  if (!currentUser || (currentUser.role !== 'EMPLOYEE' && currentUser.role !== 'ADMIN')) {
    navigate('/login');
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Staff Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/boss-rap-logo.png" alt="BOSS RAP" style={{ height: '36px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#0f172a', fontWeight: 800 }}>BOSS RAP STAFF POS</h2>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>CASHIER TERMINAL</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Register & Barcode Counter Fulfillment
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => syncWithSupabase()}
            className="btn"
            style={{ fontSize: '0.78rem' }}
            title="Refresh database records"
          >
            <RefreshCw size={13} />
            <span>Sync Cloud</span>
          </button>

          <button 
            onClick={() => navigate('/shop')} 
            className="btn"
            style={{ fontSize: '0.8rem' }}
          >
            <ShoppingBag size={14} />
            <span>Store View</span>
          </button>

          {currentUser.role === 'ADMIN' && (
            <button 
              onClick={() => navigate('/admin/dashboard')} 
              className="btn"
              style={{ fontSize: '0.8rem', color: '#dc2626', borderColor: '#fca5a5', backgroundColor: '#fef2f2' }}
            >
              <Shield size={14} />
              <span>Admin Dashboard</span>
            </button>
          )}

          <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, display: 'block' }}>{currentUser.name}</span>
            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
              {currentUser.role === 'ADMIN' ? 'ADMINISTRATOR' : 'STAFF CASHIER'}
            </span>
          </div>

          <button 
            className="btn-danger"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Staff Main Content */}
      <main style={{ flex: 1, padding: '16px 20px', width: '100%' }}>
        {children}
      </main>

      {/* Staff Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '10px 24px',
        color: '#64748b',
        fontSize: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Boss Rap Motor Shop • Terminal 01 (Baliuag Branch)</span>
        <span>POS Terminal • Online</span>
      </footer>
    </div>
  );
};

// ==========================================
// 3. Admin Layout (Enterprise Collapsible Left Sidebar)
// ==========================================
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    currentUser, 
    logout, 
    syncWithSupabase,
    users,
    products,
    sales,
    auditLogs,
    backOrders,
    purchaseOrders,
    returnRequests,
    inquiries,
    promos
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible sidebar state (persisted to localStorage)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('motoshop_admin_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('motoshop_admin_sidebar_open', String(next));
      return next;
    });
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    if (currentUser?.role === 'EMPLOYEE') {
      navigate('/staff/pos');
    } else {
      navigate('/login');
    }
    return null;
  }

  const currentTab = new URLSearchParams(location.search).get('tab') || 'ACCOUNTS';

  const isNavActive = (path: string, tab?: string) => {
    if (location.pathname !== path) return false;
    if (tab) return currentTab === tab;
    return true;
  };

  interface NavItem {
    label: string;
    path: string;
    tab?: string;
    icon: React.ReactNode;
    count?: number;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Accounts & Staff', path: '/admin/dashboard', tab: 'ACCOUNTS', icon: <Users size={17} />, count: users.length },
        { label: 'Catalog & Stock', path: '/admin/dashboard', tab: 'PRODUCTS', icon: <Package size={17} />, count: products.length },
        { label: 'Orders Feed', path: '/admin/dashboard', tab: 'ORDERS', icon: <ShoppingBag size={17} />, count: sales.length },
        { label: 'Purchase Orders', path: '/admin/purchase-orders', icon: <Truck size={17} />, count: purchaseOrders.length },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Audit Trail', path: '/admin/dashboard', tab: 'AUDIT', icon: <History size={17} />, count: auditLogs.length },
        { label: 'Back Orders', path: '/admin/dashboard', tab: 'BACKORDERS', icon: <Clock size={17} />, count: backOrders.length },
        { label: 'Returns & RMA', path: '/admin/returns', icon: <RotateCcw size={17} />, count: returnRequests.length },
        { label: 'Inquiries Inbox', path: '/admin/inquiries', icon: <Mail size={17} />, count: inquiries.length },
        { label: 'Promos & Discounts', path: '/admin/promos', icon: <Tag size={17} />, count: promos.length },
      ]
    },
    {
      title: 'ANALYTICS & SYSTEM',
      items: [
        { label: 'Sales Analytics', path: '/admin/dashboard', tab: 'REPORTS', icon: <BarChart2 size={17} /> },
        { label: 'Backup & Restore', path: '/admin/dashboard', tab: 'BACKUP', icon: <Download size={17} /> },
      ]
    }
  ];

  const getActiveTitle = () => {
    for (const sec of navSections) {
      for (const item of sec.items) {
        if (isNavActive(item.path, item.tab)) {
          return item.label;
        }
      }
    }
    return 'Admin Dashboard';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#f8fafc' }}>
      
      {/* ======================================================== */}
      {/* 1. Left Sidebar Navigation (Collapsible) */}
      {/* ======================================================== */}
      <aside style={{
        width: sidebarOpen ? '255px' : '70px',
        minWidth: sidebarOpen ? '255px' : '70px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '1px 0 3px 0 rgba(0, 0, 0, 0.02)'
      }}>
        
        {/* Sidebar Header / Brand */}
        <div style={{
          padding: sidebarOpen ? '16px 18px' : '16px 12px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          gap: '10px'
        }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <img src="/boss-rap-logo.png" alt="BOSS RAP" style={{ height: '34px', width: 'auto', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>BOSS RAP</strong>
                <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700, letterSpacing: '0.05em' }}>ADMIN PORTAL</span>
              </div>
            </div>
          ) : (
            <img src="/boss-rap-logo.png" alt="BOSS RAP" style={{ height: '30px', width: 'auto' }} />
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '6px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f1f5f9',
              flexShrink: 0
            }}
          >
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
        </div>

        {/* Sidebar Nav List (Scrollable) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: sidebarOpen ? '14px 10px' : '14px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {navSections.map(sec => (
            <div key={sec.title}>
              {sidebarOpen && (
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#94a3b8',
                  letterSpacing: '0.06em',
                  padding: '4px 10px 6px',
                  textTransform: 'uppercase'
                }}>
                  {sec.title}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {sec.items.map(item => {
                  const active = isNavActive(item.path, item.tab);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      title={!sidebarOpen ? item.label : undefined}
                      onClick={() => navigate(item.tab ? `${item.path}?tab=${item.tab}` : item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                        gap: '10px',
                        padding: sidebarOpen ? '9px 12px' : '10px 0',
                        borderRadius: '6px',
                        border: 'none',
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        backgroundColor: active ? '#eff6ff' : 'transparent',
                        color: active ? '#2563eb' : '#475569',
                        fontWeight: active ? 700 : 500,
                        borderLeft: active ? '3px solid #2563eb' : '3px solid transparent'
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.color = '#0f172a';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#475569';
                        }
                      }}
                    >
                      <div style={{ color: active ? '#2563eb' : '#64748b', flexShrink: 0 }}>
                        {item.icon}
                      </div>

                      {sidebarOpen && (
                        <>
                          <span style={{ fontSize: '0.82rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.label}
                          </span>
                          {item.count !== undefined && item.count > 0 && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '10px',
                              backgroundColor: active ? '#dbeafe' : '#f1f5f9',
                              color: active ? '#1d4ed8' : '#64748b'
                            }}>
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          padding: sidebarOpen ? '12px 14px' : '12px 8px',
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  flexShrink: 0
                }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {currentUser.name}
                  </div>
                  <span className="badge badge-red" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                    ADMINISTRATOR
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { logout(); navigate('/login'); }}
                title="Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  borderRadius: '4px',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem'
              }}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => { logout(); navigate('/login'); }}
                title="Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. Main Right Canvas & Top Navigation Bar */}
      {/* ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
        
        {/* Top Navbar */}
        <header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Left Title & Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!sidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                title="Show navigation sidebar"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  borderRadius: '6px',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f1f5f9'
                }}
              >
                <Menu size={18} />
              </button>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Admin Portal</span>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>/</span>
                <h2 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  {getActiveTitle()}
                </h2>
                <span className="badge badge-green" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>
                  LIVE SYSTEM ONLINE
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Quick Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button"
              onClick={() => syncWithSupabase()}
              className="btn"
              style={{ fontSize: '0.76rem', padding: '6px 12px' }}
              title="Refresh database records from cloud"
            >
              <RefreshCw size={13} />
              <span>Sync Cloud</span>
            </button>

          </div>
        </header>

        {/* Admin Page Main Content */}
        <main style={{ flex: 1, padding: '24px 28px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>

        {/* Admin Footer */}
        <footer style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 28px',
          color: '#64748b',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span>Boss Rap Motor Shop • Enterprise Management & POS Portal</span>
          <span>Baliuag Branch • All Rights Reserved</span>
        </footer>
      </div>

    </div>
  );
};
