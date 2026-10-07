import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product, SaleItem } from '../context/AppContext';
import { 
  Monitor, 
  CornerDownLeft, 
  ShoppingCart, 
  Banknote, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ScanBarcode, 
  Barcode, 
  UserCheck, 
  RefreshCw
} from 'lucide-react';

export const Sales: React.FC = () => {
  const { 
    products, 
    members, 
    promos, 
    pointsSettings, 
    currentUser, 
    recordSale,
    syncWithSupabase 
  } = useAppContext();

  // Scanner state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerNotification, setScannerNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart & Transaction states
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [orderType, setOrderType] = useState<'WALK-IN' | 'ONLINE/FACEBOOK'>('WALK-IN');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'E-WALLET' | 'ONLINE BANK'>('CASH');
  const [paymentRef, setPaymentRef] = useState('');

  // Cash Tendered & Change calculations
  const [cashTendered, setCashTendered] = useState<string>('');

  // Post-purchase receipt state
  const [showReceipt, setShowReceipt] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  // Product quick-search filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  // Focus scanner on load
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Web Audio API POS Beep Synthesizer
  const playBeepSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime); // 1050Hz retail barcode frequency
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const playCashRegisterChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.18, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.18);
      });
    } catch (e) {}
  };

  // Add product to register cart
  const addProductToRegister = (product: Product, quantityToAdd: number = 1) => {
    const existing = cart.find(item => item.productId === product.id);
    const cartQty = existing ? existing.quantity : 0;

    if (product.stock <= cartQty) {
      setScannerNotification({
        text: `OUT OF STOCK: "${product.name}" only has ${product.stock} in inventory.`,
        type: 'error'
      });
      setTimeout(() => setScannerNotification(null), 2500);
      return;
    }

    const availableToAdd = Math.min(quantityToAdd, product.stock - cartQty);
    if (availableToAdd <= 0) return;

    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + availableToAdd }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: availableToAdd,
        price: product.price
      }]);
    }

    playBeepSound();
    setScannerNotification({
      text: `ADDED: ${availableToAdd}× "${product.name}" (₱${product.price.toLocaleString()})`,
      type: 'success'
    });
    setTimeout(() => setScannerNotification(null), 1800);
  };

  // Barcode / Hardware Scanner Submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let targetBarcode = raw;
    let qty = 1;

    // Check quantity multiplier (e.g., 3*501234567890)
    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseInt(parts[0], 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        targetBarcode = parts[1].trim();
      }
    }

    const matchedProduct = products.find(p =>
      p.barcode === targetBarcode ||
      p.id.toLowerCase() === targetBarcode.toLowerCase() ||
      p.name.toLowerCase() === targetBarcode.toLowerCase()
    );

    if (matchedProduct) {
      addProductToRegister(matchedProduct, qty);
      setBarcodeInput('');
    } else {
      setScannerNotification({
        text: `BARCODE NOT FOUND: "${targetBarcode}". Check inventory or register item.`,
        type: 'error'
      });
      setTimeout(() => setScannerNotification(null), 2500);
    }
  };

  const updateCartQty = (productId: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQty <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    if (newQty > product.stock) {
      alert(`STOCK LIMIT: Only ${product.stock} available.`);
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const clearRegister = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from the register?')) {
      setCart([]);
      setCashTendered('');
      barcodeInputRef.current?.focus();
    }
  };

  // Member Search / QR scan
  const handleMemberScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memberInput.trim()) return;

    const query = memberInput.trim().toUpperCase();
    const matchedMember = members.find(m => 
      m.id.toUpperCase() === query || 
      m.name.toUpperCase().includes(query) ||
      m.contact.includes(query)
    );

    if (matchedMember) {
      setSelectedMemberId(matchedMember.id);
      playBeepSound();
      setScannerNotification({
        text: `MEMBER LINKED: ${matchedMember.name} (${matchedMember.id}) - ${matchedMember.points} PTS`,
        type: 'success'
      });
      setTimeout(() => setScannerNotification(null), 2000);
      setMemberInput('');
    } else {
      alert(`MEMBER NOT FOUND FOR: "${memberInput}"`);
    }
  };

  // Totals & Promos
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const activePromos = promos.filter(p => p.active && todayStr >= p.startDate && todayStr <= p.endDate);
  
  let discountApplied = 0;
  let activePromoName = '';
  activePromos.forEach(p => {
    if (subtotal >= p.minSpend) {
      const discountVal = (subtotal * p.discountPercent) / 100;
      if (discountVal > discountApplied) {
        discountApplied = discountVal;
        activePromoName = p.name;
      }
    }
  });

  const total = Math.max(0, subtotal - discountApplied);
  const linkedMember = members.find(m => m.id === selectedMemberId);

  // Cash change calculation
  const numericTendered = parseFloat(cashTendered) || 0;
  const changeDue = paymentMethod === 'CASH' && numericTendered >= total ? numericTendered - total : 0;
  const amountShort = paymentMethod === 'CASH' && numericTendered > 0 && numericTendered < total ? total - numericTendered : 0;

  // Keypad append
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setCashTendered('');
    } else if (val === '00') {
      setCashTendered(prev => (prev ? prev + '00' : '0'));
    } else {
      setCashTendered(prev => prev + val);
    }
  };

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('REGISTER CART IS EMPTY! Scan items first.');
      return;
    }

    if (paymentMethod === 'CASH' && numericTendered < total) {
      alert(`INSUFFICIENT CASH TENDERED! Short by ₱${amountShort.toLocaleString()}`);
      return;
    }

    if (paymentMethod !== 'CASH' && !paymentRef) {
      alert('PLEASE ENTER THE TRANSACTION REFERENCE NUMBER.');
      return;
    }

    setProcessing(true);

    const saleId = `S${Date.now().toString().slice(-8)}`;
    const newSaleData = {
      id: saleId,
      items: [...cart],
      subtotal,
      discountApplied,
      total,
      date: new Date().toISOString(),
      memberId: selectedMemberId || undefined,
      channel: orderType,
      fulfillmentType: orderType === 'ONLINE/FACEBOOK' ? 'STORE PICKUP' as const : 'COUNTER' as const,
      orderStatus: orderType === 'ONLINE/FACEBOOK' ? 'ORDER PLACED' as const : 'COMPLETED' as const,
      trackingCode: `${orderType === 'ONLINE/FACEBOOK' ? 'PICKUP' : 'COUNTER'}-${saleId}`,
      notes: orderType === 'ONLINE/FACEBOOK' 
        ? `ONLINE ORDER RECORDED BY ${currentUser?.name || 'STAFF'}` 
        : `WALK-IN COUNTER SALE BY ${currentUser?.name || 'STAFF'}${linkedMember ? ` (MEMBER: ${linkedMember.name})` : ''}`,
      paymentMethod,
      paymentRef: paymentMethod !== 'CASH' ? paymentRef : undefined
    };

    // Save to Supabase and update state
    const savedSale = await recordSale(newSaleData);
    setProcessing(false);

    if (savedSale) {
      playCashRegisterChime();

      // Show receipt modal
      setShowReceipt({
        ...savedSale,
        cashTendered: paymentMethod === 'CASH' ? numericTendered : total,
        changeDue: paymentMethod === 'CASH' ? changeDue : 0,
        cashierName: currentUser?.name || 'Staff'
      });
      
      // Reset POS states
      setCart([]);
      setSelectedMemberId('');
      setPaymentRef('');
      setCashTendered('');
      setPaymentMethod('CASH');
      barcodeInputRef.current?.focus();
    }
  };

  // Quick Catalog filtered
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredCatalog = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.barcode.includes(catalogSearch);
    const matchCat = catalogCategory === 'ALL' || p.category === catalogCategory;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ width: '100%', margin: '0', padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Status Bar */}
      <div className="card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        padding: '14px 20px',
        borderRadius: '8px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Monitor size={20} color="#2563eb" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>BOSS RAP POS TERMINAL</strong>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>STATION 01 • ACTIVE</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Hardware Barcode Scanner Emulation • Web Audio Chimes • Live Cloud Sync
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            onClick={() => syncWithSupabase()} 
            className="btn" 
            style={{ fontSize: '0.75rem' }}
            title="Refresh database records"
          >
            <RefreshCw size={13} />
            <span>Sync Cloud</span>
          </button>

          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Cashier: <strong style={{ color: '#0f172a' }}>{currentUser?.name || 'Staff'}</strong>
          </span>
        </div>
      </div>

      {/* Floating Scanner Notification Banner */}
      {scannerNotification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '8px',
          backgroundColor: scannerNotification.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${scannerNotification.type === 'success' ? '#86efac' : '#fecaca'}`,
          color: scannerNotification.type === 'success' ? '#15803d' : '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 700,
          animation: 'fadeIn 0.2s ease-in'
        }}>
          {scannerNotification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{scannerNotification.text}</span>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 1fr)', gap: '16px' }}>
        
        {/* Left Column: Barcode Scanner + Quick Catalog */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Scanner Input Card */}
          <div className="card" style={{ padding: '18px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScanBarcode size={18} color="#2563eb" />
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  BARCODE SCANNER EMULATION
                </h3>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Format: <code>[BARCODE]</code> or <code>[QTY]*[BARCODE]</code>
              </span>
            </div>

            <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Barcode size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan barcode or type ID (e.g. 501234567890 or 3*1)..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  style={{ paddingLeft: '38px', fontSize: '0.95rem', fontWeight: 600, height: '42px' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '42px', padding: '0 20px', fontSize: '0.85rem' }}>
                <CornerDownLeft size={16} />
                <span>Enter</span>
              </button>
            </form>
          </div>

          {/* Member Search / Club Link Card */}
          <div className="card" style={{ padding: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="#16a34a" />
                <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>LINK CLUB MEMBER (POINTS REWARD)</strong>
              </div>
              {linkedMember && (
                <button
                  type="button"
                  onClick={() => setSelectedMemberId('')}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Unlink Member
                </button>
              )}
            </div>

            {linkedMember ? (
              <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>
                    {linkedMember.name} ({linkedMember.id})
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                    Contact: {linkedMember.contact} • Address: {linkedMember.address}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                    {linkedMember.points} POINTS
                  </span>
                  <div style={{ fontSize: '0.68rem', color: '#166534', marginTop: '2px' }}>
                    +Earns {Math.floor(total / pointsSettings.currencyPerPoint)} pts on this sale
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleMemberScan} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Scan Member QR or type ID/Name (e.g. M001 or Juan)..."
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  style={{ fontSize: '0.82rem', height: '36px' }}
                />
                <button type="submit" className="btn" style={{ height: '36px', fontSize: '0.78rem' }}>
                  Link
                </button>
              </form>
            )}
          </div>

          {/* Quick Product Grid */}
          <div className="card" style={{ padding: '18px', backgroundColor: '#ffffff', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>QUICK INVENTORY CATALOG</strong>
              
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search item..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  style={{ height: '30px', fontSize: '0.75rem', width: '130px', padding: '4px 8px' }}
                />
                <select
                  value={catalogCategory}
                  onChange={e => setCatalogCategory(e.target.value)}
                  style={{ height: '30px', fontSize: '0.75rem', width: '110px', padding: '4px 8px' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {filteredCatalog.map(product => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addProductToRegister(product, 1)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: isOutOfStock ? '#f8fafc' : '#ffffff',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => !isOutOfStock && (e.currentTarget.style.borderColor = '#2563eb')}
                    onMouseLeave={e => !isOutOfStock && (e.currentTarget.style.borderColor = '#e2e8f0')}
                  >
                    <div>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>
                        {product.category}
                      </span>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.25' }}>
                        {product.name}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#16a34a' }}>
                        ₱{product.price.toLocaleString()}
                      </strong>
                      <span className={`badge ${isOutOfStock ? 'badge-red' : product.stock <= product.lowStockLevel ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '0.65rem' }}>
                        {isOutOfStock ? 'OUT' : `${product.stock} in stock`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Register Cart & Payment Keypad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Cart Card */}
          <div className="card" style={{ padding: '18px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="#2563eb" />
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  CURRENT TRANSACTION CART ({totalItemCount})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearRegister}
                  className="btn-danger"
                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div style={{ minHeight: '160px', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94a3b8' }}>
                  <ScanBarcode size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Register cart is empty.</p>
                  <span style={{ fontSize: '0.75rem' }}>Scan barcode or select an item from catalog.</span>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #f1f5f9',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>₱{item.price.toLocaleString()} each</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700 }}
                      >-</button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '22px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700 }}
                      >+</button>
                    </div>

                    <strong style={{ fontSize: '0.88rem', color: '#0f172a', marginLeft: '12px', minWidth: '60px', textAlign: 'right' }}>
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </strong>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal ({totalItemCount} items):</span>
                <strong style={{ color: '#0f172a' }}>₱{subtotal.toLocaleString()}</strong>
              </div>

              {discountApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Promo Discount ({activePromoName}):</span>
                  <strong>-₱{discountApplied.toLocaleString()}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                <span>TOTAL DUE:</span>
                <span style={{ color: '#2563eb' }}>₱{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment & Checkout Card */}
          <div className="card" style={{ padding: '18px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                PAYMENT METHOD & TENDER
              </h4>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setOrderType('WALK-IN')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: orderType === 'WALK-IN' ? '#2563eb' : '#cbd5e1',
                    backgroundColor: orderType === 'WALK-IN' ? '#eff6ff' : '#ffffff',
                    color: orderType === 'WALK-IN' ? '#1d4ed8' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  WALK-IN
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('ONLINE/FACEBOOK')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: orderType === 'ONLINE/FACEBOOK' ? '#2563eb' : '#cbd5e1',
                    backgroundColor: orderType === 'ONLINE/FACEBOOK' ? '#eff6ff' : '#ffffff',
                    color: orderType === 'ONLINE/FACEBOOK' ? '#1d4ed8' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  FB/PICKUP
                </button>
              </div>
            </div>

            {/* Method selection */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
              {(['CASH', 'E-WALLET', 'ONLINE BANK'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: paymentMethod === method ? '#2563eb' : '#cbd5e1',
                    backgroundColor: paymentMethod === method ? '#eff6ff' : '#ffffff',
                    color: paymentMethod === method ? '#1d4ed8' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Cash Tender Keypad */}
            {paymentMethod === 'CASH' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Cash Tendered (₱)..."
                    value={cashTendered}
                    onChange={e => setCashTendered(e.target.value)}
                    style={{ fontSize: '1rem', fontWeight: 700, height: '42px', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setCashTendered(total.toString())}
                    className="btn"
                    style={{ height: '42px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    Exact
                  </button>
                </div>

                {/* Quick denomination chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {['100', '200', '500', '1000'].map(denom => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => setCashTendered(denom)}
                      style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer' }}
                    >
                      ₱{denom}
                    </button>
                  ))}
                </div>

                {/* Touch POS Keypad */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '4px' }}>
                  {['7', '8', '9', 'C', '4', '5', '6', '00', '1', '2', '3', '0'].map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      style={{
                        padding: '6px',
                        fontSize: '0.78rem',
                        fontWeight: key === 'C' ? 800 : 600,
                        backgroundColor: key === 'C' ? '#fee2e2' : '#f8fafc',
                        color: key === 'C' ? '#b91c1c' : '#1e293b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Change display */}
                {numericTendered > 0 && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: numericTendered >= total ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${numericTendered >= total ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    color: numericTendered >= total ? '#15803d' : '#b91c1c'
                  }}>
                    <span>{numericTendered >= total ? 'CHANGE DUE:' : 'AMOUNT SHORT:'}</span>
                    <span>₱{numericTendered >= total ? changeDue.toLocaleString() : amountShort.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '14px' }}>
                <label>Transaction Reference # *</label>
                <input
                  type="text"
                  placeholder="e.g. GCASH-192837 or BDO-8821..."
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={processing || cart.length === 0}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '0.95rem', fontWeight: 800 }}
            >
              {processing ? (
                <span>Writing to Supabase Cloud...</span>
              ) : (
                <>
                  <Banknote size={18} />
                  <span>COMPLETE SALE (₱{total.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div id="receipt-print-area" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900 }}>BOSS RAP MOTOR SHOP</h2>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>JP Rizal St., Baliuag, Bulacan</div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>Hotline: (0905) 123-4567 • Cashier POS 01</div>
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>COUNTER SALES INVOICE</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Invoice #: {showReceipt.id}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date: {new Date(showReceipt.date).toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Cashier: {showReceipt.cashierName}</div>
                {showReceipt.memberId && (
                  <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>
                    Member ID: {showReceipt.memberId}
                  </div>
                )}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>₱{showReceipt.subtotal.toLocaleString()}</span>
              </div>
              {showReceipt.discountApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
                  <span>Discount:</span>
                  <span>-₱{showReceipt.discountApplied.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, margin: '6px 0' }}>
                <span>TOTAL:</span>
                <span>₱{showReceipt.total.toLocaleString()}</span>
              </div>

              {showReceipt.paymentMethod === 'CASH' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span>Cash Tendered:</span>
                    <span>₱{showReceipt.cashTendered?.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span>Change Due:</span>
                    <span>₱{showReceipt.changeDue?.toLocaleString()}</span>
                  </div>
                </>
              )}

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                <div>Payment Method: {showReceipt.paymentMethod}</div>
                {showReceipt.paymentRef && <div>Ref: {showReceipt.paymentRef}</div>}
                <div style={{ marginTop: '8px', fontWeight: 700, color: '#0f172a' }}>
                  THANK YOU FOR YOUR PATRONAGE!
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => window.print()} className="btn-primary" style={{ flex: 1 }}>
                <Printer size={15} />
                <span>Print Invoice</span>
              </button>
              <button type="button" onClick={() => setShowReceipt(null)} className="btn" style={{ flex: 1 }}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
