import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Contact: React.FC = () => {
  const { inquiries, setInquiries } = useAppContext();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const msg = params.get('message');
    if (msg) {
      setFormData(prev => ({
        ...prev,
        message: msg
      }));
    }
  }, [location.search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      const newInquiry = {
        id: `I${Date.now()}`,
        name: formData.name,
        email: formData.email,
        message: formData.message,
        date: new Date().toISOString()
      };
      setInquiries([...inquiries, newInquiry]);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div style={{ padding: '70px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '12px' }}>REACH OUT</span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#ffffff' }}>
          GET IN TOUCH
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '10px', maxWidth: '600px', margin: '10px auto 0' }}>
          HAVE AN INQUIRY OR WANT TO ORDER ONLINE? SEND US A MESSAGE AND WE WILL REPLY ASAP.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="contact-grid">
        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>
              <span style={{ marginRight: '8px' }}>📡</span>CONTACT CHANNELS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h5 style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-header)', marginBottom: '4px' }}>LOCATION</h5>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>BOSS RAP MOTOR SHOP, BRGY. SULIVAN, BALIUAG, BULACAN</p>
              </div>
              <div>
                <h5 style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-header)', marginBottom: '4px' }}>PHONE</h5>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>+63 912 345 6789 / (044) 766 1234</p>
              </div>
              <div>
                <h5 style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-header)', marginBottom: '4px' }}>EMAIL</h5>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>inquiries@bossrapmotoshop.com</p>
              </div>
              <div>
                <h5 style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-header)', marginBottom: '4px' }}>BUSINESS HOURS</h5>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>MONDAY - SATURDAY: 8:00 AM - 6:00 PM</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>CLOSED ON SUNDAYS</p>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="card" style={{ 
            flex: 1, 
            minHeight: '220px', 
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 210, 255, 0.08) 0%, rgba(7, 9, 14, 0.95) 80%)', 
            position: 'relative', 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            borderColor: 'var(--accent-cyan)'
          }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, 
              opacity: 0.1, 
              backgroundImage: 'radial-gradient(#00d2ff 1px, transparent 1px)', 
              backgroundSize: '20px 20px' 
            }}></div>
            <div style={{ zIndex: 2, textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                width: '50px', height: '50px', borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                margin: '0 auto 16px', fontSize: '1.3rem',
                boxShadow: 'var(--shadow-neon-blue)'
              }}>📍</div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#fff' }}>BOSS RAP MOTOR SHOP</h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '300px', margin: '0 auto' }}>
                Baliuag-Bustos Rd, Baliuag, Bulacan. Near STI College Baliuag.
              </p>
              <a href="https://maps.google.com" target="_blank" rel="noreferrer">
                <button className="primary" style={{ marginTop: '18px', fontSize: '0.7rem' }}>OPEN IN GOOGLE MAPS</button>
              </a>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>✉️</span>SEND AN INQUIRY
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 28px' }}>
              Looking for a specific motor part or accessory? Tell us what you need and our sales staff will verify availability.
            </p>

            {submitted ? (
              <div style={{ 
                border: '1px solid rgba(34, 197, 94, 0.4)', 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: '10px',
                display: 'flex', flexDirection: 'column', gap: '12px' 
              }}>
                <span style={{ fontSize: '2.5rem' }}>✅</span>
                <h4 style={{ margin: 0, color: '#4ade80' }}>INQUIRY SENT SUCCESSFULLY!</h4>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Thank you for reaching out. A sales associate will review your message and contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>YOUR NAME</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Juan Dela Cruz" 
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="email@domain.com" 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>MESSAGE / INQUIRY DETAILS</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                    placeholder="Specify part name, brand, or repair service required..." 
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button type="submit" className="primary" style={{ marginTop: '8px', width: '100%', padding: '14px' }}>
                  🚀 SUBMIT MESSAGE
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
};
