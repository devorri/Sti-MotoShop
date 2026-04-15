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

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('PASSWORDS DO NOT MATCH');
      return;
    }

    if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
      setError('USERNAME ALREADY TAKEN');
      return;
    }

    // 1. Create Member ID
    const newMemberId = `M${(members.length + 1).toString().padStart(3, '0')}`;
    
    // 2. Create Member Profile
    const newMember = {
      id: newMemberId,
      name: formData.name,
      contact: formData.contact,
      joinDate: new Date().toISOString().split('T')[0],
      points: 0
    };

    // 3. Create User Account
    const newUser = {
      id: `U_${newMemberId}`,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: 'CUSTOMER' as any,
      memberId: newMemberId
    };

    // 4. Update Global State
    setMembers([...members, newMember]);
    setUsers([...users, newUser]);
    
    // 5. Auto-login
    setCurrentUser(newUser);
    navigate('/dashboard');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
      <div className="modal" style={{ maxWidth: '450px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>BOSS RAP</h2>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: '32px', letterSpacing: '4px', opacity: 0.7 }}>CREATE CUSTOMER ACCOUNT</p>
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>FULL NAME</label>
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
              placeholder="E.G. JUAN DELA CRUZ"
              style={{ marginTop: '5px' }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>USERNAME</label>
              <input 
                type="text" 
                required 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="MYUSER123"
                style={{ marginTop: '5px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>CONTACT #</label>
              <input 
                type="text" 
                required 
                value={formData.contact}
                onChange={e => setFormData({...formData, contact: e.target.value})}
                placeholder="09123456789"
                style={{ marginTop: '5px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>PASSWORD</label>
            <input 
              type="password" 
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              style={{ marginTop: '5px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>CONFIRM PASSWORD</label>
            <input 
              type="password" 
              required 
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              style={{ marginTop: '5px' }}
            />
          </div>

          {error && <p style={{ color: 'red', fontSize: '0.7rem', fontWeight: 'bold' }}>{error}</p>}
          
          <button type="submit" className="primary" style={{ marginTop: '15px' }}>JOIN THE CLUB</button>
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.8rem' }}>ALREADY HAVE AN ACCOUNT? <Link to="/login" style={{ color: '#000', fontWeight: 'bold' }}>LOG IN</Link></p>
        </div>
      </div>
    </div>
  );
};
