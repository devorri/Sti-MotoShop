import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Contact: React.FC = () => {
  const { inquiries, setInquiries } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

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
    <div style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '2px' }}>GET IN TOUCH</h1>
        <p style={{ fontSize: '1rem', letterSpacing: '1px', opacity: 0.7, marginTop: '10px' }}>
          HAVE AN INQUIRY OR WANT TO ORDER ONLINE? SEND US A MESSAGE AND WE WILL REPLY ASAP.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' }} className="contact-grid">
        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="card">
            <h3>CONTACT CHANNELS</h3>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h5 style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>LOCATION</h5>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>BOSS RAP MOTOR SHOP, BRGY. SULIVAN, BALIUAG, BULACAN</p>
              </div>
              <div>
                <h5 style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>PHONE</h5>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>+63 912 345 6789 / (044) 766 1234</p>
              </div>
              <div>
                <h5 style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>EMAIL</h5>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>inquiries@bossrapmotoshop.com</p>
              </div>
              <div>
                <h5 style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>BUSINESS HOURS</h5>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>MONDAY - SATURDAY: 8:00 AM - 6:00 PM</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>CLOSED ON SUNDAYS</p>
              </div>
            </div>
          </div>

          {/* Interactive Simulated Map */}
          <div className="card" style={{ flex: 1, minHeight: '250px', background: '#e0e0e0', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px solid #000' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15, background: 'radial-gradient(circle, #000 10%, transparent 11%)', backgroundSize: '20px 20px' }}></div>
            <div style={{ zIndex: 2, textAlign: 'center', padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontWeight: 'bold', fontSize: '1.2rem' }}>📍</div>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>BOSS RAP MOTOR SHOP MAP</h4>
              <p style={{ fontSize: '0.7rem', opacity: 0.8, maxWidth: '300px', margin: '0 auto' }}>Baliuag-Bustos Rd, Baliuag, Bulacan. Near STI College Baliuag.</p>
              <a href="https://maps.google.com" target="_blank" rel="noreferrer">
                <button className="primary" style={{ marginTop: '15px', fontSize: '0.65rem' }}>OPEN IN GOOGLE MAPS</button>
              </a>
            </div>
          </div>
        </div>

        {/* Message Column */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3>SEND AN INQUIRY</h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '10px 0 30px' }}>
              Looking for a specific motor part or accessory? Tell us what you need and our sales staff will verify availability.
            </p>

            {submitted ? (
              <div style={{ border: '2px solid #000', padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <span style={{ fontSize: '2rem' }}>✉️</span>
                <h4 style={{ margin: 0 }}>INQUIRY SENT SUCCESSFULLY!</h4>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Thank you for reaching out. A sales associate will review your message and contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>YOUR NAME</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="E.G. JUAN DELA CRUZ" 
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="EMAIL@DOMAIN.COM" 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>MESSAGE / INQUIRY DETAILS</label>
                  <textarea 
                    required 
                    rows={6}
                    value={formData.message} 
                    onChange={e => setFormData({...formData, message: e.target.value})} 
                    placeholder="SPECIFY PART NAME, BRAND, OR REPAIR SERVICE REQUIRED..." 
                    style={{ width: '100%', padding: '8px', border: '2px solid #000', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <button type="submit" className="primary" style={{ marginTop: '10px', width: '100%' }}>SUBMIT MESSAGE</button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
        }
      `}</style>
    </div>
  );
};
