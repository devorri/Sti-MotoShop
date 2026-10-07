import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabase';
import { CheckCircle2, ArrowRight, ShoppingBag, AlertCircle, UserPlus } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    contact: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    memberId: string;
    name: string;
    username: string;
    points: number;
  } | null>(null);

  const { setCurrentUser, syncWithSupabase, addAuditLog } = useAppContext();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }

    setLoading(true);

    try {
      const cleanUsername = formData.username.trim();

      // 1. Live Check if username already exists in Supabase 'accounts'
      const { data: existingUser } = await supabase
        .from('accounts')
        .select('id, username')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (existingUser) {
        setError(`Username "${cleanUsername}" is already registered. Please choose another.`);
        setLoading(false);
        return;
      }

      // 2. Compute the next Member ID dynamically from all existing members in Supabase
      const { data: allMembers } = await supabase
        .from('members')
        .select('id');

      const existingNums = (allMembers || [])
        .map(m => parseInt((m.id || '').replace(/\D/g, ''), 10))
        .filter(n => !isNaN(n));

      const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
      const nextNum = maxNum + 1;
      const newMemberId = `M${nextNum.toString().padStart(3, '0')}`;

      const newMemberData = {
        id: newMemberId,
        name: formData.name.trim().toUpperCase(),
        contact: formData.contact.trim() || 'N/A',
        address: formData.address.trim() || 'Baliuag, Bulacan',
        join_date: new Date().toISOString().split('T')[0],
        points: 50 // Welcome bonus loyalty points
      };

      const newAccountData = {
        id: `U_${newMemberId}`,
        name: formData.name.trim().toUpperCase(),
        username: cleanUsername,
        password: formData.password,
        role: 'CUSTOMER',
        member_id: newMemberId,
        enabled: true
      };

      // 3. Insert into Supabase 'members'
      const { error: memberError } = await supabase
        .from('members')
        .insert([newMemberData]);

      if (memberError) {
        throw new Error('Failed to create member record: ' + memberError.message);
      }

      // 4. Insert into Supabase 'accounts'
      const { error: accountError } = await supabase
        .from('accounts')
        .insert([newAccountData]);

      if (accountError) {
        throw new Error('Failed to create login account: ' + accountError.message);
      }

      // 5. Audit log
      await addAuditLog(
        'USER_REGISTERED',
        `New member registered: ${newAccountData.name} (${newAccountData.username}) with ID ${newMemberId}.`
      );

      // 6. Sync app context immediately so admin user management sees the new account instantly!
      await syncWithSupabase();

      // 7. Auto-login
      setCurrentUser({
        id: newAccountData.id,
        name: newAccountData.name,
        username: newAccountData.username,
        role: 'CUSTOMER',
        memberId: newMemberId,
        enabled: true
      });

      setSuccessInfo({
        memberId: newMemberId,
        name: newMemberData.name,
        username: cleanUsername,
        points: 50
      });

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration.');
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
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '32px 28px', backgroundColor: '#ffffff' }}>
        
        {successInfo ? (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '16px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '50%', 
              color: '#16a34a', 
              marginBottom: '16px' 
            }}>
              <CheckCircle2 size={48} />
            </div>

            <h2 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: 800, margin: '0 0 6px 0' }}>
              Registration Successful!
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Welcome to Boss Rap Motor Shop Rider Club.
            </p>

            <div style={{ 
              backgroundColor: '#eff6ff', 
              border: '1px solid #bfdbfe', 
              borderRadius: '10px', 
              padding: '20px', 
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned Club ID:</span>
                <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>{successInfo.memberId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Account Name:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{successInfo.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Username:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{successInfo.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #dbeafe' }}>
                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 700 }}>Welcome Bonus:</span>
                <span className="badge badge-green">+{successInfo.points} REWARD POINTS</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')} 
                className="btn-primary" 
                style={{ flex: 1, padding: '12px' }}
              >
                <span>Go to My Dashboard</span>
                <ArrowRight size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/shop')} 
                className="btn" 
                style={{ flex: 1, padding: '12px' }}
              >
                <ShoppingBag size={16} />
                <span>Browse Catalog</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Form Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img 
                src="/boss-rap-logo.png" 
                alt="BOSS RAP" 
                style={{ maxHeight: '55px', marginBottom: '10px' }} 
              />
              <h2 style={{ fontSize: '1.35rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Join the Rider Club
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                Earn loyalty points on every motorcycle part & service purchase
              </p>
            </div>

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

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="reg-name">Full Name *</label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="reg-username">Username *</label>
                <input
                  id="reg-username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label htmlFor="reg-contact">Contact Number</label>
                  <input
                    id="reg-contact"
                    type="tel"
                    placeholder="0912 345 6789"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="reg-address">Address / City</label>
                  <input
                    id="reg-address"
                    type="text"
                    placeholder="Baliuag, Bulacan"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password">Password *</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="reg-confirm-password">Confirm Password *</label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  <span>Registering Account in Supabase...</span>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Complete Registration (+50 Points)</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Log In
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
