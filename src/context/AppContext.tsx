import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';

// ==========================================
// Core Domain Models & Types
// ==========================================

export type Role = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' | 'GUEST' | 'RIDER';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  password?: string;
  memberId?: string; // Links to Member profile for CUSTOMER role
  enabled: boolean;  // Active state for employee/user management
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  lowStockLevel: number;
  barcode: string;
  imageUrl?: string;
  weightKg?: number;
  isBulky?: boolean;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  discountApplied: number;
  promoId?: string;
  promoCode?: string;
  total: number;
  date: string;
  memberId?: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  channel?: 'WALK-IN' | 'ONLINE/FACEBOOK';
  fulfillmentType?: 'STORE PICKUP' | 'DELIVERY' | 'COUNTER';
  orderStatus?: 'ORDER PLACED' | 'PREPARING' | 'READY FOR PICKUP' | 'OUT FOR DELIVERY' | 'COMPLETED';
  trackingCode?: string;
  notes?: string;
  deliveryFee?: number;
  paymentMethod: 'CASH' | 'E-WALLET' | 'ONLINE BANK';
  paymentRef?: string;
  paymentVerified?: boolean;
  receiptUrl?: string;
  latitude?: number;
  longitude?: number;
  // Loyalty points redeemed as payment on this sale
  pointsRedeemed?: number;
  pointsDiscount?: number;
  // Rider delivery proof photo
  deliveryProofUrl?: string;
  deliveredAt?: string;
  // Cash settlement details (POS walk-in sale or store-pickup claim)
  cashTendered?: number;
  changeDue?: number;
  paidAt?: string;
  receivedBy?: string;
}

export interface Member {
  id: string;
  name: string;
  contact: string;
  address: string;
  joinDate: string;
  points: number;
}

export interface Promo {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  minSpend: number;
  startDate: string;
  endDate: string;
  active: boolean;
  discountType?: 'PERCENT' | 'FREE_SHIPPING';
  firstOrderOnly?: boolean;
  singleUsePerCustomer?: boolean;
  maxRedemptions?: number;                 // total number of times this promo can be used (undefined = unlimited)
  appliesTo?: 'ALL' | 'WALK-IN' | 'ONLINE'; // which channel can redeem it
}

export interface ReturnRequest {
  id: string;
  saleId: string;
  memberId: string;
  items: SaleItem[];
  reason: string;
  type: 'RETURN' | 'REPLACE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
  attachmentUrl?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface PointsSettings {
  currencyPerPoint: number; // e.g. ₱100 spent = 1 point
  pointValue: number;       // e.g. 1 point = ₱1 discount
}

export interface PurchaseOrderItem {
  productId?: string;
  name: string;
  quantity: number;      // quantity ordered from supplier
  costPrice: number;     // supplier price per unit (what Boss Rap pays)
  receivedQty?: number;  // good units received & added to stock (never more than ordered)
  damagedQty?: number;   // units that arrived damaged (sent to Bad Orders)
  excessQty?: number;    // units delivered beyond the ordered qty (sent to Bad Orders)
}

export type PurchaseOrderStatus = 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  supplierId?: string;
  supplierName: string;
  supplierContact?: string;  // supplier info entered directly on the PO (no supplier account needed)
  supplierPhone?: string;
  supplierAddress?: string;
  deliveryDays?: number;     // how many days the supplier needs to deliver to Boss Rap
  expectedDelivery?: string; // dateOrdered + deliveryDays
  items: PurchaseOrderItem[];
  totalCost: number;       // ordered qty x supplier price
  amountPayable?: number;  // what Boss Rap actually pays (received good qty x price + accepted excess)
  status: PurchaseOrderStatus;
  poType?: 'STANDARD' | 'DIRECT';
  notes?: string;
  dateOrdered: string;
  dateReceived?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  deliveryDays?: number;   // usual number of days to deliver to Boss Rap
  active: boolean;
  createdAt?: string;
}

// Which supplier carries which product, and at what supplier price
export interface ProductSupplier {
  supplierId: string;
  productId: string;
  supplierPrice: number;
  updatedAt?: string;
}

export type BadOrderType = 'DAMAGED' | 'EXCESS';
export type BadOrderStatus =
  | 'PENDING'                // waiting for action
  | 'RETURNED_TO_SUPPLIER'   // physically sent back to supplier
  | 'REPLACED'               // damaged: replacement units received & stocked
  | 'CREDITED'               // damaged: supplier refunded / deducted from payable
  | 'ACCEPTED';              // excess: Boss Rap kept the extra units (stocked & paid)

export interface BadOrder {
  id: string;
  type: BadOrderType;
  purchaseOrderId?: string;
  supplierId?: string;
  supplierName?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  status: BadOrderStatus;
  remarks?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
}

export interface BackOrder {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  customerName?: string;
  customerContact?: string;
  status: 'PENDING' | 'NOTIFIED' | 'FULFILLED';
  notes?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// ==========================================
// Context Interface
// ==========================================

interface AppContextType {
  initialized: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

  // Shopping Cart Persistence
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  clearCart: () => void;

  // Domain Entities
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  promos: Promo[];
  setPromos: React.Dispatch<React.SetStateAction<Promo[]>>;
  returnRequests: ReturnRequest[];
  setReturnRequests: React.Dispatch<React.SetStateAction<ReturnRequest[]>>;
  inquiries: Inquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  pointsSettings: PointsSettings;
  setPointsSettings: (settings: PointsSettings) => Promise<void>;

  // Enterprise Extensions (Audit & Back Orders)
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  addAuditLog: (action: string, details: string) => Promise<void>;
  backOrders: BackOrder[];
  setBackOrders: React.Dispatch<React.SetStateAction<BackOrder[]>>;
  addBackOrder: (item: Omit<BackOrder, 'id' | 'createdAt'>) => Promise<void>;
  updateBackOrderStatus: (id: string, status: BackOrder['status']) => Promise<void>;

  // Live Supabase Sync & Data Handlers
  syncWithSupabase: () => Promise<void>;
  recordSale: (saleData: Omit<Sale, 'id' | 'date'> & { id?: string; date?: string }) => Promise<Sale | null>;
  saveProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductDeleteBlockers: (productId: string) => string[];
  saveUser: (user: User) => Promise<boolean>;
  toggleUserEnabled: (userId: string) => Promise<boolean>;
  saveMember: (member: Member) => Promise<boolean>;
  savePromo: (promo: Promo) => Promise<boolean>;
  deletePromo: (promoId: string) => Promise<boolean>;
  savePurchaseOrder: (po: PurchaseOrder) => Promise<boolean>;
  deletePurchaseOrder: (poId: string) => Promise<boolean>;
  suppliers: Supplier[];
  saveSupplier: (supplier: Supplier) => Promise<boolean>;
  deleteSupplier: (supplierId: string) => Promise<boolean>;
  productSuppliers: ProductSupplier[];
  saveProductSupplier: (link: ProductSupplier) => Promise<boolean>;
  removeProductSupplier: (supplierId: string, productId: string) => Promise<boolean>;
  badOrders: BadOrder[];
  saveBadOrder: (bo: BadOrder) => Promise<boolean>;
  saveReturnRequest: (rr: ReturnRequest) => Promise<boolean>;
  saveInquiry: (inq: Omit<Inquiry, 'id' | 'date'>) => Promise<boolean>;
  updateSaleOrderStatus: (saleId: string, status: Sale['orderStatus']) => Promise<boolean>;
  verifySalePayment: (saleId: string) => Promise<boolean>;
  completePickupClaim: (saleId: string, payment: { cashTendered?: number; receivedBy: string }) => Promise<Sale | null>;
  completeDeliveryWithProof: (saleId: string, proofUrl: string, riderName: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_POINTS_SETTINGS: PointsSettings = {
  currencyPerPoint: 100,
  pointValue: 1
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);

  // Synchronous initialization of currentUser from localStorage
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('motoshop_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Flag to avoid wiping user cart during logout
  const isLoggingOutRef = useRef(false);

  // Synchronous initialization of cart from localStorage (persists across page refreshes and browser re-opens)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('motoshop_current_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const userKey = savedUser?.id ? `motoshop_cart_${savedUser.id}` : 'motoshop_cart';
      const savedCart = localStorage.getItem(userKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const generalCart = localStorage.getItem('motoshop_cart');
      if (generalCart) {
        const parsed = JSON.parse(generalCart);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
    }
    return [];
  });

  // Production entities initialized to empty arrays
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplier[]>([]);
  const [badOrders, setBadOrders] = useState<BadOrder[]>([]);
  const [pointsSettings, setPointsSettingsState] = useState<PointsSettings>(DEFAULT_POINTS_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [backOrders, setBackOrders] = useState<BackOrder[]>([]);

  // User session handling
  const setCurrentUser = useCallback((user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('motoshop_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('motoshop_current_user');
    }
  }, []);

  // Save cart whenever it changes (tied strictly to current user so it never gets lost)
  // Track whether the cloud cart has been initialized for the current user session
  const cloudCartLoadedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoggingOutRef.current) return;
    try {
      if (currentUser?.id) {
        const userKey = `motoshop_cart_${currentUser.id}`;
        localStorage.setItem(userKey, JSON.stringify(cart));

        // Only push to Supabase if we have already finished loading this user's cloud cart
        // This prevents an initial empty state from wiping out existing cloud items on fresh devices!
        if (cloudCartLoadedForUserRef.current === currentUser.id) {
          (async () => {
            try {
              await supabase
                .from('cart_items')
                .delete()
                .eq('account_id', currentUser.id);

              if (cart.length > 0) {
                const rows = cart.map(item => ({
                  account_id: currentUser.id,
                  product_id: item.product.id,
                  quantity: item.quantity
                }));
                await supabase.from('cart_items').insert(rows);
              }
            } catch (err) {
              console.warn('Error syncing cart with Supabase:', err);
            }
          })();
        }
      } else {
        localStorage.setItem('motoshop_cart', JSON.stringify(cart));
      }
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cart, currentUser?.id]);

  // Synchronize and restore cart when currentUser changes or products are loaded
  useEffect(() => {
    if (isLoggingOutRef.current) return;
    if (!currentUser?.id) {
      cloudCartLoadedForUserRef.current = null;
      return;
    }

    // Wait until products are loaded to reconstruct cart items accurately
    if (products.length === 0) return;

    // Avoid redundant fetches if already loaded for this user
    if (cloudCartLoadedForUserRef.current === currentUser.id) return;

    const userKey = `motoshop_cart_${currentUser.id}`;

    const loadCloudCart = async () => {
      try {
        // 1. Fetch from live Supabase cloud cart_items table
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('account_id', currentUser.id);

        if (!error && data && data.length > 0) {
          const restoredCloudCart: CartItem[] = [];
          data.forEach((row: any) => {
            const matchedProd = products.find(p => p.id === row.product_id);
            if (matchedProd && matchedProd.stock > 0) {
              restoredCloudCart.push({
                product: matchedProd,
                quantity: Math.min(matchedProd.stock, row.quantity || 1)
              });
            }
          });

          if (restoredCloudCart.length > 0) {
            setCart(restoredCloudCart);
            localStorage.setItem(userKey, JSON.stringify(restoredCloudCart));
            cloudCartLoadedForUserRef.current = currentUser.id;
            return;
          }
        }

        // 2. If no cloud cart found or table just created, check user's local storage
        try {
          const savedUserCart = localStorage.getItem(userKey);
          if (savedUserCart) {
            const parsed = JSON.parse(savedUserCart);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCart(parsed);
              // Migrate local items to cloud
              const rows = parsed.map((item: CartItem) => ({
                account_id: currentUser.id,
                product_id: item.product.id,
                quantity: item.quantity
              }));
              await supabase.from('cart_items').insert(rows);
              cloudCartLoadedForUserRef.current = currentUser.id;
              return;
            }
          }

          // 3. If new user, adopt any guest cart that was created before logging in
          const guestCart = localStorage.getItem('motoshop_cart');
          if (guestCart) {
            const parsed = JSON.parse(guestCart);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCart(parsed);
              localStorage.setItem(userKey, guestCart);
              localStorage.removeItem('motoshop_cart');
              const rows = parsed.map((item: CartItem) => ({
                account_id: currentUser.id,
                product_id: item.product.id,
                quantity: item.quantity
              }));
              await supabase.from('cart_items').insert(rows);
            }
          }
        } catch (e) {
          console.error('Error migrating local cart to cloud:', e);
        }

        cloudCartLoadedForUserRef.current = currentUser.id;
      } catch {
        cloudCartLoadedForUserRef.current = currentUser.id;
      }
    };

    loadCloudCart();
  }, [currentUser?.id, products]);

  // Clear cart only on successful checkout!
  const clearCart = useCallback(() => {
    setCart([]);
    try {
      if (currentUser?.id) {
        localStorage.removeItem(`motoshop_cart_${currentUser.id}`);
        supabase.from('cart_items').delete().eq('account_id', currentUser.id).then(() => {}, () => {});
      }
      localStorage.removeItem('motoshop_cart');
    } catch (e) {}
  }, [currentUser?.id]);

  // ==========================================
  // Audit Trail Logging
  // ==========================================
  const addAuditLog = useCallback(async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'SYSTEM',
      userRole: currentUser?.role || 'GUEST',
      action,
      details
    };

    // Prepend to local state
    setAuditLogs(prev => [newLog, ...prev]);

    // Save to local storage cache
    try {
      const stored = localStorage.getItem('motoshop_audit_logs');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('motoshop_audit_logs', JSON.stringify([newLog, ...existing].slice(0, 500)));
    } catch (e) {}

    // Try persisting to Supabase audit_logs table
    try {
      await supabase.from('audit_logs').insert([{
        user_name: newLog.userName,
        user_role: newLog.userRole,
        action: newLog.action,
        details: newLog.details
      }]);
    } catch (e) {
      // Table may not exist yet in public schema; graceful fallback
    }
  }, [currentUser]);

  // Safe Logout: preserves user's cart in localStorage so logging back in restores their exact items!
  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog('LOGOUT', `User ${currentUser.name} (${currentUser.username}) signed out`);
    }
    isLoggingOutRef.current = true;
    setCurrentUser(null);
    setCart([]);
    try {
      localStorage.removeItem('motoshop_cart');
    } catch (e) {}
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 400);
  }, [currentUser, setCurrentUser, addAuditLog]);

  // ==========================================
  // Supabase Comprehensive Sync
  // ==========================================
  const syncWithSupabase = useCallback(async () => {
    try {
      // 1. Accounts -> Users
      const { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData && accountsData.length > 0) {
        const mappedUsers: User[] = accountsData.map(acc => {
          const isRider = 
            acc.role === 'RIDER' ||
            acc.username.toLowerCase().startsWith('rider') ||
            acc.name.toLowerCase().includes('(rider)') ||
            acc.name.toLowerCase().includes('delivery rider') ||
            acc.id.startsWith('R');

          return {
            id: acc.id,
            name: acc.name,
            username: acc.username,
            password: acc.password,
            role: isRider ? ('RIDER' as Role) : (acc.role as Role),
            memberId: acc.member_id || undefined,
            enabled: acc.enabled ?? true
          };
        });

        setUsers(mappedUsers);
      }

      // 2. Members
      const { data: membersData } = await supabase.from('members').select('*');
      if (membersData && membersData.length > 0) {
        const mappedMembers: Member[] = membersData.map(m => ({
          id: m.id,
          name: m.name,
          contact: m.contact || '',
          address: m.address || '',
          joinDate: m.join_date || '',
          points: Number(m.points) || 0
        }));
        setMembers(mappedMembers);
      }

      // 3. Products
      const { data: productsData } = await supabase.from('products').select('*');
      if (productsData && productsData.length > 0) {
        const mappedProducts: Product[] = productsData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category,
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          lowStockLevel: Number(p.low_stock_level) || 5,
          barcode: p.barcode || '',
          imageUrl: p.image_url || undefined,
          weightKg: p.weight_kg !== undefined && p.weight_kg !== null ? Number(p.weight_kg) : 0.5,
          isBulky: Boolean(p.is_bulky)
        }));
        setProducts(mappedProducts);
      }

      // 4. Promos
      const { data: promosData } = await supabase.from('promos').select('*');
      if (promosData && promosData.length > 0) {
        const mappedPromos: Promo[] = promosData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          discountPercent: Number(p.discount_percent) || 0,
          minSpend: Number(p.min_spend) || 0,
          startDate: p.start_date || '',
          endDate: p.end_date || '',
          active: p.active ?? true,
          discountType: p.discount_type === 'FREE_SHIPPING' ? 'FREE_SHIPPING' : 'PERCENT',
          firstOrderOnly: Boolean(p.first_order_only),
          singleUsePerCustomer: Boolean(p.single_use_per_customer),
          maxRedemptions: p.max_redemptions !== undefined && p.max_redemptions !== null ? Number(p.max_redemptions) : undefined,
          appliesTo: p.applies_to === 'WALK-IN' || p.applies_to === 'ONLINE' ? p.applies_to : 'ALL'
        }));
        setPromos(mappedPromos);
      }

      // 5. Sales + Sale Items (joined, sorted newest first!)
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .order('created_at', { ascending: false });

      if (salesData && salesData.length > 0) {
        const mappedSales: Sale[] = salesData.map(s => {
          let custName: string | undefined = s.customer_name || undefined;
          let custPhone: string | undefined = s.customer_phone || undefined;
          let shipAddress: string | undefined = s.shipping_address || undefined;
          let delFee: number | undefined = s.delivery_fee !== undefined && s.delivery_fee !== null ? Number(s.delivery_fee) : undefined;
          let payVerified: boolean = s.channel === 'WALK-IN' && s.payment_method === 'CASH';
          let displayNotes: string | undefined = s.notes || undefined;
          let pointsRedeemed: number | undefined;
          let pointsDiscount: number | undefined;
          let deliveryProofUrl: string | undefined = s.delivery_proof_url || undefined;
          let deliveredAt: string | undefined;
          let cashTendered: number | undefined;
          let changeDue: number | undefined;
          let paidAt: string | undefined;
          let receivedBy: string | undefined;
          let lat: number | undefined = s.latitude !== undefined && s.latitude !== null ? Number(s.latitude) : undefined;
          let lng: number | undefined = s.longitude !== undefined && s.longitude !== null ? Number(s.longitude) : undefined;

          if (s.notes) {
            try {
              const parsed = JSON.parse(s.notes);
              if (parsed && typeof parsed === 'object') {
                if (!custName) custName = parsed.customerName || undefined;
                if (!custPhone) custPhone = parsed.customerPhone || undefined;
                if (!shipAddress) shipAddress = parsed.shippingAddress || undefined;
                if (delFee === undefined) delFee = Number(parsed.deliveryFee) || undefined;
                if (parsed.paymentVerified !== undefined) {
                  payVerified = Boolean(parsed.paymentVerified);
                }
                if (lat === undefined) {
                  if (parsed.latitude !== undefined && parsed.latitude !== null) lat = Number(parsed.latitude);
                  else if (parsed.lat !== undefined && parsed.lat !== null) lat = Number(parsed.lat);
                }
                if (lng === undefined) {
                  if (parsed.longitude !== undefined && parsed.longitude !== null) lng = Number(parsed.longitude);
                  else if (parsed.lng !== undefined && parsed.lng !== null) lng = Number(parsed.lng);
                }

                if (parsed.receiptUrl && !s.receipt_url) {
                  s.receipt_url = parsed.receiptUrl;
                }
                displayNotes = parsed.rawNotes || undefined;
                if (parsed.pointsRedeemed) pointsRedeemed = Number(parsed.pointsRedeemed) || undefined;
                if (parsed.pointsDiscount) pointsDiscount = Number(parsed.pointsDiscount) || undefined;
                if (!deliveryProofUrl && parsed.deliveryProofUrl) deliveryProofUrl = String(parsed.deliveryProofUrl);
                if (parsed.deliveredAt) deliveredAt = String(parsed.deliveredAt);
                if (parsed.cashTendered !== undefined && parsed.cashTendered !== null) cashTendered = Number(parsed.cashTendered);
                if (parsed.changeDue !== undefined && parsed.changeDue !== null) changeDue = Number(parsed.changeDue);
                if (parsed.paidAt) paidAt = String(parsed.paidAt);
                if (parsed.receivedBy) receivedBy = String(parsed.receivedBy);
              }
            } catch (e) {
              if (lat === undefined || lng === undefined) {
                const gpsMatch = (s.notes as string).match(/GPS:\s*([0-9.-]+)\s*,\s*([0-9.-]+)/i);
                if (gpsMatch) {
                  lat = parseFloat(gpsMatch[1]);
                  lng = parseFloat(gpsMatch[2]);
                }
              }
            }
          }

          // E-wallet payments are confirmed by the e-wallet itself (no manual admin verification step)
          if (s.payment_method === 'E-WALLET') payVerified = true;

          return {
            id: s.id,
            subtotal: Number(s.subtotal) || 0,
            discountApplied: Number(s.discount_applied) || 0,
            promoId: s.promo_id || undefined,
            promoCode: s.promo_code || undefined,
            total: Number(s.total) || 0,
            date: s.date || s.created_at,
            memberId: s.member_id || undefined,
            customerName: custName,
            customerPhone: custPhone,
            shippingAddress: shipAddress,
            deliveryFee: delFee,
            paymentVerified: payVerified,
            latitude: lat,
            longitude: lng,
            channel: s.channel || 'WALK-IN',
            fulfillmentType: s.fulfillment_type || 'COUNTER',
            orderStatus: s.order_status || 'COMPLETED',
            trackingCode: s.tracking_code || undefined,
            notes: displayNotes,
            paymentMethod: s.payment_method || 'CASH',
            paymentRef: s.payment_ref || undefined,
            receiptUrl: s.receipt_url || undefined,
            pointsRedeemed,
            pointsDiscount,
            deliveryProofUrl,
            deliveredAt,
            cashTendered,
            changeDue,
            paidAt,
            receivedBy,
            items: (s.sale_items || []).map((it: any) => ({
              productId: it.product_id || '',
              name: it.name || '',
              quantity: Number(it.quantity) || 1,
              price: Number(it.price) || 0
            }))
          };
        });

        // Guarantee newest first sorting
        mappedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSales(mappedSales);
      }

      // 6. Purchase Orders + Purchase Order Items
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_items(*)')
        .order('date_ordered', { ascending: false });

      if (poData && poData.length > 0) {
        const mappedPOs: PurchaseOrder[] = poData.map(po => {
          const status = (po.status || 'PENDING') as PurchaseOrderStatus;
          const items: PurchaseOrderItem[] = (po.purchase_order_items || []).map((poi: any) => {
            const qty = Number(poi.quantity) || 0;
            const hasReceivedCol = poi.received_qty !== undefined && poi.received_qty !== null;
            return {
              productId: poi.product_id || undefined,
              name: poi.name || '',
              quantity: qty,
              costPrice: Number(poi.cost_price) || 0,
              // Legacy rows (pre-migration) that were RECEIVED were received in full
              receivedQty: hasReceivedCol ? Number(poi.received_qty) || 0 : (status === 'RECEIVED' ? qty : 0),
              damagedQty: Number(poi.damaged_qty) || 0,
              excessQty: Number(poi.excess_qty) || 0
            };
          });
          const totalCost = Number(po.total_cost) || 0;
          return {
            id: po.id,
            supplierId: po.supplier_id || undefined,
            supplierName: po.supplier_name,
            supplierContact: po.supplier_contact || undefined,
            supplierPhone: po.supplier_phone || undefined,
            supplierAddress: po.supplier_address || undefined,
            deliveryDays: po.delivery_days !== undefined && po.delivery_days !== null ? Number(po.delivery_days) : undefined,
            expectedDelivery: po.expected_delivery || undefined,
            totalCost,
            amountPayable: po.amount_payable !== undefined && po.amount_payable !== null
              ? Number(po.amount_payable) || 0
              : (status === 'RECEIVED' ? totalCost : 0),
            status,
            poType: po.po_type === 'DIRECT' ? 'DIRECT' : 'STANDARD',
            notes: po.notes || undefined,
            dateOrdered: po.date_ordered,
            dateReceived: po.date_received || undefined,
            items
          };
        });
        setPurchaseOrders(mappedPOs);
      }

      // 6b. Suppliers, supplier price list & bad orders (tables from revision_redemo_migration.sql)
      const { data: supData } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
      if (supData) {
        setSuppliers(supData.map((sp: any) => ({
          id: sp.id,
          name: sp.name,
          contactPerson: sp.contact_person || undefined,
          phone: sp.phone || undefined,
          email: sp.email || undefined,
          address: sp.address || undefined,
          deliveryDays: sp.delivery_days !== undefined && sp.delivery_days !== null ? Number(sp.delivery_days) : undefined,
          active: sp.active !== false,
          createdAt: sp.created_at
        })));
      }
      const { data: psData } = await supabase.from('product_suppliers').select('*');
      if (psData) {
        setProductSuppliers(psData.map((ps: any) => ({
          supplierId: ps.supplier_id,
          productId: ps.product_id,
          supplierPrice: Number(ps.supplier_price) || 0,
          updatedAt: ps.updated_at
        })));
      }
      const { data: boData } = await supabase.from('bad_orders').select('*').order('created_at', { ascending: false });
      if (boData) {
        setBadOrders(boData.map((b: any) => ({
          id: b.id,
          type: b.type === 'EXCESS' ? 'EXCESS' : 'DAMAGED',
          purchaseOrderId: b.purchase_order_id || undefined,
          supplierId: b.supplier_id || undefined,
          supplierName: b.supplier_name || undefined,
          productId: b.product_id || undefined,
          productName: b.product_name,
          quantity: Number(b.quantity) || 0,
          unitCost: Number(b.unit_cost) || 0,
          status: (b.status || 'PENDING') as BadOrderStatus,
          remarks: b.remarks || undefined,
          createdAt: b.created_at,
          resolvedAt: b.resolved_at || undefined
        })));
      }

      // 7. Inquiries
      const { data: inqData } = await supabase
        .from('inquiries')
        .select('*')
        .order('date', { ascending: false });

      if (inqData && inqData.length > 0) {
        const mappedInq: Inquiry[] = inqData.map(i => ({
          id: i.id.toString(),
          name: i.name,
          email: i.email,
          message: i.message,
          date: i.date
        }));
        setInquiries(mappedInq);
      }

      // 8. Return Requests
      const { data: returnData } = await supabase
        .from('return_requests')
        .select('*')
        .order('date', { ascending: false });

      if (returnData && returnData.length > 0) {
        const mappedReturns: ReturnRequest[] = returnData.map(r => ({
          id: r.id,
          saleId: r.sale_id,
          memberId: r.member_id,
          reason: r.reason,
          type: r.type || 'RETURN',
          status: r.status || 'PENDING',
          date: r.date,
          attachmentUrl: r.attachment_url || undefined,
          items: Array.isArray(r.items) ? r.items : []
        }));
        setReturnRequests(mappedReturns);
      }

      // 9. Points Settings
      const { data: pointsData } = await supabase
        .from('points_settings')
        .select('*')
        .limit(1);

      if (pointsData && pointsData.length > 0) {
        setPointsSettingsState({
          currencyPerPoint: Number(pointsData[0].currency_per_point) || 100,
          pointValue: Number(pointsData[0].point_value) || 1
        });
      }

      // 10. Audit Logs from Supabase or local cache
      try {
        const { data: logsData } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);

        if (logsData && logsData.length > 0) {
          const mappedLogs: AuditLog[] = logsData.map(l => ({
            id: l.id.toString(),
            timestamp: l.timestamp,
            userName: l.user_name,
            userRole: l.user_role,
            action: l.action,
            details: l.details
          }));
          setAuditLogs(mappedLogs);
        } else {
          const localLogs = localStorage.getItem('motoshop_audit_logs');
          if (localLogs) setAuditLogs(JSON.parse(localLogs));
        }
      } catch (e) {
        const localLogs = localStorage.getItem('motoshop_audit_logs');
        if (localLogs) setAuditLogs(JSON.parse(localLogs));
      }

      // 11. Back Orders from Supabase or local cache
      try {
        const { data: boData } = await supabase
          .from('back_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (boData && boData.length > 0) {
          const mappedBOs: BackOrder[] = boData.map(b => ({
            id: b.id,
            productId: b.product_id,
            productName: b.product_name,
            quantity: Number(b.quantity) || 1,
            customerName: b.customer_name || undefined,
            customerContact: b.customer_contact || b.contact || undefined,
            status: b.status || 'PENDING',
            notes: b.notes || undefined,
            createdAt: b.created_at
          }));
          setBackOrders(mappedBOs);
        } else {
          const localBO = localStorage.getItem('motoshop_back_orders');
          if (localBO) setBackOrders(JSON.parse(localBO));
        }
      } catch (e) {
        const localBO = localStorage.getItem('motoshop_back_orders');
        if (localBO) setBackOrders(JSON.parse(localBO));
      }

    } catch (err) {
      console.error('Error syncing with Supabase:', err);
    }
  }, []);

  // Initial mount load & global Supabase real-time sync across the entire app
  useEffect(() => {
    const savedCurrentUser = localStorage.getItem('motoshop_current_user');
    if (savedCurrentUser) {
      try {
        setCurrentUserState(JSON.parse(savedCurrentUser));
      } catch (e) {}
    }

    syncWithSupabase().finally(() => {
      setInitialized(true);
    });

    // Real-time listener for products table across ALL connected clients
    const productsChannel = supabase
      .channel('global_products_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as any;
            setProducts(prev => prev.map(p => p.id === updated.id ? {
              ...p,
              stock: Number(updated.stock) ?? 0,
              price: Number(updated.price) ?? p.price,
              name: updated.name ?? p.name,
              category: updated.category ?? p.category
            } : p));
          } else {
            syncWithSupabase();
          }
        }
      )
      .subscribe();

    // Real-time listener for sales table
    const salesChannel = supabase
      .channel('global_sales_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => {
          syncWithSupabase();
        }
      )
      .subscribe();

    // Auto-refresh when tab gains focus and periodic heartbeat
    const handleFocus = () => {
      syncWithSupabase();
    };
    window.addEventListener('focus', handleFocus);
    const syncInterval = setInterval(() => {
      syncWithSupabase();
    }, 5000);

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [syncWithSupabase]);

  // ==========================================
  // Sale Transaction Handler (POS & Web Shop)
  // ==========================================
  const recordSale = async (
    saleData: Omit<Sale, 'id' | 'date'> & { id?: string; date?: string }
  ): Promise<Sale | null> => {
    try {
      const saleId = saleData.id || `S${Date.now().toString().slice(-8)}`;
      const saleDate = saleData.date || new Date().toISOString();

      const newSale: Sale = {
        ...saleData,
        id: saleId,
        date: saleDate,
        paymentVerified: saleData.paymentMethod === 'E-WALLET'
          ? true
          : (saleData.paymentVerified ?? (saleData.channel === 'WALK-IN' && saleData.paymentMethod === 'CASH'))
      };

      // 0. Strict Concurrency & Overselling Prevention:
      // Perform atomic conditional decrement on each product using `.gte('stock', quantity)`.
      // This evaluates inside the row-lock at database level so two concurrent checkouts cannot oversell.
      const deductedItems: { productId: string; quantity: number; previousStock: number }[] = [];
      let deductionFailed = false;
      let failureReason = '';

      for (const item of newSale.items) {
        if (!item.productId) continue;

        // Fetch fresh product data from Supabase
        const { data: dbProd, error: fetchErr } = await supabase
          .from('products')
          .select('id, name, stock')
          .eq('id', item.productId)
          .single();

        if (fetchErr || !dbProd) {
          deductionFailed = true;
          failureReason = `Could not verify live stock for "${item.name}". Please try again.`;
          break;
        }

        const currentDbStock = Number(dbProd.stock) || 0;
        if (currentDbStock < item.quantity) {
          deductionFailed = true;
          failureReason = `ORDER REJECTED: "${item.name}" only has ${currentDbStock} unit(s) remaining in stock, but your order requested ${item.quantity}.`;
          break;
        }

        const newStock = currentDbStock - item.quantity;

        // ATOMIC CONDITIONAL UPDATE:
        // By adding `.gte('stock', item.quantity)`, Postgres evaluates this check
        // inside the row-lock at the exact instant of execution.
        // If another transaction reduced stock in the meantime, 0 rows match.
        const { data: updatedRows, error: updateErr } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.productId)
          .gte('stock', item.quantity)
          .select('id, stock');

        if (updateErr || !updatedRows || updatedRows.length === 0) {
          deductionFailed = true;
          failureReason = `ORDER REJECTED (STOCK CONFLICT): Another customer just purchased "${item.name}". Only ${currentDbStock} unit(s) were available.`;
          break;
        }

        deductedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          previousStock: currentDbStock
        });
      }

      // If ANY product in this order failed atomic reservation, ROLLBACK all previously deducted products!
      if (deductionFailed) {
        for (const rolled of deductedItems) {
          await supabase
            .from('products')
            .update({ stock: rolled.previousStock })
            .eq('id', rolled.productId);
        }
        await syncWithSupabase();
        alert(failureReason);
        return null;
      }

      // Serialize metadata (customer details, delivery fee, paymentVerified, GPS coordinates) into notes JSON
      const notesPayload = JSON.stringify({
        customerName: newSale.customerName,
        customerPhone: newSale.customerPhone,
        shippingAddress: newSale.shippingAddress,
        deliveryFee: newSale.deliveryFee || 0,
        paymentVerified: newSale.paymentMethod === 'E-WALLET' ? true : (newSale.paymentVerified ?? (newSale.channel === 'WALK-IN' && newSale.paymentMethod === 'CASH')),
        latitude: newSale.latitude,
        longitude: newSale.longitude,
        receiptUrl: newSale.receiptUrl || null,
        promoId: newSale.promoId || null,
        promoCode: newSale.promoCode || null,
        pointsRedeemed: newSale.pointsRedeemed || 0,
        pointsDiscount: newSale.pointsDiscount || 0,
        cashTendered: newSale.cashTendered ?? null,
        changeDue: newSale.changeDue ?? null,
        paidAt: newSale.paidAt || null,
        receivedBy: newSale.receivedBy || null,
        rawNotes: newSale.notes || ''
      });

      // 1. Insert into Supabase 'sales' table with dedicated location & delivery columns
      const saleRow: Record<string, any> = {
        id: newSale.id,
        subtotal: newSale.subtotal,
        discount_applied: newSale.discountApplied,
        total: newSale.total,
        date: newSale.date,
        member_id: newSale.memberId || null,
        channel: newSale.channel || 'WALK-IN',
        fulfillment_type: newSale.fulfillmentType || 'COUNTER',
        order_status: newSale.orderStatus || 'COMPLETED',
        tracking_code: newSale.trackingCode || null,
        notes: notesPayload,
        payment_method: newSale.paymentMethod,
        payment_ref: newSale.paymentRef || null,
        receipt_url: newSale.receiptUrl || null,
        promo_id: newSale.promoId || null,
        promo_code: newSale.promoCode || null,
        delivery_fee: newSale.deliveryFee || 0
      };

      if (newSale.latitude !== undefined && newSale.latitude !== null) {
        saleRow.latitude = newSale.latitude;
      }
      if (newSale.longitude !== undefined && newSale.longitude !== null) {
        saleRow.longitude = newSale.longitude;
      }
      if (newSale.shippingAddress) {
        saleRow.shipping_address = newSale.shippingAddress;
      }
      if (newSale.customerName) {
        saleRow.customer_name = newSale.customerName;
      }
      if (newSale.customerPhone) {
        saleRow.customer_phone = newSale.customerPhone;
      }

      let { error: saleError } = await supabase.from('sales').insert([saleRow]);

      // If Supabase table does not have the new columns yet (pre-migration), retry cleanly without them
      if (saleError && saleError.message && (
        saleError.message.toLowerCase().includes('latitude') ||
        saleError.message.toLowerCase().includes('longitude') ||
        saleError.message.toLowerCase().includes('shipping_address') ||
        saleError.message.toLowerCase().includes('customer_name') ||
        saleError.message.toLowerCase().includes('customer_phone') ||
        saleError.message.toLowerCase().includes('column')
      )) {
        const legacyRow = {
          id: newSale.id,
          subtotal: newSale.subtotal,
          discount_applied: newSale.discountApplied,
          total: newSale.total,
          date: newSale.date,
          member_id: newSale.memberId || null,
          channel: newSale.channel || 'WALK-IN',
          fulfillment_type: newSale.fulfillmentType || 'COUNTER',
          order_status: newSale.orderStatus || 'COMPLETED',
          tracking_code: newSale.trackingCode || null,
          notes: notesPayload,
          payment_method: newSale.paymentMethod,
          payment_ref: newSale.paymentRef || null,
          receipt_url: newSale.receiptUrl || null,
          delivery_fee: newSale.deliveryFee || 0
        };
        const retryResult = await supabase.from('sales').insert([legacyRow]);
        saleError = retryResult.error;
      }

      if (saleError) {
        console.error('Supabase sales insert error:', saleError);
        // Rollback all deducted stocks!
        for (const rolled of deductedItems) {
          await supabase
            .from('products')
            .update({ stock: rolled.previousStock })
            .eq('id', rolled.productId);
        }
        await syncWithSupabase();
        alert('Failed to save sale to cloud database: ' + saleError.message);
        return null;
      }

      // 2. Insert into Supabase 'sale_items' table
      if (newSale.items.length > 0) {
        const saleItemsPayload = newSale.items.map(item => ({
          sale_id: newSale.id,
          product_id: (item.productId && products.some(p => p.id === item.productId)) ? item.productId : null,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItemsPayload);

        if (itemsError) {
          console.error('Supabase sale_items insert error:', itemsError);
        }
      }

      // Record the redemption so one-use and first-order vouchers remain enforced across devices.
      if (newSale.promoId && newSale.memberId) {
        const { error: redemptionError } = await supabase.from('promo_redemptions').insert([{
          promo_id: newSale.promoId,
          member_id: newSale.memberId,
          sale_id: newSale.id
        }]);
        if (redemptionError) {
          console.error('Promo redemption record error:', redemptionError);
        }
      }

      // 3. Update local products state with the deducted quantities
      setProducts(prev => prev.map(p => {
        const cartItem = newSale.items.find(it => it.productId === p.id);
        return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
      }));

      // 4. Update member loyalty points if linked:
      //    - points used as payment are deducted (redeeming all usable points brings the balance to 0)
      //    - points are earned only on the amount actually paid (after promo & points discounts)
      if (newSale.memberId) {
        const pointsEarned = Math.floor(newSale.total / pointsSettings.currencyPerPoint);
        const member = members.find(m => m.id === newSale.memberId);
        if (member) {
          const { data: freshMember } = await supabase.from('members').select('points').eq('id', newSale.memberId).single();
          const currentPoints = freshMember ? Number(freshMember.points) || 0 : (member.points || 0);
          const redeemed = Math.min(currentPoints, Math.max(0, newSale.pointsRedeemed || 0));
          const newPoints = Math.max(0, currentPoints - redeemed + pointsEarned);
          await supabase.from('members').update({ points: newPoints }).eq('id', newSale.memberId);
          setMembers(prev => prev.map(m => m.id === newSale.memberId ? { ...m, points: newPoints } : m));
          if (redeemed > 0) {
            await addAuditLog('POINTS_REDEEMED', `Member ${member.name} (${member.id}) redeemed ${redeemed} pts (₱${(newSale.pointsDiscount || 0).toLocaleString()}) on sale ${newSale.id}. New balance: ${newPoints} pts.`);
          }
        }
      }

      // 5. Prepend new sale to local sales array (NEWEST FIRST!)
      setSales(prev => [newSale, ...prev]);

      // 6. Log audit action
      await addAuditLog(
        'SALE_COMPLETED',
        `Sale ${newSale.id} completed. Total: ₱${newSale.total.toLocaleString()} (${newSale.channel || 'WALK-IN'}, ${newSale.paymentMethod})`
      );

      // 7. Ensure local state has latest refreshed products from cloud
      await syncWithSupabase();

      return newSale;
    } catch (err: any) {
      console.error('Record sale exception:', err);
      alert('Transaction error: ' + (err.message || 'Unknown error'));
      return null;
    }
  };

  // ==========================================
  // Product Operations
  // ==========================================
  const saveProduct = async (product: Product): Promise<boolean> => {
    try {
      const payload: any = {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        low_stock_level: product.lowStockLevel,
        barcode: product.barcode,
        image_url: product.imageUrl || null,
        weight_kg: product.weightKg ?? 0.5,
        is_bulky: product.isBulky ?? false
      };

      let { error } = await supabase.from('products').upsert([payload]);

      // If columns haven't been added yet to Supabase, fallback cleanly
      if (error && error.message?.includes('column')) {
        delete payload.weight_kg;
        delete payload.is_bulky;
        const fallback = await supabase.from('products').upsert([payload]);
        error = fallback.error;
      }

      if (error) {
        console.error('Supabase product save error:', error);
        alert('Error saving product: ' + error.message);
        return false;
      }

      setProducts(prev => {
        const idx = prev.findIndex(p => p.id === product.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = product;
          return updated;
        }
        return [product, ...prev];
      });

      await addAuditLog('PRODUCT_SAVED', `Product ${product.name} (₱${product.price}, Stock: ${product.stock}) saved.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // Lists the ongoing transactions that prevent a product from being deleted (empty = safe to delete).
  const getProductDeleteBlockers = (productId: string): string[] => {
    const blockers: string[] = [];
    const openOrders = sales.filter(sl =>
      sl.orderStatus !== 'COMPLETED' && sl.items.some(it => it.productId === productId)
    );
    if (openOrders.length > 0) {
      blockers.push(`${openOrders.length} ongoing customer order(s): ${openOrders.slice(0, 5).map(o => '#' + o.id).join(', ')}${openOrders.length > 5 ? '…' : ''}`);
    }
    const openPOs = purchaseOrders.filter(po =>
      po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && po.items.some(it => it.productId === productId)
    );
    if (openPOs.length > 0) {
      blockers.push(`${openPOs.length} purchase order(s) not yet fully received: ${openPOs.map(po => po.id).join(', ')}`);
    }
    const openReturns = returnRequests.filter(rr =>
      rr.status === 'PENDING' && rr.items.some(it => it.productId === productId)
    );
    if (openReturns.length > 0) {
      blockers.push(`${openReturns.length} pending return/replacement request(s)`);
    }
    const openBackOrders = backOrders.filter(bo =>
      bo.productId === productId && (bo.status === 'PENDING' || bo.status === 'NOTIFIED')
    );
    if (openBackOrders.length > 0) {
      blockers.push(`${openBackOrders.length} active back-order reservation(s)`);
    }
    const openBadOrders = badOrders.filter(b => b.productId === productId && b.status === 'PENDING');
    if (openBadOrders.length > 0) {
      blockers.push(`${openBadOrders.length} unresolved bad order(s) with the supplier`);
    }
    return blockers;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const prod = products.find(p => p.id === productId);

      const blockers = getProductDeleteBlockers(productId);
      if (blockers.length > 0) {
        alert(
          `CANNOT DELETE "${prod?.name || productId}".\n\nThis product is part of an ongoing transaction:\n• ${blockers.join('\n• ')}\n\nComplete or cancel these transactions first, then delete the product.`
        );
        return false;
      }

      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        alert('Error deleting product: ' + error.message);
        return false;
      }
      setProducts(prev => prev.filter(p => p.id !== productId));
      await addAuditLog('PRODUCT_DELETED', `Product ${prod?.name || productId} removed from catalog.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // User / Account Operations
  // ==========================================
  const saveUser = async (user: User): Promise<boolean> => {
    try {
      // 1. Try saving with user.role directly (works once schema constraint is updated with RIDER)
      let { error } = await supabase.from('accounts').upsert([{
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        member_id: user.memberId || null,
        enabled: user.enabled
      }]);

      let finalName = user.name;

      // 2. If DB check constraint fails because 'RIDER' is not yet added in Supabase schema, fallback gracefully
      if (error && user.role === 'RIDER') {
        finalName = user.name.toLowerCase().includes('(rider)') ? user.name : `${user.name} (Rider)`;
        const fallback = await supabase.from('accounts').upsert([{
          id: user.id,
          name: finalName,
          username: user.username,
          password: user.password,
          role: 'EMPLOYEE',
          member_id: user.memberId || null,
          enabled: user.enabled
        }]);
        error = fallback.error;
      }

      if (error) {
        alert('Error saving user: ' + error.message);
        return false;
      }

      setUsers(prev => {
        const idx = prev.findIndex(u => u.id === user.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...user, name: finalName };
          return updated;
        }
        return [{ ...user, name: finalName }, ...prev];
      });

      await addAuditLog('USER_SAVED', `User account ${finalName} (${user.role}) saved.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  const toggleUserEnabled = async (userId: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    const newStatus = !user.enabled;

    const { error } = await supabase.from('accounts').update({ enabled: newStatus }).eq('id', userId);
    if (error) {
      alert('Failed to update account status: ' + error.message);
      return false;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, enabled: newStatus } : u));
    await addAuditLog('ACCOUNT_STATUS_CHANGED', `Account ${user.name} (${user.username}) status set to ${newStatus ? 'ENABLED' : 'DISABLED'}.`);
    return true;
  };

  // ==========================================
  // Member Operations
  // ==========================================
  const saveMember = async (member: Member): Promise<boolean> => {
    try {
      const { error } = await supabase.from('members').upsert([{
        id: member.id,
        name: member.name,
        contact: member.contact,
        address: member.address,
        join_date: member.joinDate,
        points: member.points
      }]);

      if (error) {
        alert('Error saving member: ' + error.message);
        return false;
      }

      setMembers(prev => {
        const idx = prev.findIndex(m => m.id === member.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = member;
          return updated;
        }
        return [...prev, member];
      });

      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Promo Operations
  // ==========================================
  const savePromo = async (promo: Promo): Promise<boolean> => {
    try {
      const { error } = await supabase.from('promos').upsert([{
        id: promo.id,
        name: promo.name,
        description: promo.description,
        discount_percent: promo.discountPercent,
        discount_type: promo.discountType || 'PERCENT',
        first_order_only: promo.firstOrderOnly || false,
        single_use_per_customer: promo.singleUsePerCustomer || false,
        max_redemptions: promo.maxRedemptions ?? null,
        applies_to: promo.appliesTo || 'ALL',
        min_spend: promo.minSpend,
        start_date: promo.startDate,
        end_date: promo.endDate,
        active: promo.active
      }]);

      if (error) {
        alert('Error saving promo: ' + error.message + (/column|schema cache/i.test(error.message) ? '\n\nPlease run revision_redemo_migration.sql in Supabase → SQL Editor first.' : ''));
        return false;
      }

      setPromos(prev => {
        const idx = prev.findIndex(p => p.id === promo.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = promo;
          return updated;
        }
        return [promo, ...prev];
      });

      await addAuditLog('PROMO_SAVED', `Promo code ${promo.name} (${promo.discountPercent}%) saved.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  const deletePromo = async (promoId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('promos').delete().eq('id', promoId);
      if (error) {
        alert('Error deleting promo: ' + error.message);
        return false;
      }
      setPromos(prev => prev.filter(p => p.id !== promoId));
      await addAuditLog('PROMO_DELETED', `Promo ID ${promoId} deleted.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Purchase Order Operations
  // ==========================================
  const savePurchaseOrder = async (po: PurchaseOrder): Promise<boolean> => {
    try {
      const { error: poErr } = await supabase.from('purchase_orders').upsert([{
        id: po.id,
        supplier_id: po.supplierId || null,
        supplier_name: po.supplierName,
        supplier_contact: po.supplierContact || null,
        supplier_phone: po.supplierPhone || null,
        supplier_address: po.supplierAddress || null,
        delivery_days: po.deliveryDays ?? null,
        expected_delivery: po.expectedDelivery || null,
        total_cost: po.totalCost,
        amount_payable: po.amountPayable ?? 0,
        status: po.status,
        po_type: po.poType || 'STANDARD',
        notes: po.notes || null,
        date_ordered: po.dateOrdered,
        date_received: po.dateReceived || null
      }]);

      if (poErr) {
        const msg = poErr.message || '';
        if (/column|schema cache|check constraint|violates/i.test(msg)) {
          alert('Error saving purchase order: ' + msg + '\n\nYour database is missing the new Purchase Order columns. Please run revision_redemo_migration.sql and revision_final2_migration.sql in Supabase → SQL Editor, then try again.');
        } else {
          alert('Error saving purchase order: ' + msg);
        }
        return false;
      }

      // Save items
      if (po.items.length > 0) {
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', po.id);
        const itemsPayload = po.items.map(item => ({
          purchase_order_id: po.id,
          product_id: (item.productId && products.some(p => p.id === item.productId)) ? item.productId : null,
          name: item.name,
          quantity: item.quantity,
          cost_price: item.costPrice,
          received_qty: item.receivedQty || 0,
          damaged_qty: item.damagedQty || 0,
          excess_qty: item.excessQty || 0
        }));
        const { error: itemsErr } = await supabase.from('purchase_order_items').insert(itemsPayload);
        if (itemsErr) {
          alert('Error saving purchase order items: ' + itemsErr.message);
          return false;
        }
      }

      setPurchaseOrders(prev => {
        const idx = prev.findIndex(p => p.id === po.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = po;
          return updated;
        }
        return [po, ...prev];
      });

      await addAuditLog('PO_SAVED', `Purchase Order ${po.id} from ${po.supplierName} (₱${po.totalCost.toLocaleString()}) saved — status ${po.status}.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  const deletePurchaseOrder = async (poId: string): Promise<boolean> => {
    try {
      const po = purchaseOrders.find(p => p.id === poId);
      if (po && po.items.some(it => (it.receivedQty || 0) > 0 || (it.damagedQty || 0) > 0 || (it.excessQty || 0) > 0)) {
        alert('This purchase order already has received items and cannot be deleted. Use CANCEL / CLOSE instead to keep the stock history intact.');
        return false;
      }
      const { error } = await supabase.from('purchase_orders').delete().eq('id', poId);
      if (error) {
        alert('Error deleting purchase order: ' + error.message);
        return false;
      }
      setPurchaseOrders(prev => prev.filter(p => p.id !== poId));
      await addAuditLog('PO_DELETED', `Purchase Order ${poId} deleted.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Supplier Maintenance & Supplier Price List
  // ==========================================
  const missingTableHint = (msg: string) =>
    /relation|does not exist|schema cache|column/i.test(msg)
      ? '\n\nPlease run revision_redemo_migration.sql and revision_final2_migration.sql in Supabase → SQL Editor first.'
      : '';

  const saveSupplier = async (supplier: Supplier): Promise<boolean> => {
    try {
      const { error } = await supabase.from('suppliers').upsert([{
        id: supplier.id,
        name: supplier.name,
        contact_person: supplier.contactPerson || null,
        phone: supplier.phone || null,
        email: supplier.email || null,
        address: supplier.address || null,
        delivery_days: supplier.deliveryDays ?? null,
        active: supplier.active
      }]);
      if (error) {
        alert('Error saving supplier: ' + error.message + missingTableHint(error.message));
        return false;
      }
      setSuppliers(prev => {
        const idx = prev.findIndex(s => s.id === supplier.id);
        const next = idx >= 0 ? prev.map(s => s.id === supplier.id ? supplier : s) : [...prev, supplier];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      await addAuditLog('SUPPLIER_SAVED', `Supplier ${supplier.name} saved.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  const deleteSupplier = async (supplierId: string): Promise<boolean> => {
    try {
      const sup = suppliers.find(s => s.id === supplierId);
      const openPOs = purchaseOrders.filter(po => po.supplierId === supplierId && (po.status === 'PENDING' || po.status === 'PARTIAL'));
      if (openPOs.length > 0) {
        alert(`Cannot delete supplier "${sup?.name}". It still has ${openPOs.length} open purchase order(s): ${openPOs.map(p => p.id).join(', ')}.\nYou can set the supplier to INACTIVE instead.`);
        return false;
      }
      const openBad = badOrders.filter(b => b.supplierId === supplierId && b.status === 'PENDING');
      if (openBad.length > 0) {
        alert(`Cannot delete supplier "${sup?.name}". It still has ${openBad.length} unresolved bad order(s).`);
        return false;
      }
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
      if (error) {
        alert('Error deleting supplier: ' + error.message);
        return false;
      }
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      setProductSuppliers(prev => prev.filter(ps => ps.supplierId !== supplierId));
      await addAuditLog('SUPPLIER_DELETED', `Supplier ${sup?.name || supplierId} deleted.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  const saveProductSupplier = async (link: ProductSupplier): Promise<boolean> => {
    try {
      const updatedAt = new Date().toISOString();
      const { error } = await supabase.from('product_suppliers').upsert([{
        supplier_id: link.supplierId,
        product_id: link.productId,
        supplier_price: link.supplierPrice,
        updated_at: updatedAt
      }], { onConflict: 'supplier_id,product_id' });
      if (error) {
        alert('Error saving supplier price: ' + error.message + missingTableHint(error.message));
        return false;
      }
      setProductSuppliers(prev => {
        const exists = prev.some(ps => ps.supplierId === link.supplierId && ps.productId === link.productId);
        const saved = { ...link, updatedAt };
        return exists
          ? prev.map(ps => ps.supplierId === link.supplierId && ps.productId === link.productId ? saved : ps)
          : [...prev, saved];
      });
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  const removeProductSupplier = async (supplierId: string, productId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('product_suppliers').delete().eq('supplier_id', supplierId).eq('product_id', productId);
      if (error) {
        alert('Error removing product from supplier: ' + error.message);
        return false;
      }
      setProductSuppliers(prev => prev.filter(ps => !(ps.supplierId === supplierId && ps.productId === productId)));
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Bad Orders (Damaged / Over-delivered items from supplier)
  // ==========================================
  const saveBadOrder = async (bo: BadOrder): Promise<boolean> => {
    try {
      const { error } = await supabase.from('bad_orders').upsert([{
        id: bo.id,
        type: bo.type,
        purchase_order_id: bo.purchaseOrderId || null,
        supplier_id: bo.supplierId || null,
        supplier_name: bo.supplierName || null,
        product_id: (bo.productId && products.some(p => p.id === bo.productId)) ? bo.productId : null,
        product_name: bo.productName,
        quantity: bo.quantity,
        unit_cost: bo.unitCost,
        status: bo.status,
        remarks: bo.remarks || null,
        created_at: bo.createdAt,
        resolved_at: bo.resolvedAt || null
      }]);
      if (error) {
        alert('Error saving bad order: ' + error.message + missingTableHint(error.message));
        return false;
      }
      setBadOrders(prev => {
        const idx = prev.findIndex(b => b.id === bo.id);
        return idx >= 0 ? prev.map(b => b.id === bo.id ? bo : b) : [bo, ...prev];
      });
      await addAuditLog('BAD_ORDER_SAVED', `${bo.type} bad order ${bo.id}: ${bo.quantity} x ${bo.productName} (${bo.status}).`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Return / Replacement Operations
  // ==========================================
  const saveReturnRequest = async (rr: ReturnRequest): Promise<boolean> => {
    try {
      const { error } = await supabase.from('return_requests').upsert([{
        id: rr.id,
        sale_id: rr.saleId,
        member_id: rr.memberId,
        items: rr.items,
        reason: rr.reason,
        type: rr.type,
        status: rr.status,
        date: rr.date,
        attachment_url: rr.attachmentUrl || null
      }]);

      if (error) {
        alert('Error submitting return claim: ' + error.message);
        return false;
      }

      setReturnRequests(prev => {
        const idx = prev.findIndex(r => r.id === rr.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = rr;
          return updated;
        }
        return [rr, ...prev];
      });

      await addAuditLog('RETURN_REQUEST_SAVED', `Return request ${rr.id} for sale ${rr.saleId} (${rr.type}: ${rr.status}) submitted.`);
      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Inquiry Operations
  // ==========================================
  const saveInquiry = async (inq: Omit<Inquiry, 'id' | 'date'>): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase.from('inquiries').insert([{
        name: inq.name,
        email: inq.email,
        message: inq.message,
        date: now
      }]).select();

      if (error) {
        alert('Error sending inquiry: ' + error.message);
        return false;
      }

      if (data && data[0]) {
        const newInq: Inquiry = {
          id: data[0].id.toString(),
          name: data[0].name,
          email: data[0].email,
          message: data[0].message,
          date: data[0].date
        };
        setInquiries(prev => [newInq, ...prev]);
      }

      return true;
    } catch (e: any) {
      alert('Error: ' + e.message);
      return false;
    }
  };

  // ==========================================
  // Points Settings Operations
  // ==========================================
  const setPointsSettings = async (settings: PointsSettings): Promise<void> => {
    setPointsSettingsState(settings);
    try {
      await supabase.from('points_settings').upsert([{
        id: 1,
        currency_per_point: settings.currencyPerPoint,
        point_value: settings.pointValue,
        updated_at: new Date().toISOString()
      }]);
      await addAuditLog('SETTINGS_UPDATED', `Points system updated: ₱${settings.currencyPerPoint}/point, 1 pt = ₱${settings.pointValue}`);
    } catch (e) {}
  };

  // ==========================================
  // Back Order Operations
  // ==========================================
  const addBackOrder = async (item: Omit<BackOrder, 'id' | 'createdAt'>) => {
    const newBO: BackOrder = {
      ...item,
      id: `BO-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString()
    };

    setBackOrders(prev => [newBO, ...prev]);

    try {
      const stored = localStorage.getItem('motoshop_back_orders');
      const existing = stored ? JSON.parse(stored) : [];
      localStorage.setItem('motoshop_back_orders', JSON.stringify([newBO, ...existing]));
    } catch (e) {}

    try {
      const boRow: Record<string, any> = {
        id: newBO.id,
        product_id: (newBO.productId && products.some(p => p.id === newBO.productId)) ? newBO.productId : null,
        product_name: newBO.productName,
        quantity: newBO.quantity,
        customer_name: newBO.customerName || null,
        customer_contact: newBO.customerContact || null,
        contact: newBO.customerContact || null,
        status: newBO.status,
        notes: newBO.notes || null
      };
      let { error: boErr } = await supabase.from('back_orders').insert([boRow]);
      if (boErr && boErr.message?.includes('column')) {
        // Retry with either contact or customer_contact depending on which one the table has
        delete boRow.contact;
        const retry1 = await supabase.from('back_orders').insert([boRow]);
        if (retry1.error && retry1.error.message?.includes('column')) {
          delete boRow.customer_contact;
          boRow.contact = newBO.customerContact || null;
          await supabase.from('back_orders').insert([boRow]);
        }
      }
    } catch (e) {}

    await addAuditLog('BACK_ORDER_CREATED', `Back order created for ${newBO.quantity}x "${newBO.productName}"`);
  };

  const updateBackOrderStatus = async (id: string, status: BackOrder['status']) => {
    setBackOrders(prev => prev.map(bo => bo.id === id ? { ...bo, status } : bo));

    try {
      const stored = localStorage.getItem('motoshop_back_orders');
      if (stored) {
        const list = JSON.parse(stored).map((b: BackOrder) => b.id === id ? { ...b, status } : b);
        localStorage.setItem('motoshop_back_orders', JSON.stringify(list));
      }
    } catch (e) {}

    try {
      await supabase.from('back_orders').update({ status }).eq('id', id);
    } catch (e) {}

    await addAuditLog('BACK_ORDER_STATUS', `Back order ${id} status updated to ${status}`);
  };

  const updateSaleOrderStatus = async (saleId: string, status: Sale['orderStatus']): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ order_status: status })
        .eq('id', saleId);

      if (error) {
        console.error('Failed to update order status:', error);
        alert('Failed to update order status: ' + error.message);
        return false;
      }

      setSales(prev => prev.map(s => s.id === saleId ? { ...s, orderStatus: status } : s));
      await addAuditLog('ORDER_STATUS_UPDATED', `Order ${saleId} status updated to ${status}`);
      return true;
    } catch (e: any) {
      console.error('Error updating order status:', e);
      return false;
    }
  };

  const verifySalePayment = async (saleId: string): Promise<boolean> => {
    try {
      const sale = sales.find(s => s.id === saleId);
      if (!sale) return false;

      const existingNotesObj: any = await loadSaleNotesObject(sale);
      existingNotesObj.paymentVerified = true;
      existingNotesObj.customerName = sale.customerName;
      existingNotesObj.customerPhone = sale.customerPhone;
      existingNotesObj.shippingAddress = sale.shippingAddress;
      existingNotesObj.deliveryFee = sale.deliveryFee;
      existingNotesObj.latitude = sale.latitude;
      existingNotesObj.longitude = sale.longitude;
      existingNotesObj.receiptUrl = sale.receiptUrl || existingNotesObj.receiptUrl;

      const serializedNotes = JSON.stringify(existingNotesObj);

      const { error } = await supabase
        .from('sales')
        .update({ notes: serializedNotes })
        .eq('id', saleId);

      if (error) {
        console.error('Failed to verify payment:', error);
        alert('Failed to verify payment: ' + error.message);
        return false;
      }

      setSales(prev => prev.map(s => s.id === saleId ? { ...s, paymentVerified: true } : s));
      await addAuditLog('PAYMENT_VERIFIED', `Payment for Order #${saleId} verified by Admin (Ref: ${sale.paymentRef || 'N/A'})`);
      return true;
    } catch (e: any) {
      console.error('Error verifying payment:', e);
      return false;
    }
  };

  // Reads the sale's stored notes JSON from the DB (state only keeps the human-readable part),
  // so updates merge into the full metadata instead of overwriting it.
  const loadSaleNotesObject = async (sale: Sale): Promise<any> => {
    try {
      const { data } = await supabase.from('sales').select('notes').eq('id', sale.id).single();
      const raw = data?.notes;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) {
          return { rawNotes: raw };
        }
      }
    } catch (e) { /* fall through */ }
    return {
      rawNotes: sale.notes || '',
      promoId: sale.promoId || null,
      promoCode: sale.promoCode || null,
      pointsRedeemed: sale.pointsRedeemed || 0,
      pointsDiscount: sale.pointsDiscount || 0,
      cashTendered: sale.cashTendered ?? null,
      changeDue: sale.changeDue ?? null,
      paidAt: sale.paidAt || null,
      receivedBy: sale.receivedBy || null
    };
  };

  // Rider marks a delivery COMPLETED together with a proof-of-delivery photo (required).
  const completeDeliveryWithProof = async (saleId: string, proofUrl: string, riderName: string): Promise<boolean> => {
    try {
      const sale = sales.find(s => s.id === saleId);
      if (!sale) { alert('Order not found. Please sync and try again.'); return false; }
      if (!proofUrl) { alert('A delivery proof photo is required.'); return false; }

      const notesObj: any = await loadSaleNotesObject(sale);
      const deliveredAt = new Date().toISOString();
      notesObj.customerName = sale.customerName;
      notesObj.customerPhone = sale.customerPhone;
      notesObj.shippingAddress = sale.shippingAddress;
      notesObj.deliveryFee = sale.deliveryFee;
      notesObj.latitude = sale.latitude;
      notesObj.longitude = sale.longitude;
      notesObj.receiptUrl = sale.receiptUrl || notesObj.receiptUrl || null;
      notesObj.paymentVerified = sale.paymentVerified ?? notesObj.paymentVerified;
      notesObj.deliveryProofUrl = proofUrl;
      notesObj.deliveredAt = deliveredAt;
      notesObj.deliveredBy = riderName;

      const notes = JSON.stringify(notesObj);
      let { error } = await supabase
        .from('sales')
        .update({ order_status: 'COMPLETED', notes, delivery_proof_url: proofUrl })
        .eq('id', saleId);
      // Pre-migration fallback: proof is still kept inside the notes JSON
      if (error && /delivery_proof_url|column|schema cache/i.test(error.message || '')) {
        const retry = await supabase.from('sales').update({ order_status: 'COMPLETED', notes }).eq('id', saleId);
        error = retry.error;
      }
      if (error) {
        alert('Failed to complete delivery: ' + error.message);
        return false;
      }

      setSales(prev => prev.map(s => s.id === saleId
        ? { ...s, orderStatus: 'COMPLETED', deliveryProofUrl: proofUrl, deliveredAt, notes: s.notes }
        : s));
      await addAuditLog('DELIVERY_COMPLETED', `Order ${saleId} delivered by ${riderName} with proof photo.`);
      return true;
    } catch (e: any) {
      alert('Error completing delivery: ' + (e?.message || e));
      return false;
    }
  };

  // Store-pickup claim: customer pays (or presents a prepaid order) at the counter and the order is released.
  // Records amount tendered + change so the cash collected on pickup is part of the system.
  const completePickupClaim = async (
    saleId: string,
    payment: { cashTendered?: number; receivedBy: string }
  ): Promise<Sale | null> => {
    try {
      const sale = sales.find(s => s.id === saleId);
      if (!sale) {
        alert('Order not found. Please sync and try again.');
        return null;
      }
      if (sale.orderStatus === 'COMPLETED') {
        alert(`Order #${saleId} is already completed.`);
        return null;
      }

      const isCash = sale.paymentMethod === 'CASH';
      const tendered = isCash ? Number(payment.cashTendered) || 0 : 0;
      if (isCash && tendered < sale.total) {
        alert(`INSUFFICIENT CASH TENDERED! Amount due is ₱${sale.total.toLocaleString()}.`);
        return null;
      }
      const change = isCash ? Math.round((tendered - sale.total) * 100) / 100 : 0;
      const paidAt = new Date().toISOString();

      const notesObj: any = await loadSaleNotesObject(sale);
      notesObj.customerName = sale.customerName;
      notesObj.customerPhone = sale.customerPhone;
      notesObj.shippingAddress = sale.shippingAddress;
      notesObj.deliveryFee = sale.deliveryFee;
      notesObj.latitude = sale.latitude;
      notesObj.longitude = sale.longitude;
      notesObj.receiptUrl = sale.receiptUrl || notesObj.receiptUrl || null;
      notesObj.paymentVerified = true;
      notesObj.cashTendered = isCash ? tendered : null;
      notesObj.changeDue = isCash ? change : null;
      notesObj.paidAt = paidAt;
      notesObj.receivedBy = payment.receivedBy;

      const { error } = await supabase
        .from('sales')
        .update({ order_status: 'COMPLETED', notes: JSON.stringify(notesObj) })
        .eq('id', saleId);

      if (error) {
        console.error('Failed to complete pickup claim:', error);
        alert('Failed to complete pickup: ' + error.message);
        return null;
      }

      const updated: Sale = {
        ...sale,
        orderStatus: 'COMPLETED',
        paymentVerified: true,
        cashTendered: isCash ? tendered : undefined,
        changeDue: isCash ? change : undefined,
        paidAt,
        receivedBy: payment.receivedBy
      };
      setSales(prev => prev.map(s => s.id === saleId ? updated : s));

      await addAuditLog(
        'PICKUP_CLAIMED',
        isCash
          ? `Order #${saleId} claimed at counter. Due ₱${sale.total.toLocaleString()}, tendered ₱${tendered.toLocaleString()}, change ₱${change.toLocaleString()} (received by ${payment.receivedBy})`
          : `Order #${saleId} (prepaid via ${sale.paymentMethod}${sale.paymentRef ? `, Ref: ${sale.paymentRef}` : ''}) released at counter by ${payment.receivedBy}`
      );
      return updated;
    } catch (e: any) {
      console.error('Error completing pickup claim:', e);
      alert('Error completing pickup: ' + (e?.message || e));
      return null;
    }
  };

  return (
    <AppContext.Provider value={{
      initialized,
      currentUser,
      setCurrentUser,
      logout,
      cart,
      setCart,
      clearCart,
      users,
      setUsers,
      members,
      setMembers,
      products,
      setProducts,
      sales,
      setSales,
      promos,
      setPromos,
      returnRequests,
      setReturnRequests,
      inquiries,
      setInquiries,
      purchaseOrders,
      setPurchaseOrders,
      deletePurchaseOrder,
      suppliers,
      saveSupplier,
      deleteSupplier,
      productSuppliers,
      saveProductSupplier,
      removeProductSupplier,
      badOrders,
      saveBadOrder,
      pointsSettings,
      setPointsSettings,
      auditLogs,
      setAuditLogs,
      addAuditLog,
      backOrders,
      setBackOrders,
      addBackOrder,
      updateBackOrderStatus,
      syncWithSupabase,
      recordSale,
      saveProduct,
      deleteProduct,
      saveUser,
      toggleUserEnabled,
      saveMember,
      savePromo,
      deletePromo,
      savePurchaseOrder,
      saveReturnRequest,
      saveInquiry,
      updateSaleOrderStatus,
      verifySalePayment,
      completePickupClaim,
      completeDeliveryWithProof,
      getProductDeleteBlockers
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
