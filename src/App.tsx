import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { PublicLayout, AdminLayout } from './components/Layout';
import { Home, Shop } from './pages/PublicPages';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard, UserManagement, Inventory } from './pages/AdminPages';
import { CustomerDashboard } from './pages/CustomerPages';
import './App.css';

// Placeholder Pages for complete set
const Services = () => (
  <div style={{ padding: '60px 40px' }}>
    <h2 style={{ textAlign: 'center', marginBottom: '60px' }}>PROFESSIONAL MOTOR SERVICES</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
      {[
        { title: 'TUNE UP', price: '₱500+', desc: 'Complete engine diagnostics and optimization.' },
        { title: 'CHANGE OIL', price: '₱350+', desc: 'Premium oil replacement for maximum engine life.' },
        { title: 'OVERHAUL', price: '₱5,000+', desc: 'Full engine restoration and parts replacement.' },
        { title: 'BRAKE SERVICE', price: '₱300+', desc: 'Brake pad replacement and system bleeding.' },
        { title: 'VULCANIZING', price: '₱150+', desc: 'Flat tire repair and tire rotation.' },
        { title: 'WASH & WAX', price: '₱200+', desc: 'Deep cleaning and protective wax finish.' },
      ].map(s => (
        <div key={s.title} className="card">
          <h3>{s.title}</h3>
          <p style={{ fontWeight: 'bold', margin: '15px 0' }}>STARTING AT {s.price}</p>
          <p style={{ fontSize: '0.8rem' }}>{s.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const About = () => (
  <div style={{ padding: '80px 40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
    <h2>ABOUT BOSS RAP</h2>
    <p style={{ marginTop: '40px', fontSize: '1.1rem', lineHeight: '1.8' }}>
      ESTABLISHED IN 2008, BOSS RAP MOTOR SHOP HAS BEEN THE LEADING PROVIDER OF PREMIUM MOTORCYCLE PARTS 
      AND PROFESSIONAL SERVICES IN THE REGION. WE PRIDE OURSELVES ON TRANSPARENCY, QUALITY, AND SPEED.
    </p>
    <div className="card" style={{ marginTop: '60px' }}>
      <h3>OUR MISSION</h3>
      <p style={{ fontSize: '0.9rem', marginTop: '20px' }}>
        TO PROVIDE RIDERS WITH THE BEST QUALITY PARTS AND UNMATCHED SERVICE EXCELLENCE, 
        ENSURING EVERY RIDE IS SAFE AND PERFORMING AT ITS PEAK.
      </p>
    </div>
  </div>
);

const Contact = () => (
  <div style={{ padding: '80px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
    <div>
      <h2>GET IN TOUCH</h2>
      <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div>
          <h4>ADDRESS</h4>
          <p style={{ fontSize: '0.9rem' }}>Bagong Nayon, Baliwag, Bulacan (infront of Bagong Nayon Chapel)</p>
        </div>
        <div>
          <h4>PHONE</h4>
          <p style={{ fontSize: '0.9rem' }}>+63 912 345 6789</p>
        </div>
        <div>
          <h4>EMAIL</h4>
          <p style={{ fontSize: '0.9rem' }}>CONTACT@BOSSRAP.COM</p>
        </div>
        <div>
          <h4>HOURS</h4>
          <p style={{ fontSize: '0.9rem' }}>MON-SAT: 8:00 AM - 6:00 PM</p>
        </div>
      </div>
    </div>
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <h3>MAP PLACEHOLDER</h3>
    </div>
  </div>
);

// Admin Module Placeholders (integrated logic)
const Sales = () => {
  const { products, sales, setSales, setProducts, members, setMembers } = useAppContext();
  const [cart, setCart] = React.useState<any[]>([]);
  const [selectedMember, setSelectedMember] = React.useState('');

  const addToCart = (p: any) => {
    const existing = cart.find(i => i.productId === p.id);
    if (existing) {
      setCart(cart.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
    }
  };

  const processSale = () => {
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const newSale = { id: `S${Date.now()}`, items: cart, total, date: new Date().toISOString(), memberId: selectedMember };
    setSales([...sales, newSale]);
    
    // Deduct stock
    const updatedProducts = products.map(p => {
      const item = cart.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock - item.quantity } : p;
    });
    setProducts(updatedProducts);

    // [INTEGRATION] Award points if it's a member transaction
    if (selectedMember) {
      const pointsEarned = Math.floor(total / 100);
      const updatedMembers = members.map(m => 
        m.id === selectedMember ? { ...m, points: m.points + pointsEarned } : m
      );
      setMembers(updatedMembers);
    }

    setCart([]);
    alert(`TRANSACTION COMPLETED${selectedMember ? ' - POINTS AWARDED!' : ''}`);
  };

  return (
    <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
      <div className="card">
        <h3>POS SYSTEM</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} style={{ fontSize: '0.7rem' }}>
              {p.name}<br/>₱{p.price}
            </button>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>CART</h3>
        <div style={{ margin: '20px 0' }}>
          {cart.map(i => <p key={i.productId} style={{ fontSize: '0.8rem' }}>{i.name} x {i.quantity}</p>)}
        </div>
        <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} style={{ marginBottom: '20px' }}>
          <option value="">WALK-IN</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <h4>TOTAL: ₱{cart.reduce((sum, i) => sum + i.price * i.quantity, 0)}</h4>
        <button className="primary" style={{ width: '100%', marginTop: '20px' }} onClick={processSale}>COMPLETE SALE</button>
      </div>
    </div>
  );
};

const Members = () => {
  const { members } = useAppContext();
  return (
    <div style={{ padding: '32px' }}>
      <h2>Member List</h2>
      <table style={{ marginTop: '24px' }}>
        <thead><tr><th>ID</th><th>NAME</th><th>CONTACT</th><th>POINTS</th></tr></thead>
        <tbody>
          {members.map(m => (
            <tr key={m.id}><td>{m.id}</td><td>{m.name}</td><td>{m.contact}</td><td>{m.points}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Reports = () => {
  const { sales } = useAppContext();
  return (
    <div style={{ padding: '32px' }}>
      <h2>System Reports</h2>
      <div className="card" style={{ marginTop: '24px' }}>
        <h3>SALES HISTORY</h3>
        <table style={{ marginTop: '16px' }}>
          <thead><tr><th>ID</th><th>DATE</th><th>TOTAL</th></tr></thead>
          <tbody>
            {sales.map(s => (
              <tr key={s.id}><td>{s.id}</td><td>{new Date(s.date).toLocaleString()}</td><td>₱{s.total}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
          <Route path="/dashboard" element={<PublicLayout><CustomerDashboard /></PublicLayout>} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>}>
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/admin/inventory" element={<AdminLayout><Inventory /></AdminLayout>} />
          <Route path="/admin/sales" element={<AdminLayout><Sales /></AdminLayout>} />
          <Route path="/admin/members" element={<AdminLayout><Members /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><Reports /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

