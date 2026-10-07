import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Product, SaleItem } from '../context/AppContext';
import { Services } from './Services';
import { About } from './About';
import { Contact } from './Contact';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Package, 
  Search, 
  X, 
  Sparkles, 
  Clock, 
  Printer 
} from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ 
        padding: '70px 24px 90px', 
        textAlign: 'center', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)',
        color: '#0f172a',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ zIndex: 2, maxWidth: '900px', width: '100%' }}>
          <span className="badge badge-blue" style={{ marginBottom: '20px', padding: '6px 16px', fontSize: '0.75rem', letterSpacing: '0.12em' }}>
            EST. 2008 • BALIWAG, BULACAN
          </span>

          {/* Hero Logo Emblem */}
          <div style={{ marginBottom: '24px' }}>
            <img 
              src="/boss-rap-logo.png" 
              alt="BOSS RAP MOTOR SHOP LOGO" 
              style={{ 
                maxWidth: '340px', 
                width: '80%', 
                height: 'auto',
                filter: 'drop-shadow(0 4px 15px rgba(37, 99, 235, 0.15))'
              }} 
            />
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 5vw, 4rem)', 
            fontWeight: 900, 
            letterSpacing: '0.02em', 
            margin: '0 0 16px 0', 
            lineHeight: 1.15,
            color: '#0f172a'
          }}>
            HIGH-PERFORMANCE TUNING & SPARES
          </h1>
          
          <p style={{ 
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', 
            color: '#475569', 
            fontWeight: '500', 
            lineHeight: '1.7', 
            maxWidth: '720px', 
            margin: '0 auto 32px' 
          }}>
            Bulacan's trusted motorcycle shop for professional CVT tuning, engine overhauls, high-grade synthetic lubricants, genuine OEM spare parts, and Rider Club rewards.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                <ShoppingBag size={18} />
                <span>EXPLORE INVENTORY</span>
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button className="btn" style={{ padding: '12px 28px', fontSize: '0.9rem', color: '#16a34a', borderColor: '#86efac' }}>
                <Sparkles size={18} color="#16a34a" />
                <span>JOIN RIDER CLUB (+50 PTS)</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section style={{ 
        maxWidth: '1280px', 
        margin: '-24px auto 40px',
        padding: '0 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '16px'
        }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#2563eb', display: 'block' }}>15+</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Years of Experience</span>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#16a34a', display: 'block' }}>100%</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Genuine Spare Parts</span>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#d97706', display: 'block' }}>5,000+</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Bikes Tuned & Serviced</span>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#7c3aed', display: 'block' }}>1:100</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Points Reward Ratio</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Shop: React.FC = () => {
  const { 
    products, 
    promos, 
    currentUser, 
    pointsSettings,
    recordSale,
    addBackOrder 
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
  const [checkingOut, setCheckingOut] = useState(false);

  // Post-purchase Receipt State
  const [showReceipt, setShowReceipt] = useState<any | null>(null);

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('lubri')) return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ea580c' }}>
        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" fill="#ea580c" fillOpacity="0.15"/>
      </svg>
    );
    if (c.includes('brake')) return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2563eb' }}>
        <circle cx="12" cy="12" r="10" fill="#2563eb" fillOpacity="0.1"/>
        <circle cx="12" cy="12" r="6"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    );
    if (c.includes('tire')) return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#16a34a' }}>
        <circle cx="12" cy="12" r="9" fill="#16a34a" fillOpacity="0.1"/>
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>
      </svg>
    );
    return (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#475569' }}>
        <circle cx="12" cy="12" r="3" fill="#475569" fillOpacity="0.1"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    );
  };

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

  // Back order reservation request
  const handleRequestBackOrder = async (product: Product) => {
    const customerName = currentUser?.name || prompt('Please enter your name for the back order reservation:');
    if (!customerName) return;
    const contact = prompt('Please enter your phone number to notify when restocked:');
    if (!contact) return;

    await addBackOrder({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      customerName,
      customerContact: contact,
      status: 'PENDING',
      notes: `Back order reserved via web catalog by ${customerName}`
    });

    alert(`Back order reservation recorded for "${product.name}". Our staff will contact you once restocked!`);
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

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
  const total = Math.max(0, subtotal - discountApplied);

  // Total points that this cart will yield
  const cartPointsYield = Math.floor(total / pointsSettings.currencyPerPoint);

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    for (const item of cart) {
      const fresh = products.find(p => p.id === item.product.id);
      if (!fresh || fresh.stock < item.quantity) {
        alert(`STOCK HAS CHANGED: ${item.product.name} is no longer fully available.`);
        return;
      }
    }

    if (!currentUser && (!checkoutForm.guestName || !checkoutForm.phone)) {
      alert('PLEASE PROVIDE YOUR NAME AND CONTACT PHONE.');
      return;
    }

    if (checkoutForm.deliveryType === 'DELIVERY' && !checkoutForm.address) {
      alert('PLEASE PROVIDE A DELIVERY ADDRESS.');
      return;
    }

    if (checkoutForm.paymentMethod !== 'CASH' && !checkoutForm.paymentRef) {
      alert('PLEASE PROVIDE THE TRANSACTION REFERENCE NUMBER.');
      return;
    }

    setCheckingOut(true);

    const saleId = `S_ONL${Date.now().toString().slice(-6)}`;
    const isDelivery = checkoutForm.deliveryType === 'DELIVERY';
    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }));

    const customerDisplayName = currentUser ? currentUser.name : checkoutForm.guestName.trim().toUpperCase();
    const customerPhone = checkoutForm.phone || 'N/A';

    const newSalePayload = {
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
      notes: isDelivery 
        ? `CUSTOMER: ${customerDisplayName}. PHONE: ${customerPhone}. SHIPPING: LALAMOVE. ADDR: ${checkoutForm.address.toUpperCase()}`
        : `CUSTOMER: ${customerDisplayName}. PHONE: ${customerPhone}. STORE PICKUP AT BALIUAG`
    };

    // Save to Supabase and update state
    const savedSale = await recordSale(newSalePayload);
    setCheckingOut(false);

    if (savedSale) {
      setShowReceipt({
        ...savedSale,
        guestName: customerDisplayName,
        deliveryDetails: isDelivery ? checkoutForm.address : 'Store Pickup'
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
    }
  };

  return (
    <div style={{ padding: '36px 20px', maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
      
      {/* Floating Shopping Cart Button */}
      <button 
        type="button"
        onClick={() => setIsCartOpen(true)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 999,
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '58px',
          height: '58px',
          cursor: 'pointer'
        }}
        title="View Cart"
      >
        <ShoppingCart size={24} />
        {cart.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#dc2626',
            color: '#fff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #ffffff'
          }}>
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Header section */}
      <section style={{ marginBottom: '28px' }}>
        <span className="badge badge-blue" style={{ marginBottom: '8px' }}>PARTS & ACCESSORIES</span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a' }}>
          Motorcycle Parts Catalog
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px' }}>
          Explore genuine OEM motorcycle components. Earn <strong>1 Club Point</strong> per <strong>₱{pointsSettings.currencyPerPoint}</strong> on every part!
        </p>
      </section>

      {/* Filter and Search Navbar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '14px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '18px'
      }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat} 
              type="button"
              className={`btn ${selectedCategory === cat ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.78rem', borderRadius: '20px', padding: '6px 14px' }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ maxWidth: '320px', width: '100%', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Search parts by name or barcode..." 
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}>
          <Package size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '6px 0', color: '#0f172a' }}>NO PRODUCTS FOUND</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Try searching with a different term or select another category.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const pointsYield = Math.floor(product.price / pointsSettings.currencyPerPoint);

            return (
              <div 
                key={product.id} 
                className="card"
                onClick={() => setSelectedProduct(product)}
                style={{ 
                  cursor: 'pointer',
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%', 
                  transition: 'all 0.15s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Product Card Image Wrapper */}
                <div style={{
                  aspectRatio: '16 / 10',
                  background: '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <>
                      {getCategoryIcon(product.category)}
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, marginTop: '6px', letterSpacing: '1px' }}>
                        BOSS RAP GENUINE
                      </span>
                    </>
                  )}
                  <code style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.92)', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#64748b', backdropFilter: 'blur(4px)' }}>
                    {product.barcode}
                  </code>
                </div>
                
                {/* Product Card Details */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{product.category}</span>
                      {product.stock <= product.lowStockLevel && product.stock > 0 && (
                        <span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>LOW STOCK</span>
                      )}
                    </div>
                    <h4 style={{ margin: '8px 0 4px 0', fontSize: '1rem', lineHeight: '1.3', color: '#0f172a' }}>{product.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>
                  </div>

                  {/* Product Loyalty Points Yield */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.72rem', color: '#166534', fontWeight: 700 }}>
                    <Sparkles size={13} color="#16a34a" />
                    <span>Earns +{pointsYield} Club Points</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#2563eb' }}>
                      ₱{product.price.toLocaleString()}
                    </span>
                    <span className={`badge ${isOutOfStock ? 'badge-red' : product.stock <= product.lowStockLevel ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                      {isOutOfStock ? 'OUT OF STOCK' : `${product.stock} IN STOCK`}
                    </span>
                  </div>
                  
                  {isOutOfStock ? (
                    <button 
                      type="button"
                      className="btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestBackOrder(product);
                      }}
                      style={{ fontSize: '0.75rem', padding: '8px 12px', width: '100%', color: '#ea580c', borderColor: '#fdba74' }}
                    >
                      <Clock size={13} />
                      <span>Reserve Back Order</span>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className="btn-primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      style={{ fontSize: '0.78rem', padding: '9px 14px', width: '100%' }}
                    >
                      <ShoppingCart size={14} />
                      <span>Add to Cart</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth: '580px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>{selectedProduct.category}</span>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>{selectedProduct.name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedProduct(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '18px', marginBottom: '18px' }}>
              <div style={{ aspectRatio: '1', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  getCategoryIcon(selectedProduct.category)
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ margin: 0 }}>DESCRIPTION</label>
                  <p style={{ fontSize: '0.85rem', color: '#334155', margin: '4px 0 0' }}>{selectedProduct.description}</p>
                </div>
                
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div>
                    <label style={{ margin: 0 }}>PRICE</label>
                    <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>₱{selectedProduct.price.toLocaleString()}</strong>
                  </div>
                  <div>
                    <label style={{ margin: 0 }}>LOYALTY REWARD</label>
                    <span className="badge badge-green">+{Math.floor(selectedProduct.price / pointsSettings.currencyPerPoint)} Points</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedProduct.stock > 0 ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <ShoppingCart size={15} />
                  <span>Add to Cart ({selectedProduct.stock} Available)</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, padding: '12px', color: '#ea580c' }}
                  onClick={() => {
                    handleRequestBackOrder(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <Clock size={15} />
                  <span>Reserve Back Order</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART & CHECKOUT MODAL */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal" style={{ maxWidth: '520px', width: '92%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                  {checkoutStep === 'CART' ? `Shopping Cart (${cart.length})` : 'Delivery & Payment'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                <p style={{ fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>Your cart is empty.</p>
                <span style={{ fontSize: '0.82rem' }}>Add products from the catalog to order online or reserve for pickup.</span>
              </div>
            ) : checkoutStep === 'CART' ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1, marginRight: '10px' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>{item.product.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₱{item.product.price.toLocaleString()} each</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ width: '24px', height: '24px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }}
                        >+</button>
                      </div>

                      <strong style={{ fontSize: '0.92rem', color: '#0f172a', marginLeft: '14px', minWidth: '60px', textAlign: 'right' }}>
                        ₱{(item.product.price * item.quantity).toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Promo Code (e.g. WELCOME10)..."
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    style={{ fontSize: '0.82rem', height: '36px' }}
                  />
                  <button type="button" onClick={applyPromo} className="btn" style={{ height: '36px', fontSize: '0.78rem' }}>
                    Apply
                  </button>
                </div>

                {promoError && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '-8px 0 10px 0' }}>{promoError}</p>
                )}

                {/* Totals */}
                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Subtotal:</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>Discount ({appliedPromo?.name}):</span>
                      <span>-₱{discountApplied.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                    <span>Total:</span>
                    <span style={{ color: '#2563eb' }}>₱{total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontSize: '0.75rem', fontWeight: 700 }}>
                    <span>Estimated Rewards:</span>
                    <span>+{cartPointsYield} Points</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutStep('DETAILS')}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '16px', fontSize: '0.9rem' }}
                >
                  <span>Proceed to Details & Payment</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label>Fulfillment Method</label>
                  <select
                    value={checkoutForm.deliveryType}
                    onChange={e => setCheckoutForm({ ...checkoutForm, deliveryType: e.target.value as any })}
                  >
                    <option value="PICKUP">Store Counter Pickup (JP Rizal, Baliuag)</option>
                    <option value="DELIVERY">Delivery via Lalamove / Courier</option>
                  </select>
                </div>

                {!currentUser && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label>Your Name *</label>
                      <input
                        type="text"
                        placeholder="Juan Dela Cruz"
                        value={checkoutForm.guestName}
                        onChange={e => setCheckoutForm({ ...checkoutForm, guestName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label>Contact Phone *</label>
                      <input
                        type="tel"
                        placeholder="0912 345 6789"
                        value={checkoutForm.phone}
                        onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                {checkoutForm.deliveryType === 'DELIVERY' && (
                  <div>
                    <label>Delivery Address *</label>
                    <textarea
                      rows={2}
                      placeholder="House/Street, Barangay, City (e.g. Sulivan, Baliuag, Bulacan)..."
                      value={checkoutForm.address}
                      onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div>
                  <label>Payment Method</label>
                  <select
                    value={checkoutForm.paymentMethod}
                    onChange={e => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value as any })}
                  >
                    <option value="CASH">Cash on Counter / Cash on Delivery</option>
                    <option value="E-WALLET">GCash / Maya E-Wallet</option>
                    <option value="ONLINE BANK">Online Bank Transfer (BDO / BPI)</option>
                  </select>
                </div>

                {checkoutForm.paymentMethod !== 'CASH' && (
                  <div>
                    <label>Transaction Reference # *</label>
                    <input
                      type="text"
                      placeholder="e.g. GCASH-881920"
                      value={checkoutForm.paymentRef}
                      onChange={e => setCheckoutForm({ ...checkoutForm, paymentRef: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#2563eb' }}>₱{total.toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setCheckoutStep('CART')} className="btn" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button type="submit" disabled={checkingOut} className="btn-primary" style={{ flex: 1 }}>
                    {checkingOut ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post-Checkout Receipt Modal */}
      {showReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div id="receipt-print-area" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900 }}>BOSS RAP MOTOR SHOP</h2>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>JP Rizal St., Baliuag, Bulacan</div>
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>ONLINE ORDER CONFIRMATION</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Order #: {showReceipt.id}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tracking: {showReceipt.trackingCode}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Customer: {showReceipt.guestName || currentUser?.name}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {showReceipt.items.map((it: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.name} × {it.quantity}</span>
                    <strong>₱{(it.price * it.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900 }}>
                <span>TOTAL:</span>
                <span>₱{showReceipt.total.toLocaleString()}</span>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                <div>Fulfillment: {showReceipt.fulfillmentType}</div>
                <div>Status: {showReceipt.orderStatus}</div>
                <div style={{ marginTop: '8px', fontWeight: 700, color: '#0f172a' }}>
                  PRESENT THIS CODE AT THE COUNTER FOR PICKUP
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => window.print()} className="btn-primary" style={{ flex: 1 }}>
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
              <button type="button" onClick={() => setShowReceipt(null)} className="btn" style={{ flex: 1 }}>
                Close
              </button>
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
      <section id="shop" style={{ borderTop: '1px solid #e2e8f0' }}><Shop /></section>
      <section id="services" style={{ borderTop: '1px solid #e2e8f0' }}><Services /></section>
      <section id="about" style={{ borderTop: '1px solid #e2e8f0' }}><About /></section>
      <section id="contact" style={{ borderTop: '1px solid #e2e8f0' }}><Contact /></section>
    </div>
  );
};
