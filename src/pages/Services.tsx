import React from 'react';
import { Link } from 'react-router-dom';

export const Services: React.FC = () => {
  const serviceList = [
    { title: 'TUNE UP', price: '₱500+', desc: 'Complete engine diagnostics, valve adjustment, air filter cleaning, and timing optimization.', duration: '1-2 Hours' },
    { title: 'CHANGE OIL', price: '₱350+', desc: 'Premium synthetic oil replacement, oil filter check, and chain lubrication.', duration: '30 Mins' },
    { title: 'ENGINE OVERHAUL', price: '₱5,000+', desc: 'Full engine teardown, carbon cleaning, cylinder boring, and replacement of worn internal parts.', duration: '2-3 Days' },
    { title: 'BRAKE SERVICE', price: '₱300+', desc: 'Brake pad/shoe replacement, caliper cleaning, master cylinder check, and fluid bleeding.', duration: '45 Mins' },
    { title: 'VULCANIZING & TIRES', price: '₱150+', desc: 'Tubeless tire patching, tire replacement, wheel alignment, and rim spoke adjustment.', duration: '30 Mins' },
    { title: 'WASH & WAX', price: '₱200+', desc: 'Deep mud washing, degreasing of engine bay, chain wash, and high-gloss protective wax.', duration: '45 Mins' },
    { title: 'WIRING & ELECTRICAL', price: '₱400+', desc: 'Full electrical system diagnostics, wiring harness repair, bulb replacement, and battery health checks.', duration: '1-2 Hours' },
    { title: 'CVT CLEANING', price: '₱350+', desc: 'For automatic scooters: cleaning of pulley, clutch, rollers, belt inspection, and re-greasing.', duration: '1 Hour' },
  ];

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', letterSpacing: '2px' }}>PROFESSIONAL SERVICES</h1>
        <p style={{ fontSize: '1rem', letterSpacing: '1px', opacity: 0.7, marginTop: '10px' }}>
          EXPERT MECHANICS, TRANSPARENT PRICING, AND GUARANTEED QUALITY.
        </p>
      </section>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '30px' 
      }}>
        {serviceList.map((service, index) => (
          <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{service.title}</h3>
                <span className="badge">{service.duration}</span>
              </div>
              <p style={{ fontSize: '0.8rem', lineHeight: '1.6', marginBottom: '20px', opacity: 0.8 }}>{service.desc}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #000', paddingTop: '15px', marginTop: 'auto' }}>
              <div>
                <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 'bold', display: 'block' }}>STARTING PRICE</span>
                <span style={{ fontSize: '1.4rem', fontWeight: '900' }}>{service.price}</span>
              </div>
              <Link to={`/contact?message=Hi Boss Rap! I would like to book a ${service.title} service. Price starts at ${service.price}. Please get back to me to confirm scheduling.`}>
                <button className="primary" style={{ fontSize: '0.7rem' }}>BOOK SERVICE</button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px', backgroundColor: '#000', color: '#fff' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', margin: 0 }}>NEED A CUSTOM MODIFICATION?</h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '5px' }}>TALK TO OUR LEAD MECHANICS FOR FULL CUSTOM BUILDS AND SCOOTER RACING UPGRADES.</p>
        </div>
        <Link to="/contact?message=Hi Boss Rap! I would like to request a free quote for a custom motorcycle/scooter modification or upgrade. Please get back to me.">
          <button style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '12px 24px' }}>GET A FREE QUOTE</button>
        </Link>
      </div>
    </div>
  );
};
