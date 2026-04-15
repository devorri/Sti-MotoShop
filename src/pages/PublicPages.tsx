import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        padding: '10vw 5vw', 
        textAlign: 'center', 
        borderBottom: '2px solid #000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '0.1em', margin: '0' }}>BOSS RAP</h1>
        <h2 style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: '40px', fontWeight: '400' }}>PREMIUM MOTORCYCLE PARTS & SERVICES</h2>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/shop"><button className="primary" style={{ padding: '15px 40px', minWidth: '200px' }}>EXPLORE SHOP</button></Link>
          <Link to="/services"><button style={{ padding: '15px 40px', minWidth: '200px' }}>OUR SERVICES</button></Link>
        </div>
      </section>

      {/* Quick Stats */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        borderBottom: '2px solid #000' 
      }}>
        <div style={{ padding: '4vw', borderRight: '2px solid #000', borderBottom: '2px solid #000', textAlign: 'center' }} className="stat-box">
          <h3 style={{ fontSize: '2.5rem' }}>500+</h3>
          <p style={{ fontSize: '0.8rem', marginTop: '10px', fontWeight: 'bold' }}>QUALITY PARTS</p>
        </div>
        <div style={{ padding: '4vw', borderRight: '2px solid #000', borderBottom: '2px solid #000', textAlign: 'center' }} className="stat-box">
          <h3 style={{ fontSize: '2.5rem' }}>1000+</h3>
          <p style={{ fontSize: '0.8rem', marginTop: '10px', fontWeight: 'bold' }}>HAPPY CUSTOMERS</p>
        </div>
        <div style={{ padding: '4vw', borderBottom: '2px solid #000', textAlign: 'center' }} className="stat-box">
          <h3 style={{ fontSize: '2.5rem' }}>15+</h3>
          <p style={{ fontSize: '0.8rem', marginTop: '10px', fontWeight: 'bold' }}>YEARS EXPERIENCE</p>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .stat-box { border-right: none !important; }
          }
        `}</style>
      </section>

      {/* Featured Services Preview */}
      <section style={{ padding: '10vw 5vw', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '60px' }}>SERVICES WE PROVIDE</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px' 
        }}>
          {[
            { name: 'CHANGE OIL', desc: 'PREMIUM LUBRICANTS FOR OPTIMAL ENGINE PERFORMANCE.' },
            { name: 'TUNE UP', desc: 'PRECISION TUNING TO KEEP YOUR RIDE SMOOTH AND POWERFUL.' },
            { name: 'OVERHAUL', desc: 'COMPLETE ENGINE RESTORATION BY EXPERT MECHANICS.' },
            { name: 'VULCANIZING', desc: 'QUICK AND RELIABLE TIRE REPAIRS FOR ALL MOTORCYCLES.' }
          ].map(service => (
            <div key={service.name} className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <h4 style={{ fontSize: '1.2rem' }}>{service.name}</h4>
              <p style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>{service.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const Shop = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const products = [
    { id: '1', name: 'Engine Oil 1L', category: 'Lubricant', price: 450, stock: 15 },
    { id: '2', name: 'Brake Pad Set', category: 'Brakes', price: 1200, stock: 3 },
    { id: '3', name: 'Tire 17"', category: 'Tires', price: 2500, stock: 8 },
    { id: '4', name: 'Spark Plug', category: 'Electrical', price: 150, stock: 20 },
  ];

  return (
    <div style={{ padding: '5vw', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <h2 style={{ margin: 0 }}>BROWSE PARTS</h2>
        <input 
          type="text" 
          placeholder="SEARCH PRODUCTS..." 
          style={{ maxWidth: '400px', width: '100%' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: '30px' 
      }}>
        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
          <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
            <div style={{ 
              aspectRatio: '1 / 1', 
              background: '#f9f9f9', 
              border: '1px solid #000', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%' 
            }}>
              <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 'bold' }}>[ PRODUCT IMAGE ]</span>
            </div>
            <div style={{ flex: 1 }}>
              <span className="badge">{product.category}</span>
              <h4 style={{ margin: '10px 0', fontSize: '1.1rem' }}>{product.name}</h4>
              <p style={{ fontWeight: '900', fontSize: '1.2rem' }}>₱{product.price.toLocaleString()}</p>
            </div>
            <div style={{ borderTop: '2px solid #000', paddingTop: '15px', marginTop: 'auto' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                STOCK: {product.stock > 0 ? `${product.stock} AVAILABLE` : 'OUT OF STOCK'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

