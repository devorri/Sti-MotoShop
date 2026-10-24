import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product, SaleItem } from '../context/AppContext';
import { Ean13Barcode, toEan13 } from '../components/Ean13Barcode';
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
  RefreshCw,
  QrCode,
  ExternalLink,
  X,
  Package
} from 'lucide-react';
import { createQrPhPayment, checkPaymentIntentStatus, type PayMongoQrResponse } from '../services/paymongoService';

const EditablePosQty: React.FC<{
  quantity: number;
  maxStock: number;
  onUpdate: (qty: number) => void;
}> = ({ quantity, maxStock, onUpdate }) => {
  const [val, setVal] = useState<string>(String(quantity));

  useEffect(() => {
    setVal(String(quantity));
  }, [quantity]);

  const commit = () => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 0) {
      setVal(String(quantity));
    } else if (parsed === 0) {
      onUpdate(0);
    } else {
      onUpdate(Math.min(maxStock, parsed));
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      <button
        type="button"
        onClick={() => onUpdate(quantity - 1)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem'
        }}
        title="Decrease quantity"
      >-</button>
      <input
        type="number"
        min="1"
        max={maxStock}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        style={{
          width: '46px',
          height: '24px',
          borderRadius: '4px',
          border: '1px solid #cbd5e1',
          textAlign: 'center',
          fontWeight: 800,
          fontSize: '0.82rem',
          padding: '0 2px',
          backgroundColor: '#fff'
        }}
        title="Type bulk quantity and press Enter"
      />
      <button
        type="button"
        onClick={() => onUpdate(quantity + 1)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem'
        }}
        title="Increase quantity"
      >+</button>
    </div>
  );
};

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

  // POS PayMongo QR Ph Modal States
  const [showPosQrModal, setShowPosQrModal] = useState(false);
  const [posQrLoading, setPosQrLoading] = useState(false);
  const [posQrData, setPosQrData] = useState<PayMongoQrResponse | null>(null);
  const [posQrPaid, setPosQrPaid] = useState(false);
  const [posQrError, setPosQrError] = useState<string | null>(null);

  // Cash Tendered & Change calculations
  const [cashTendered, setCashTendered] = useState<string>('');

  // Post-purchase receipt state
  const [showReceipt, setShowReceipt] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  // Product quick-search filter
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');

  // Barcode Preview Modal & Quick Catalog Display states
  const [barcodePreview, setBarcodePreview] = useState<Product | null>(null);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [showBarcodesInCatalog, setShowBarcodesInCatalog] = useState(true);

  // Default active scan target to first available product for immediate scanner testing
  useEffect(() => {
    if (!lastScannedProduct && products.length > 0) {
      setLastScannedProduct(products[0]);
    }
  }, [products, lastScannedProduct]);

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

  const handleGeneratePosQr = async () => {
    if (total <= 0) return;
    setPosQrLoading(true);
    setPosQrError(null);
    setPosQrPaid(false);
    try {
      const res = await createQrPhPayment({
        amountInPhp: total,
        description: `Boss Rap POS (${selectedMemberId || 'Walk-In Customer'})`
      });
      if (res.success && res.qrCodeUrl) {
        setPosQrData(res);
      } else {
        setPosQrError(res.error || 'Failed to generate QR Ph code from PayMongo');
      }
    } catch (e: any) {
      setPosQrError(e.message || 'PayMongo connection error');
    } finally {
      setPosQrLoading(false);
    }
  };

  // Polling for POS QR Ph payment
  useEffect(() => {
    if (!posQrData?.paymentIntentId || posQrPaid || !showPosQrModal) return;

    const interval = setInterval(async () => {
      try {
        const check = await checkPaymentIntentStatus(posQrData.paymentIntentId!);
        if (check.paid) {
          setPosQrPaid(true);
          playCashRegisterChime();
          const ref = check.paymentId || posQrData.paymentIntentId!;
          setPaymentRef(ref);
          clearInterval(interval);
        }
      } catch (err) {
        console.warn('POS QR poll error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [posQrData?.paymentIntentId, posQrPaid, showPosQrModal]);

  // Add product to register cart
  const addProductToRegister = (product: Product, quantityToAdd: number = 1) => {
    setLastScannedProduct(product);
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
      toEan13(p.barcode) === targetBarcode ||
      p.id.toLowerCase() === targetBarcode.toLowerCase() ||
      p.name.toLowerCase() === targetBarcode.toLowerCase()
    );

    if (matchedProduct) {
      setLastScannedProduct(matchedProduct);
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

    if (paymentMethod !== 'CASH') {
      if (!paymentRef.trim()) {
        alert('PLEASE ENTER THE TRANSACTION REFERENCE NUMBER.');
        return;
      }
      if (paymentMethod === 'E-WALLET' && !posQrPaid) {
        const cleanRef = paymentRef.replace(/[\s-]/g, '');
        if (cleanRef.length < 10 || cleanRef.length > 13) {
          alert(`GCash / Maya Reference Number must be between 10 and 13 digits long (current: ${cleanRef.length} digits). Please enter a valid reference.`);
          return;
        }
      }
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
      setPosQrData(null);
      setPosQrPaid(false);
      setShowPosQrModal(false);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ScanBarcode size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', margin: 0, color: '#0f172a', fontWeight: 900 }}>
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

            {/* Scanned / Active Product Image and Infos */}
            {lastScannedProduct && (
              <div style={{
                marginTop: '14px',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  {lastScannedProduct.imageUrl ? (
                    <img
                      src={lastScannedProduct.imageUrl}
                      alt={lastScannedProduct.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid #cbd5e1',
                        flexShrink: 0,
                        backgroundColor: '#ffffff'
                      }}
                      onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#94a3b8'
                    }}>
                      <Package size={26} />
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className="badge badge-blue" style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        {lastScannedProduct.category}
                      </span>
                      <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', color: '#64748b', fontWeight: 600 }}>
                        Barcode: {toEan13(lastScannedProduct.barcode) || lastScannedProduct.barcode}
                      </span>
                    </div>

                    <strong style={{ fontSize: '0.94rem', color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {lastScannedProduct.name}
                    </strong>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                      <span style={{ fontSize: '1rem', color: '#16a34a', fontWeight: 800 }}>
                        ₱{lastScannedProduct.price.toLocaleString()}
                      </span>
                      <span className={`badge ${lastScannedProduct.stock <= 0 ? 'badge-red' : lastScannedProduct.stock <= lastScannedProduct.lowStockLevel ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                        {lastScannedProduct.stock <= 0 ? 'Out of stock' : `${lastScannedProduct.stock} in stock`}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setBarcodePreview(lastScannedProduct)}
                    className="btn"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.76rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: '#2563eb',
                      borderColor: '#bfdbfe',
                      background: '#eff6ff',
                      fontWeight: 600
                    }}
                    title="View barcode label"
                  >
                    <Barcode size={14} />
                    <span>View Label</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addProductToRegister(lastScannedProduct, 1)}
                    className="btn-primary"
                    style={{ padding: '8px 14px', fontSize: '0.76rem', fontWeight: 700 }}
                  >
                    +1 Add
                  </button>
                </div>
              </div>
            )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>QUICK INVENTORY CATALOG</strong>
                <button
                  type="button"
                  onClick={() => setShowBarcodesInCatalog(!showBarcodesInCatalog)}
                  className="btn"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    borderColor: showBarcodesInCatalog ? '#2563eb' : '#cbd5e1',
                    backgroundColor: showBarcodesInCatalog ? '#eff6ff' : '#ffffff',
                    color: showBarcodesInCatalog ? '#1d4ed8' : '#64748b'
                  }}
                  title="Toggle barcode labels on products"
                >
                  <Barcode size={12} />
                  <span>{showBarcodesInCatalog ? 'Barcodes: Visible' : 'Barcodes: Hidden'}</span>
                </button>
              </div>
              
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', maxHeight: '460px', overflowY: 'auto' }}>
              {filteredCatalog.map(product => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && addProductToRegister(product, 1)}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: isOutOfStock ? '#f8fafc' : '#ffffff',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => !isOutOfStock && (e.currentTarget.style.borderColor = '#2563eb')}
                    onMouseLeave={e => !isOutOfStock && (e.currentTarget.style.borderColor = '#cbd5e1')}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      {product.imageUrl && (
                        <div style={{ width: '42px', height: '42px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                          <img
                            src={product.imageUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                          {product.category}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.25' }}>
                          {product.name}
                        </strong>
                      </div>
                    </div>

                    {/* BIG Generated EAN-13 Barcode */}
                    {showBarcodesInCatalog && toEan13(product.barcode) && (
                      <div style={{
                        marginTop: '10px',
                        marginBottom: '8px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #0f172a',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}>
                        <div style={{ width: '100%', maxWidth: '280px', background: '#ffffff' }}>
                          <Ean13Barcode value={product.barcode} height={105} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '6px', padding: '0 2px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLastScannedProduct(product);
                              setBarcodeInput(toEan13(product.barcode) || product.barcode);
                              barcodeInputRef.current?.focus();
                            }}
                            className="btn"
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              cursor: 'pointer'
                            }}
                            title="Load barcode into scanner input"
                          >
                            To Scanner
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBarcodePreview(product);
                            }}
                            className="btn-primary"
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700
                            }}
                            title="View barcode label"
                          >
                            <Barcode size={12} /> View Label
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#16a34a' }}>
                        ₱{product.price.toLocaleString()}
                      </strong>
                      <span className={`badge ${isOutOfStock ? 'badge-red' : product.stock <= product.lowStockLevel ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
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
                cart.map(item => {
                  const prod = products.find(p => p.id === item.productId);
                  const ean = prod?.barcode ? (toEan13(prod.barcode) || prod.barcode) : null;
                  return (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>₱{item.price.toLocaleString()} each</span>
                          {ean && (
                            <span
                              onClick={() => prod && setBarcodePreview(prod)}
                              style={{
                                fontSize: '0.65rem',
                                fontFamily: 'monospace',
                                color: '#2563eb',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: '4px',
                                padding: '1px 5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer'
                              }}
                              title="Click to view/print barcode label"
                            >
                              <Barcode size={10} />
                              {ean}
                            </span>
                          )}
                        </div>
                      </div>

                      <EditablePosQty
                        quantity={item.quantity}
                        maxStock={prod?.stock || 9999}
                        onUpdate={(qty) => updateCartQty(item.productId, qty)}
                      />

                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', marginLeft: '12px', minWidth: '60px', textAlign: 'right' }}>
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </strong>
                    </div>
                  );
                })
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
                <span>TOTAL AMOUNT:</span>
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
              <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem' }}>Transaction Reference # *</label>
                  {paymentMethod === 'E-WALLET' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPosQrModal(true);
                        handleGeneratePosQr();
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.72rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <QrCode size={13} /> Show Customer QR Ph
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={paymentMethod === 'E-WALLET' ? "e.g. Scan QR Ph or enter GCash Ref (10-13 digits)..." : "e.g. BDO-882193..."}
                  value={paymentRef}
                  maxLength={20}
                  onChange={e => setPaymentRef(e.target.value)}
                  required
                  style={{
                    backgroundColor: posQrPaid ? '#f0fdf4' : '#ffffff',
                    borderColor: posQrPaid ? '#86efac' : (
                      paymentMethod === 'E-WALLET' && paymentRef
                        ? (paymentRef.replace(/[\s-]/g, '').length >= 10 && paymentRef.replace(/[\s-]/g, '').length <= 13 ? '#86efac' : '#f59e0b')
                        : '#cbd5e1'
                    ),
                    fontWeight: 700
                  }}
                />
                {paymentMethod === 'E-WALLET' && !posQrPaid && paymentRef && (() => {
                  const cleanRef = paymentRef.replace(/[\s-]/g, '');
                  const isValid = cleanRef.length >= 10 && cleanRef.length <= 13;
                  return (
                    <span style={{ fontSize: '0.72rem', color: isValid ? '#16a34a' : '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                      {isValid ? <CheckCircle2 size={12} color="#16a34a" /> : <AlertCircle size={12} color="#d97706" />}
                      <span>{isValid ? `Valid Reference (${cleanRef.length} digits)` : `GCash Ref: ${cleanRef.length}/10-13 digits`}</span>
                    </span>
                  );
                })()}
                {posQrPaid && (
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <CheckCircle2 size={13} /> Paid via PayMongo QR Ph (Ref: {paymentRef})
                  </span>
                )}
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

      {/* POS Customer Facing QR Ph Modal */}
      {showPosQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            gap: '14px'
          }}>
            <button
              type="button"
              onClick={() => setShowPosQrModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={20} />
            </button>

            <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
              COUNTER-TOP QR PH TERMINAL
            </span>

            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
              Customer Scan & Pay
            </h3>

            <div style={{ backgroundColor: '#dbeafe', padding: '8px 16px', borderRadius: '8px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 700 }}>Total Due:</span>
              <strong style={{ fontSize: '1.3rem', color: '#1d4ed8', fontWeight: 900 }}>₱{total.toLocaleString()}</strong>
            </div>

            {posQrLoading ? (
              <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <RefreshCw className="animate-spin" size={36} color="#2563eb" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e40af' }}>
                  Generating QR Ph code from PayMongo...
                </span>
              </div>
            ) : posQrError ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={32} color="#dc2626" />
                <span style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 700 }}>{posQrError}</span>
                <button type="button" onClick={handleGeneratePosQr} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                  Retry Generation
                </button>
              </div>
            ) : posQrPaid ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={36} color="#16a34a" />
                </div>
                <h4 style={{ margin: 0, color: '#15803d', fontWeight: 900, fontSize: '1.15rem' }}>
                  PAYMENT RECEIVED!
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
                  PayMongo verified payment. Reference saved to POS register.
                </p>
                <div style={{ backgroundColor: '#f0fdf4', padding: '6px 14px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.8rem', fontWeight: 700, color: '#14532d' }}>
                  Ref: {paymentRef}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPosQrModal(false)}
                  className="btn btn-primary"
                  style={{ marginTop: '8px', fontSize: '0.85rem', width: '100%' }}
                >
                  Continue POS Checkout
                </button>
              </div>
            ) : posQrData?.qrCodeUrl ? (
              <>
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  <img
                    src={posQrData.qrCodeUrl}
                    alt="Customer QR Ph"
                    style={{ width: '220px', height: '220px', objectFit: 'contain', display: 'block' }}
                  />
                </div>

                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Customer can scan using GCash, Maya, ShopeePay, or any bank app.
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.74rem',
                  color: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #bfdbfe'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    display: 'inline-block'
                  }} />
                  <span>Awaiting payment... Auto-detects within seconds</span>
                </div>

                {/* Test simulation button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '4px' }}>
                  {posQrData.testUrl && (
                    <a
                      href={posQrData.testUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ fontSize: '0.72rem', padding: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> PayMongo Simulator Page
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const mockRef = posQrData.paymentIntentId || `PAY_POS_${Date.now()}`;
                      setPosQrPaid(true);
                      setPaymentRef(mockRef);
                      playCashRegisterChime();
                    }}
                    style={{
                      fontSize: '0.72rem',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px dashed #94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Simulate Customer Scan Success
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

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
                {showReceipt.items.map((it: any, idx: number) => {
                  const prod = products.find(p => p.id === it.productId);
                  const itemBarcode = prod?.barcode ? (toEan13(prod.barcode) || prod.barcode) : null;
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{it.name} × {it.quantity}</span>
                        <strong>₱{(it.price * it.quantity).toLocaleString()}</strong>
                      </div>
                      {itemBarcode && (
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                          SKU/Barcode: {itemBarcode}
                        </div>
                      )}
                    </div>
                  );
                })}
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

              {/* Receipt / Invoice Scannable Barcode */}
              {(() => {
                const rawDigits = (showReceipt.id || '').replace(/\D/g, '');
                const padded12 = (rawDigits.length >= 12 ? rawDigits.slice(0, 12) : `50${rawDigits}`.padEnd(12, '0')).slice(0, 12);
                const receiptEan = toEan13(padded12);
                return receiptEan ? (
                  <div style={{ marginTop: '10px', marginBottom: '8px', padding: '6px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '170px', margin: '0 auto' }}>
                      <Ean13Barcode value={receiptEan} height={44} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                      Invoice Barcode: {receiptEan}
                    </div>
                  </div>
                ) : null;
              })()}

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

      {/* Product Barcode Label Preview Modal */}
      {barcodePreview && (
        <div className="modal-overlay" onClick={() => setBarcodePreview(null)}>
          <div className="modal" style={{ maxWidth: '600px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span className="badge badge-blue" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                  BARCODE LABEL
                </span>
                <h2 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '4px 0 0', fontWeight: 900 }}>
                  {barcodePreview.name}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  {barcodePreview.category} • ₱{barcodePreview.price.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBarcodePreview(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div id="barcode-label-print-area" style={{
              border: '2px solid #000000',
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <strong style={{ fontSize: '1.15rem', color: '#000000', letterSpacing: '1px', display: 'block', fontWeight: 900 }}>
                  BOSS RAP MOTOR SHOP
                </strong>
                <span style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 700 }}>
                  {barcodePreview.name}
                </span>
                <div style={{ fontSize: '0.98rem', color: '#16a34a', fontWeight: 900, marginTop: '2px' }}>
                  ₱{barcodePreview.price.toLocaleString()}
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: '480px', margin: '8px 0', background: '#ffffff', padding: '10px' }}>
                <Ean13Barcode value={barcodePreview.barcode} height={180} />
              </div>

              <div style={{
                fontSize: '1.35rem',
                color: '#000000',
                fontFamily: "'Courier New', Courier, monospace",
                fontWeight: 900,
                letterSpacing: '4px',
                marginTop: '8px',
                backgroundColor: '#f8fafc',
                padding: '6px 20px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
              }}>
                {toEan13(barcodePreview.barcode)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '18px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setLastScannedProduct(barcodePreview);
                  setBarcodeInput(toEan13(barcodePreview.barcode) || barcodePreview.barcode);
                  setBarcodePreview(null);
                  barcodeInputRef.current?.focus();
                }}
                style={{ flex: 1, fontSize: '0.82rem', padding: '10px', minWidth: '130px', fontWeight: 700 }}
                title="Populate barcode in POS scanner input"
              >
                <ScanBarcode size={15} />
                <span>Input to Terminal</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  addProductToRegister(barcodePreview, 1);
                  setBarcodePreview(null);
                }}
                style={{ flex: 1, fontSize: '0.82rem', padding: '10px', minWidth: '120px', fontWeight: 700 }}
              >
                <ShoppingCart size={15} />
                <span>+ Add to Cart</span>
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => window.print()}
                style={{ flex: 1, fontSize: '0.82rem', padding: '10px', minWidth: '120px', fontWeight: 800 }}
              >
                <Printer size={15} />
                <span>Print Label</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
