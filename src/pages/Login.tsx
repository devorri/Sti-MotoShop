import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabase';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setCurrentUser, users, addAuditLog, syncWithSupabase } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const input = username.trim();
    if (!input || !password) {
      setError('Please provide both username and password.');
      setLoading(false);
      return;
    }

    try {
      // 1. First check in local synced users
      let foundUser = users.find(u => {
        const matchesUsername = u.username.toLowerCase() === input.toLowerCase() || 
          (u.memberId && u.memberId.toLowerCase() === input.toLowerCase());
        return matchesUsername && u.password === password;
      });

      // 2. Query live Supabase 'accounts' directly in case it was just created
      if (!foundUser) {
        const { data: dbUser } = await supabase
          .from('accounts')
          .select('*')
          .or(`username.ilike.${input},member_id.ilike.${input}`)
          .maybeSingle();

        if (dbUser && dbUser.password === password) {
          foundUser = {
            id: dbUser.id,
            name: dbUser.name,
            username: dbUser.username,
            password: dbUser.password,
            role: dbUser.role,
            memberId: dbUser.member_id || undefined,
            enabled: dbUser.enabled ?? true
          };
          // Re-sync all users so state stays in sync
          await syncWithSupabase();
        }
      }

      if (foundUser) {
        if (!foundUser.enabled) {
          setError('Your account has been disabled by the store manager. Please contact administration.');
          setLoading(false);
          return;
        }

        setCurrentUser(foundUser);
        await addAuditLog('LOGIN', `User ${foundUser.name} (${foundUser.username}, ${foundUser.role}) logged in successfully.`);

        if (foundUser.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (foundUser.role === 'EMPLOYEE') {
          navigate('/staff/pos');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Invalid username or password. Please verify your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '75vh',
      padding: '28px 14px'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px 30px', backgroundColor: '#ffffff' }}>
        {/* Header & Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img 
            src="/boss-rap-logo.png" 
            alt="BOSS RAP MOTOR SHOP" 
            style={{ 
              maxHeight: '65px', 
              marginBottom: '12px'
            }} 
          />
          <h2 style={{ fontSize: '1.4rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
            System Sign In
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
            Boss Rap Motor Shop • Sales, Inventory & Club Portal
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca', 
            padding: '10px 14px', 
            borderRadius: '8px',
            color: '#b91c1c', 
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="login-username">Username or Member ID</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter username or Member ID"
              required
              autoFocus
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#2563eb',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '0.9rem' }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to System</span>
              </>
            )}
          </button>
        </form>

        {/* Link to Register */}
        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              Register for Rider Club (+50 Pts)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
