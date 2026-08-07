import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    contact: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { users, setUsers, members, setMembers, setCurrentUser } = useAppContext();
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
      setError('USERNAME ALREADY TAKEN');
      return;
    }

    const newMemberId = `M${(members.length + 1).toString().padStart(3, '0')}`;
    
    const newMember = {
      id: newMemberId,
      name: formData.name,
      contact: formData.contact,
      address: 'N/A',
      joinDate: new Date().toISOString().split('T')[0],
      points: 0
    };

    const newUser = {
      id: `U_${newMemberId}`,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: 'CUSTOMER' as const,
      memberId: newMemberId,
      enabled: true
    };

    setMembers([...members, newMember]);
    setUsers([...users, newUser]);
    
    setCurrentUser(newUser);
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '85vh', 
      padding: '40px 20px',
      background: 'radial-gradient(circle at 50% 50%, rgba(255, 30, 39, 0.1) 0%, rgba(7, 9, 14, 0.95) 70%)'
    }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img 
            src="/boss-rap-logo.png" 
            alt="BOSS RAP MOTOR SHOP" 
            style={{ 
              maxHeight: '75px', 
              marginBottom: '14px',
              filter: 'drop-shadow(0 0 12px rgba(255, 30, 39, 0.5))' 
            }} 
          />
          <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>JOIN BOSS RAP RIDER CLUB</h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-header)' }}>
            EARN REWARD POINTS & ENJOY MEMBER DISCOUNTS
          </p>
        </div>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
              FULL NAME
            </label>
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
              placeholder="JUAN DELA CRUZ"
              style={{ marginTop: '6px' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
                USERNAME
              </label>
              <input 
                type="text" 
                required 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="MYUSER123"
                style={{ marginTop: '6px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
                CONTACT #
              </label>
              <input 
                type="text" 
                required 
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
                placeholder="09123456789"
                style={{ marginTop: '6px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
              PASSWORD
            </label>
            <input 
              type="password" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
              style={{ marginTop: '6px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>
              CONFIRM PASSWORD
            </label>
            <input 
              type="password" 
              required 
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="••••••••"
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
            ⚡ REGISTER FREE MEMBERSHIP
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            ALREADY A MEMBER?{' '}
            <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 700, textDecoration: 'none' }}>
              LOG IN HERE
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
