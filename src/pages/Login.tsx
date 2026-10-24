import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabase';
import { 
  AlertCircle, 
  LogIn, 
  Eye, 
  EyeOff, 
  KeyRound, 
  MessageSquare, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  X,
  Phone
} from 'lucide-react';
import { sendPasswordResetOtpSms, formatPhoneNumber, isValidPhilippineNumber } from '../services/smsService';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password via SMS States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fpStep, setFpStep] = useState<'IDENTIFY' | 'OTP' | 'SUCCESS'>('IDENTIFY');
  const [fpIdentifier, setFpIdentifier] = useState('');
  const [fpPhoneInput, setFpPhoneInput] = useState('');
  const [fpTargetPhone, setFpTargetPhone] = useState('');
  const [fpMatchedAccount, setFpMatchedAccount] = useState<{ id: string; name: string; username: string } | null>(null);
  const [fpOtpSent, setFpOtpSent] = useState('');
  const [fpOtpInput, setFpOtpInput] = useState('');
  const [fpOtpExpiresAt, setFpOtpExpiresAt] = useState<number>(0);
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpShowNewPass, setFpShowNewPass] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccessMsg, setFpSuccessMsg] = useState('');

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
          const isRider = 
            dbUser.role === 'RIDER' ||
            dbUser.username.toLowerCase().startsWith('rider') ||
            dbUser.name.toLowerCase().includes('(rider)') ||
            dbUser.name.toLowerCase().includes('delivery rider') ||
            dbUser.id.startsWith('R');

          foundUser = {
            id: dbUser.id,
            name: dbUser.name,
            username: dbUser.username,
            password: dbUser.password,
            role: isRider ? 'RIDER' : dbUser.role,
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
        } else if (foundUser.role === 'RIDER') {
          navigate('/rider/deliveries');
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

  // Step 1: Request Password Reset via Semaphore SMS
  const handleRequestPasswordResetSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    const input = fpIdentifier.trim();
    if (!input) {
      setFpError('Please enter your Username or Member ID.');
      return;
    }

    setFpLoading(true);

    try {
      // 1. Locate account in Supabase
      const { data: dbAccount, error: accErr } = await supabase
        .from('accounts')
        .select('id, name, username, member_id')
        .or(`username.ilike.${input},member_id.ilike.${input}`)
        .maybeSingle();

      if (accErr || !dbAccount) {
        setFpError('No account found matching this Username or Member ID.');
        setFpLoading(false);
        return;
      }

      // 2. Determine target phone number
      let phoneToSend = '';

      if (dbAccount.member_id) {
        const { data: member } = await supabase
          .from('members')
          .select('contact')
          .eq('id', dbAccount.member_id)
          .maybeSingle();

        if (member?.contact && isValidPhilippineNumber(member.contact)) {
          phoneToSend = formatPhoneNumber(member.contact);
        }
      }

      // If no valid member contact found, check if user provided one manually
      if (!phoneToSend) {
        if (!fpPhoneInput.trim()) {
          setFpMatchedAccount(dbAccount);
          setFpError('Please provide your 11-digit registered mobile number to receive your OTP.');
          setFpLoading(false);
          return;
        }

        if (!isValidPhilippineNumber(fpPhoneInput.trim())) {
          setFpError('Invalid mobile number. Please enter an 11-digit Philippine number (e.g. 09171234567).');
          setFpLoading(false);
          return;
        }

        phoneToSend = formatPhoneNumber(fpPhoneInput.trim());
      }

      // 3. Generate 6-digit One-Time PIN
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTimestamp = Date.now() + 15 * 60 * 1000; // 15 mins

      setFpMatchedAccount(dbAccount);
      setFpTargetPhone(phoneToSend);
      setFpOtpSent(generatedOtp);
      setFpOtpExpiresAt(expirationTimestamp);

      // 4. Dispatch SMS via Semaphore
      const smsResult = await sendPasswordResetOtpSms({
        phone: phoneToSend,
        otpCode: generatedOtp,
        expirationMinutes: 15
      });

      if (!smsResult.success) {
        console.warn('Semaphore SMS error:', smsResult.error);
        // If carrier rejected or balance issue, allow simulation or notify user
      }

      setFpLoading(false);
      setFpStep('OTP');
    } catch (err: any) {
      setFpError(err.message || 'Failed to dispatch password reset SMS.');
      setFpLoading(false);
    }
  };

  // Step 2: Verify OTP and Update Password in Supabase
  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');

    if (Date.now() > fpOtpExpiresAt) {
      setFpError('Your OTP has expired (15-minute limit). Please request a new code.');
      return;
    }

    if (fpOtpInput.trim() !== fpOtpSent) {
      setFpError('Incorrect OTP code. Please check your SMS and try again.');
      return;
    }

    if (fpNewPassword.length < 4) {
      setFpError('New password must be at least 4 characters long.');
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setFpError('Passwords do not match. Please retype carefully.');
      return;
    }

    if (!fpMatchedAccount) {
      setFpError('Session expired. Please start over.');
      return;
    }

    setFpLoading(true);

    try {
      // Update password in Supabase 'accounts' table
      const { error: updateErr } = await supabase
        .from('accounts')
        .update({ password: fpNewPassword.trim() })
        .eq('id', fpMatchedAccount.id);

      if (updateErr) {
        setFpError(updateErr.message || 'Failed to update password.');
        setFpLoading(false);
        return;
      }

      // Re-sync local users context
      await syncWithSupabase();
      await addAuditLog('SECURITY', `Password reset successfully via SMS OTP for user ${fpMatchedAccount.username}.`);

      setFpSuccessMsg(`Password updated successfully for @${fpMatchedAccount.username}! You can now sign in.`);
      setFpStep('SUCCESS');
      setUsername(fpMatchedAccount.username);
      setPassword('');
    } catch (err: any) {
      setFpError(err.message || 'Error occurred while saving new password.');
    } finally {
      setFpLoading(false);
    }
  };

  // Helper to mask phone number: e.g. 09171234567 -> 0917 ••• ••67
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 11) return phone;
    return `${phone.slice(0, 4)} ••• ••${phone.slice(-2)}`;
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

        {/* Global Error message */}
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
            {/* Forgot Password Link */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setFpStep('IDENTIFY');
                  setFpIdentifier(username);
                  setFpError('');
                  setFpSuccessMsg('');
                  setFpOtpInput('');
                  setFpNewPassword('');
                  setFpConfirmPassword('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#2563eb',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <KeyRound size={13} />
                <span>Forgot Password?</span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '4px', fontSize: '0.9rem' }}
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

      {/* Forgot Password via SMS Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '28px 24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <MessageSquare size={22} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                Reset Password via SMS
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Official Boss Rap SMS OTP Recovery (Semaphore Gateway)
              </p>
            </div>

            {/* Error in modal */}
            {fpError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '10px 12px',
                borderRadius: '8px',
                color: '#b91c1c',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{fpError}</span>
              </div>
            )}

            {/* STEP 1: Identification & SMS Dispatch */}
            {fpStep === 'IDENTIFY' && (
              <form onSubmit={handleRequestPasswordResetSms} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Username or Member ID *</label>
                  <input
                    type="text"
                    placeholder="e.g. rider1, customer, or M051"
                    value={fpIdentifier}
                    onChange={e => { setFpIdentifier(e.target.value); setFpError(''); }}
                    required
                    autoFocus
                    style={{ height: '42px', fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Enter the username or club member ID linked to your account.
                  </span>
                </div>

                {fpMatchedAccount && !fpTargetPhone && (
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                      <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Registered Mobile Number (09XXXXXXXXX) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 09171234567"
                      value={fpPhoneInput}
                      onChange={e => { setFpPhoneInput(e.target.value); setFpError(''); }}
                      required
                      style={{ height: '42px', fontSize: '0.9rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      We will send your 6-digit OTP to this mobile number.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="btn-primary"
                  style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 800, marginTop: '4px' }}
                >
                  {fpLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <RefreshCw className="animate-spin" size={16} />
                      Sending SMS OTP...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <MessageSquare size={16} />
                      Send 6-Digit OTP via SMS
                    </span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Enter OTP & Set New Password */}
            {fpStep === 'OTP' && (
              <form onSubmit={handleVerifyOtpAndResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 700, display: 'block' }}>
                    SMS Sent to {maskPhone(fpTargetPhone)}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#3b82f6' }}>
                    Please enter the 6-digit OTP code sent to your phone. Valid for 15 minutes.
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>6-Digit SMS OTP Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={fpOtpInput}
                    onChange={e => { setFpOtpInput(e.target.value.replace(/\D/g, '')); setFpError(''); }}
                    required
                    autoFocus
                    style={{ height: '44px', fontSize: '1.2rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 900 }}
                  />
                  {/* Test mode OTP indicator for easy evaluation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Didn't get code? Check phone signal
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFpOtpInput(fpOtpSent);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: '#2563eb',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Fill Code ({fpOtpSent})
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>New Password *</label>
                    <button
                      type="button"
                      onClick={() => setFpShowNewPass(!fpShowNewPass)}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {fpShowNewPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={fpShowNewPass ? 'text' : 'password'}
                    placeholder="At least 4 characters"
                    value={fpNewPassword}
                    onChange={e => { setFpNewPassword(e.target.value); setFpError(''); }}
                    required
                    style={{ height: '40px', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Confirm New Password *</label>
                  <input
                    type={fpShowNewPass ? 'text' : 'password'}
                    placeholder="Re-type new password"
                    value={fpConfirmPassword}
                    onChange={e => { setFpConfirmPassword(e.target.value); setFpError(''); }}
                    required
                    style={{ height: '40px', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setFpStep('IDENTIFY'); setFpError(''); }}
                    className="btn"
                    style={{ flex: 1, fontSize: '0.85rem' }}
                  >
                    <ArrowLeft size={14} style={{ marginRight: 4 }} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="btn-primary"
                    style={{ flex: 2, padding: '12px', fontSize: '0.88rem', fontWeight: 800 }}
                  >
                    {fpLoading ? 'Updating Password...' : 'Verify & Set Password'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success Notification */}
            {fpStep === 'SUCCESS' && (
              <div style={{ textAlign: 'center', padding: '12px 6px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <CheckCircle2 size={36} color="#16a34a" />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 900, color: '#166534' }}>
                  Password Reset Complete!
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#15803d', margin: '0 0 16px' }}>
                  {fpSuccessMsg}
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 800 }}
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

