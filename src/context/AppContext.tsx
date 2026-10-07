import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

// ==========================================
// Core Domain Models & Types
// ==========================================

export type Role = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' | 'GUEST';

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
  total: number;
  date: string;
  memberId?: string;
  channel?: 'WALK-IN' | 'ONLINE/FACEBOOK';
  fulfillmentType?: 'STORE PICKUP' | 'DELIVERY' | 'COUNTER';
  orderStatus?: 'ORDER PLACED' | 'PREPARING' | 'READY FOR PICKUP' | 'OUT FOR DELIVERY' | 'COMPLETED';
  trackingCode?: string;
  notes?: string;
  paymentMethod: 'CASH' | 'E-WALLET' | 'ONLINE BANK';
  paymentRef?: string;
  receiptUrl?: string;
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
  quantity: number;
  costPrice: number;
}

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'PENDING' | 'RECEIVED';
  dateOrdered: string;
  dateReceived?: string;
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

// ==========================================
// Context Interface
// ==========================================

interface AppContextType {
  initialized: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;

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
  saveUser: (user: User) => Promise<boolean>;
  toggleUserEnabled: (userId: string) => Promise<boolean>;
  saveMember: (member: Member) => Promise<boolean>;
  savePromo: (promo: Promo) => Promise<boolean>;
  deletePromo: (promoId: string) => Promise<boolean>;
  savePurchaseOrder: (po: PurchaseOrder) => Promise<boolean>;
  saveReturnRequest: (rr: ReturnRequest) => Promise<boolean>;
  saveInquiry: (inq: Omit<Inquiry, 'id' | 'date'>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_POINTS_SETTINGS: PointsSettings = {
  currencyPerPoint: 100,
  pointValue: 1
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialized, setInitialized] = useState(false);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  // Production entities initialized to empty arrays
  const [users, setUsers] = useState<User[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
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

  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog('LOGOUT', `User ${currentUser.name} (${currentUser.username}) signed out`);
    }
    setCurrentUser(null);
  }, [currentUser, setCurrentUser]);

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

  // ==========================================
  // Supabase Comprehensive Sync
  // ==========================================
  const syncWithSupabase = useCallback(async () => {
    try {
      // 1. Accounts -> Users
      const { data: accountsData } = await supabase.from('accounts').select('*');
      if (accountsData && accountsData.length > 0) {
        const mappedUsers: User[] = accountsData.map(acc => ({
          id: acc.id,
          name: acc.name,
          username: acc.username,
          password: acc.password,
          role: acc.role,
          memberId: acc.member_id || undefined,
          enabled: acc.enabled ?? true
        }));
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
          imageUrl: p.image_url || undefined
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
          active: p.active ?? true
        }));
        setPromos(mappedPromos);
      }

      // 5. Sales + Sale Items (joined, sorted newest first!)
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .order('created_at', { ascending: false });

      if (salesData && salesData.length > 0) {
        const mappedSales: Sale[] = salesData.map(s => ({
          id: s.id,
          subtotal: Number(s.subtotal) || 0,
          discountApplied: Number(s.discount_applied) || 0,
          total: Number(s.total) || 0,
          date: s.date || s.created_at,
          memberId: s.member_id || undefined,
          channel: s.channel || 'WALK-IN',
          fulfillmentType: s.fulfillment_type || 'COUNTER',
          orderStatus: s.order_status || 'COMPLETED',
          trackingCode: s.tracking_code || undefined,
          notes: s.notes || undefined,
          paymentMethod: s.payment_method || 'CASH',
          paymentRef: s.payment_ref || undefined,
          receiptUrl: s.receipt_url || undefined,
          items: (s.sale_items || []).map((it: any) => ({
            productId: it.product_id || '',
            name: it.name || '',
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0
          }))
        }));

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
        const mappedPOs: PurchaseOrder[] = poData.map(po => ({
          id: po.id,
          supplierName: po.supplier_name,
          totalCost: Number(po.total_cost) || 0,
          status: po.status || 'PENDING',
          dateOrdered: po.date_ordered,
          dateReceived: po.date_received || undefined,
          items: (po.purchase_order_items || []).map((poi: any) => ({
            productId: poi.product_id || undefined,
            name: poi.name || '',
            quantity: Number(poi.quantity) || 0,
            costPrice: Number(poi.cost_price) || 0
          }))
        }));
        setPurchaseOrders(mappedPOs);
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
            customerContact: b.customer_contact || undefined,
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

  // Initial mount load
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
        date: saleDate
      };

      // 1. Insert into Supabase 'sales' table
      const { error: saleError } = await supabase.from('sales').insert([{
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
        notes: newSale.notes || null,
        payment_method: newSale.paymentMethod,
        payment_ref: newSale.paymentRef || null,
        receipt_url: newSale.receiptUrl || null
      }]);

      if (saleError) {
        console.error('Supabase sales insert error:', saleError);
        alert('Failed to save sale to cloud database: ' + saleError.message);
        return null;
      }

      // 2. Insert into Supabase 'sale_items' table
      if (newSale.items.length > 0) {
        const saleItemsPayload = newSale.items.map(item => ({
          sale_id: newSale.id,
          product_id: item.productId || null,
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

      // 3. Deduct product stock in Supabase & local state
      for (const item of newSale.items) {
        const currentProd = products.find(p => p.id === item.productId);
        if (currentProd) {
          const newStock = Math.max(0, currentProd.stock - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        }
      }
      setProducts(prev => prev.map(p => {
        const cartItem = newSale.items.find(it => it.productId === p.id);
        return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
      }));

      // 4. Update member loyalty points if linked
      if (newSale.memberId) {
        const pointsEarned = Math.floor(newSale.total / pointsSettings.currencyPerPoint);
        const member = members.find(m => m.id === newSale.memberId);
        if (member) {
          const newPoints = (member.points || 0) + pointsEarned;
          await supabase.from('members').update({ points: newPoints }).eq('id', newSale.memberId);
          setMembers(prev => prev.map(m => m.id === newSale.memberId ? { ...m, points: newPoints } : m));
        }
      }

      // 5. Prepend new sale to local sales array (NEWEST FIRST!)
      setSales(prev => [newSale, ...prev]);

      // 6. Log audit action
      await addAuditLog(
        'SALE_COMPLETED',
        `Sale ${newSale.id} completed. Total: ₱${newSale.total.toLocaleString()} (${newSale.channel || 'WALK-IN'}, ${newSale.paymentMethod})`
      );

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
      const { error } = await supabase.from('products').upsert([{
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        low_stock_level: product.lowStockLevel,
        barcode: product.barcode,
        image_url: product.imageUrl || null
      }]);

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

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      const prod = products.find(p => p.id === productId);
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
      const { error } = await supabase.from('accounts').upsert([{
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        member_id: user.memberId || null,
        enabled: user.enabled
      }]);

      if (error) {
        alert('Error saving user: ' + error.message);
        return false;
      }

      setUsers(prev => {
        const idx = prev.findIndex(u => u.id === user.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = user;
          return updated;
        }
        return [user, ...prev];
      });

      await addAuditLog('USER_SAVED', `User account ${user.name} (${user.role}) saved.`);
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
        min_spend: promo.minSpend,
        start_date: promo.startDate,
        end_date: promo.endDate,
        active: promo.active
      }]);

      if (error) {
        alert('Error saving promo: ' + error.message);
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
        supplier_name: po.supplierName,
        total_cost: po.totalCost,
        status: po.status,
        date_ordered: po.dateOrdered,
        date_received: po.dateReceived || null
      }]);

      if (poErr) {
        alert('Error saving purchase order: ' + poErr.message);
        return false;
      }

      // Save items
      if (po.items.length > 0) {
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', po.id);
        const itemsPayload = po.items.map(item => ({
          purchase_order_id: po.id,
          product_id: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          cost_price: item.costPrice
        }));
        await supabase.from('purchase_order_items').insert(itemsPayload);
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

      await addAuditLog('PO_SAVED', `Purchase Order ${po.id} from ${po.supplierName} (₱${po.totalCost.toLocaleString()}) saved.`);
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
      await supabase.from('back_orders').insert([{
        id: newBO.id,
        product_id: newBO.productId,
        product_name: newBO.productName,
        quantity: newBO.quantity,
        customer_name: newBO.customerName || null,
        customer_contact: newBO.customerContact || null,
        status: newBO.status,
        notes: newBO.notes || null
      }]);
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

  return (
    <AppContext.Provider value={{
      initialized,
      currentUser,
      setCurrentUser,
      logout,
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
      saveInquiry
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
