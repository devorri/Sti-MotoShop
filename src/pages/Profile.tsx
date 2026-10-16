import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabase';
import type { Sale } from '../context/AppContext';
import {
  UserCheck,
  Shield,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ClipboardList,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  Printer,
  X,
  QrCode,
  RefreshCw,
  Monitor
} from 'lucide-react';

export const Profile: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    members,
    setMembers,
    setUsers,
    sales,
    products,
    users,
    pointsSettings,
    syncWithSupabase,
    addAuditLog
  } = useAppContext();

  const navigate = useNavigate();

  // Find linked member record if CUSTOMER
  const memberRecord = members.find(m => m.id === currentUser?.memberId);

  // Form states - Profile Details
  const [name, setName] = useState(currentUser?.name || '');
  const [contact, setContact] = useState(memberRecord?.contact || '');
  const [address, setAddress] = useState(memberRecord?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Form states - Password Security
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Active receipt modal
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  // Keep form in sync when memberRecord or currentUser updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
    }
    if (memberRecord) {
      setContact(memberRecord.contact || '');
      setAddress(memberRecord.address || '');
    }
  }, [currentUser, memberRecord]);

  if (!currentUser) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p>Please log in to view your profile.</p>
        <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', padding: '10px 20px' }}>
          Go to Sign In
        </Link>
      </div>
    );
  }

  const isCustomer = currentUser.role === 'CUSTOMER';
  const isRider = currentUser.role === 'RIDER';
  const isAdmin = currentUser.role === 'ADMIN';
  const isStaff = currentUser.role === 'EMPLOYEE';

  // Customer sales
  const customerOrders = currentUser.memberId
    ? sales
        .filter(s => s.memberId === currentUser.memberId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Rider deliveries metrics
  const completedDeliveries = sales.filter(s => s.fulfillmentType === 'DELIVERY' && s.orderStatus === 'COMPLETED').length;
  const outForDeliveries = sales.filter(s => s.fulfillmentType === 'DELIVERY' && s.orderStatus === 'OUT FOR DELIVERY').length;
  const pendingDeliveries = sales.filter(s => s.fulfillmentType === 'DELIVERY' && s.orderStatus === 'PREPARING').length;

  // Customer Loyalty Stats
  const points = memberRecord ? memberRecord.points : 0;
  const discountPesoValue = points * (pointsSettings.pointValue || 1);
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);

  // Customer Membership Tier
  const getTier = (pts: number) => {
    if (pts >= 500) return { name: 'PLATINUM RIDER', color: '#8b5cf6', badgeClass: 'badge-purple', next: null, progress: 100, perks: 'VIP tuning queue & 10% parts discount' };
    if (pts >= 250) return { name: 'GOLD RIDER', color: '#eab308', badgeClass: 'badge-yellow', next: 500, progress: (pts / 500) * 100, perks: 'Free oil change labor & priority queue' };
    if (pts >= 100) return { name: 'SILVER RIDER', color: '#0ea5e9', badgeClass: 'badge-blue', next: 250, progress: (pts / 250) * 100, perks: '5% off preventive maintenance labor' };
    return { name: 'BRONZE MEMBER', color: '#f97316', badgeClass: 'badge-green', next: 100, progress: (pts / 100) * 100, perks: 'Standard loyalty points earning on all parts' };
  };

  const tier = getTier(points);

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const cleanName = name.trim();
    const cleanContact = contact.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    setSavingProfile(true);

    try {
      // 1. Update accounts table in Supabase
      const { error: accErr } = await supabase
        .from('accounts')
        .update({ name: cleanName })
        .eq('id', currentUser.id);

      if (accErr) throw accErr;

      // 2. If member record exists (Customer role), update members table
      if (currentUser.memberId) {
        const { error: memErr } = await supabase
          .from('members')
          .update({
            name: cleanName,
            contact: cleanContact || 'N/A',
            address: cleanAddress || 'Baliuag, Bulacan'
          })
          .eq('id', currentUser.memberId);

        if (memErr) throw memErr;

        setMembers(prev => prev.map(m => m.id === currentUser.memberId ? {
          ...m,
          name: cleanName,
          contact: cleanContact || 'N/A',
          address: cleanAddress || 'Baliuag, Bulacan'
        } : m));
      }

      // 3. Update current user in context & localStorage
      const updatedUser = {
        ...currentUser,
        name: cleanName
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      await addAuditLog('PROFILE_UPDATED', `User ${cleanName} (${currentUser.username}, ${currentUser.role}) updated profile details.`);
      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4500);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 3) {
      setPasswordError('Password must be at least 3 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    setSavingPassword(true);

    try {
      const { error: pwdErr } = await supabase
        .from('accounts')
        .update({ password: newPassword })
        .eq('id', currentUser.id);

      if (pwdErr) throw pwdErr;

      // Update current user
      const updatedUser = {
        ...currentUser,
        password: newPassword
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      await addAuditLog('PASSWORD_CHANGED', `User ${currentUser.name} (${currentUser.username}) updated account password.`);
      setPasswordSuccess('Password successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4500);
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '28px 18px', width: '100%' }}>
      
      {/* ======================================================== */}
      {/* 1. Header Banner & Quick Role Actions */}
      {/* ======================================================== */}
      <div className="card" style={{
        backgroundColor: '#ffffff',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderLeft: `5px solid ${
          isAdmin ? '#dc2626' :
          isRider ? '#7c3aed' :
          isStaff ? '#2563eb' : '#16a34a'
        }`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            backgroundColor: isRider ? '#f5f3ff' : isAdmin ? '#fef2f2' : isStaff ? '#eff6ff' : '#f0fdf4',
            color: isRider ? '#7c3aed' : isAdmin ? '#dc2626' : isStaff ? '#2563eb' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${isRider ? '#ddd6fe' : isAdmin ? '#fecaca' : isStaff ? '#bfdbfe' : '#bbf7d0'}`
          }}>
            {isRider ? <Truck size={28} /> : isAdmin ? <Shield size={28} /> : isStaff ? <Monitor size={28} /> : <UserCheck size={28} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${
                isAdmin ? 'badge-red' :
                isStaff ? 'badge-blue' :
                isRider ? 'badge-purple' : 'badge-green'
              }`} style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                {isRider ? 'IN-HOUSE DELIVERY DRIVER' :
                 isAdmin ? 'SYSTEM ADMINISTRATOR' :
                 isStaff ? 'STAFF CASHIER' : 'CUSTOMER MEMBER'}
              </span>
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#166534',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                {isRider ? 'ON DUTY' : 'VERIFIED ACCOUNT'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '2px 0 4px', fontWeight: 900 }}>
              {currentUser.name}
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              Username: <strong style={{ color: '#0f172a' }}>@{currentUser.username}</strong>
              {isCustomer && currentUser.memberId ? (
                <> • Club ID: <strong style={{ color: '#2563eb' }}>{currentUser.memberId}</strong></>
              ) : (
                <> • Employee ID: <strong style={{ color: '#0f172a' }}>{currentUser.id}</strong></>
              )}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => syncWithSupabase()}
            className="btn"
            style={{ fontSize: '0.82rem', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            title="Refresh profile and records from cloud database"
          >
            <RefreshCw size={14} />
            <span>Sync Cloud</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Main Grid: Left Column (Role Identity Badge) + Right Column (Forms) */}
      {/* ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 390px) 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* ======================================================== */}
        {/* Left Column: Role-Specific ID Cards & Operational Stats */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* A. CUSTOMER ONLY: DIGITAL VIP MEMBERSHIP CARD */}
          {isCustomer && (
            <div style={{
              background: 'linear-gradient(135deg, #091326 0%, #172554 50%, #1e3a8a 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="/boss-rap-logo.png"
                    alt="Boss Rap"
                    style={{
                      height: '32px',
                      filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.4)) brightness(1.2)'
                    }}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.04em', display: 'block' }}>
                      BOSS RAP MOTOR SHOP
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#93c5fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Rider Club Official Member
                    </span>
                  </div>
                </div>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  border: `1px solid ${tier.color}`,
                  color: tier.color,
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.05em'
                }}>
                  {tier.name}
                </span>
              </div>

              {/* Microchip & QR Icon Visual */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '38px',
                  height: '28px',
                  borderRadius: '5px',
                  background: 'linear-gradient(135deg, #fef08a 0%, #ca8a04 100%)',
                  border: '1px solid #facc15',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '4px',
                    border: '1px dashed rgba(0,0,0,0.3)',
                    borderRadius: '3px'
                  }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.72rem' }}>
                  <QrCode size={18} color="#38bdf8" />
                  <span>POS Scan Ready</span>
                </div>
              </div>

              {/* Member ID in Monospace */}
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  CLUB MEMBERSHIP ID
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  color: '#ffffff'
                }}>
                  {currentUser.memberId || 'N/A'}
                </span>
              </div>

              {/* Card Holder Name & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                    CARD HOLDER
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                    {currentUser.name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                    MEMBER SINCE
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93c5fd' }}>
                    {memberRecord?.joinDate || 'Sep 2026'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* B. RIDER ONLY: OFFICIAL DELIVERY DRIVER BADGE */}
          {isRider && (
            <div style={{
              background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #6d28d9 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: '0 12px 28px -6px rgba(109, 40, 217, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="/boss-rap-logo.png"
                    alt="Boss Rap"
                    style={{ height: '34px', filter: 'brightness(1.2)' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.04em', display: 'block' }}>
                      BOSS RAP LOGISTICS
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#e9d5ff', textTransform: 'uppercase', fontWeight: 700 }}>
                      Official In-House Delivery Rider
                    </span>
                  </div>
                </div>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid #c084fc',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  ON DUTY 🛵
                </span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.65rem', color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  RIDER DRIVER ID
                </span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#ffffff'
                }}>
                  {currentUser.id}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', color: '#d8b4fe', textTransform: 'uppercase', display: 'block' }}>
                    DRIVER NAME
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                    {currentUser.name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.62rem', color: '#d8b4fe', textTransform: 'uppercase', display: 'block' }}>
                    ASSIGNED HUB
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f5f3ff' }}>
                    Baliuag, Bulacan
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
                <Link to="/rider/deliveries" style={{ textDecoration: 'none' }}>
                  <button className="btn" style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    color: '#6d28d9',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    padding: '10px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <Truck size={16} />
                    <span>Open Live Delivery Feed →</span>
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* C. ADMIN ONLY: SYSTEM ADMINISTRATOR CREDENTIAL CARD */}
          {isAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: '0 12px 28px -6px rgba(185, 28, 28, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/boss-rap-logo.png" alt="Boss Rap" style={{ height: '34px', filter: 'brightness(1.2)' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.04em', display: 'block' }}>
                      BOSS RAP ENTERPRISE
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#fecaca', textTransform: 'uppercase', fontWeight: 700 }}>
                      System Administration
                    </span>
                  </div>
                </div>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid #f87171',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  ROOT ACCESS
                </span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.65rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  ADMINISTRATOR ID
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '0.12em', color: '#ffffff' }}>
                  {currentUser.id}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', color: '#fca5a5', textTransform: 'uppercase', display: 'block' }}>
                    ADMINISTRATOR
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                    {currentUser.name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.62rem', color: '#fca5a5', textTransform: 'uppercase', display: 'block' }}>
                    SECURITY CLEARANCE
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fee2e2' }}>
                    Level 1 - Full Control
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* D. STAFF CASHIER ONLY: POS STATION BADGE */}
          {isStaff && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: '0 12px 28px -6px rgba(37, 99, 235, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/boss-rap-logo.png" alt="Boss Rap" style={{ height: '34px', filter: 'brightness(1.2)' }} />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.04em', display: 'block' }}>
                      BOSS RAP POINT OF SALE
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#bfdbfe', textTransform: 'uppercase', fontWeight: 700 }}>
                      Official Cashier Station
                    </span>
                  </div>
                </div>
                <span style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid #60a5fa',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  CASHIER
                </span>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.65rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  STAFF EMPLOYEE ID
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '0.12em', color: '#ffffff' }}>
                  {currentUser.id}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', color: '#93c5fd', textTransform: 'uppercase', display: 'block' }}>
                    CASHIER
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                    {currentUser.name}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.62rem', color: '#93c5fd', textTransform: 'uppercase', display: 'block' }}>
                    COUNTER
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dbeafe' }}>
                    Terminal 01 (Baliuag)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER ONLY: LOYALTY POINTS WALLET */}
          {isCustomer && (
            <div className="card" style={{ padding: '20px', borderLeft: `5px solid ${tier.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  LOYALTY REWARD WALLET
                </span>
                <Sparkles size={18} color={tier.color} />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0 10px' }}>
                <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#0f172a', fontWeight: 900 }}>
                  {points}
                </h2>
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>POINTS</span>
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0'
                }}>
                  = ₱{discountPesoValue.toLocaleString()} Discount
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>
                Current Tier: <strong style={{ color: tier.color }}>{tier.name}</strong> • {tier.perks}
              </p>

              {/* Tier Progress bar */}
              <div style={{ width: '100%', height: '7px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ width: `${Math.min(100, tier.progress)}%`, height: '100%', backgroundColor: tier.color, borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                <span>Earn 1 pt per ₱{pointsSettings.currencyPerPoint} spent</span>
                {tier.next ? <span>{tier.next - points} pts to next tier</span> : <span>MAX TIER REACHED 👑</span>}
              </div>
            </div>
          )}

          {/* RIDER ONLY: DELIVERY PERFORMANCE STATS */}
          {isRider && (
            <div className="card" style={{ padding: '20px', borderLeft: '5px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase' }}>
                  DISPATCH & DELIVERY STATS
                </span>
                <Truck size={18} color="#7c3aed" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                  <span style={{ fontSize: '0.68rem', color: '#6d28d9', fontWeight: 700, display: 'block' }}>DELIVERED</span>
                  <strong style={{ fontSize: '1.4rem', color: '#5b21b6' }}>{completedDeliveries}</strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Completed Parcels</span>
                </div>

                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.68rem', color: '#1d4ed8', fontWeight: 700, display: 'block' }}>IN TRANSIT</span>
                  <strong style={{ fontSize: '1.4rem', color: '#1e40af' }}>{outForDeliveries}</strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>Out on Road</span>
                </div>
              </div>

              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.76rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Pending Preparation:</span>
                <strong style={{ color: '#0f172a' }}>{pendingDeliveries} Orders</strong>
              </div>
            </div>
          )}

          {/* ADMIN ONLY: SYSTEM METRIC OVERVIEW */}
          {isAdmin && (
            <div className="card" style={{ padding: '20px', borderLeft: '5px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                  STORE CONTROL OVERVIEW
                </span>
                <Shield size={18} color="#dc2626" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total User Accounts:</span>
                  <strong style={{ color: '#0f172a' }}>{users.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Catalog Products:</span>
                  <strong style={{ color: '#0f172a' }}>{products.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Transactions:</span>
                  <strong style={{ color: '#16a34a' }}>{sales.length}</strong>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER ONLY: QUICK ORDER STATS */}
          {isCustomer && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800, margin: '0 0 14px' }}>
                My Shopping Activity
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Total Orders Placed:</span>
                  <strong style={{ color: '#0f172a' }}>{customerOrders.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Total Lifetime Spend:</span>
                  <strong style={{ color: '#16a34a' }}>₱{totalSpent.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Active Deliveries:</span>
                  <strong style={{ color: '#2563eb' }}>
                    {customerOrders.filter(o => o.orderStatus !== 'COMPLETED').length}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* Right Column: Editable Profile & Security Settings */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* PROFILE & CONTACT DETAILS FORM */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} color="#2563eb" />
                <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                  {isRider ? 'Driver Profile & Contact' : isCustomer ? 'Personal & Delivery Information' : 'Staff Profile Details'}
                </h2>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {isRider ? 'Used for in-house delivery dispatch' : isCustomer ? 'Synced with online ordering & deliveries' : 'Official employee records'}
              </span>
            </div>

            {profileSuccess && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={16} color="#166534" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} color="#b91c1c" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="profile-name">Full Registered Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="profile-username">Username (Account Sign In)</label>
                  <input
                    id="profile-username"
                    type="text"
                    value={currentUser.username}
                    disabled
                    style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Usernames are fixed for account security</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isCustomer ? '1fr 1.2fr' : '1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="profile-contact">Contact Phone Number</label>
                  <input
                    id="profile-contact"
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder="e.g. 09171234567"
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {isRider ? 'Used for delivery driver communication' : isCustomer ? 'Used by rider for delivery arrival notification' : 'Staff contact number'}
                  </span>
                </div>

                {isCustomer && (
                  <div>
                    <label htmlFor="profile-memberid">Club Member Number</label>
                    <input
                      id="profile-memberid"
                      type="text"
                      value={currentUser.memberId || 'N/A'}
                      disabled
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', fontWeight: 700 }}
                    />
                  </div>
                )}
              </div>

              {/* Address field for delivery */}
              <div>
                <label htmlFor="profile-address">
                  {isRider ? 'Home / Base Address' : isCustomer ? 'Default Shipping / Delivery Address' : 'Address'}
                </label>
                <textarea
                  id="profile-address"
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter house no., street, barangay, city, landmark"
                  style={{ width: '100%', resize: 'vertical' }}
                />
                {isCustomer && (
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Auto-fills in your shopping cart when ordering online</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
                >
                  <Save size={15} />
                  <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ACCOUNT SECURITY & CHANGE PASSWORD */}
          <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="#2563eb" />
                <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                  Account Security & Password
                </h2>
              </div>
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
                <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
              </button>
            </div>

            {passwordSuccess && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#166534',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <CheckCircle2 size={16} color="#166534" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={16} color="#b91c1c" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Re-type new password"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Protect your account with a secure password.
                </span>
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
                >
                  <Lock size={15} />
                  <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* CUSTOMER ONLY: RECENT ORDERS TABLE */}
          {isCustomer && customerOrders.length > 0 && (
            <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardList size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '1.05rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                    Recent Orders & Official Receipts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                >
                  View All Orders →
                </button>
              </div>

              <div className="table-container" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>ORDER ID</th>
                      <th>DATE</th>
                      <th>TOTAL</th>
                      <th>FULFILLMENT</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.slice(0, 4).map(sale => (
                      <tr key={sale.id}>
                        <td style={{ fontWeight: 800, color: '#2563eb' }}>{sale.id}</td>
                        <td style={{ fontSize: '0.75rem' }}>{new Date(sale.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 800 }}>₱{sale.total.toLocaleString()}</td>
                        <td>
                          <span className="badge" style={{ fontSize: '0.68rem' }}>
                            {sale.fulfillmentType}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${sale.orderStatus === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.68rem' }}>
                            {sale.orderStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(sale)}
                            className="btn"
                            style={{ fontSize: '0.7rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Printer size={12} />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Official Receipt Modal (Customer) */}
      {/* ======================================================== */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>OFFICIAL SALES RECEIPT</h3>
              <button type="button" onClick={() => setActiveReceipt(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{
              fontFamily: 'monospace',
              backgroundColor: '#fff',
              padding: '16px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#000'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #94a3b8', paddingBottom: '10px', marginBottom: '10px' }}>
                <strong style={{ fontSize: '1.05rem', display: 'block' }}>BOSS RAP MOTOR SHOP</strong>
                <span>Baliuag, Bulacan • Contact: 0912 345 6789</span><br />
                <span>VAT Reg TIN: 000-123-456-000</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>RECEIPT #:</span>
                <strong>{activeReceipt.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>DATE:</span>
                <span>{new Date(activeReceipt.date).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>CUSTOMER:</span>
                <span>{currentUser.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>PAYMENT METHOD:</span>
                <strong>{activeReceipt.paymentMethod}</strong>
              </div>

              <div style={{ borderTop: '1px dashed #94a3b8', borderBottom: '1px dashed #94a3b8', padding: '8px 0', margin: '8px 0' }}>
                {activeReceipt.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{it.quantity}x {it.name}</span>
                    <span>₱{(it.price * it.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>SUBTOTAL:</span>
                <span>₱{activeReceipt.subtotal.toLocaleString()}</span>
              </div>
              {activeReceipt.discountApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
                  <span>DISCOUNT:</span>
                  <span>-₱{activeReceipt.discountApplied.toLocaleString()}</span>
                </div>
              )}
              {activeReceipt.deliveryFee && activeReceipt.deliveryFee > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#2563eb' }}>
                  <span>DELIVERY FEE:</span>
                  <span>+₱{activeReceipt.deliveryFee.toLocaleString()}</span>
                </div>
              ) : null}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '6px', marginTop: '6px' }}>
                <span>TOTAL:</span>
                <span>₱{activeReceipt.total.toLocaleString()}</span>
              </div>

              {activeReceipt.paymentRef && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#2563eb' }}>
                  Payment Ref: <strong>{activeReceipt.paymentRef}</strong>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.72rem', color: '#64748b' }}>
                Thank you for tuning with Boss Rap Motor Shop!<br />
                Ride safe, idol! 🏁
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button type="button" onClick={() => window.print()} className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                <Printer size={15} />
                <span>Print Copy</span>
              </button>
              <button type="button" onClick={() => setActiveReceipt(null)} className="btn" style={{ flex: 1, padding: '10px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
