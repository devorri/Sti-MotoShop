import React from 'react';

export const About: React.FC = () => {
  return (
    <div style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: '900', letterSpacing: '2px', lineHeight: 1 }}>BOSS RAP MOTOR SHOP</h1>
        <p style={{ fontSize: '1rem', letterSpacing: '4px', opacity: 0.6, marginTop: '15px' }}>SINCE 2008 • PREMIUM MOTORCYCLE SPARE PARTS & SERVICES</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginBottom: '80px', alignItems: 'center' }} className="about-grid">
        <div style={{ borderRight: '2px solid #000', paddingRight: '40px' }} className="about-col-left">
          <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>OUR STORY</h2>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.8', marginBottom: '20px' }}>
            BOSS RAP MOTOR SHOP WAS FOUNDED WITH A SIMPLE VISION: TO PROVIDE RIDERS WITH RELIABLE, HIGH-QUALITY MOTORCYCLE SPARE PARTS AND HONEST, PROFESSIONAL REPAIR SERVICES. WHAT STARTED AS A LOCAL ONE-BAY REPAIR GARAGE HAS GROWN INTO A CENTRALIZED HUB FOR MOTORCYCLE ENTHUSIASTS AND REGULAR COMMUTERS ALIKE.
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.8' }}>
            OVER THE LAST 15 YEARS, WE HAVE SECURED TRUSTED PARTNERSHIPS WITH MAJOR GLOBAL MOTORCYCLE BRAND DISTRIBUTORS, ALLOWING US TO OFFER OUTSTANDING PRODUCTS RANGING FROM DAILY COMMUTER SPARES TO SPORT TUNING KITS.
          </p>
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>OUR MISSION</h2>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.8', marginBottom: '30px' }}>
            TO EMPOWER EVERY RIDER BY DELIVERING TOP-GRADE COMPONENTS AND UNCOMPROMISING MAINTENANCE SERVICE. WE AIM TO SAFEGUARD YOUR JOURNEYS, MINIMIZE DOWNTIME, AND OPTIMIZE VEHICLE PERFORMANCE AT HONEST, AFFORDABLE RATES.
          </p>
          <div className="card" style={{ backgroundColor: '#f9f9f9' }}>
            <h4 style={{ fontSize: '0.8rem', marginBottom: '10px' }}>WHY CUSTOMERS CHOOSE US:</h4>
            <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>100% GENUINE OEM SPARE PARTS</li>
              <li>CERTIFIED AND CUSTOM-BUILT UPGRADE MECHANICS</li>
              <li>MEMBERSHIP BENEFITS AND EARNED LOYALTY POINTS</li>
              <li>FAST & DIRECT WALK-IN SERVICE & CONVENIENT FB ORDER PICKUP</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', paddingTop: '60px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '40px' }}>OUR CORE VALUES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>TRANSPARENCY</h3>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.6', opacity: 0.8 }}>No hidden fees, no markup parts, and full repair explanation before we begin work on your motorcycle.</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>INTEGRITY</h3>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.6', opacity: 0.8 }}>We only install what is needed, and we stand firmly behind the quality of every repair we sign off.</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>EFFICIENCY</h3>
            <p style={{ fontSize: '0.75rem', lineHeight: '1.6', opacity: 0.8 }}>Using digital tracking tools and modern inventory practices to reduce transaction time and errors.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
          .about-col-left { border-right: none !important; padding-right: 0 !important; border-bottom: 2px solid #000; padding-bottom: 30px; }
        }
      `}</style>
    </div>
  );
};
