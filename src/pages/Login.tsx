import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setCurrentUser, users } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (!user.enabled) {
        setError('YOUR ACCOUNT HAS BEEN DISABLED. PLEASE CONTACT THE ADMINISTRATOR.');
        return;
      }
      setCurrentUser(user);
      if (user.role === 'ADMIN' || user.role === 'EMPLOYEE') {
        navigate('/admin/dashboard');
      } else if (user.role === 'CUSTOMER') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError('INVALID USERNAME OR PASSWORD');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '85vh',
      padding: '40px 20px',
      background: 'radial-gradient(circle at 50% 50%, rgba(0, 210, 255, 0.1) 0%, rgba(7, 9, 14, 0.95) 70%)'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img 
            src="/boss-rap-logo.png" 
            alt="BOSS RAP MOTOR SHOP" 
            style={{ 
              maxHeight: '75px', 
              marginBottom: '14px',
              filter: 'drop-shadow(0 0 12px rgba(0, 210, 255, 0.5))' 
            }} 
          />
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>MEMBER & STAFF LOGIN</h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-header)' }}>
            ACCESS YOUR ORDERS, DISCOUNTS & DASHBOARD
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              style={{ marginTop: '6px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ marginTop: '6px' }}
            />
          </div>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(255, 30, 39, 0.15)', 
              border: '1px solid var(--accent-red)', 
              padding: '10px 14px', 
              borderRadius: '6px',
              color: '#ff4d53', 
              fontSize: '0.75rem', 
              fontWeight: 700 
            }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="primary" style={{ marginTop: '10px', padding: '14px' }}>
            ⚡ LOG IN TO ACCOUNT
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            NEW TO BOSS RAP?{' '}
            <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 700, textDecoration: 'none' }}>
              REGISTER HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
