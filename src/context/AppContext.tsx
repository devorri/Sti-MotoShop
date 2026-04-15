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
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockLevel: number;
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
  total: number;
  date: string;
  memberId?: string;
}

export interface Member {
  id: string;
  name: string;
  contact: string;
  joinDate: string;
  points: number;
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
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Sample Data
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Engine Oil 1L', category: 'Lubricant', price: 450, stock: 15, lowStockLevel: 5 },
  { id: '2', name: 'Brake Pad Set', category: 'Brakes', price: 1200, stock: 3, lowStockLevel: 5 },
  { id: '3', name: 'Tire 17"', category: 'Tires', price: 2500, stock: 8, lowStockLevel: 2 },
  { id: '4', name: 'Spark Plug', category: 'Electrical', price: 150, stock: 20, lowStockLevel: 10 },
];

const INITIAL_MEMBERS: Member[] = [
  { id: 'M001', name: 'John Doe', contact: '09123456789', joinDate: '2024-01-10', points: 100 },
  { id: 'M002', name: 'Jane Smith', contact: '09987654321', joinDate: '2024-02-15', points: 50 },
  { id: 'M003', name: 'Robert Fox', contact: '09887766554', joinDate: '2024-03-20', points: 0 },
];

const INITIAL_USERS: User[] = [
  // ADMINS
  { id: 'U001', name: 'Boss Rap (Admin)', username: 'admin', password: '123', role: 'ADMIN' },
  { id: 'U002', name: 'Store Owner', username: 'owner', password: '123', role: 'ADMIN' },
  { id: 'U003', name: 'System Manager', username: 'boss', password: '123', role: 'ADMIN' },
  
  // STAFF (EMPLOYEES)
  { id: 'S001', name: 'Staff Mike', username: 'mike', password: '123', role: 'EMPLOYEE' },
  { id: 'S002', name: 'Staff Sara', username: 'sara', password: '123', role: 'EMPLOYEE' },
  { id: 'S003', name: 'Staff John', username: 'john', password: '123', role: 'EMPLOYEE' },

  // CUSTOMERS (USERS) - Mapping members to users for login
  { id: 'U_M001', name: 'John Doe', username: 'M001', password: '123', role: 'CUSTOMER', memberId: 'M001' },
  { id: 'U_M002', name: 'Jane Smith', username: 'M002', password: '123', role: 'CUSTOMER', memberId: 'M002' },
  { id: 'U_M003', name: 'Robert Fox', username: 'M003', password: '123', role: 'CUSTOMER', memberId: 'M003' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const savedProducts = localStorage.getItem('motoshop_products');
    const savedMembers = localStorage.getItem('motoshop_members');
    const savedSales = localStorage.getItem('motoshop_sales');
    const savedUsers = localStorage.getItem('motoshop_users');

    setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);
    setMembers(savedMembers ? JSON.parse(savedMembers) : INITIAL_MEMBERS);
    setSales(savedSales ? JSON.parse(savedSales) : []);
    setUsers(savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS);
  }, []);

  useEffect(() => {
    if (products.length > 0) localStorage.setItem('motoshop_products', JSON.stringify(products));
    if (members.length > 0) localStorage.setItem('motoshop_members', JSON.stringify(members));
    if (sales.length > 0) localStorage.setItem('motoshop_sales', JSON.stringify(sales));
    if (users.length > 0) localStorage.setItem('motoshop_users', JSON.stringify(users));
  }, [products, members, sales, users]);

  const logout = () => setCurrentUser(null);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, 
      products, setProducts, 
      members, setMembers, 
      sales, setSales, 
      users, setUsers,
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
