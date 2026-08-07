import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../context/AppContext';
import { Services } from './Services';
import { About } from './About';
import { Contact } from './Contact';

export const Home: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#07090e', color: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '100px 24px 120px', 
        textAlign: 'center', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 30%, rgba(0, 210, 255, 0.12) 0%, rgba(255, 30, 39, 0.08) 50%, #07090e 90%)',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(0, 210, 255, 0.2)'
      }}>
        {/* Carbon Background Pattern */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          opacity: 0.08, 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
          backgroundSize: '24px 24px' 
        }}></div>
        
        <div style={{ zIndex: 2, maxWidth: '900px', width: '100%' }}>
          <span className="badge" style={{ marginBottom: '24px', padding: '6px 16px', fontSize: '0.75rem', letterSpacing: '0.2em' }}>
            ⚡ EST. 2008 • BALIWAG, BULACAN
          </span>

          {/* Hero Logo Emblem */}
          <div style={{ marginBottom: '28px' }}>
            <img 
              src="/boss-rap-logo.png" 
              alt="BOSS RAP MOTOR SHOP LOGO" 
              style={{ 
                maxWidth: '380px', 
                width: '85%', 
                height: 'auto',
                filter: 'drop-shadow(0 0 25px rgba(0, 210, 255, 0.45)) drop-shadow(0 0 10px rgba(255, 30, 39, 0.3))' 
              }}
              className="hero-logo-img"
            />
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 6vw, 4.8rem)', 
            fontWeight: '900', 
            letterSpacing: '0.04em', 
            margin: '0 0 16px 0', 
            lineHeight: 1.05,
            background: 'linear-gradient(135deg, #ffffff 30%, #00d2ff 70%, #ff1e27 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            HIGH-PERFORMANCE TUNING & SPARES
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(0.95rem, 2vw, 1.25rem)', 
            color: '#cbd5e1', 
            fontWeight: '500', 
            lineHeight: '1.7', 
            maxWidth: '720px', 
            margin: '0 auto 40px' 
          }}>
            Bulacan's trusted racing sanctuary for professional CVT tuning, engine overhauls, high-grade synthetic lubricants, and genuine OEM spare parts.
          </p>

          <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop">
              <button className="primary" style={{ padding: '16px 36px', fontSize: '0.85rem' }}>
                🛒 EXPLORE INVENTORY
              </button>
            </Link>
            <Link to="/services">
              <button className="btn" style={{ padding: '16px 36px', fontSize: '0.85rem' }}>
                🔧 OUR SERVICES & TUNING
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section style={{ 
        maxWidth: '1400px', 
        margin: '-30px auto 60px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '20px'
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📦</span>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-cyan)' }}>500+</h3>
            <p style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.1em' }}>GENUINE OEM PARTS</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🏁</span>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-red)' }}>1,500+</h3>
            <p style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.1em' }}>CLUB MEMBERS</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🏆</span>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-gold)' }}>15+ YEARS</h3>
            <p style={{ fontSize: '0.75rem', marginTop: '6px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.1em' }}>ON-ROAD EXPERTISE</p>
          </div>
        </div>
      </section>

      {/* Featured Services Preview */}
      <section style={{ padding: '60px 24px 80px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="badge" style={{ marginBottom: '10px' }}>EXPERT MAINTENANCE</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff' }}>POPULAR TUNING SERVICES</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '8px' }}>PRECISION CARE FOR MAXIMUM ACCELERATION AND SAFETY</p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          {[
            { name: 'ENGINE TUNE-UP', desc: 'Full throttle body cleaning, FI diagnostic scan, valve clearance adjustment, and electronics calibration.', label: '₱500+' },
            { name: 'SYNTHETIC OIL CHANGE', desc: 'Premium 4T racing engine lubricant drain & replace, filter inspection, and chain tensioning.', label: '₱350+' },
            { name: 'CVT CLEANING & UPGRADE', desc: 'Professional performance CVT cleaning, pulley resurfacing, clutch bell deglazing, and belt fitting.', label: '₱450+' },
            { name: 'ENGINE OVERHAUL', desc: 'Cylinder re-boring, carbon scrubbing, gasket replacement, and full racing piston tuning.', label: '₱5,000+' }
          ].map(service => (
            <div key={service.name} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', margin: 0, color: '#fff' }}>{service.name}</h4>
                  <span className="badge">{service.label}</span>
                </div>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#94a3b8' }}>{service.desc}</p>
              </div>
              <Link to="/services" style={{ marginTop: '24px' }}>
                <button className="btn" style={{ width: '100%', fontSize: '0.7rem' }}>BOOK SERVICE</button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Join Club Banner */}
      <section style={{ 
        padding: '80px 24px', 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, rgba(0, 82, 255, 0.2) 0%, rgba(255, 30, 39, 0.2) 100%)', 
        color: '#fff', 
        borderTop: '1px solid rgba(0, 210, 255, 0.2)',
        borderBottom: '1px solid rgba(0, 210, 255, 0.2)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="badge badge-red" style={{ marginBottom: '16px' }}>EXCLUSIVE MEMBER REWARDS</span>
          <h2 style={{ color: '#fff', fontSize: '2.4rem', marginBottom: '16px', fontWeight: 900 }}>
            JOIN THE BOSS RAP RIDER CLUB
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '32px' }}>
            Earn 1 membership point for every ₱100 spent. Collect points to redeem free oil changes and parts discounts. Show your digital membership QR code at the shop counter!
          </p>
          <Link to="/register">
            <button className="primary" style={{ padding: '16px 40px', fontSize: '0.85rem' }}>
              ⚡ REGISTER FOR FREE MEMBERSHIP
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export const Shop: React.FC = () => {
  const { 
    products, 
    setProducts, 
    promos, 
    sales, 
    setSales, 
    currentUser, 
    members, 
    setMembers,
    pointsSettings 
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Shopping Cart & Modal states
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Checkout flow states
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'DETAILS'>('CART');
  const [checkoutForm, setCheckoutForm] = useState({
    deliveryType: 'PICKUP' as 'PICKUP' | 'DELIVERY',
    address: '',
    phone: '',
    guestName: '',
    paymentMethod: 'CASH' as 'CASH' | 'E-WALLET' | 'ONLINE BANK',
    paymentRef: ''
  });
  
  // Coupon state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState('');

  // Post-purchase Receipt State
  const [showReceipt, setShowReceipt] = useState<any | null>(null);

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Category Icon SVG Generator
  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('lubri')) return (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff5e36' }}>
        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" fill="#ff5e36" fillOpacity="0.15"/>
      </svg>
    );
    if (c.includes('brake')) return (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
        <circle cx="12" cy="12" r="10" fill="#3b82f6" fillOpacity="0.1"/>
        <circle cx="12" cy="12" r="6"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    );
    if (c.includes('tire')) return (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
        <circle cx="12" cy="12" r="9" fill="#10b981" fillOpacity="0.1"/>
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>
      </svg>
    );
    if (c.includes('elect')) return (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#eab308' }}>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#eab308" fillOpacity="0.15"/>
      </svg>
    );
    return (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gear-icon" style={{ color: '#000' }}>
        <circle cx="12" cy="12" r="3" fill="#000" fillOpacity="0.1"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    );
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    const cartQty = existing ? existing.quantity : 0;

    if (product.stock <= cartQty) {
      alert(`INSUFFICIENT STOCK: Only ${product.stock} units available.`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    if (qty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
      return;
    }

    if (item.product.stock < qty) {
      alert(`INSUFFICIENT STOCK: Only ${item.product.stock} units available.`);
      return;
    }

    setCart(cart.map(i => 
      i.product.id === productId ? { ...i, quantity: qty } : i
    ));
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Promo code validation
  const applyPromo = () => {
    setPromoError('');
    if (!promoCode) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const match = promos.find(p => p.name.toUpperCase() === promoCode.toUpperCase() && p.active && todayStr >= p.startDate && todayStr <= p.endDate);

    if (match) {
      if (subtotal >= match.minSpend) {
        setAppliedPromo(match);
      } else {
        setPromoError(`MINIMUM SPEND OF ₱${match.minSpend} REQUIRED FOR THIS PROMO.`);
      }
    } else {
      setPromoError('INVALID OR EXPIRED PROMO CODE.');
    }
  };

  const discountApplied = appliedPromo ? (subtotal * appliedPromo.discountPercent) / 100 : 0;
  const total = subtotal - discountApplied;

  // Checkout submission
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Validate stock levels once more
    for (const item of cart) {
      const fresh = products.find(p => p.id === item.product.id);
      if (!fresh || fresh.stock < item.quantity) {
        alert(`STOCK HAS CHANGED: ${item.product.name} is no longer fully available.`);
        return;
      }
    }

    // Validate guest checkouts
    if (!currentUser && (!checkoutForm.guestName || !checkoutForm.phone)) {
      alert('PLEASE PROVIDE YOUR NAME AND CONTACT PHONE.');
      return;
    }

    // Validate deliveries
    if (checkoutForm.deliveryType === 'DELIVERY' && !checkoutForm.address) {
      alert('PLEASE PROVIDE A DELIVERY ADDRESS.');
      return;
    }

    // Validate digital reference
    if (checkoutForm.paymentMethod !== 'CASH' && !checkoutForm.paymentRef) {
      alert('PLEASE PROVIDE THE TRANSACTION REFERENCE NUMBER.');
      return;
    }

    const saleId = `S_ONL${Date.now().toString().slice(-6)}`;
    const isDelivery = checkoutForm.deliveryType === 'DELIVERY';
    const saleItems = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));

    const newSale = {
      id: saleId,
      items: saleItems,
      subtotal,
      discountApplied,
      total,
      date: new Date().toISOString(),
      memberId: currentUser?.memberId || undefined,
      channel: 'ONLINE/FACEBOOK' as const,
      fulfillmentType: isDelivery ? 'DELIVERY' as const : 'STORE PICKUP' as const,
      orderStatus: isDelivery ? 'PREPARING' as const : 'ORDER PLACED' as const,
      trackingCode: `${isDelivery ? 'LALA' : 'PICKUP'}-${saleId}`,
      paymentMethod: checkoutForm.paymentMethod,
      paymentRef: checkoutForm.paymentMethod !== 'CASH' ? checkoutForm.paymentRef : undefined,
      // Pass shipping details in metadata format if necessary
      notes: isDelivery 
        ? `SHIPPING: LALAMOVE. ADDR: ${checkoutForm.address.toUpperCase()}. PHONE: ${checkoutForm.phone}`
        : 'STORE PICKUP'
    };

    // 1. Deduct Inventory stock
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.product.id === p.id);
      return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
    });
    setProducts(updatedProducts);

    // 2. Award Points
    if (currentUser?.memberId) {
      const pointsEarned = Math.floor(total / pointsSettings.currencyPerPoint);
      const updatedMembers = members.map(m => 
        m.id === currentUser.memberId ? { ...m, points: m.points + pointsEarned } : m
      );
      setMembers(updatedMembers);
    }

    // 3. Add to sales database
    setSales([...sales, newSale]);

    // 4. Trigger Receipt and Reset cart
    setShowReceipt({
      ...newSale,
      guestName: currentUser ? undefined : checkoutForm.guestName.toUpperCase(),
      deliveryDetails: checkoutForm.deliveryType === 'DELIVERY' ? checkoutForm.address : undefined
    });
    setCart([]);
    setAppliedPromo(null);
    setPromoCode('');
    setIsCartOpen(false);
    setCheckoutStep('CART');
    setCheckoutForm({
      deliveryType: 'PICKUP',
      address: '',
      phone: '',
      guestName: '',
      paymentMethod: 'CASH',
      paymentRef: ''
    });
  };

  const getCompatibilityList = (pName: string) => {
    const name = pName.toLowerCase();
    if (name.includes('oil')) return 'HONDA CLICK, YAMAHA MIO, SUZUKI RAIDER, VESPA, UNIVERSAL 4T SCOOTERS & MOTORCYCLES';
    if (name.includes('brake')) return 'HONDA CLICK 125i/150i, BEAT, PCX, MIO I 125, AEROX FRONT DISC';
    if (name.includes('tire')) return '17-INCH RIMS, YAMAHA SNIPER, HONDA WAVE, SUZUKI RAIDER 150';
    if (name.includes('spark')) return 'ALL FI & CARBURETOR 100CC TO 150CC SINGLE CYLINDER MOTORCYCLES';
    return 'UNIVERSAL FITMENT - PLEASE CONFIRM WITH MECHANICAL STAFF AT COUNTER';
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      <style>{`
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .product-card {
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(14, 20, 33, 0.85);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
          cursor: pointer;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
        }
        .product-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d2ff, #ff1e27, transparent);
          opacity: 0.5;
          transition: opacity 0.3s;
        }
        .product-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 210, 255, 0.3);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 210, 255, 0.1);
        }
        .product-card:hover::before {
          opacity: 1;
        }
        .product-image {
          aspect-ratio: 16 / 10;
          background: radial-gradient(circle, rgba(15, 23, 42, 0.9) 0%, rgba(7, 9, 14, 0.95) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .product-image::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(#00d2ff 0.5px, transparent 0.5px);
          background-size: 16px 16px;
          opacity: 0.06;
          pointer-events: none;
        }
        .product-card:hover .gear-icon {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .filter-btn {
          font-size: 0.72rem;
          padding: 8px 16px;
          border: 1px solid rgba(0, 210, 255, 0.3);
          background: rgba(15, 23, 42, 0.8);
          color: #94a3b8;
          font-weight: 700;
          font-family: var(--font-header);
          border-radius: 6px;
          transition: all 0.2s ease;
          letter-spacing: 0.05em;
        }
        .filter-btn:hover, .filter-btn.active {
          background: linear-gradient(135deg, #0052ff, #00d2ff);
          color: #fff;
          border-color: #00d2ff;
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.3);
          transform: translateY(-1px);
        }
        .checkout-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          font-family: inherit;
          margin-top: 6px;
          outline: none;
          background: rgba(10, 15, 26, 0.9);
          color: #f8fafc;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }
        .checkout-input:focus {
          background: rgba(15, 23, 42, 0.95);
          border-color: #00d2ff;
          box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.15);
        }
        .action-button-neo {
          cursor: pointer;
          font-family: var(--font-header);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 12px 20px;
          background: rgba(15, 23, 42, 0.8);
          color: #f8fafc;
          border: 1px solid rgba(0, 210, 255, 0.3);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.8rem;
        }
        .action-button-neo:hover {
          background: rgba(0, 210, 255, 0.15);
          border-color: #00d2ff;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.25);
        }
        .action-button-neo.primary {
          background: linear-gradient(135deg, #0052ff 0%, #0036ab 100%);
          color: #fff;
          border: 1px solid #00d2ff;
          box-shadow: 0 4px 15px rgba(0, 82, 255, 0.4);
        }
        .action-button-neo.primary:hover {
          background: linear-gradient(135deg, #00d2ff 0%, #0052ff 100%);
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.25);
        }
        .action-button-neo:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .quantity-counter {
          display: flex;
          align-items: center;
          border: 1px solid rgba(0, 210, 255, 0.3);
          background: rgba(15, 23, 42, 0.8);
          border-radius: 6px;
          overflow: hidden;
        }
        .quantity-counter button {
          border: none;
          background: transparent;
          font-weight: bold;
          padding: 4px 10px;
          font-size: 0.85rem;
          color: #f8fafc;
          border-radius: 0;
        }
        .quantity-counter button:hover {
          background: rgba(0, 210, 255, 0.2);
          color: #fff;
        }
      `}</style>

      {/* Floating Shopping Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 999,
          background: 'linear-gradient(135deg, #0052ff, #00d2ff)',
          color: '#fff',
          border: '2px solid #00d2ff',
          boxShadow: '0 4px 20px rgba(0, 210, 255, 0.5)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          fontSize: '1.6rem',
          cursor: 'pointer'
        }}
        title="View Shopping Cart"
      >
        🛒
        {cart.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'linear-gradient(135deg, #ff1e27, #a80006)',
            color: '#fff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #07090e'
          }}>
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Header section */}
      <section style={{ marginBottom: '50px' }}>
        <span className="badge" style={{ marginBottom: '12px' }}>GENUINE OEM PARTS</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff' }}>SHOP SPARE PARTS & ACCESSORIES</h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '8px' }}>EXPLORE HIGH-QUALITY OEM MOTORCYCLE PARTS AND RACING ACCESSORIES.</p>
      </section>

      {/* Filter and Search Navbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '24px'
      }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`} 
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ maxWidth: '350px', width: '100%', position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search parts by name, code, barcode..." 
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              paddingRight: '36px',
              border: '1px solid rgba(0, 210, 255, 0.3)', 
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontFamily: 'inherit'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span style={{ position: 'absolute', right: '14px', top: '13px', opacity: 0.5 }}>🔍</span>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🔩</span>
          <h3 style={{ marginTop: '20px', color: '#fff' }}>NO PRODUCTS MATCH YOUR FILTERS</h3>
          <p style={{ color: '#94a3b8', marginTop: '10px', fontSize: '0.9rem' }}>Try adjusting your search terms or selecting a different category filter.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="product-card" 
              onClick={() => setSelectedProduct(product)}
            >
              {/* Product Card Image Wrapper */}
              <div className="product-image">
                {getCategoryIcon(product.category)}
                <span style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 'bold', marginTop: '8px', letterSpacing: '2px' }}>BOSS RAP SPARES</span>
                <code style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '0.55rem', opacity: 0.6, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>BC: {product.barcode}</code>
              </div>
              
              {/* Product Card Details */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '15px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge" style={{ fontSize: '0.6rem' }}>{product.category.toUpperCase()}</span>
                    {product.stock <= product.lowStockLevel && product.stock > 0 && (
                      <span className="badge warning" style={{ fontSize: '0.55rem' }}>LOW STOCK</span>
                    )}
                  </div>
                  <h4 style={{ margin: '10px 0 5px 0', fontSize: '1.1rem', lineHeight: '1.3', color: '#fff' }}>{product.name}</h4>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>{product.description}</p>
                </div>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-header)' }}>₱{product.price.toLocaleString()}</span>
                  <span className={`badge ${product.stock <= product.lowStockLevel ? 'danger' : 'success'}`} style={{ fontSize: '0.6rem' }}>
                    {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                  </span>
                </div>
                
                <button 
                  className="action-button-neo primary" 
                  disabled={product.stock <= 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  style={{ fontSize: '0.7rem', padding: '8px 15px' }}
                >
                  {product.stock > 0 ? '🛒 Add to Cart' : '❌ OUT OF STOCK'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth: '600px', width: '90%', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #000', paddingBottom: '15px' }}>
              <div>
                <span className="badge" style={{ backgroundColor: '#ffe600', color: '#000', marginBottom: '8px' }}>{selectedProduct.category.toUpperCase()}</span>
                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{selectedProduct.name}</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px' }} className="modal-detail-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getCategoryIcon(selectedProduct.category)}
                </div>
                
                {/* Simulated Barcode card */}
                <div style={{ border: '2.5px solid #000', padding: '10px 5px', width: '100%', background: '#fff', textAlign: 'center', boxShadow: '2px 2px 0px #000' }}>
                  <div style={{ display: 'flex', height: '35px', justifyContent: 'center', gap: '1.5px', marginBottom: '5px' }}>
                    {selectedProduct.barcode.split('').map((char: string, index: number) => {
                      const val = Number(char) || index;
                      const barWidth = (val % 3) + 1;
                      const barColor = (val % 2 === 0) ? '#000' : 'transparent';
                      return <div key={index} style={{ width: `${barWidth}px`, backgroundColor: barColor }}></div>;
                    })}
                  </div>
                  <code style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '1px' }}>{selectedProduct.barcode}</code>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <h5 style={{ fontSize: '0.65rem', color: '#666' }}>DESCRIPTION</h5>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', marginTop: '4px' }}>{selectedProduct.description}</p>
                </div>
                
                <div>
                  <h5 style={{ fontSize: '0.65rem', color: '#666' }}>FITMENT & COMPATIBILITY</h5>
                  <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ff5e36', lineHeight: '1.4', marginTop: '4px' }}>
                    {getCompatibilityList(selectedProduct.name)}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                  <div>
                    <h5 style={{ fontSize: '0.65rem', color: '#666' }}>UNIT PRICE</h5>
                    <span style={{ fontSize: '1.6rem', fontWeight: '950', color: '#000' }}>₱{selectedProduct.price.toLocaleString()}</span>
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.65rem', color: '#666' }}>AVAILABILITY</h5>
                    <span className={`badge ${selectedProduct.stock <= selectedProduct.lowStockLevel ? 'danger' : ''}`} style={{ fontSize: '0.7rem', marginTop: '5px', border: '2.5px solid #000' }}>
                      {selectedProduct.stock > 0 ? `${selectedProduct.stock} UNITS IN STOCK` : 'OUT OF STOCK'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', borderTop: '3px solid #000', paddingTop: '15px', marginTop: '10px' }} className="modal-actions">
              <Link 
                to={`/contact?message=Hi Boss Rap! I would like to inquire about the availability and purchasing options for the following product: ${selectedProduct.name} (Barcode: ${selectedProduct.barcode}).`}
                style={{ flex: 1 }}
                onClick={() => setSelectedProduct(null)}
              >
                <button className="action-button-neo" style={{ width: '100%', fontSize: '0.75rem' }}>💬 Inquire via Message</button>
              </Link>
              <button 
                className="action-button-neo primary" 
                style={{ flex: 1, fontSize: '0.75rem' }}
                disabled={selectedProduct.stock <= 0}
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                  setIsCartOpen(true);
                }}
              >
                🛒 Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', zIndex: 9999 }} onClick={() => setIsCartOpen(false)}>
          <div 
            style={{ 
              width: '100%', 
              maxWidth: '460px', 
              height: '100vh', 
              background: '#fff', 
              borderLeft: '4px solid #000', 
              padding: '30px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              boxShadow: '-10px 0px 0px rgba(0,0,0,0.15)',
              animation: 'slideLeft 0.18s ease-out'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '1px' }}>🛒 SHOPPING CART</h3>
              <button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>✕</button>
            </div>

            {checkoutStep === 'CART' ? (
              /* CART STEP */
              <>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.6 }}>
                      <span style={{ fontSize: '2.5rem' }}>⚙️</span>
                      <p style={{ marginTop: '15px', fontWeight: 'bold' }}>YOUR CART IS EMPTY</p>
                      <button onClick={() => setIsCartOpen(false)} style={{ marginTop: '15px', fontSize: '0.65rem' }}>KEEP SHOPPING</button>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product.id} style={{ display: 'flex', gap: '15px', border: '2px solid #000', padding: '15px', background: '#fcfcfc', boxShadow: '2px 2px 0px #000' }}>
                        <div style={{ width: '50px', height: '50px', background: '#eee', border: '1.5px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {getCategoryIcon(item.product.category)}
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h4 style={{ fontSize: '0.85rem', margin: 0 }}>{item.product.name}</h4>
                            <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'bold' }}>₱{item.product.price.toLocaleString()}</span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                            <div className="quantity-counter">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                              <span style={{ padding: '0 8px', fontWeight: 'bold', fontSize: '0.8rem' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                            </div>
                            
                            <button 
                              onClick={() => updateQuantity(item.product.id, 0)}
                              style={{ border: 'none', background: 'transparent', color: 'red', fontSize: '0.65rem', padding: '5px' }}
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div style={{ borderTop: '3px solid #000', paddingTop: '20px' }}>
                    {/* Promo coupon input */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                      <input 
                        type="text" 
                        placeholder="ENTER PROMO CODE (E.G. WELCOME10)" 
                        value={promoCode} 
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        style={{ border: '2px solid #000', padding: '8px', flex: 1, fontSize: '0.75rem' }}
                      />
                      <button onClick={applyPromo} style={{ fontSize: '0.7rem' }}>APPLY</button>
                    </div>
                    {promoError && <p style={{ color: 'red', fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ {promoError}</p>}
                    {appliedPromo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f5fff5', border: '1.5px solid green', padding: '8px', fontSize: '0.7rem', color: 'green', marginBottom: '15px', fontWeight: 'bold' }}>
                        <span>PROMO APPLIED: {appliedPromo.name}</span>
                        <span>-{appliedPromo.discountPercent}% OFF</span>
                      </div>
                    )}

                    {/* Pricing Summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>SUBTOTAL:</span>
                        <span>₱{subtotal.toLocaleString()}</span>
                      </div>
                      {discountApplied > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'red', fontWeight: 'bold' }}>
                          <span>PROMO DISCOUNT:</span>
                          <span>-₱{discountApplied.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '950', borderTop: '2px solid #000', paddingTop: '8px' }}>
                        <span>GRAND TOTAL:</span>
                        <span>₱{total.toLocaleString()}</span>
                      </div>
                      
                      {currentUser && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fafaf0', padding: '8px', border: '1px solid #000', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '5px' }}>
                          <span>MEMBER LOYALTY POINTS EARNED:</span>
                          <span style={{ color: 'green' }}>+{Math.floor(total / pointsSettings.currencyPerPoint)} PTS</span>
                        </div>
                      )}
                    </div>

                    <button 
                      className="checkout-btn" 
                      onClick={() => setCheckoutStep('DETAILS')}
                    >
                      PROCEED TO CHECKOUT
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* CHECKOUT DETAILS STEP */
              <form onSubmit={handleCheckout} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingBottom: '20px' }}>
                  
                  {/* Shipping option */}
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block' }}>DELIVERY TYPE</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <button 
                        type="button" 
                        className={checkoutForm.deliveryType === 'PICKUP' ? 'primary' : ''} 
                        style={{ flex: 1, fontSize: '0.65rem' }} 
                        onClick={() => setCheckoutForm({ ...checkoutForm, deliveryType: 'PICKUP' })}
                      >
                        STORE PICKUP
                      </button>
                      <button 
                        type="button" 
                        className={checkoutForm.deliveryType === 'DELIVERY' ? 'primary' : ''} 
                        style={{ flex: 1, fontSize: '0.65rem' }} 
                        onClick={() => setCheckoutForm({ ...checkoutForm, deliveryType: 'DELIVERY' })}
                      >
                        DELIVERY (LALAMOVE)
                      </button>
                    </div>
                  </div>

                  {/* Customer Information (Guest or Member info) */}
                  <div style={{ borderTop: '2px solid #eee', paddingTop: '15px' }}>
                    <h4 style={{ fontSize: '0.75rem', marginBottom: '10px' }}>CUSTOMER CONTACT</h4>
                    
                    {currentUser ? (
                      <div style={{ background: '#f5f5f5', border: '1.5px solid #000', padding: '12px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p>Logged in Member: <span style={{ fontWeight: 'bold' }}>{currentUser.name}</span></p>
                        <p>Member ID: <span style={{ fontWeight: 'bold' }}>{currentUser.memberId}</span></p>
                        {checkoutForm.deliveryType === 'DELIVERY' && (
                          <div style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>CONTACT PHONE NUMBER</label>
                            <input 
                              type="text" 
                              required
                              className="checkout-input" 
                              value={checkoutForm.phone} 
                              onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                              placeholder="09XXXXXXXXX"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>YOUR FULL NAME</label>
                          <input 
                            type="text" 
                            required
                            className="checkout-input" 
                            value={checkoutForm.guestName} 
                            onChange={e => setCheckoutForm({ ...checkoutForm, guestName: e.target.value })}
                            placeholder="E.G. JUAN DELA CRUZ"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>CONTACT PHONE</label>
                          <input 
                            type="text" 
                            required
                            className="checkout-input" 
                            value={checkoutForm.phone} 
                            onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                            placeholder="E.G. 09171234567"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Address */}
                  {checkoutForm.deliveryType === 'DELIVERY' && (
                    <div>
                      <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>DELIVERY ADDRESS (BULACAN AREA ONLY)</label>
                      <textarea 
                        required
                        rows={3} 
                        className="checkout-input" 
                        value={checkoutForm.address} 
                        onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                        placeholder="SPECIFY COMPLETE ADDRESS..."
                        style={{ resize: 'vertical' }}
                      />
                      <p style={{ fontSize: '0.55rem', opacity: 0.6, marginTop: '2px' }}>* Lalamove delivery fee is shouldered by the customer upon delivery.</p>
                    </div>
                  )}

                  {/* Payment selection */}
                  <div style={{ borderTop: '2px solid #eee', paddingTop: '15px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>PAYMENT METHOD</label>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
                      {['CASH', 'E-WALLET', 'ONLINE BANK'].map(method => (
                        <button 
                          key={method} 
                          type="button" 
                          className={checkoutForm.paymentMethod === method ? 'primary' : ''} 
                          style={{ flex: 1, fontSize: '0.55rem', padding: '6px' }}
                          onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: method as any })}
                        >
                          {method === 'CASH' ? (checkoutForm.deliveryType === 'DELIVERY' ? 'COD (CASH)' : 'COP (CASH)') : method}
                        </button>
                      ))}
                    </div>

                    {checkoutForm.paymentMethod !== 'CASH' && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ background: '#fafaf3', border: '1px dashed #000', padding: '10px', fontSize: '0.65rem', marginBottom: '8px' }}>
                          <p style={{ fontWeight: 'bold' }}>💳 DIGITAL PAYMENT DIRECTORY:</p>
                          <p style={{ marginTop: '2px' }}>• GCASH: 0912-345-6789 (BOSS RAP MOTOR SHOP)</p>
                          <p>• BDO BANK: 0012-3456-7890 (BOSS RAP INC)</p>
                        </div>
                        <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>TRANSACTION REFERENCE NUMBER</label>
                        <input 
                          type="text" 
                          required
                          className="checkout-input" 
                          value={checkoutForm.paymentRef} 
                          onChange={e => setCheckoutForm({ ...checkoutForm, paymentRef: e.target.value })}
                          placeholder="ENTER GCASH/BANK REF #"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing summary & Checkout actions */}
                <div style={{ borderTop: '3px solid #000', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Subtotal:</span>
                      <span>₱{subtotal.toLocaleString()}</span>
                    </div>
                    {discountApplied > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red', fontWeight: 'bold' }}>
                        <span>Discount:</span>
                        <span>-₱{discountApplied.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '950', borderTop: '1px solid #000', paddingTop: '5px' }}>
                      <span>Grand Total:</span>
                      <span>₱{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setCheckoutStep('CART')} style={{ flex: 1, fontSize: '0.75rem' }}>BACK</button>
                    <button type="submit" className="checkout-btn" style={{ flex: 1.5, fontSize: '0.75rem' }}>COMPLETE ORDER</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* COMPLETED ONLINE ORDER RECEIPT MODAL */}
      {showReceipt && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal" style={{ maxWidth: '420px', padding: '24px' }}>
            <div id="receipt-print-area" style={{ fontFamily: 'Courier New, monospace', fontSize: '0.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>BOSS RAP MOTOR SHOP</h3>
                <p style={{ margin: '0 0 2px 0' }}>BRGY. SULIVAN, BALIUAG, BULACAN</p>
                <p style={{ margin: '0 0 10px 0' }}>TEL: +63 912 345 6789</p>
                <p style={{ margin: 0 }}>--------------------------------</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>ONLINE TRANSACTION RECEIPT</p>
                <p style={{ margin: 0 }}>--------------------------------</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Order ID:</span>
                  <span>{showReceipt.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date:</span>
                  <span>{new Date(showReceipt.date).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer:</span>
                  <span>{showReceipt.guestName || currentUser?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payment:</span>
                  <span>{showReceipt.paymentMethod}</span>
                </div>
                {showReceipt.paymentRef && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ref #:</span>
                    <span>{showReceipt.paymentRef}</span>
                  </div>
                )}
                {showReceipt.memberId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Member ID:</span>
                    <span>{showReceipt.memberId}</span>
                  </div>
                )}
              </div>

              <p style={{ margin: 0 }}>--------------------------------</p>
              <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {showReceipt.items.map((item: any, index: number) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.name}</span>
                      <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', paddingLeft: '10px' }}>
                      {item.quantity} x ₱{item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0 }}>--------------------------------</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₱{showReceipt.subtotal.toLocaleString()}</span>
                </div>
                {showReceipt.discountApplied > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                    <span>Promo Discount:</span>
                    <span>-₱{showReceipt.discountApplied.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <span>GRAND TOTAL:</span>
                  <span>₱{showReceipt.total.toLocaleString()}</span>
                </div>
              </div>

              <p style={{ margin: '15px 0 0 0' }}>--------------------------------</p>
              <div style={{ margin: '5px 0', fontSize: '0.65rem' }}>
                <span style={{ fontWeight: 'bold' }}>SHIPPING LOGISTICS:</span>
                <p style={{ marginTop: '2px' }}>{showReceipt.notes}</p>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ margin: '0 0 5px 0' }}>ORDER PLACED SUCCESSFULLY!</p>
                <p style={{ margin: 0 }}>In case of pickup, present this receipt code at the counter. For delivery, Lalamove tracking details will be sent via SMS.</p>
                <p style={{ margin: '10px 0 0 0' }}>--------------------------------</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button className="checkout-btn" style={{ flex: 1 }} onClick={() => window.print()}>PRINT RECEIPT</button>
              <button style={{ flex: 1, fontWeight: 'bold' }} onClick={() => setShowReceipt(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PublicLanding: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <section id="home"><Home /></section>
      <section id="shop" style={{ borderTop: '3px solid #000' }}><Shop /></section>
      <section id="services" style={{ borderTop: '3px solid #000' }}><Services /></section>
      <section id="about" style={{ borderTop: '3px solid #000' }}><About /></section>
      <section id="contact" style={{ borderTop: '3px solid #000' }}><Contact /></section>
    </div>
  );
};
