import React from 'react';
import { Link } from 'react-router-dom';

export const Services: React.FC = () => {
  const serviceList = [
    { title: 'TUNE UP', price: '₱500+', desc: 'Complete engine diagnostics, valve adjustment, air filter cleaning, and timing optimization.', duration: '1-2 Hours', icon: '🔧' },
    { title: 'CHANGE OIL', price: '₱350+', desc: 'Premium synthetic oil replacement, oil filter check, and chain lubrication.', duration: '30 Mins', icon: '🛢️' },
    { title: 'ENGINE OVERHAUL', price: '₱5,000+', desc: 'Full engine teardown, carbon cleaning, cylinder boring, and replacement of worn internal parts.', duration: '2-3 Days', icon: '⚙️' },
    { title: 'BRAKE SERVICE', price: '₱300+', desc: 'Brake pad/shoe replacement, caliper cleaning, master cylinder check, and fluid bleeding.', duration: '45 Mins', icon: '🛑' },
    { title: 'VULCANIZING & TIRES', price: '₱150+', desc: 'Tubeless tire patching, tire replacement, wheel alignment, and rim spoke adjustment.', duration: '30 Mins', icon: '🏍️' },
    { title: 'WASH & WAX', price: '₱200+', desc: 'Deep mud washing, degreasing of engine bay, chain wash, and high-gloss protective wax.', duration: '45 Mins', icon: '✨' },
    { title: 'WIRING & ELECTRICAL', price: '₱400+', desc: 'Full electrical system diagnostics, wiring harness repair, bulb replacement, and battery health checks.', duration: '1-2 Hours', icon: '⚡' },
    { title: 'CVT CLEANING', price: '₱350+', desc: 'For automatic scooters: cleaning of pulley, clutch, rollers, belt inspection, and re-greasing.', duration: '1 Hour', icon: '🔩' },
  ];

  return (
    <div style={{ padding: '70px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <span className="badge" style={{ marginBottom: '12px' }}>PROFESSIONAL CARE</span>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#ffffff' }}>
          TUNING & REPAIR SERVICES
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '10px', maxWidth: '600px', margin: '10px auto 0' }}>
          EXPERT MECHANICS, TRANSPARENT PRICING, AND GUARANTEED QUALITY WORKMANSHIP.
        </p>
      </section>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {serviceList.map((service, index) => (
          <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{service.icon}</span>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>{service.title}</h3>
                </div>
                <span className="badge">{service.duration}</span>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.7', color: '#94a3b8' }}>{service.desc}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '20px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, display: 'block', fontFamily: 'var(--font-header)' }}>STARTING AT</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>{service.price}</span>
              </div>
              <Link to={`/contact?message=Hi Boss Rap! I would like to book a ${service.title} service. Price starts at ${service.price}. Please get back to me to confirm scheduling.`}>
                <button className="primary" style={{ fontSize: '0.7rem', padding: '10px 18px' }}>BOOK NOW</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ 
        marginTop: '70px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '30px', 
        background: 'linear-gradient(135deg, rgba(0, 82, 255, 0.2) 0%, rgba(255, 30, 39, 0.2) 100%)',
        borderColor: 'var(--accent-cyan)'
      }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.6rem', margin: 0 }}>NEED A CUSTOM MODIFICATION?</h2>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '6px' }}>TALK TO OUR LEAD MECHANICS FOR FULL CUSTOM BUILDS AND SCOOTER RACING UPGRADES.</p>
        </div>
        <Link to="/contact?message=Hi Boss Rap! I would like to request a free quote for a custom motorcycle/scooter modification or upgrade. Please get back to me.">
          <button className="primary" style={{ padding: '14px 28px', fontSize: '0.8rem' }}>🏁 GET A FREE QUOTE</button>
        </Link>
      </div>
    </div>
  );
};
