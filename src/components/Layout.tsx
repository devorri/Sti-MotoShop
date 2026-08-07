import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Top Announcement Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #ff1e27 0%, #0052ff 50%, #00d2ff 100%)',
        color: '#fff',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-header)',
        letterSpacing: '0.1em',
        textAlign: 'center',
        padding: '6px 12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>
        🏁 FREE MOTORCYCLE DIAGNOSTICS FOR REGISTERED MEMBERS! EARN DISCOUNTS AFTER 100 POINTS ⚡
      </div>

      {/* Main Header / Navigation */}
      <header style={{ 
        borderBottom: '1px solid rgba(0, 210, 255, 0.2)', 
        padding: '12px 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(7, 9, 14, 0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src="/boss-rap-logo.png" 
            alt="BOSS RAP MOTOR SHOP" 
            style={{ 
              height: '46px', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(0, 210, 255, 0.4))',
              transition: 'transform 0.3s ease'
            }} 
            className="header-logo-img"
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '1.25rem', 
              fontFamily: 'var(--font-header)', 
              fontWeight: 900, 
              color: '#ffffff', 
              letterSpacing: '0.05em',
              lineHeight: 1,
              background: 'linear-gradient(90deg, #ffffff 0%, #00d2ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              BOSS RAP
            </span>
            <span style={{ 
              fontSize: '0.6rem', 
              letterSpacing: '0.25em', 
              color: '#94a3b8', 
              fontWeight: 700,
              fontFamily: 'var(--font-header)',
              marginTop: '2px'
            }}>
              MOTOR SHOP
            </span>
          </div>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ 
            display: 'none', 
            background: 'rgba(15, 23, 42, 0.8)', 
            color: '#fff', 
            border: '1px solid var(--border-glow-blue)', 
            fontSize: '1.4rem',
            padding: '6px 12px',
            borderRadius: '6px'
          }}
          className="mobile-toggle"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        {/* Desktop & Mobile Navigation */}
        <nav style={{ 
          display: 'flex', 
          gap: '28px', 
          alignItems: 'center',
        }} className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            HOME
          </Link>
          <Link 
            to="/shop" 
            className={`nav-link ${location.pathname === '/shop' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            PARTS & SHOP
          </Link>
          <Link 
            to="/services" 
            className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            SERVICES
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            ABOUT US
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            CONTACT
          </Link>
          
          <div style={{ 
            display: 'flex', 
            gap: '14px', 
            alignItems: 'center', 
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)', 
            paddingLeft: '24px',
          }} className="nav-auth">
            {currentUser ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700 }}>{currentUser.name}</span>
                  <span className={`badge ${currentUser.role === 'ADMIN' ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                    {currentUser.role}
                  </span>
                </div>
                {currentUser.role === 'CUSTOMER' ? (
                  <button 
                    onClick={() => { navigate('/dashboard'); setIsMenuOpen(false); }} 
                    className="btn"
                    style={{ fontSize: '0.7rem', padding: '8px 14px' }}
                  >
                    MY ORDERS & TRACKING
                  </button>
                ) : (
                  <button 
                    onClick={() => { navigate('/admin/dashboard'); setIsMenuOpen(false); }} 
                    className="btn-primary"
                    style={{ fontSize: '0.7rem', padding: '8px 14px' }}
                  >
                    ADMIN PANEL
                  </button>
                )}
                <button 
                  onClick={() => { logout(); setIsMenuOpen(false); }} 
                  className="btn-danger"
                  style={{ fontSize: '0.7rem', padding: '8px 14px' }}
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="btn" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>LOG IN</button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                  <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '8px 16px' }}>JOIN CLUB</button>
                </Link>
              </div>
            )}
          </div>
        </nav>

        <style>{`
          @media (max-width: 992px) {
            .mobile-toggle { display: block !important; }
            .main-nav {
              display: none !important;
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: rgba(10, 14, 23, 0.98);
              backdrop-filter: blur(20px);
              border-bottom: 2px solid var(--accent-blue);
              flex-direction: column;
              padding: 24px;
              gap: 18px !important;
              align-items: flex-start !important;
              box-shadow: 0 20px 40px rgba(0,0,0,0.9);
            }
            .main-nav.open { display: flex !important; }
            .nav-auth { 
              border-left: none !important; 
              padding-left: 0 !important; 
              border-top: 1px solid rgba(255,255,255,0.1); 
              padding-top: 18px; 
              width: 100%; 
              flex-wrap: wrap;
              justify-content: space-between;
            }
          }
        `}</style>
      </header>

      <main style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      {/* Modern Footer */}
      <footer style={{ 
        borderTop: '1px solid rgba(0, 210, 255, 0.15)', 
        padding: '50px 24px 30px', 
        backgroundColor: '#05070c',
        color: '#94a3b8',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src="/boss-rap-logo.png" alt="BOSS RAP" style={{ height: '40px', filter: 'drop-shadow(0 0 8px rgba(0, 210, 255, 0.3))' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>BOSS RAP MOTOR SHOP</h3>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.7', color: '#64748b' }}>
              Bulacan's premier hub for genuine motorcycle spare parts, custom tune-ups, high-performance racing upgrades, and membership reward discounts.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#00d2ff', marginBottom: '16px' }}>QUICK NAVIGATION</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <li><Link to="/shop" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Parts Catalog & Inventory</Link></li>
              <li><Link to="/services" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Tuning & Repair Services</Link></li>
              <li><Link to="/about" style={{ color: '#cbd5e1', textDecoration: 'none' }}>About Our Shop</Link></li>
              <li><Link to="/contact" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Customer Inquiry & Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#00d2ff', marginBottom: '16px' }}>SHOP LOCATION & HOURS</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.7', color: '#cbd5e1' }}>
              📍 JP Rizal St., Baliwag, Bulacan, Philippines<br />
              ⏰ Monday - Saturday: 8:00 AM - 6:00 PM<br />
              📞 Hotline: (0905) 123-4567 / (044) 764-8899<br />
              ✉️ Email: support@bossrap-motorshop.com
            </p>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.08)', 
          paddingTop: '20px', 
          textAlign: 'center', 
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} BOSS RAP MOTOR SHOP. ALL RIGHTS RESERVED.</p>
          <p style={{ margin: 0, color: '#00d2ff', fontFamily: 'var(--font-header)' }}>ENGINEERED FOR HIGH-PERFORMANCE RIDING ⚡</p>
        </div>
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

  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: string }) => {
    const isActive = location.pathname.includes(id);
    return (
      <Link to={`/admin/${id}`} style={{ textDecoration: 'none' }} onClick={() => setIsSidebarVisible(false)}>
        <div 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 20px', 
            borderLeft: isActive ? '4px solid var(--accent-cyan)' : '4px solid transparent',
            background: isActive ? 'linear-gradient(90deg, rgba(0, 210, 255, 0.15) 0%, transparent 100%)' : 'transparent',
            color: isActive ? '#ffffff' : '#94a3b8',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-header)',
            fontWeight: isActive ? 800 : 600,
            letterSpacing: '0.05em',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
          <span>{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', flexDirection: 'row', backgroundColor: '#07090e' }} className="admin-container">
      {/* Mobile Sidebar Toggle Header */}
      <div style={{ 
        display: 'none', 
        padding: '12px 20px', 
        borderBottom: '1px solid rgba(0, 210, 255, 0.2)', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        zIndex: 1100
      }} className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/boss-rap-logo.png" alt="BOSS RAP" style={{ height: '32px' }} />
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>ADMIN PANEL</h4>
        </div>
        <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="btn" style={{ fontSize: '0.7rem' }}>
          {isSidebarVisible ? 'CLOSE' : 'MENU ☰'}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside style={{ 
        width: '260px', 
        borderRight: '1px solid rgba(255, 255, 255, 0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '24px 0',
        backgroundColor: 'rgba(10, 14, 23, 0.95)',
        flexShrink: 0,
        boxShadow: '4px 0 25px rgba(0,0,0,0.5)'
      }} className={`admin-sidebar ${isSidebarVisible ? 'visible' : ''}`}>
        <div style={{ padding: '0 20px', marginBottom: '28px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/boss-rap-logo.png" alt="BOSS RAP" style={{ height: '42px', filter: 'drop-shadow(0 0 10px rgba(0, 210, 255, 0.4))' }} />
            <div>
              <h1 style={{ fontSize: '1.1rem', margin: 0, lineHeight: '1', color: '#fff' }}>BOSS RAP</h1>
              <p style={{ fontSize: '0.55rem', letterSpacing: '2px', margin: '4px 0 0', color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>MANAGEMENT HUB</p>
            </div>
          </Link>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <TabButton id="dashboard" label="DASHBOARD" icon="📊" />
          <TabButton id="inventory" label="INVENTORY & PO" icon="📦" />
          <TabButton id="purchase-orders" label="PURCHASE ORDERS" icon="📑" />
          <TabButton id="sales" label="SALES & ORDERS" icon="💰" />
          <TabButton id="members" label="MEMBERS & DISCOUNTS" icon="👑" />
          <TabButton id="promos" label="PROMOTIONS" icon="🏷️" />
          <TabButton id="returns" label="RETURNS & CLAIMS" icon="🔄" />
          <TabButton id="inquiries" label="MESSAGES" icon="💬" />
          <TabButton id="reports" label="REPORTS & ANALYTICS" icon="📈" />
          {currentUser.role === 'ADMIN' && <TabButton id="users" label="SYSTEM USERS" icon="⚙️" />}
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '16px 20px', 
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15, 23, 42, 0.6)',
          margin: '20px 14px 0 14px',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, fontFamily: 'var(--font-header)' }}>LOGGED IN AS:</p>
              <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fff', margin: '2px 0 0' }}>{currentUser.name}</p>
            </div>
            <span className={`badge ${currentUser.role === 'ADMIN' ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: '0.55rem' }}>
              {currentUser.role}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <Link to="/" style={{ flex: 1 }}>
              <button className="btn" style={{ width: '100%', fontSize: '0.65rem', padding: '6px' }}>
                SHOP HOME
              </button>
            </Link>
            <button 
              className="btn-danger"
              style={{ fontSize: '0.65rem', padding: '6px 12px' }}
              onClick={() => { logout(); navigate('/'); }}
            >
              EXIT
            </button>
          </div>
        </div>
      </aside>
      
      <main style={{ flex: 1, backgroundColor: '#07090e', overflowY: 'auto', padding: '28px' }} className="admin-main">
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
            border-bottom: 2px solid var(--accent-blue) !important;
            position: fixed;
            top: 56px;
            left: 0;
            right: 0;
            background: #07090e;
            z-index: 1050;
            height: calc(100vh - 56px);
            overflow-y: auto;
          }
          .admin-sidebar.visible { display: flex !important; }
          .admin-main { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
};
