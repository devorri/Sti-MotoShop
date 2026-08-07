import React from 'react';

export const About: React.FC = () => {
  return (
    <div style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      <section style={{ textAlign: 'center', marginBottom: '70px' }}>
        <img 
          src="/boss-rap-logo.png" 
          alt="BOSS RAP MOTOR SHOP" 
          style={{ 
            maxWidth: '280px', 
            width: '70%',
            marginBottom: '20px',
            filter: 'drop-shadow(0 0 20px rgba(0, 210, 255, 0.4))'
          }}
          className="hero-logo-img"
        />
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
          BOSS RAP MOTOR SHOP
        </h1>
        <p style={{ fontSize: '1rem', letterSpacing: '0.2em', color: 'var(--accent-cyan)', marginTop: '12px', fontFamily: 'var(--font-header)' }}>
          SINCE 2008 • PREMIUM MOTORCYCLE PARTS & SERVICES
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '70px', alignItems: 'start' }} className="about-grid">
        <div className="card" style={{ height: '100%' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff' }}>
            <span style={{ color: 'var(--accent-cyan)', marginRight: '10px' }}>⚡</span>OUR STORY
          </h2>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.8', marginBottom: '18px', color: '#cbd5e1' }}>
            BOSS RAP MOTOR SHOP WAS FOUNDED WITH A SIMPLE VISION: TO PROVIDE RIDERS WITH RELIABLE, HIGH-QUALITY MOTORCYCLE SPARE PARTS AND HONEST, PROFESSIONAL REPAIR SERVICES. WHAT STARTED AS A LOCAL ONE-BAY REPAIR GARAGE HAS GROWN INTO A CENTRALIZED HUB FOR MOTORCYCLE ENTHUSIASTS AND REGULAR COMMUTERS ALIKE.
          </p>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#cbd5e1' }}>
            OVER THE LAST 15 YEARS, WE HAVE SECURED TRUSTED PARTNERSHIPS WITH MAJOR GLOBAL MOTORCYCLE BRAND DISTRIBUTORS, ALLOWING US TO OFFER OUTSTANDING PRODUCTS RANGING FROM DAILY COMMUTER SPARES TO SPORT TUNING KITS.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#fff' }}>
              <span style={{ color: 'var(--accent-red)', marginRight: '10px' }}>🎯</span>OUR MISSION
            </h2>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#cbd5e1' }}>
              TO EMPOWER EVERY RIDER BY DELIVERING TOP-GRADE COMPONENTS AND UNCOMPROMISING MAINTENANCE SERVICE. WE AIM TO SAFEGUARD YOUR JOURNEYS, MINIMIZE DOWNTIME, AND OPTIMIZE VEHICLE PERFORMANCE AT HONEST, AFFORDABLE RATES.
            </p>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.08) 0%, rgba(0, 82, 255, 0.08) 100%)', borderColor: 'var(--accent-cyan)' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '14px', color: 'var(--accent-cyan)' }}>WHY RIDERS CHOOSE BOSS RAP:</h4>
            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '10px', color: '#cbd5e1' }}>
              <li>100% GENUINE OEM SPARE PARTS FROM TRUSTED DISTRIBUTORS</li>
              <li>CERTIFIED & EXPERIENCED TUNING MECHANICS</li>
              <li>MEMBERSHIP REWARDS WITH LOYALTY POINTS SYSTEM</li>
              <li>FAST WALK-IN SERVICE & CONVENIENT ORDER PICKUP</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0, 210, 255, 0.15)', paddingTop: '60px', textAlign: 'center' }}>
        <span className="badge" style={{ marginBottom: '12px' }}>OUR PRINCIPLES</span>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '40px', color: '#fff' }}>CORE VALUES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🤝</span>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#fff' }}>TRANSPARENCY</h3>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.6', color: '#94a3b8' }}>No hidden fees, no markup parts, and full repair explanation before we begin work on your motorcycle.</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🛡️</span>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#fff' }}>INTEGRITY</h3>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.6', color: '#94a3b8' }}>We only install what is needed, and we stand firmly behind the quality of every repair we sign off.</p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>🚀</span>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#fff' }}>EFFICIENCY</h3>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.6', color: '#94a3b8' }}>Using digital tracking tools and modern inventory practices to reduce transaction time and errors.</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
};
