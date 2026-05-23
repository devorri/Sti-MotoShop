import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type Role = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' | 'GUEST';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  password?: string;
  memberId?: string; // Links to Member profile for CUSTOMER role
  enabled: boolean;  // Active state for employee management
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
  paymentMethod: 'CASH' | 'E-WALLET' | 'ONLINE BANK';
  paymentRef?: string; // Reference number for E-Wallet / Online Banking
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
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface PointsSettings {
  currencyPerPoint: number; // ₱ spent per point earned
  pointValue: number;       // Value of 1 point in PHP for discounts
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  promos: Promo[];
  setPromos: React.Dispatch<React.SetStateAction<Promo[]>>;
  returnRequests: ReturnRequest[];
  setReturnRequests: React.Dispatch<React.SetStateAction<ReturnRequest[]>>;
  inquiries: Inquiry[];
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  pointsSettings: PointsSettings;
  setPointsSettings: (settings: PointsSettings) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Sample Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Engine Oil 1L', description: 'Premium synthetic engine oil for 4-stroke motorcycles.', category: 'Lubricant', price: 450, stock: 15, lowStockLevel: 5, barcode: '501234567890' },
  { id: '2', name: 'Brake Pad Set', description: 'High friction ceramic brake pads for superior stopping power.', category: 'Brakes', price: 1200, stock: 3, lowStockLevel: 5, barcode: '501234567891' },
  { id: '3', name: 'Tire 17"', description: 'All-weather sport touring tire with deep groove tread.', category: 'Tires', price: 2500, stock: 8, lowStockLevel: 2, barcode: '501234567892' },
  { id: '4', name: 'Spark Plug', description: 'High-performance iridium spark plug for stable ignition.', category: 'Electrical', price: 150, stock: 20, lowStockLevel: 10, barcode: '501234567893' },
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'M001', name: 'JOHN DOE', contact: '09123456789', address: 'Baliuag, Bulacan', joinDate: '2024-01-10', points: 100 },
  { id: 'M002', name: 'JANE SMITH', contact: '09987654321', address: 'Pulilan, Bulacan', joinDate: '2024-02-15', points: 50 },
  { id: 'M003', name: 'ROBERT FOX', contact: '09887766554', address: 'Bustos, Bulacan', joinDate: '2024-03-20', points: 0 },
];

const INITIAL_USERS: User[] = [
  // ADMINS
  { id: 'U001', name: 'Boss Rap (Admin)', username: 'admin', password: '123', role: 'ADMIN', enabled: true },
  { id: 'U002', name: 'Store Owner', username: 'owner', password: '123', role: 'ADMIN', enabled: true },
  { id: 'U003', name: 'System Manager', username: 'boss', password: '123', role: 'ADMIN', enabled: true },
  
  // STAFF (EMPLOYEES)
  { id: 'S001', name: 'Staff Mike', username: 'mike', password: '123', role: 'EMPLOYEE', enabled: true },
  { id: 'S002', name: 'Staff Sara', username: 'sara', password: '123', role: 'EMPLOYEE', enabled: true },
  { id: 'S003', name: 'Staff John', username: 'john', password: '123', role: 'EMPLOYEE', enabled: false }, // Disabled for demonstration

  // CUSTOMERS (USERS) - Mapping members to users for login
  { id: 'U_M001', name: 'JOHN DOE', username: 'M001', password: '123', role: 'CUSTOMER', memberId: 'M001', enabled: true },
  { id: 'U_M002', name: 'JANE SMITH', username: 'M002', password: '123', role: 'CUSTOMER', memberId: 'M002', enabled: true },
  { id: 'U_M003', name: 'ROBERT FOX', username: 'M003', password: '123', role: 'CUSTOMER', memberId: 'M003', enabled: true },
];

const INITIAL_PROMOS: Promo[] = [
  { id: 'P001', name: 'WELCOME10', description: '10% discount on orders of ₱1,000 or more', discountPercent: 10, minSpend: 1000, startDate: '2026-01-01', endDate: '2026-12-31', active: true },
  { id: 'P002', name: 'SUMMER5', description: '5% discount on all purchases', discountPercent: 5, minSpend: 0, startDate: '2026-03-01', endDate: '2026-08-31', active: true },
];

const INITIAL_INQUIRIES: Inquiry[] = [
  { id: 'I001', name: 'Alan Walker', email: 'alan@walker.com', message: 'Do you have Honda Click 125i fairings available?', date: '2026-05-18T10:30:00Z' },
  { id: 'I002', name: 'Sarah Connor', email: 'sarah@skynet.com', message: 'How much is the labor cost for a full engine overhaul?', date: '2026-05-19T14:45:00Z' },
];

const INITIAL_POINTS_SETTINGS: PointsSettings = {
  currencyPerPoint: 100,
  pointValue: 1
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pointsSettings, setPointsSettingsState] = useState<PointsSettings>(INITIAL_POINTS_SETTINGS);

  useEffect(() => {
    const savedProducts = localStorage.getItem('motoshop_products');
    const savedMembers = localStorage.getItem('motoshop_members');
    const savedSales = localStorage.getItem('motoshop_sales');
    const savedUsers = localStorage.getItem('motoshop_users');
    const savedPromos = localStorage.getItem('motoshop_promos');
    const savedReturns = localStorage.getItem('motoshop_returns');
    const savedInquiries = localStorage.getItem('motoshop_inquiries');
    const savedSettings = localStorage.getItem('motoshop_points_settings');

    setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);
    setMembers(savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS);
    setSales(savedSales ? JSON.parse(savedSales) : []);
    setUsers(savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS);
    setPromos(savedPromos ? JSON.parse(savedPromos) : INITIAL_PROMOS);
    setReturnRequests(savedReturns ? JSON.parse(savedReturns) : []);
    setInquiries(savedInquiries ? JSON.parse(savedInquiries) : INITIAL_INQUIRIES);
    setPointsSettingsState(savedSettings ? JSON.parse(savedSettings) : INITIAL_POINTS_SETTINGS);
  }, []);

  useEffect(() => {
    if (products.length > 0) localStorage.setItem('motoshop_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (members.length > 0) localStorage.setItem('motoshop_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (sales.length > 0) localStorage.setItem('motoshop_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    if (users.length > 0) localStorage.setItem('motoshop_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('motoshop_promos', JSON.stringify(promos));
  }, [promos]);

  useEffect(() => {
    localStorage.setItem('motoshop_returns', JSON.stringify(returnRequests));
  }, [returnRequests]);

  useEffect(() => {
    localStorage.setItem('motoshop_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  const setPointsSettings = (settings: PointsSettings) => {
    setPointsSettingsState(settings);
    localStorage.setItem('motoshop_points_settings', JSON.stringify(settings));
  };

  const logout = () => setCurrentUser(null);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, 
      products, setProducts, 
      members, setMembers, 
      sales, setSales, 
      users, setUsers,
      promos, setPromos,
      returnRequests, setReturnRequests,
      inquiries, setInquiries,
      pointsSettings, setPointsSettings,
      logout 
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
