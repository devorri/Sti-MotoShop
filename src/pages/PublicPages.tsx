import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, uploadFileToBucket } from '../supabase';
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
  CheckCircle2,
  LogIn,
  UserCheck,
  Lock,
  Truck,
  Store,
  CreditCard,
  Wallet,
  AlertCircle,
  Trash2,
  ArrowRight,
  MapPin,
  Phone,
  Tag,
  Info,
  ShieldCheck,
  Navigation,
  ExternalLink,
  QrCode,
  RefreshCw,
  Check,
  Mail,
  Upload,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { sendOrderConfirmationSms } from '../services/smsService';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { createQrPhPayment, checkPaymentIntentStatus, type PayMongoQrResponse } from '../services/paymongoService';

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

// Inline editable quantity component with typing, minus, plus, and live validation
const EditableCartQty: React.FC<{
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
          width: '26px',
          height: '26px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          color: '#334155'
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
          width: '52px',
          height: '26px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          textAlign: 'center',
          fontWeight: 800,
          fontSize: '0.85rem',
          padding: '0 2px',
          backgroundColor: '#ffffff',
          color: '#0f172a'
        }}
        title="Type bulk quantity and press Enter"
      />
      <button
        type="button"
        onClick={() => onUpdate(quantity + 1)}
        style={{
          width: '26px',
          height: '26px',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          color: '#334155'
        }}
        title="Increase quantity"
      >+</button>
    </div>
  );
};

export const Shop: React.FC = () => {
  const { 
    products, 
    setProducts,
    promos, 
    currentUser, 
    members,
    pointsSettings,
    recordSale,
    addBackOrder,
    syncWithSupabase,
    cart,
    setCart,
    clearCart
  } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Bulk order quantity tracking for catalog cards & product details modal
  const [cardQtys, setCardQtys] = useState<Record<string, number>>({});
  const [modalQty, setModalQty] = useState<number>(1);

  // Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartSuccessModal, setCartSuccessModal] = useState<{
    product: Product;
    quantity: number;
    totalItems: number;
    totalSubtotal: number;
  } | null>(null);
  
  // Checkout flow states
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'DETAILS' | 'PAYMENT'>('CART');
  const [checkoutForm, setCheckoutForm] = useState({
    deliveryType: 'PICKUP' as 'PICKUP' | 'DELIVERY',
    address: '',
    phone: '',
    email: '',
    paymentMethod: 'E-WALLET' as 'CASH' | 'E-WALLET' | 'ONLINE BANK',
    paymentRef: '',
    receiptUrl: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file (PNG, JPG, JPEG, WEBP).'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('File size exceeds 10MB limit. Please choose a smaller image.'); return; }
    const localUrl = URL.createObjectURL(file);
    setReceiptFile(file);
    setReceiptPreview(localUrl);
    setUploadingReceipt(true);
    setReceiptUploadError(null);
    try {
      const publicUrl = await uploadFileToBucket(file, 'receipts');
      if (publicUrl) {
        setCheckoutForm(prev => ({ ...prev, receiptUrl: publicUrl }));
        setReceiptPreview(publicUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => setCheckoutForm(prev => ({ ...prev, receiptUrl: reader.result as string }));
        reader.readAsDataURL(file);
        setReceiptUploadError('Notice: Bucket upload pending, screenshot saved locally for order verification.');
      }
    } catch (err: any) {
      console.error('Receipt upload error:', err);
      setReceiptUploadError('Upload failed. Image attached locally for admin inspection.');
    } finally { setUploadingReceipt(false); }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setCheckoutForm(prev => ({ ...prev, receiptUrl: '' }));
    setReceiptUploadError(null);
  };
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);

  // PayMongo QR Ph payment states
  const [qrPhMode, setQrPhMode] = useState<'QRPH' | 'MANUAL'>('QRPH');
  const [paymongoLoading, setPaymongoLoading] = useState(false);
  const [paymongoQr, setPaymongoQr] = useState<PayMongoQrResponse | null>(null);
  const [qrPaid, setQrPaid] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatusMessage('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingGps(true);
    setGpsStatusMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCheckoutForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setGpsStatusMessage(`GPS Location pinned! (${lat}, ${lng})`);
      },
      (err) => {
        setLocatingGps(false);
        const defaultLat = 14.9542;
        const defaultLng = 120.9008;
        setCheckoutForm(prev => ({ ...prev, latitude: defaultLat, longitude: defaultLng }));
        setGpsStatusMessage(`Could not access device GPS (${err.message}). Set to Baliuag center coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Keep catalog and inventory live in real time
  useEffect(() => {
    syncWithSupabase();

    const channel = supabase
      .channel('shop_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as any;
            setProducts(prev => prev.map(p => p.id === updated.id ? {
              ...p,
              stock: Number(updated.stock) || 0,
              price: Number(updated.price) || p.price
            } : p));
          } else {
            syncWithSupabase();
          }
        }
      )
      .subscribe();

    const handleFocus = () => {
      syncWithSupabase();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncWithSupabase, setProducts]);

  // Pre-fill phone and address for logged-in member
  useEffect(() => {
    if (currentUser) {
      const currentMember = members.find(m => m.id === currentUser.memberId);
      if (currentMember) {
        setCheckoutForm(prev => ({
          ...prev,
          phone: prev.phone || currentMember.contact || '',
          address: prev.address || currentMember.address || ''
        }));
      }
    }
  }, [currentUser, members]);
  
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

  // Strict live stock verification against cloud database
  const verifyLiveCartStock = async (silent: boolean = false): Promise<boolean> => {
    if (cart.length === 0) return true;

    try {
      const productIds = cart.map(i => i.product.id);
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('id, name, stock, price')
        .in('id', productIds);

      if (error || !dbProducts) {
        if (!silent) {
          alert('Could not verify current stock with server. Please check your internet connection.');
        }
        return false;
      }

      let hasConflict = false;
      const conflictMessages: string[] = [];

      const verifiedCart = cart.map(item => {
        const fresh = dbProducts.find(p => p.id === item.product.id);
        const liveStock = fresh ? (Number(fresh.stock) || 0) : 0;
        const livePrice = fresh && fresh.price !== undefined ? Number(fresh.price) : item.product.price;

        if (liveStock <= 0) {
          hasConflict = true;
          conflictMessages.push(`• "${item.product.name}" is now OUT OF STOCK and was removed from your cart.`);
          return null;
        }

        if (item.quantity > liveStock) {
          hasConflict = true;
          conflictMessages.push(`• "${item.product.name}" only has ${liveStock} unit(s) remaining (requested ${item.quantity}). Your cart quantity has been updated to ${liveStock}.`);
          return { ...item, quantity: liveStock, product: { ...item.product, stock: liveStock, price: livePrice } };
        }

        return { ...item, product: { ...item.product, stock: liveStock, price: livePrice } };
      }).filter(Boolean) as { product: Product; quantity: number }[];

      if (hasConflict) {
        setCart(verifiedCart);
        // Update local products state with fresh stock
        setProducts(prev => prev.map(p => {
          const fresh = dbProducts.find(db => db.id === p.id);
          return fresh ? { ...p, stock: Number(fresh.stock) || 0, price: Number(fresh.price) || p.price } : p;
        }));
        if (!silent) {
          alert(`INVENTORY UPDATE DETECTED:\n\n${conflictMessages.join('\n')}\n\nYour cart has been adjusted to available stock.`);
        }
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error verifying stock:', err);
      return false;
    }
  };

  // Auto-verify live inventory on mount if items are already in persisted cart
  useEffect(() => {
    if (cart.length > 0) {
      verifyLiveCartStock(true);
    }
  }, []);

  const handleOpenCart = async () => {
    setIsCartOpen(true);
    await verifyLiveCartStock(false);
  };

  const addToCart = async (product: Product, quantityToAdd: number = 1) => {
    if (!currentUser) {
      alert('GUEST ORDERING DISABLED: Please sign in or register as a member to order online.');
      navigate('/login');
      return;
    }

    if (currentUser.role === 'RIDER') {
      alert('Rider accounts cannot place orders. Please use your Rider Deliveries portal to manage parcel fulfillment.');
      return;
    }

    if (quantityToAdd <= 0) return;

    // Always fetch live inventory from cloud
    const { data: dbProd } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', product.id)
      .single();

    const liveStock = dbProd ? (Number(dbProd.stock) || 0) : product.stock;

    // Update local products stock if different
    if (liveStock !== product.stock) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: liveStock } : p));
    }

    const existing = cart.find(item => item.product.id === product.id);
    const cartQty = existing ? existing.quantity : 0;
    const requestedTotal = cartQty + quantityToAdd;

    if (liveStock < requestedTotal) {
      alert(`INSUFFICIENT STOCK: "${product.name}" only has ${liveStock} unit(s) remaining in stock (you already have ${cartQty} in your cart).`);
      return;
    }

    const nextQty = requestedTotal;
    let nextCart: { product: Product; quantity: number }[];
    if (existing) {
      nextCart = cart.map(item => 
        item.product.id === product.id ? { ...item, quantity: nextQty, product: { ...item.product, stock: liveStock } } : item
      );
    } else {
      nextCart = [...cart, { product: { ...product, stock: liveStock }, quantity: quantityToAdd }];
    }
    setCart(nextCart);

    const totalItems = nextCart.reduce((sum, item) => sum + item.quantity, 0);
    const totalSubtotal = nextCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    setCartSuccessModal({
      product: { ...product, stock: liveStock },
      quantity: nextQty,
      totalItems,
      totalSubtotal
    });
  };

  useEffect(() => {
    if (!cartSuccessModal) return;
    const timer = setTimeout(() => {
      setCartSuccessModal(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [cartSuccessModal]);

  const updateQuantity = async (productId: string, qty: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    if (qty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
      return;
    }

    // Fetch live inventory from cloud
    const { data: dbProd } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', productId)
      .single();

    const liveStock = dbProd ? (Number(dbProd.stock) || 0) : item.product.stock;

    if (liveStock < qty) {
      alert(`INSUFFICIENT STOCK: "${item.product.name}" only has ${liveStock} unit(s) available in inventory.`);
      setCart(cart.map(i => 
        i.product.id === productId ? { ...i, quantity: Math.min(i.quantity, liveStock), product: { ...i.product, stock: liveStock } } : i
      ));
      return;
    }

    setCart(cart.map(i => 
      i.product.id === productId ? { ...i, quantity: qty, product: { ...i.product, stock: liveStock } } : i
    ));
  };

  // Back order reservation request
  const handleRequestBackOrder = async (product: Product) => {
    if (!currentUser) {
      alert('Please log in or register to reserve back order items.');
      navigate('/login');
      return;
    }

    const customerName = currentUser.name;
    const contact = prompt('Please enter your phone number to notify when restocked:', checkoutForm.phone);
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

  const applyPromo = async () => {
    setPromoError('');
    if (!promoCode) return;

    if (!currentUser?.memberId) {
      setPromoError('PLEASE SIGN IN WITH A MEMBER ACCOUNT TO USE A VOUCHER.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const match = promos.find(p => p.name.toUpperCase() === promoCode.toUpperCase() && p.active && todayStr >= p.startDate && todayStr <= p.endDate);

    if (!match) {
      setPromoError('INVALID OR EXPIRED PROMO CODE.');
      return;
    }
    if (subtotal < match.minSpend) {
      setPromoError(`MINIMUM SPEND OF ₱${match.minSpend} REQUIRED FOR THIS PROMO.`);
      return;
    }

    if (match.firstOrderOnly) {
      const { count, error } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', currentUser.memberId);
      if (error) {
        setPromoError('COULD NOT VERIFY YOUR ORDER HISTORY. PLEASE TRY AGAIN.');
        return;
      }
      if ((count || 0) > 0) {
        setPromoError('THIS VOUCHER IS FOR A CUSTOMER\'S FIRST ORDER ONLY.');
        return;
      }
    }

    if (match.singleUsePerCustomer || match.firstOrderOnly) {
      const { data, error } = await supabase
        .from('promo_redemptions')
        .select('id')
        .eq('promo_id', match.id)
        .eq('member_id', currentUser.memberId)
        .maybeSingle();
      if (error) {
        setPromoError('COULD NOT VERIFY VOUCHER USAGE. PLEASE TRY AGAIN.');
        return;
      }
      if (data) {
        setPromoError('YOU HAVE ALREADY USED THIS VOUCHER.');
        return;
      }
    }

    setAppliedPromo(match);
  };

  // Smart Dynamic Delivery Fee Multiplier (Quantity & Bulky/Weight Surcharge)
  const isDelivery = checkoutForm.deliveryType === 'DELIVERY';

  // Identify bulky/heavy motorcycle parts (Tires, Exhaust Pipes, Blocks/Heads, Suspensions, Wheels)
  const isBulkyProduct = (name: string, category: string) => {
    const text = `${name} ${category}`.toLowerCase();
    return (
      text.includes('tire') || 
      text.includes('gulong') || 
      text.includes('exhaust') || 
      text.includes('pipe') || 
      text.includes('suspension') || 
      text.includes('shock') || 
      text.includes('cylinder') || 
      text.includes('block') || 
      text.includes('engine & drivetrain') || 
      text.includes('battery') || 
      text.includes('rim') || 
      text.includes('wheel') ||
      text.includes('cvt set') ||
      text.includes('torque drive')
    );
  };

  // Total parcel weight in kilograms (from database product.weightKg)
  const totalWeightKg = cart.reduce((acc, item) => {
    const unitWeight = item.product.weightKg !== undefined && item.product.weightKg > 0 ? item.product.weightKg : 0.5;
    return acc + (unitWeight * item.quantity);
  }, 0);

  // Count bulky / oversized items (from database product.isBulky or category detection)
  const bulkyUnitsCount = cart.reduce((acc, item) => {
    const isBulky = Boolean(item.product.isBulky || isBulkyProduct(item.product.name, item.product.category));
    return isBulky ? acc + item.quantity : acc;
  }, 0);

  // Delivery Pricing Formula (Shopee / Lazada Style Weight & Bulky Cargo Tier):
  // Base: ₱100 (Covers standard motorcycle parcel for up to 2.0 kg)
  // Excess weight surcharge: +₱25 per kg beyond 2.0 kg
  // Bulky / Heavy cargo handling surcharge: +₱40 per bulky item (Tires, Exhausts, Suspensions)
  const baseDeliveryFee = 100;
  const excessWeightKg = Math.max(0, totalWeightKg - 2);
  const weightSurcharge = Math.ceil(excessWeightKg) * 25;
  const bulkySurcharge = bulkyUnitsCount * 40;

  const deliveryFee = isDelivery 
    ? (baseDeliveryFee + weightSurcharge + bulkySurcharge) 
    : 0;

  const productDiscount = appliedPromo?.discountType === 'FREE_SHIPPING'
    ? 0
    : appliedPromo ? (subtotal * appliedPromo.discountPercent) / 100 : 0;
  const shippingDiscount = appliedPromo?.discountType === 'FREE_SHIPPING' && isDelivery ? deliveryFee : 0;
  const discountApplied = productDiscount + shippingDiscount;
  const total = Math.max(0, subtotal - productDiscount + deliveryFee - shippingDiscount);

  // Total points that this cart will yield
  const cartPointsYield = Math.floor(total / pointsSettings.currencyPerPoint);

  const handleGeneratePaymongoQr = async () => {
    if (total <= 0) return;
    setPaymongoLoading(true);
    setQrError(null);
    try {
      const res = await createQrPhPayment({
        amountInPhp: total,
        description: `Boss Rap Motor Shop (${currentUser?.name || 'Customer'})`
      });
      if (res.success && res.qrCodeUrl) {
        setPaymongoQr(res);
      } else {
        setQrError(res.error || 'Failed to generate QR Ph code from PayMongo.');
      }
    } catch (err: any) {
      setQrError(err.message || 'Error communicating with PayMongo');
    } finally {
      setPaymongoLoading(false);
    }
  };

  // Auto-generate QR Ph when entering payment step
  useEffect(() => {
    if (checkoutStep === 'PAYMENT' && checkoutForm.paymentMethod === 'E-WALLET' && qrPhMode === 'QRPH') {
      if ((!paymongoQr || paymongoQr.amount !== total) && !paymongoLoading && !qrPaid && total > 0) {
        handleGeneratePaymongoQr();
      }
    }
  }, [checkoutStep, checkoutForm.paymentMethod, qrPhMode, total]);

  // Polling for QR Ph payment confirmation
  useEffect(() => {
    if (!paymongoQr?.paymentIntentId || qrPaid || checkoutStep !== 'PAYMENT') return;

    const interval = setInterval(async () => {
      try {
        const check = await checkPaymentIntentStatus(paymongoQr.paymentIntentId!);
        if (check.paid) {
          setQrPaid(true);
          const ref = check.paymentId || paymongoQr.paymentIntentId!;
          setCheckoutForm(prev => ({ ...prev, paymentRef: ref }));
          clearInterval(interval);
        }
      } catch (e) {
        console.warn('QR Ph status poll warning:', e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymongoQr?.paymentIntentId, qrPaid, checkoutStep]);

  // Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('GUEST ORDERING DISABLED: Please sign in or create an account to place an order.');
      navigate('/login');
      return;
    }

    if (cart.length === 0) return;

    // Strict pre-checkout cloud stock verification
    const isStockValid = await verifyLiveCartStock();
    if (!isStockValid) {
      return;
    }

    if (!checkoutForm.phone.trim()) {
      alert('PLEASE PROVIDE YOUR CONTACT PHONE NUMBER.');
      return;
    }

    if (checkoutForm.deliveryType === 'DELIVERY' && !checkoutForm.address.trim()) {
      alert('PLEASE PROVIDE A DELIVERY ADDRESS.');
      return;
    }

    if (checkoutForm.deliveryType === 'DELIVERY' && checkoutForm.paymentMethod === 'CASH') {
      alert('CASH ON DELIVERY IS NOT AVAILABLE. Please pay via GCash, Maya, or Online Bank Transfer.');
      return;
    }

    if (appliedPromo?.discountType === 'FREE_SHIPPING' && checkoutForm.deliveryType !== 'DELIVERY') {
      alert('THIS FREE SHIPPING VOUCHER CAN ONLY BE USED WITH RIDER DELIVERY.');
      return;
    }

    if (checkoutForm.paymentMethod !== 'CASH') {
      if (!checkoutForm.paymentRef.trim()) {
        alert('Payment Required: Please enter your transaction reference number before generating your receipt.');
        return;
      }
      if (checkoutForm.paymentMethod === 'E-WALLET' && !qrPaid) {
        const cleanRef = checkoutForm.paymentRef.replace(/[\s-]/g, '');
        if (cleanRef.length < 10 || cleanRef.length > 13) {
          alert(`GCash / Maya Reference Number must be between 10 and 13 digits long (current: ${cleanRef.length} digits). Please enter the reference number from your GCash SMS or receipt.`);
          return;
        }
      }
      if (!checkoutForm.receiptUrl && !receiptPreview && !qrPaid) {
        alert('Payment Receipt Required: Please upload a screenshot or photo of your payment receipt so the Admin can verify your order.');
        return;
      }
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

    const customerDisplayName = currentUser.name;
    const customerPhone = checkoutForm.phone.trim();
    const finalReceiptUrl = checkoutForm.paymentMethod !== 'CASH' 
      ? (checkoutForm.receiptUrl || receiptPreview || undefined) 
      : undefined;

    const newSalePayload = {
      id: saleId,
      items: saleItems,
      subtotal,
      discountApplied,
      promoId: appliedPromo?.id,
      promoCode: appliedPromo?.name,
      deliveryFee,
      total,
      date: new Date().toISOString(),
      memberId: currentUser.memberId || undefined,
      customerName: currentUser.name,
      customerPhone,
      shippingAddress: isDelivery ? checkoutForm.address.trim().toUpperCase() : undefined,
      latitude: isDelivery && checkoutForm.latitude ? checkoutForm.latitude : undefined,
      longitude: isDelivery && checkoutForm.longitude ? checkoutForm.longitude : undefined,
      channel: 'ONLINE/FACEBOOK' as const,
      fulfillmentType: isDelivery ? 'DELIVERY' as const : 'STORE PICKUP' as const,
      orderStatus: isDelivery ? 'PREPARING' as const : 'ORDER PLACED' as const,
      trackingCode: `${isDelivery ? 'RIDER' : 'PICKUP'}-${saleId}`,
      paymentMethod: checkoutForm.paymentMethod,
      paymentRef: checkoutForm.paymentMethod !== 'CASH' ? checkoutForm.paymentRef : undefined,
      receiptUrl: finalReceiptUrl,
      notes: isDelivery 
        ? `MEMBER: ${customerDisplayName}. PHONE: ${customerPhone}. SHIPPING: BOSS RAP RIDER (+₱${deliveryFee}). ADDR: ${checkoutForm.address.toUpperCase()}${checkoutForm.latitude && checkoutForm.longitude ? `. GPS: ${checkoutForm.latitude}, ${checkoutForm.longitude}` : ''}`
        : `MEMBER: ${customerDisplayName}. PHONE: ${customerPhone}. STORE PICKUP AT BALIUAG`
    };

    // Save to Supabase and update state
    const savedSale = await recordSale(newSalePayload);
    setCheckingOut(false);

    if (savedSale) {
      // Send Order Confirmation SMS in background if valid phone number provided
      if (customerPhone && customerPhone !== 'N/A') {
        sendOrderConfirmationSms({
          phone: customerPhone,
          orderId: saleId,
          total,
          paymentMethod: checkoutForm.paymentMethod,
          fulfillmentType: isDelivery ? 'Boss Rap Rider Delivery' : 'Store Pickup',
          customerName: customerDisplayName
        }).catch(err => console.warn('SMS dispatch error:', err));
      }

      // Send Order Confirmation Email via EmailJS if email is available
      const targetEmail = checkoutForm.email?.trim() || (currentUser?.username?.includes('@') ? currentUser.username.trim() : '');
      if (targetEmail && targetEmail.includes('@')) {
        sendOrderConfirmationEmail({
          email: targetEmail,
          orderId: saleId,
          toName: customerDisplayName,
          items: cart.map(c => ({
            name: c.product.name,
            quantity: c.quantity,
            price: c.product.price,
            image_url: c.product.imageUrl
          })),
          shippingFee: deliveryFee,
          taxAmount: 0,
          total: total
        }).catch(err => console.warn('EmailJS confirmation error:', err));
      }

      setShowReceipt({
        ...savedSale,
        deliveryFee,
        customerName: customerDisplayName,
        memberId: currentUser.memberId,
        receiptUrl: finalReceiptUrl,
        latitude: isDelivery ? checkoutForm.latitude : undefined,
        longitude: isDelivery ? checkoutForm.longitude : undefined,
        deliveryDetails: isDelivery ? checkoutForm.address : 'Store Pickup'
      });

      clearCart();
      setAppliedPromo(null);
      setPromoCode('');
      setIsCartOpen(false);
      setCheckoutStep('CART');
      setPaymongoQr(null);
      setQrPaid(false);
      setQrError(null);
      setCheckoutForm({
        deliveryType: 'PICKUP',
        address: '',
        phone: '',
        email: '',
        paymentMethod: 'E-WALLET',
        paymentRef: '',
        receiptUrl: '',
        latitude: null,
        longitude: null
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      setUploadingReceipt(false);
      setReceiptUploadError(null);
    } else {
      // Re-verify cart & update stock if rejected
      await verifyLiveCartStock();
    }
  };

  return (
    <div style={{ padding: '36px 20px', maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>
      
      {/* Floating Shopping Cart Button (Only for Logged-In Members & Admins) */}
      {currentUser && currentUser.role !== 'RIDER' && (
        <button 
          type="button"
          onClick={handleOpenCart}
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
      )}

      {/* Delivery Rider Mode Notice */}
      {currentUser?.role === 'RIDER' && (
        <div style={{
          backgroundColor: '#f5f3ff',
          border: '1px solid #ddd6fe',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Truck size={20} color="#7c3aed" />
            </div>
            <div>
              <strong style={{ color: '#6d28d9', fontSize: '0.9rem', display: 'block' }}>
                Delivery Rider Account Active
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#7c3aed' }}>
                You are currently signed in as an in-house delivery rider. Online customer ordering is disabled.
              </span>
            </div>
          </div>
          <Link to="/rider/deliveries" className="btn-primary" style={{ backgroundColor: '#7c3aed', borderColor: '#6d28d9', fontSize: '0.82rem', padding: '8px 16px', textDecoration: 'none' }}>
            Open Deliveries Feed →
          </Link>
        </div>
      )}

      {/* Guest Notice Banner */}
      {!currentUser && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              flexShrink: 0
            }}>
              <Lock size={20} />
            </div>
            <div>
              <strong style={{ color: '#1e40af', fontSize: '0.95rem', display: 'block' }}>
                Member-Exclusive Online Ordering
              </strong>
              <span style={{ fontSize: '0.82rem', color: '#3b82f6', marginTop: '2px', display: 'block' }}>
                Guest ordering is disabled. Please log in or create an account to order online and earn loyalty points.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link 
              to="/login" 
              className="btn-primary" 
              style={{ fontSize: '0.82rem', padding: '9px 18px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogIn size={14} />
              <span>Sign In to Order</span>
            </Link>
            <Link 
              to="/register" 
              className="btn" 
              style={{ fontSize: '0.82rem', padding: '9px 16px', textDecoration: 'none', backgroundColor: '#ffffff', borderColor: '#bfdbfe', color: '#1e40af' }}
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

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
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock <= product.lowStockLevel && product.stock > 0;
            const pointsYield = Math.floor(product.price / pointsSettings.currencyPerPoint);
            const inCart = cart.find(c => c.product.id === product.id);
            const currentCardQty = cardQtys[product.id] ?? 1;

            return (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => {
                  setSelectedProduct(product);
                  setModalQty(cardQtys[product.id] || 1);
                }}
                style={{ cursor: 'pointer' }}
              >
                {/* Product Card Image Wrapper */}
                <div className="product-card-media">
                  {/* Floating Category Chip */}
                  <span className="product-chip product-chip-category">
                    {product.category}
                  </span>

                  {/* Floating Stock Chip with Lucide Icon (NO EMOJIS) */}
                  <span className={`product-chip product-chip-stock ${isOutOfStock ? 'out-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                    {isOutOfStock ? (
                      <>
                        <X size={11} strokeWidth={2.5} />
                        <span>Sold Out</span>
                      </>
                    ) : isLowStock ? (
                      <>
                        <AlertCircle size={11} strokeWidth={2.5} />
                        <span>Low Stock ({product.stock})</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        <span>{product.stock} in stock</span>
                      </>
                    )}
                  </span>

                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      {getCategoryIcon(product.category)}
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 800, marginTop: '8px', letterSpacing: '1.2px' }}>
                        GENUINE SPEC
                      </span>
                    </div>
                  )}

                  {/* Barcode Chip */}
                  <span className="product-chip-barcode">
                    {product.barcode}
                  </span>
                </div>
                
                {/* Product Card Details */}
                <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <h4 style={{ 
                      margin: '0 0 6px 0', 
                      fontSize: '1.05rem', 
                      fontWeight: 800,
                      lineHeight: '1.35', 
                      color: '#0f172a',
                      letterSpacing: '-0.01em'
                    }}>
                      {product.name}
                    </h4>

                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: '#64748b', 
                      lineHeight: '1.5', 
                      margin: '0 0 10px 0', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden' 
                    }}>
                      {product.description}
                    </p>

                    {/* Rider Club Points micro-tag */}
                    <div style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      padding: '3px 8px', 
                      backgroundColor: '#f0fdf4', 
                      borderRadius: '6px', 
                      border: '1px solid #bbf7d0', 
                      fontSize: '0.72rem', 
                      color: '#166534', 
                      fontWeight: 700 
                    }}>
                      <Sparkles size={12} color="#16a34a" />
                      <span>+{pointsYield} Rider Club Pts</span>
                    </div>
                  </div>

                  {/* Price & Cart status row */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', display: 'block' }}>
                          Price
                        </span>
                        <span style={{ fontWeight: 900, fontSize: '1.35rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
                          ₱{product.price.toLocaleString()}
                        </span>
                      </div>
                      {inCart && (
                        <span style={{
                          fontSize: '0.74rem',
                          color: '#2563eb',
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShoppingCart size={12} />
                          {inCart.quantity} in cart
                        </span>
                      )}
                    </div>
                    
                    {isOutOfStock ? (
                      <button 
                        type="button"
                        className="btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestBackOrder(product);
                        }}
                        style={{ fontSize: '0.8rem', padding: '10px 14px', width: '100%', color: '#ea580c', borderColor: '#fdba74' }}
                      >
                        <Clock size={14} />
                        <span>Reserve Back Order</span>
                      </button>
                    ) : currentUser?.role === 'RIDER' ? (
                      <button 
                        type="button"
                        className="btn" 
                        disabled
                        style={{ fontSize: '0.75rem', padding: '10px', width: '100%', opacity: 0.6, cursor: 'not-allowed', color: '#6d28d9' }}
                      >
                        <Truck size={14} />
                        <span>Driver Mode (Ordering Disabled)</span>
                      </button>
                    ) : !currentUser ? (
                      <button 
                        type="button"
                        className="btn-primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/login');
                        }}
                        style={{ fontSize: '0.82rem', padding: '10px 14px', width: '100%', backgroundColor: '#0f172a', borderColor: '#0f172a' }}
                      >
                        <LogIn size={15} />
                        <span>Sign In to Order</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Sleek Stepper Capsule */}
                        <div 
                          className="qty-stepper-capsule"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="qty-stepper-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardQtys(prev => ({
                                ...prev,
                                [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                              }));
                            }}
                            title="Decrease quantity"
                          >−</button>
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={currentCardQty}
                            className="qty-stepper-input"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const val = parseInt(e.target.value, 10);
                              setCardQtys(prev => ({
                                ...prev,
                                [product.id]: isNaN(val) ? 1 : Math.max(1, Math.min(product.stock, val))
                              }));
                            }}
                            title={`Max available stock: ${product.stock}`}
                          />
                          <button
                            type="button"
                            className="qty-stepper-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCardQtys(prev => ({
                                ...prev,
                                [product.id]: Math.min(product.stock, (prev[product.id] || 1) + 1)
                              }));
                            }}
                            title="Increase quantity"
                          >+</button>
                        </div>

                        {/* Add to Cart button */}
                        <button 
                          type="button"
                          className="btn-primary" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const qty = cardQtys[product.id] || 1;
                            addToCart(product, qty);
                          }}
                          style={{ 
                            fontSize: '0.82rem', 
                            padding: '9px 12px', 
                            flex: 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '6px',
                            borderRadius: '8px'
                          }}
                        >
                          <ShoppingCart size={15} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCT DETAILS / QUICK ORDER MODAL */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" style={{ maxWidth: '640px', width: '92%', padding: '24px', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{selectedProduct.category}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>SKU: {selectedProduct.barcode}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedProduct(null)} 
                style={{ 
                  border: '1px solid #e2e8f0', 
                  background: '#f8fafc', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: '#64748b' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: '22px', marginBottom: '20px' }}>
              <div>
                <div style={{ 
                  aspectRatio: '1', 
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden',
                  marginBottom: '10px'
                }}>
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

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '5px', 
                  padding: '6px', 
                  backgroundColor: '#f0fdf4', 
                  borderRadius: '6px', 
                  border: '1px solid #bbf7d0',
                  fontSize: '0.68rem',
                  color: '#166534',
                  fontWeight: 700
                }}>
                  <ShieldCheck size={13} color="#16a34a" />
                  <span>100% Genuine Spec</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 900, lineHeight: 1.3 }}>
                    {selectedProduct.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    {selectedProduct.description}
                  </p>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '10px 14px' 
                }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>PRICE</span>
                    <strong style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: 900 }}>₱{selectedProduct.price.toLocaleString()}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>CLUB REWARD</span>
                    <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={12} color="#16a34a" />
                      +{Math.floor(selectedProduct.price / pointsSettings.currencyPerPoint)} Pts
                    </span>
                  </div>
                </div>

                {/* Stock Level status card (clean Lucide icon, NO EMOJIS) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: selectedProduct.stock <= 0 ? '#fef2f2' : selectedProduct.stock <= selectedProduct.lowStockLevel ? '#fefce8' : '#f0fdf4',
                  border: `1px solid ${selectedProduct.stock <= 0 ? '#fecaca' : selectedProduct.stock <= selectedProduct.lowStockLevel ? '#fef08a' : '#bbf7d0'}`,
                  fontSize: '0.78rem'
                }}>
                  <Package size={15} color={selectedProduct.stock <= 0 ? '#dc2626' : selectedProduct.stock <= selectedProduct.lowStockLevel ? '#a16207' : '#15803d'} />
                  <span style={{ color: selectedProduct.stock <= 0 ? '#dc2626' : selectedProduct.stock <= selectedProduct.lowStockLevel ? '#a16207' : '#15803d', fontWeight: 700 }}>
                    {selectedProduct.stock <= 0 
                      ? 'Currently Out of Stock' 
                      : `${selectedProduct.stock} ${selectedProduct.stock === 1 ? 'unit' : 'units'} available in stock`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper & Price Subtotal for Modal */}
            {selectedProduct.stock > 0 && currentUser && currentUser.role !== 'RIDER' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                marginBottom: '18px'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                    SELECT QUANTITY
                  </span>
                  <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                    Subtotal: <span style={{ color: '#2563eb', fontWeight: 900 }}>₱{(selectedProduct.price * modalQty).toLocaleString()}</span>
                  </strong>
                </div>

                <div className="qty-stepper-capsule" style={{ height: '40px' }}>
                  <button
                    type="button"
                    className="qty-stepper-btn"
                    style={{ width: '36px', fontSize: '1.1rem' }}
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                    title="Decrease"
                  >−</button>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.stock}
                    value={modalQty}
                    className="qty-stepper-input"
                    style={{ width: '54px', fontSize: '1rem' }}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setModalQty(isNaN(val) ? 1 : Math.max(1, Math.min(selectedProduct.stock, val)));
                    }}
                    title="Type how many you want to buy"
                  />
                  <button
                    type="button"
                    className="qty-stepper-btn"
                    style={{ width: '36px', fontSize: '1.1rem' }}
                    onClick={() => setModalQty(Math.min(selectedProduct.stock, modalQty + 1))}
                    title="Increase"
                  >+</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {selectedProduct.stock > 0 ? (
                currentUser?.role === 'RIDER' ? (
                  <button
                    type="button"
                    className="btn"
                    disabled
                    style={{ flex: 1, padding: '12px', opacity: 0.6, cursor: 'not-allowed', color: '#6d28d9' }}
                  >
                    <span>Driver Mode: Customer Ordering Disabled</span>
                  </button>
                ) : !currentUser ? (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: '10px' }}
                    onClick={() => {
                      setSelectedProduct(null);
                      navigate('/login');
                    }}
                  >
                    <LogIn size={16} />
                    <span>Sign In to Order</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, padding: '13px', borderRadius: '10px', fontSize: '0.92rem', fontWeight: 800 }}
                    onClick={() => {
                      addToCart(selectedProduct, modalQty);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCart size={16} />
                    <span>Add {modalQty} {modalQty > 1 ? 'Units' : 'Unit'} to Cart • ₱{(selectedProduct.price * modalQty).toLocaleString()}</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, padding: '12px', color: '#ea580c', borderRadius: '10px' }}
                  onClick={() => {
                    handleRequestBackOrder(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <Clock size={16} />
                  <span>Reserve Back Order</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD TO CART SUCCESSION POPUP MODAL */}
      {cartSuccessModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setCartSuccessModal(null)}
          style={{ zIndex: 10000 }}
        >
          <div 
            className="modal" 
            style={{ 
              maxWidth: '560px', 
              width: '92%', 
              padding: '30px 28px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }} 
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              type="button" 
              onClick={() => setCartSuccessModal(null)}
              aria-label="Close"
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                border: '1px solid #cbd5e1', 
                background: '#f8fafc', 
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer', 
                color: '#334155'
              }}
            >
              <X size={18} />
            </button>

            {/* Header Success Banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '22px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                border: '2px solid #86efac',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                flexShrink: 0
              }}>
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.45rem', color: '#0f172a', fontWeight: 900 }}>
                  Added to Cart!
                </h3>
                <span style={{ fontSize: '0.92rem', color: '#16a34a', fontWeight: 700 }}>
                  Item successfully added to your shopping bag
                </span>
              </div>
            </div>

            {/* Product Item Card Preview */}
            <div style={{
              display: 'flex',
              gap: '16px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {cartSuccessModal.product.imageUrl ? (
                  <img
                    src={cartSuccessModal.product.imageUrl}
                    alt={cartSuccessModal.product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  getCategoryIcon(cartSuccessModal.product.category)
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="badge badge-blue" style={{ fontSize: '0.72rem', padding: '3px 8px', marginBottom: '6px' }}>
                  {cartSuccessModal.product.category}
                </span>
                <strong style={{ 
                  display: 'block', 
                  fontSize: '1.05rem', 
                  color: '#0f172a', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.3
                }}>
                  {cartSuccessModal.product.name}
                </strong>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                    Qty in Cart: <strong style={{ color: '#0f172a', fontSize: '1rem' }}>{cartSuccessModal.quantity}</strong>
                  </span>
                  <span className={`badge ${cartSuccessModal.product.stock <= cartSuccessModal.product.lowStockLevel ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '0.74rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Package size={13} strokeWidth={2.5} />
                    <span>{cartSuccessModal.product.stock} in stock</span>
                  </span>
                  <span style={{ fontSize: '1.2rem', color: '#2563eb', fontWeight: 900 }}>
                    ₱{cartSuccessModal.product.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Cart Summary Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid #bfdbfe',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={20} color="#2563eb" />
                <span style={{ fontSize: '0.95rem', color: '#1e40af', fontWeight: 700 }}>
                  Cart Total ({cartSuccessModal.totalItems} {cartSuccessModal.totalItems === 1 ? 'item' : 'items'}):
                </span>
              </div>
              <strong style={{ fontSize: '1.3rem', color: '#1e40af', fontWeight: 900 }}>
                ₱{cartSuccessModal.totalSubtotal.toLocaleString()}
              </strong>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn"
                style={{ 
                  flex: 1, 
                  padding: '13px 16px', 
                  fontSize: '0.92rem', 
                  fontWeight: 700, 
                  justifyContent: 'center',
                  backgroundColor: '#ffffff'
                }}
                onClick={() => setCartSuccessModal(null)}
              >
                Continue Shopping
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ 
                  flex: 1.3, 
                  padding: '13px 18px', 
                  fontSize: '0.95rem', 
                  fontWeight: 800, 
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={() => {
                  setCartSuccessModal(null);
                  handleOpenCart();
                  setCheckoutStep('CART');
                }}
              >
                <ShoppingCart size={18} />
                <span>View Cart & Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* SHOPPING CART & CHECKOUT MODAL */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="modal" style={{ maxWidth: '560px', width: '92%', borderRadius: '20px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}>
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 900 }}>
                    {checkoutStep === 'CART' 
                      ? `Shopping Cart (${cart.length})` 
                      : checkoutStep === 'DETAILS' 
                        ? 'Delivery & Order Details' 
                        : 'Online Payment Verification'}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Boss Rap Motor Shop Secure Portal</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCartOpen(false)} 
                style={{ 
                  border: '1px solid #e2e8f0', 
                  background: '#f8fafc', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: '#64748b' 
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Checkout Step Progress Bar */}
            {cart.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '8px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: checkoutStep === 'CART' ? '#2563eb' : '#dcfce7',
                    color: checkoutStep === 'CART' ? '#ffffff' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    {checkoutStep !== 'CART' ? <CheckCircle2 size={13} strokeWidth={2.5} /> : '1'}
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: checkoutStep === 'CART' ? 800 : 600, color: checkoutStep === 'CART' ? '#0f172a' : '#64748b' }}>
                    Cart
                  </span>
                </div>

                <div style={{ height: '1px', flex: 1, backgroundColor: '#cbd5e1', margin: '0 8px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: checkoutStep === 'DETAILS' ? '#2563eb' : checkoutStep === 'PAYMENT' ? '#dcfce7' : '#e2e8f0',
                    color: checkoutStep === 'DETAILS' ? '#ffffff' : checkoutStep === 'PAYMENT' ? '#16a34a' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    {checkoutStep === 'PAYMENT' ? <CheckCircle2 size={13} strokeWidth={2.5} /> : '2'}
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: checkoutStep === 'DETAILS' ? 800 : 600, color: checkoutStep === 'DETAILS' ? '#0f172a' : '#64748b' }}>
                    Delivery
                  </span>
                </div>

                <div style={{ height: '1px', flex: 1, backgroundColor: '#cbd5e1', margin: '0 8px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: checkoutStep === 'PAYMENT' ? '#2563eb' : '#e2e8f0',
                    color: checkoutStep === 'PAYMENT' ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    3
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: checkoutStep === 'PAYMENT' ? 800 : 600, color: checkoutStep === 'PAYMENT' ? '#0f172a' : '#64748b' }}>
                    Payment
                  </span>
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                <Package size={44} style={{ opacity: 0.35, marginBottom: '12px' }} />
                <p style={{ fontWeight: 800, margin: '0 0 6px 0', color: '#0f172a', fontSize: '1.05rem' }}>Your cart is empty</p>
                <span style={{ fontSize: '0.84rem' }}>Add genuine parts and tuning kits from the catalog to order online.</span>
              </div>
            ) : checkoutStep === 'CART' ? (
              <div>
                {/* Cart Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{
                      padding: '12px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0
                      }}>
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                        ) : (
                          <Package size={20} color="#94a3b8" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product.name}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₱{item.product.price.toLocaleString()} each</span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: item.product.stock <= item.product.lowStockLevel ? '#a16207' : '#15803d',
                            backgroundColor: item.product.stock <= item.product.lowStockLevel ? '#fefce8' : '#f0fdf4',
                            border: `1px solid ${item.product.stock <= item.product.lowStockLevel ? '#fef08a' : '#bbf7d0'}`,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Package size={11} strokeWidth={2.5} />
                            <span>Stock: {item.product.stock}</span>
                          </span>
                        </div>
                      </div>

                      <EditableCartQty
                        quantity={item.quantity}
                        maxStock={item.product.stock}
                        onUpdate={(qty) => updateQuantity(item.product.id, qty)}
                      />

                      <strong style={{ fontSize: '0.92rem', color: '#0f172a', minWidth: '65px', textAlign: 'right' }}>
                        ₱{(item.product.price * item.quantity).toLocaleString()}
                      </strong>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 0)}
                        title="Remove from cart"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px'
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Tag size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. WELCOME10)..."
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      style={{ fontSize: '0.82rem', height: '38px', paddingLeft: '32px' }}
                    />
                  </div>
                  <button type="button" onClick={() => void applyPromo()} className="btn" style={{ height: '38px', fontSize: '0.8rem', padding: '0 16px' }}>
                    Apply
                  </button>
                </div>

                {promoError && (
                  <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '-8px 0 10px 0' }}>{promoError}</p>
                )}

                {/* Price Breakdown Card */}
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px', 
                  fontSize: '0.85rem' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Items Subtotal:</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                      <span>{appliedPromo?.discountType === 'FREE_SHIPPING' ? `Voucher (${appliedPromo?.name} — free shipping)` : `Voucher (${appliedPromo?.name})`}:</span>
                      <span>-₱{discountApplied.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={13} color="#16a34a" /> Estimated Rewards:
                    </span>
                    <span>+{cartPointsYield} Rider Points</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Total:</span>
                    <span style={{ color: '#2563eb' }}>₱{total.toLocaleString()}</span>
                  </div>
                </div>

                {!currentUser ? (
                  <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                      Please sign in as a registered member to place your order.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIsCartOpen(false); navigate('/login'); }}
                      className="btn-primary"
                      style={{ width: '100%', padding: '11px', fontSize: '0.88rem', borderRadius: '10px' }}
                    >
                      <LogIn size={15} />
                      <span>Sign In / Register to Checkout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const isValid = await verifyLiveCartStock();
                      if (isValid) {
                        setCheckoutStep('DETAILS');
                      }
                    }}
                    className="btn-primary"
                    style={{ width: '100%', padding: '13px', marginTop: '16px', fontSize: '0.92rem', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <span>Proceed to Delivery & Details</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            ) : checkoutStep === 'DETAILS' ? (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!currentUser) {
                    alert('GUEST ORDERING DISABLED: Please sign in to place an order.');
                    navigate('/login');
                    return;
                  }
                  if (!checkoutForm.phone.trim()) {
                    alert('PLEASE PROVIDE YOUR CONTACT PHONE.');
                    return;
                  }
                  if (checkoutForm.deliveryType === 'DELIVERY' && !checkoutForm.address.trim()) {
                    alert('PLEASE PROVIDE A DELIVERY ADDRESS.');
                    return;
                  }

                  const isValid = await verifyLiveCartStock();
                  if (!isValid) return;

                  if (checkoutForm.paymentMethod === 'CASH') {
                    if (checkoutForm.deliveryType === 'DELIVERY') {
                      alert('CASH ON DELIVERY IS NOT AVAILABLE. Online payment is required for deliveries.');
                      return;
                    }
                    handleCheckout(e);
                  } else {
                    setCheckoutStep('PAYMENT');
                  }
                }} 
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Member Identity Display */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    flexShrink: 0
                  }}>
                    <UserCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                      Ordering As Registered Member
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{currentUser?.name}</strong>
                    {currentUser?.memberId && (
                      <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px' }}>
                        ID: {currentUser.memberId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fulfillment Method Selection Cards */}
                <div>
                  <label style={{ marginBottom: '8px', fontSize: '0.8rem', fontWeight: 800 }}>Fulfillment Method *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      className={`selectable-option-card ${checkoutForm.deliveryType === 'PICKUP' ? 'selected' : ''}`}
                      onClick={() => setCheckoutForm(prev => ({ ...prev, deliveryType: 'PICKUP' }))}
                    >
                      <Store size={22} color={checkoutForm.deliveryType === 'PICKUP' ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block' }}>Store Pickup</strong>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>FREE (JP Rizal, Baliuag)</span>
                      </div>
                    </div>

                    <div
                      className={`selectable-option-card ${checkoutForm.deliveryType === 'DELIVERY' ? 'selected' : ''}`}
                      onClick={() => setCheckoutForm(prev => ({
                        ...prev,
                        deliveryType: 'DELIVERY',
                        paymentMethod: prev.paymentMethod === 'CASH' ? 'E-WALLET' : prev.paymentMethod
                      }))}
                    >
                      <Truck size={22} color={checkoutForm.deliveryType === 'DELIVERY' ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block' }}>Rider Delivery</strong>
                        <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700 }}>+₱100 Base Fee</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 800 }}>
                    <Phone size={13} color="#2563eb" />
                    <span>Contact Phone (for Rider Delivery / SMS Updates) *</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0912 345 6789"
                    value={checkoutForm.phone}
                    onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    required
                    style={{ height: '40px' }}
                  />
                </div>

                {/* Contact Email (EmailJS Order Confirmation) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 800 }}>
                    <Mail size={13} color="#2563eb" />
                    <span>Email Address (for Itemized Order Confirmation Email)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={checkoutForm.email}
                    onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                    style={{ height: '40px' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Receive your official order receipt and invoice directly to your inbox.
                  </span>
                </div>

                {/* Delivery Address */}
                {checkoutForm.deliveryType === 'DELIVERY' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 800 }}>
                        <MapPin size={13} color="#2563eb" />
                        <span>Delivery Address (Drop-off Destination) *</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="House/Street, Barangay, Municipality (e.g. Sulivan, Baliuag, Bulacan)..."
                        value={checkoutForm.address}
                        onChange={e => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                        required
                      />
                    </div>

                    {/* Exact GPS Pin Capture for Rider Navigation */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Navigation size={13} color="#2563eb" />
                          <span>Exact GPS Pin for Delivery Rider (Google Maps)</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={locatingGps}
                          className="btn"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            borderColor: '#bfdbfe',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700
                          }}
                        >
                          <Navigation size={12} className={locatingGps ? 'spin' : ''} />
                          <span>{locatingGps ? 'Locating...' : 'Pin My Location (GPS)'}</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Latitude</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 14.954200"
                            value={checkoutForm.latitude ?? ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setCheckoutForm(prev => ({ ...prev, latitude: isNaN(val) ? null : val }));
                            }}
                            style={{ height: '34px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Longitude</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 120.900800"
                            value={checkoutForm.longitude ?? ''}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setCheckoutForm(prev => ({ ...prev, longitude: isNaN(val) ? null : val }));
                            }}
                            style={{ height: '34px', fontSize: '0.8rem', fontFamily: 'monospace' }}
                          />
                        </div>
                      </div>

                      {checkoutForm.latitude && checkoutForm.longitude ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} color="#16a34a" />
                            <span>GPS Pin Set: {checkoutForm.latitude.toFixed(5)}, {checkoutForm.longitude.toFixed(5)}</span>
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${checkoutForm.latitude},${checkoutForm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <span>Open Google Maps Pin</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                          Click "Pin My Location (GPS)" or enter coordinates so our rider can navigate turn-by-turn straight to your location.
                        </span>
                      )}

                      {gpsStatusMessage && (
                        <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#0369a1' }}>
                          {gpsStatusMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Method Selection Cards */}
                <div>
                  <label style={{ marginBottom: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                    Payment Method (No Cash on Delivery) *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      className={`selectable-option-card ${checkoutForm.paymentMethod === 'E-WALLET' ? 'selected' : ''}`}
                      onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'E-WALLET' }))}
                    >
                      <Wallet size={20} color={checkoutForm.paymentMethod === 'E-WALLET' ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block' }}>GCash / Maya E-Wallet</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Instant QR / Mobile Number transfer with reference</span>
                      </div>
                    </div>

                    <div
                      className={`selectable-option-card ${checkoutForm.paymentMethod === 'ONLINE BANK' ? 'selected' : ''}`}
                      onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'ONLINE BANK' }))}
                    >
                      <CreditCard size={20} color={checkoutForm.paymentMethod === 'ONLINE BANK' ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block' }}>Online Bank Transfer</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>BDO Unibank / BPI via Instapay</span>
                      </div>
                    </div>

                    {checkoutForm.deliveryType === 'PICKUP' && (
                      <div
                        className={`selectable-option-card ${checkoutForm.paymentMethod === 'CASH' ? 'selected' : ''}`}
                        onClick={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'CASH' }))}
                      >
                        <Store size={20} color={checkoutForm.paymentMethod === 'CASH' ? '#16a34a' : '#64748b'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: '0.86rem', color: '#0f172a', display: 'block' }}>Cash on Counter</strong>
                          <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>Pay at store cashier upon pickup</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {checkoutForm.deliveryType === 'DELIVERY' && (
                    <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, display: 'block', marginTop: '6px' }}>
                      Notice: No Cash on Delivery (COD). All delivery orders require online payment prior to rider dispatch.
                    </span>
                  )}
                </div>

                {/* Surcharge & Totals Breakdown */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                    <span>Items Subtotal:</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>
                      <span>{appliedPromo?.discountType === 'FREE_SHIPPING' ? `Voucher (${appliedPromo?.name} — free shipping)` : `Voucher (${appliedPromo?.name})`}:</span>
                      <span>-₱{discountApplied.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: isDelivery ? '#2563eb' : '#64748b', fontWeight: isDelivery ? 700 : 500 }}>
                      <span>Delivery Fee:</span>
                      <span>{isDelivery ? `+₱${deliveryFee.toLocaleString()} (Rider Delivery)` : 'FREE (Store Pickup)'}</span>
                    </div>
                    {isDelivery && (bulkySurcharge > 0 || weightSurcharge > 0) && (
                      <div style={{ fontSize: '0.72rem', color: '#1e40af', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: '6px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={13} color="#2563eb" style={{ flexShrink: 0 }} />
                        <span>
                          Base (up to 2 kg): ₱100
                          {weightSurcharge > 0 && ` • Weight (${totalWeightKg.toFixed(1)} kg): +₱${weightSurcharge.toLocaleString()}`}
                          {bulkySurcharge > 0 && ` • Bulky cargo (${bulkyUnitsCount}x): +₱${bulkySurcharge.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: '#2563eb' }}>₱{total.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setCheckoutStep('CART')} className="btn" style={{ flex: 1, borderRadius: '10px' }}>
                    Back to Cart
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1.5, fontWeight: 800, borderRadius: '10px' }}>
                    {checkoutForm.paymentMethod === 'CASH' 
                      ? 'Confirm Counter Pickup' 
                      : 'Proceed to Payment →'}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 3: ONLINE PAYMENT VERIFICATION SCREEN */
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    flexShrink: 0
                  }}>
                    <Wallet size={22} color="#16a34a" />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#166534', display: 'block', fontWeight: 800 }}>
                      PAYMENT SUBMISSION
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                      Submit your payment reference for store verification. Your official receipt becomes available after approval.
                    </span>
                  </div>
                </div>

                {checkoutForm.paymentMethod === 'E-WALLET' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Method sub-toggle: QR Ph vs Manual */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setQrPhMode('QRPH')}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: qrPhMode === 'QRPH' ? '#2563eb' : 'transparent',
                          color: qrPhMode === 'QRPH' ? '#ffffff' : '#475569',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <QrCode size={16} /> PayMongo QR Ph (Instant)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrPhMode('MANUAL')}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: qrPhMode === 'MANUAL' ? '#2563eb' : 'transparent',
                          color: qrPhMode === 'MANUAL' ? '#ffffff' : '#475569',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Wallet size={16} /> Manual GCash / Maya
                      </button>
                    </div>

                    {qrPhMode === 'QRPH' ? (
                      /* Dynamic PayMongo QR Ph View */
                      <div style={{
                        backgroundColor: qrPaid ? '#f0fdf4' : '#eff6ff',
                        border: `2px solid ${qrPaid ? '#16a34a' : '#2563eb'}`,
                        borderRadius: '16px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '12px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span className={`badge ${qrPaid ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                            {qrPaid ? '✓ PAYMENT CONFIRMED' : 'OFFICIAL QR PH STANDARDS'}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: qrPaid ? '#15803d' : '#1d4ed8' }}>
                            {qrPaid ? 'Instant Clearance' : 'PayMongo Gateway'}
                          </span>
                        </div>

                        {paymongoLoading ? (
                          <div style={{ padding: '36px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <RefreshCw className="animate-spin" size={32} color="#2563eb" />
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e40af' }}>
                              Generating official QR Ph code for ₱{total.toLocaleString()}...
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Connecting securely to PayMongo API
                            </span>
                          </div>
                        ) : qrError ? (
                          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <AlertCircle size={32} color="#dc2626" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b91c1c' }}>
                              {qrError}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={handleGeneratePaymongoQr}
                                className="btn btn-primary"
                                style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                              >
                                Try Again
                              </button>
                              <button
                                type="button"
                                onClick={() => setQrPhMode('MANUAL')}
                                className="btn"
                                style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                              >
                                Switch to Manual Transfer
                              </button>
                            </div>
                          </div>
                        ) : qrPaid ? (
                          <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CheckCircle2 size={32} color="#16a34a" />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#166534', fontWeight: 900 }}>
                              PAYMENT RECEIVED & VERIFIED!
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d', maxWidth: '320px' }}>
                              PayMongo has confirmed payment of <strong>₱{total.toLocaleString()}</strong>. Your order is ready to place!
                            </p>
                            <div style={{ backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.78rem', color: '#14532d', fontWeight: 700, marginTop: '4px' }}>
                              Ref: {checkoutForm.paymentRef}
                            </div>
                          </div>
                        ) : paymongoQr?.qrCodeUrl ? (
                          <>
                            {/* QR Ph Image Container */}
                            <div style={{
                              backgroundColor: '#ffffff',
                              padding: '14px',
                              borderRadius: '16px',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                              border: '1px solid #cbd5e1',
                              position: 'relative'
                            }}>
                              <img
                                src={paymongoQr.qrCodeUrl}
                                alt="PayMongo QR Ph Code"
                                style={{
                                  width: '210px',
                                  height: '210px',
                                  objectFit: 'contain',
                                  display: 'block'
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: '6px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.04em'
                              }}>
                                QR PH • BANGKO SENTRAL
                              </div>
                            </div>

                            {/* Amount badge */}
                            <div style={{ backgroundColor: '#dbeafe', padding: '8px 18px', borderRadius: '10px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 700 }}>Scan Exact Amount:</span>
                              <strong style={{ fontSize: '1.25rem', color: '#1d4ed8', fontWeight: 900 }}>₱{total.toLocaleString()}</strong>
                            </div>

                            {/* Accepted banks / apps strip */}
                            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.4 }}>
                              <span style={{ fontWeight: 700, color: '#334155' }}>Accepted e-wallets & banks:</span><br />
                              GCash • Maya • ShopeePay • BDO • BPI • UnionBank • SeaBank • GoTyme
                            </div>

                            {/* Live polling indicator */}
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
                              <span>Listening for payment... Auto-updates on scan</span>
                            </div>

                            {/* Test mode helpers */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '4px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                              {paymongoQr.testUrl && (
                                <a
                                  href={paymongoQr.testUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    backgroundColor: '#f8fafc',
                                    color: '#2563eb',
                                    border: '1px solid #cbd5e1',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <ExternalLink size={12} /> Open PayMongo Test Mode Payment Simulator
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const mockRef = paymongoQr.paymentIntentId || `PAY_TEST_${Date.now()}`;
                                  setQrPaid(true);
                                  setCheckoutForm(prev => ({ ...prev, paymentRef: mockRef }));
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
                                ⚡ Test Quick-Approve (Click to Simulate Scan Success)
                              </button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={handleGeneratePaymongoQr}
                            className="btn btn-primary"
                            style={{ fontSize: '0.82rem', padding: '10px 18px', borderRadius: '8px' }}
                          >
                            <QrCode size={16} /> Generate Dynamic QR Ph Code
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Manual GCash / Maya Card */
                      <div style={{
                        backgroundColor: '#eff6ff',
                        border: '2px solid #2563eb',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-blue" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                            GCASH / MAYA OFFICIAL ACCOUNT
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700 }}>
                            Express Send
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 700 }}>GCASH / MAYA NUMBER</span>
                            <strong style={{ fontSize: '1.15rem', color: '#0f172a', letterSpacing: '0.04em' }}>0912 345 6789</strong>
                            <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'block', fontWeight: 700, marginTop: '2px' }}>
                              BOSS RAP MOTOR SHOP / RAPHAEL G.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('09123456789');
                              alert('Copied 09123456789 to clipboard!');
                            }}
                            className="btn"
                            style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px' }}
                          >
                            Copy #
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#dbeafe', padding: '10px 14px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 700 }}>Exact Amount to Send:</span>
                          <strong style={{ fontSize: '1.3rem', color: '#1d4ed8', fontWeight: 900 }}>₱{total.toLocaleString()}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '2px solid #059669',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-green" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        BDO / BPI ONLINE BANK TRANSFER
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>
                        Instapay / Pesonet
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: 700 }}>BDO UNIBANK ACCOUNT</span>
                        <strong style={{ fontSize: '1.15rem', color: '#0f172a', letterSpacing: '0.04em' }}>0012 3456 7890</strong>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', display: 'block', fontWeight: 700, marginTop: '2px' }}>
                          BOSS RAP MOTOR SHOP
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('001234567890');
                          alert('Copied BDO Account 001234567890 to clipboard!');
                        }}
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px' }}
                      >
                        Copy #
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#a7f3d0', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 700 }}>Exact Amount to Transfer:</span>
                      <strong style={{ fontSize: '1.3rem', color: '#047857', fontWeight: 900 }}>₱{total.toLocaleString()}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', margin: 0 }}>
                      Transaction Reference Number {checkoutForm.paymentMethod === 'E-WALLET' && !qrPaid ? '(10 - 13 Digits) *' : '*'}
                    </label>
                    {qrPaid ? (
                      <span className="badge badge-green" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                        <Check size={11} style={{ marginRight: 2 }} /> Confirmed by PayMongo — awaiting admin approval
                      </span>
                    ) : checkoutForm.paymentMethod === 'E-WALLET' && (() => {
                      const cleanRef = checkoutForm.paymentRef.replace(/[\s-]/g, '');
                      const isValid = cleanRef.length >= 10 && cleanRef.length <= 13;
                      if (!cleanRef) return null;
                      return (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          color: isValid ? '#16a34a' : '#d97706',
                          backgroundColor: isValid ? '#f0fdf4' : '#fffbeb',
                          border: `1px solid ${isValid ? '#bbf7d0' : '#fde68a'}`,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          {isValid ? <CheckCircle2 size={11} color="#16a34a" /> : <AlertCircle size={11} color="#d97706" />}
                          <span>{isValid ? `Valid length (${cleanRef.length} digits)` : `${cleanRef.length}/10-13 digits`}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    placeholder={checkoutForm.paymentMethod === 'E-WALLET' ? "e.g. 1002 9384 7129 (10-13 digits)" : "e.g. BDO-001234567890"}
                    value={checkoutForm.paymentRef}
                    maxLength={20}
                    onChange={e => setCheckoutForm({ ...checkoutForm, paymentRef: e.target.value })}
                    required
                    style={{
                      height: '42px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      backgroundColor: qrPaid ? '#f0fdf4' : '#ffffff',
                      borderColor: qrPaid ? '#86efac' : (
                        checkoutForm.paymentMethod === 'E-WALLET' && !qrPaid && checkoutForm.paymentRef
                          ? (checkoutForm.paymentRef.replace(/[\s-]/g, '').length >= 10 && checkoutForm.paymentRef.replace(/[\s-]/g, '').length <= 13 ? '#86efac' : '#f59e0b')
                          : '#cbd5e1'
                      )
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {qrPaid 
                        ? '✓ PayMongo payment reference captured automatically.' 
                        : 'Enter the 10 - 13 digit reference number from your GCash / Maya SMS or app receipt.'}
                    </span>
                  </div>
                </div>

                {/* Upload Proof of Payment (GCash / Bank Receipt Screenshot) */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={14} color="#2563eb" />
                      <span>Upload Proof of Payment / Receipt Screenshot *</span>
                    </label>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Bucket: Files</span>
                  </div>

                  {receiptPreview ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '10px'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <img 
                          src={receiptPreview} 
                          alt="Receipt Preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-green" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                            <Check size={10} style={{ marginRight: 2 }} /> {uploadingReceipt ? 'Uploading...' : 'Receipt Attached'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#475569', display: 'block', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {receiptFile?.name || 'payment_proof_receipt.png'}
                        </span>
                        {receiptUploadError && (
                          <span style={{ fontSize: '0.68rem', color: '#b45309', display: 'block', marginTop: '2px' }}>
                            {receiptUploadError}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a
                          href={receiptPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                          style={{ fontSize: '0.7rem', padding: '4px 8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Eye size={11} /> View
                        </a>
                        <button
                          type="button"
                          onClick={handleRemoveReceipt}
                          className="btn"
                          style={{ fontSize: '0.7rem', padding: '4px 8px', color: '#dc2626' }}
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #93c5fd',
                      borderRadius: '10px',
                      padding: '16px 12px',
                      cursor: 'pointer',
                      backgroundColor: '#eff6ff',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      gap: '6px'
                    }}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleReceiptUpload}
                        style={{ display: 'none' }}
                      />
                      {uploadingReceipt ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
                          <RefreshCw size={18} className="spin" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Uploading receipt to Supabase Files bucket...</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                            <Upload size={18} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.82rem', color: '#1e40af', display: 'block' }}>
                              Click or Tap to Upload GCash / Bank Receipt
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              PNG, JPG, or WEBP screenshot from GCash app (Max 10MB)
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setCheckoutStep('DETAILS')} className="btn" style={{ flex: 1, borderRadius: '10px' }}>
                    Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={
                      checkingOut || 
                      uploadingReceipt ||
                      !checkoutForm.paymentRef.trim() ||
                      (checkoutForm.paymentMethod === 'E-WALLET' && !qrPaid && (checkoutForm.paymentRef.replace(/[\s-]/g, '').length < 10 || checkoutForm.paymentRef.replace(/[\s-]/g, '').length > 13)) ||
                      (!qrPaid && !checkoutForm.receiptUrl && !receiptPreview)
                    } 
                    className="btn-primary" 
                    style={{ flex: 1.6, padding: '12px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '10px' }}
                  >
                    {checkingOut 
                      ? 'Submitting Order...' 
                      : uploadingReceipt 
                      ? 'Uploading Receipt...' 
                      : 'Submit Order for Verification'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Post-Checkout Receipt Modal */}
      {showReceipt && (
        <div className="modal-overlay" onClick={async () => { setShowReceipt(null); await syncWithSupabase(); }}>
          <div className="modal" style={{ maxWidth: '440px', width: '100%' }} onClick={e => e.stopPropagation()}>
            {/* Live Order Confirmation Status Banner */}
            {(() => {
              const isCash = showReceipt.paymentMethod === 'CASH';
              return (
                <div style={{
                  backgroundColor: isCash ? '#f8fafc' : '#eff6ff',
                  border: `1px solid ${isCash ? '#cbd5e1' : '#bfdbfe'}`,
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={24} color={isCash ? '#475569' : '#2563eb'} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: isCash ? '#1e293b' : '#1e40af', display: 'block' }}>
                      {isCash ? 'Order Placed (Pay at Counter Upon Pickup)' : 'Order Placed & Reference Submitted!'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: isCash ? '#475569' : '#1d4ed8', display: 'block', marginTop: '2px' }}>
                      {isCash 
                        ? `Please prepare ₱${showReceipt.total?.toLocaleString()} in cash to settle upon claiming your order.` 
                        : `₱${showReceipt.total?.toLocaleString()} via ${showReceipt.paymentMethod} (Ref: ${showReceipt.paymentRef}). Admin has been notified to verify.`}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div id="receipt-print-area" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900 }}>BOSS RAP MOTOR SHOP</h2>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>JP Rizal St., Baliuag, Bulacan</div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>Tel: (0905) 123-4567 • Tax Reg 2008</div>
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />
                
                {/* Dynamic Header: Unpaid Order Slip vs Official Receipt */}
                <div style={{
                  padding: '5px 8px',
                  borderRadius: '4px',
                  margin: '6px 0',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontWeight: 800,
                  fontSize: '0.82rem'
                }}>
                  ORDER INVOICE / ACKNOWLEDGEMENT (PENDING PAYMENT)
                </div>
              </div>

              {/* Customer Details Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.72rem',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Order #:</span>
                  <strong>{showReceipt.id}</strong>
                </div>
                {showReceipt.trackingCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tracking Code:</span>
                    <strong>{showReceipt.trackingCode}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span>{new Date(showReceipt.date).toLocaleString()}</span>
                </div>
                <div style={{ borderTop: '1px dashed #cbd5e1', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <strong>{showReceipt.customerName || currentUser?.name || 'Customer'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Contact Number:</span>
                  <span>{showReceipt.customerPhone || 'On File'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Member ID:</span>
                  <span>{showReceipt.memberId || currentUser?.memberId || 'REGULAR CUSTOMER'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Fulfillment:</span>
                  <strong style={{ color: showReceipt.fulfillmentType === 'DELIVERY' ? '#2563eb' : '#0f172a' }}>
                    {showReceipt.fulfillmentType === 'DELIVERY' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Truck size={13} /> HOME DELIVERY
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Store size={13} /> STORE PICKUP
                      </span>
                    )}
                  </strong>
                </div>
                {showReceipt.shippingAddress && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ color: '#64748b' }}>Delivery Address:</span>
                    <span style={{ textAlign: 'right', maxWidth: '65%' }}>{showReceipt.shippingAddress}</span>
                  </div>
                )}
                {showReceipt.latitude && showReceipt.longitude && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                    <span style={{ color: '#64748b' }}>Delivery Pin:</span>
                    <a
                      href={`https://www.google.com/maps?q=${showReceipt.latitude},${showReceipt.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="View pinned location on Google Maps"
                    >
                      <MapPin size={12} color="#16a34a" />
                      <span>Pinned Location on Map</span>
                      <ExternalLink size={10} />
                    </a>
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
                <span>₱{showReceipt.subtotal?.toLocaleString()}</span>
              </div>
              {showReceipt.discountApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
                  <span>{showReceipt.promoCode ? `Voucher (${showReceipt.promoCode}):` : 'Discount:'}</span>
                  <span>-₱{showReceipt.discountApplied.toLocaleString()}</span>
                </div>
              )}
              {showReceipt.fulfillmentType === 'DELIVERY' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#2563eb' }}>
                  <span>Delivery Fee:</span>
                  <span>+₱{(showReceipt.deliveryFee ?? 100).toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, margin: '6px 0' }}>
                <span>TOTAL:</span>
                <span>₱{showReceipt.total?.toLocaleString()}</span>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

              {/* Payment Status Notice */}
              <div style={{
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                textAlign: 'center',
                fontSize: '0.72rem'
              }}>
                <div style={{ fontWeight: 800, color: '#b45309', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <AlertCircle size={13} color="#b45309" />
                  <span>PAYMENT STATUS: PENDING / UNVERIFIED</span>
                </div>
                <div>Method: <strong>{showReceipt.paymentMethod}</strong> {showReceipt.paymentRef ? `(Ref: ${showReceipt.paymentRef})` : ''}</div>
                <div>Status: <strong>{showReceipt.orderStatus === 'READY FOR PICKUP' && showReceipt.fulfillmentType === 'DELIVERY' ? 'READY FOR DELIVERY' : showReceipt.orderStatus}</strong></div>
                <div style={{ marginTop: '4px', color: '#b45309', fontStyle: 'italic', fontSize: '0.68rem' }}>
                  {showReceipt.paymentMethod === 'CASH' 
                    ? '* Settle payment in cash at the counter upon pickup.'
                    : '* Official receipt will be validated once admin verifies your transaction reference.'}
                </div>
                <div style={{ marginTop: '8px', fontWeight: 700, color: '#0f172a' }}>
                  {showReceipt.fulfillmentType === 'DELIVERY' 
                    ? 'OUR RIDER WILL NOTIFY YOU BEFORE ARRIVAL' 
                    : 'PRESENT THIS ORDER CODE AT THE STORE COUNTER'}
                </div>
                {showReceipt.receiptUrl && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700, marginBottom: '4px' }}>
                      ATTACHED PAYMENT PROOF (FILES BUCKET)
                    </span>
                    <a
                      href={showReceipt.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      <ImageIcon size={13} />
                      <span>View Uploaded Receipt Screenshot</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Official Receipt Lock Notice */}
            <div style={{
              marginTop: '12px',
              padding: '10px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              fontSize: '0.72rem',
              color: '#475569',
              textAlign: 'center',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lock size={16} color="#64748b" style={{ flexShrink: 0 }} />
              <span><strong>Official Receipt Notice:</strong> Your Official Sales Receipt is locked until payment is verified by the store admin. Once approved, you can view and print it anytime from your Orders dashboard.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setShowReceipt(null);
                  navigate('/dashboard?tab=ORDERS');
                }} 
                className="btn-primary" 
                style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
              >
                Track in My Orders
              </button>
              <button 
                type="button" 
                onClick={async () => { setShowReceipt(null); await syncWithSupabase(); }} 
                className="btn" 
                style={{ padding: '10px', borderRadius: '8px' }}
              >
                Done
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
