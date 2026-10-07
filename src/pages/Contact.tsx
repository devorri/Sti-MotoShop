import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export const Contact: React.FC = () => {
  const { saveInquiry } = useAppContext();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setSending(true);
    const ok = await saveInquiry({
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim()
    });
    setSending(false);

    if (ok) {
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <section style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="badge badge-blue" style={{ marginBottom: '10px' }}>CUSTOMER SUPPORT</span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '6px 0' }}>
          Get in Touch With Boss Rap
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Have questions about specific motorcycle spare parts, custom racing tunes, or order tracking? Drop us a line.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '24px' }}>
        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '20px', fontSize: '1.1rem', fontWeight: 800 }}>
              Shop Channels & Hours
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '6px', color: '#2563eb' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <label style={{ margin: 0, color: '#64748b' }}>Store Address</label>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', margin: '2px 0 0' }}>
                    JP Rizal St., Baliuag, Bulacan, Philippines
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '6px', color: '#2563eb' }}>
                  <Phone size={18} />
                </div>
                <div>
                  <label style={{ margin: 0, color: '#64748b' }}>Contact Hotline</label>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', margin: '2px 0 0' }}>
                    +63 912 345 6789 / (044) 766 1234
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '6px', color: '#2563eb' }}>
                  <Mail size={18} />
                </div>
                <div>
                  <label style={{ margin: 0, color: '#64748b' }}>Email Inquiry</label>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', margin: '2px 0 0' }}>
                    inquiries@bossrapmotoshop.com
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '6px', color: '#2563eb' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <label style={{ margin: 0, color: '#64748b' }}>Operating Hours</label>
                  <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a', margin: '2px 0 0' }}>
                    Monday - Saturday: 8:00 AM - 6:00 PM (Closed Sundays)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="card" style={{ padding: '28px', backgroundColor: '#ffffff' }}>
          <h3 style={{ color: '#0f172a', marginBottom: '6px', fontSize: '1.15rem', fontWeight: 800 }}>
            Send Us an Inquiry
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 20px' }}>
            Looking for a specific motor part or service quote? Send your request directly to our staff.
          </p>

          {submitted ? (
            <div style={{ 
              padding: '24px', 
              textAlign: 'center', 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              gap: '10px' 
            }}>
              <CheckCircle2 size={36} color="#16a34a" />
              <h4 style={{ margin: 0, color: '#166534', fontWeight: 800 }}>Inquiry Sent Successfully!</h4>
              <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
                Your message has been saved to the store management system. A staff associate will contact you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="contact-name">Your Full Name *</label>
                <input 
                  id="contact-name"
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Juan Dela Cruz" 
                />
              </div>
              
              <div>
                <label htmlFor="contact-email">Email Address *</label>
                <input 
                  id="contact-email"
                  type="email" 
                  required 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="juan@gmail.com" 
                />
              </div>

              <div>
                <label htmlFor="contact-message">Message Details *</label>
                <textarea 
                  id="contact-message"
                  required 
                  rows={5}
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                  placeholder="Specify part brand, motorcycle model (e.g. Yamaha Aerox 155, Honda Click), or repair inquiries..." 
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={sending}
                className="btn-primary" 
                style={{ padding: '12px', fontSize: '0.9rem' }}
              >
                <Send size={15} />
                <span>{sending ? 'Sending to Supabase...' : 'Submit Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
