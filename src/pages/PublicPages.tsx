import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const Home: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#fff', color: '#000' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '120px 20px', 
        textAlign: 'center', 
        borderBottom: '3px solid #000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #1a1a1e 0%, #000000 100%)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Grid Lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div style={{ zIndex: 2, maxWidth: '800px' }}>
          <span className="badge" style={{ borderColor: '#FF6600', color: '#FF6600', marginBottom: '20px', padding: '4px 12px', fontSize: '0.75rem', letterSpacing: '2px' }}>EST. 2008</span>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: '950', letterSpacing: '-1px', margin: '0 0 10px 0', textTransform: 'uppercase', lineHeight: 0.9 }}>BOSS RAP</h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.6rem)', color: '#FF6600', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', margin: '0 0 40px 0' }}>MOTOR SHOP</p>
          <p style={{ fontSize: '0.95rem', opacity: 0.8, lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px', color: '#ccc' }}>
            BULACAN'S PREMIER DESTINATION FOR PROFESSIONAL MOTORCYCLE TUNE-UPS, HIGH-PERFORMANCE UPGRADES, AND GENUINE OEM SPARE PARTS.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop"><button className="primary" style={{ backgroundColor: '#FF6600', borderColor: '#FF6600', color: '#fff', padding: '16px 40px', minWidth: '220px', fontSize: '0.8rem', letterSpacing: '1px' }}>EXPLORE INVENTORY</button></Link>
            <Link to="/services"><button style={{ backgroundColor: 'transparent', borderColor: '#fff', color: '#fff', padding: '16px 40px', minWidth: '220px', fontSize: '0.8rem', letterSpacing: '1px' }}>OUR SERVICES</button></Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        borderBottom: '3px solid #000',
        backgroundColor: '#fff'
      }}>
        <div style={{ padding: '60px 40px', borderRight: '2px solid #000', borderBottom: '2px solid #000', textAlign: 'center' }} className="stat-box">
          <h3 style={{ fontSize: '3rem', fontWeight: '900' }}>500+</h3>
          <p style={{ fontSize: '0.75rem', marginTop: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>GENUINE SPARE PARTS</p>
        </div>
        <div style={{ padding: '60px 40px', borderRight: '2px solid #000', borderBottom: '2px solid #000', textAlign: 'center' }} className="stat-box">
          <h3 style={{ fontSize: '3rem', fontWeight: '900' }}>1,500+</h3>
          <p style={{ fontSize: '0.75rem', marginTop: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>REGISTERED MEMEBERS</p>
        </div>
        <div style={{ padding: '60px 40px', borderBottom: '2px solid #000', textAlign: 'center' }} className="stat-box">
          <h3 style={{ fontSize: '3rem', fontWeight: '900' }}>15+ YEARS</h3>
          <p style={{ fontSize: '0.75rem', marginTop: '10px', fontWeight: 'bold', letterSpacing: '2px' }}>ON-THE-ROAD EXPERTISE</p>
        </div>
      </section>

      {/* Featured Services Preview */}
      <section style={{ padding: '100px 20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900' }}>POPULAR MAINTENANCE SERVICES</h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '8px' }}>RIDE SAFE WITH EXPERT REPAIRS AND GENUINE SPARES</p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px' 
        }}>
          {[
            { name: 'ENGINE TUNE-UP', desc: 'Full throttle body cleaning, valve clearance adjustment, and electronics calibration.', label: '₱500+' },
            { name: 'SYNTHETIC OIL CHANGE', desc: 'Premium 4T engine lubricant drain & replace, filter inspection, and chain lubing.', label: '₱350+' },
            { name: 'EXHAUST / CV UPGRADE', desc: 'Professional performance CVT cleaning and aftermarket exhaust fitting.', label: '₱350+' },
            { name: 'ENGINE OVERHAUL', desc: 'Cylinder re-boring, carbon scrubbing, gasket replacement, and full piston tuning.', label: '₱5,000+' }
          ].map(service => (
            <div key={service.name} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{service.name}</h4>
                  <span className="badge" style={{ borderColor: '#FF6600', color: '#FF6600' }}>{service.label}</span>
                </div>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.6', opacity: 0.7 }}>{service.desc}</p>
              </div>
              <Link to="/services" style={{ marginTop: '20px' }}>
                <button style={{ width: '100%', fontSize: '0.65rem' }}>LEARN MORE</button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Join Club */}
      <section style={{ 
        padding: '80px 20px', 
        textAlign: 'center', 
        background: '#000', 
        color: '#fff', 
        borderTop: '3px solid #000'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '15px' }}>JOIN THE BOSS RAP RIDER CLUB</h2>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '30px', color: '#ccc' }}>
            Earn 1 points for every ₱100 spent. Redeem points for custom parts discounts. Access your virtual QR membership card instantly on your dashboard.
          </p>
          <Link to="/register">
            <button className="primary" style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '15px 35px' }}>REGISTER AS A MEMBER</button>
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .stat-box { border-right: none !important; }
        }
      `}</style>
    </div>
  );
};

export const Shop: React.FC = () => {
  const { products } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto' }}>
      <section style={{ marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '950' }}>SHOP SPARE PARTS</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '5px' }}>EXPLORE HIGH-QUALITY OEM MOTOR PARTS AND ACCESORIES.</p>
      </section>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px',
        borderBottom: '2px solid #000',
        paddingBottom: '20px'
      }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={selectedCategory === cat ? 'primary' : ''} 
              onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: '0.65rem', padding: '6px 12px' }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <input 
          type="text" 
          placeholder="Search by part name or barcode..." 
          style={{ maxWidth: '350px', width: '100%', padding: '10px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h3>NO PRODUCTS MATCH YOUR FILTERS</h3>
          <p style={{ opacity: 0.6, marginTop: '10px' }}>Try adjusting your keywords or category filters.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '30px' 
        }}>
          {filteredProducts.map(product => (
            <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
              <div style={{ 
                aspectRatio: '16 / 10', 
                background: 'radial-gradient(circle, #eee 0%, #e5e5e5 100%)', 
                border: '2px solid #000', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                position: 'relative'
              }}>
                <span style={{ fontSize: '1.8rem', opacity: 0.7 }}>⚙️</span>
                <span style={{ fontSize: '0.55rem', color: '#666', fontWeight: 'bold', marginTop: '8px', letterSpacing: '1px' }}>BOSS RAP SPARES</span>
                <code style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '0.55rem', opacity: 0.6 }}>BC: {product.barcode}</code>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="badge" style={{ borderColor: '#FF6600', color: '#FF6600' }}>{product.category}</span>
                  <h4 style={{ margin: '10px 0 5px 0', fontSize: '1.05rem', lineHeight: '1.3' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: '1.4', marginBottom: '15px' }}>{product.description}</p>
                </div>
                
                <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '900', fontSize: '1.3rem', color: '#000' }}>₱{product.price.toLocaleString()}</span>
                  <span className={`badge ${product.stock <= product.lowStockLevel ? 'danger' : ''}`} style={{ fontSize: '0.6rem' }}>
                    {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
