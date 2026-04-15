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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>BOSS RAP</h2>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', marginBottom: '32px', letterSpacing: '4px' }}>MOTOSHOP LOGIN</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ marginTop: '5px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ marginTop: '5px' }}
            />
          </div>
          {error && <p style={{ color: 'red', fontSize: '0.7rem', fontWeight: 'bold' }}>{error}</p>}
          <button type="submit" className="primary" style={{ marginTop: '10px' }}>LOG IN</button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem' }}>NEW CUSTOMER? <Link to="/register" style={{ color: '#000', fontWeight: 'bold' }}>REGISTER HERE</Link></p>
        </div>

      </div>
    </div>
  );
};
