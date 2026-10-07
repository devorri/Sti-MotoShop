import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Sale, Product, User } from '../context/AppContext';
import { supabase } from '../supabase';
import {
  Users,
  Package,
  Search,
  Trash2,
  Edit3,
  X,
  Barcode,
  Box,
  PlusCircle,
  RefreshCw,
  Printer,
  History,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { 
    users, 
    setUsers, 
    members, 
    setMembers,
    products, 
    setProducts, 
    sales, 
    setSales, 
    currentUser, 
    syncWithSupabase,
    saveProduct,
    deleteProduct,
    saveUser,
    toggleUserEnabled,
    auditLogs,
    backOrders,
    updateBackOrderStatus,
    pointsSettings
  } = useAppContext();

  // Active Tab synchronized with URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['ACCOUNTS', 'PRODUCTS', 'ORDERS', 'AUDIT', 'BACKORDERS', 'REPORTS', 'BACKUP'] as const;
  type TabType = typeof validTabs[number];

  const tabFromUrl = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTabState] = useState<TabType>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'ACCOUNTS'
  );

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  // User tab states
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'EMPLOYEE' | 'ADMIN' | 'CUSTOMER'>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'EMPLOYEE' as User['role']
  });

  // Product tab states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    category: 'Lubricant',
    customCategory: '',
    price: '',
    stock: '',
    lowStockLevel: '5',
    barcode: ''
  });

  // Orders tab states (Sorted NEWEST FIRST)
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'ORDER PLACED' | 'PREPARING' | 'READY FOR PICKUP' | 'OUT FOR DELIVERY' | 'COMPLETED'>('ALL');
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  // Audit Log tab states
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  // Back Orders tab states
  const [backOrderFilter, setBackOrderFilter] = useState<'ALL' | 'PENDING' | 'NOTIFIED' | 'FULFILLED'>('ALL');

  // Sync on mount
  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Metric calculations
  const totalUsers = users.length;
  const staffMembers = users.filter(u => u.role === 'EMPLOYEE');
  const staffCount = staffMembers.length;
  const activeStaffCount = staffMembers.filter(u => u.enabled).length;

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const pendingOrdersCount = sales.filter(s => s.orderStatus && s.orderStatus !== 'COMPLETED').length;
  const lowStockItemsCount = products.filter(p => p.stock <= p.lowStockLevel).length;

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Filtered Orders (NEWEST FIRST)
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredOrders = sortedSales.filter(s => {
    return orderStatusFilter === 'ALL' || s.orderStatus === orderStatusFilter;
  });

  // Filtered Products
  const productCategories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase());
    const matchAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
    return matchSearch && matchAction;
  });

  // Filtered Back Orders
  const filteredBackOrders = backOrders.filter(bo => {
    return backOrderFilter === 'ALL' || bo.status === backOrderFilter;
  });

  // Order status advance
  const advanceOrderStatus = async (saleId: string) => {
    const statusFlow: Sale['orderStatus'][] = [
      'ORDER PLACED',
      'PREPARING',
      'READY FOR PICKUP',
      'OUT FOR DELIVERY',
      'COMPLETED'
    ];

    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const currentIdx = statusFlow.indexOf(sale.orderStatus || 'ORDER PLACED');
    const nextIdx = currentIdx < statusFlow.length - 1 ? currentIdx + 1 : currentIdx;
    const newStatus = statusFlow[nextIdx];

    // Persist to Supabase first
    const { error } = await supabase
      .from('sales')
      .update({ order_status: newStatus })
      .eq('id', saleId);

    if (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status: ' + error.message);
      return;
    }

    // Then update local state
    setSales(sales.map(s =>
      s.id === saleId ? { ...s, orderStatus: newStatus } : s
    ));
  };

  // Add Product Handler
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) return;

    const priceVal = parseFloat(newProductForm.price) || 0;
    const stockVal = parseInt(newProductForm.stock, 10) || 0;
    const lowStockVal = parseInt(newProductForm.lowStockLevel, 10) || 5;

    const categoryVal = newProductForm.category === 'CUSTOM'
      ? (newProductForm.customCategory.trim() || 'General')
      : newProductForm.category;

    const barcodeVal = newProductForm.barcode.trim() || `50${Date.now().toString().slice(-10)}`;
    const productId = `PROD-${Date.now().toString().slice(-6)}`;

    const newProd: Product = {
      id: productId,
      name: newProductForm.name.trim(),
      description: newProductForm.description.trim() || 'High performance motorcycle part/accessory.',
      category: categoryVal,
      price: priceVal,
      stock: stockVal,
      lowStockLevel: lowStockVal,
      barcode: barcodeVal
    };

    const ok = await saveProduct(newProd);
    if (ok) {
      setShowAddProductModal(false);
      setNewProductForm({
        name: '',
        description: '',
        category: 'Lubricant',
        customCategory: '',
        price: '',
        stock: '',
        lowStockLevel: '5',
        barcode: ''
      });
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const ok = await saveProduct(editingProduct);
    if (ok) {
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to remove "${productName}" from the catalog?`)) {
      await deleteProduct(productId);
    }
  };

  // Add User Handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username.trim() || !newUserForm.name.trim() || !newUserForm.password) {
      alert('Please fill out all fields.');
      return;
    }

    const newUser: User = {
      id: `U_${Date.now().toString().slice(-6)}`,
      name: newUserForm.name.trim(),
      username: newUserForm.username.trim(),
      password: newUserForm.password,
      role: newUserForm.role,
      enabled: true
    };

    const ok = await saveUser(newUser);
    if (ok) {
      setShowAddUserModal(false);
      setNewUserForm({ name: '', username: '', password: '', role: 'EMPLOYEE' });
    }
  };

  // Quick Stock Adjustment
  const handleQuickStock = async (product: Product, delta: number) => {
    const updated = { ...product, stock: Math.max(0, product.stock + delta) };
    await saveProduct(updated);
  };

  // Backup & Restore
  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      system: 'Boss Rap Motor Shop Enterprise System',
      users,
      members,
      products,
      sales,
      auditLogs,
      backOrders
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boss_rap_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm('Restore system data from this backup? Existing records will be updated.')) {
          if (data.products) setProducts(data.products);
          if (data.users) setUsers(data.users);
          if (data.members) setMembers(data.members);
          if (data.sales) setSales(data.sales);
          alert('Backup restored successfully into memory state!');
        }
      } catch (err) {
        alert('Failed to parse backup file. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  // Reporting chart data
  const categorySalesMap: { [cat: string]: number } = {};
  products.forEach(p => {
    categorySalesMap[p.category] = (categorySalesMap[p.category] || 0) + (p.stock * p.price);
  });
  const categoryValueData = Object.keys(categorySalesMap).map(cat => ({
    name: cat,
    value: categorySalesMap[cat]
  }));

  const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#8b5cf6', '#eab308', '#06b6d4'];

  const productStockData = products.slice(0, 8).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    stock: p.stock,
    price: p.price
  }));

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Welcome Banner */}
      <div className="card" style={{
        backgroundColor: '#ffffff',
        padding: '24px 28px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-red">ADMINISTRATOR</span>
            <span className="badge badge-green">LIVE SYSTEM ONLINE</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '4px 0', fontWeight: 800 }}>
            Welcome, {currentUser?.name}!
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Boss Rap Motor Shop Enterprise Management Portal
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => syncWithSupabase()}
            className="btn"
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} />
            <span>Sync Supabase</span>
          </button>
        </div>
      </div>

      {/* 5 Metric Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Total Users */}
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL USERS</span>
            <Users size={16} color="#64748b" />
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#2563eb', fontWeight: 800 }}>
            {totalUsers}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>All Live Supabase Accounts</span>
        </div>

        {/* Staff Members Breakdown */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>STAFF ROSTER</span>
            <span className="badge badge-blue">{staffCount} Staff</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#0f172a', fontWeight: 800 }}>
            {activeStaffCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/ {staffCount} Active</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned Cashiers</span>
        </div>

        {/* Total Sales Revenue */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL REVENUE</span>
            <span className="badge badge-green">SALES</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#059669', fontWeight: 800 }}>
            ₱{totalSalesRevenue.toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{sales.length} Lifetime Transactions</span>
        </div>

        {/* Active Customer Orders */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PENDING ORDERS</span>
            <Box size={16} color="#d97706" />
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#d97706', fontWeight: 800 }}>
            {pendingOrdersCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Needs Counter Fulfillment</span>
        </div>

        {/* Low Stock Items Alert */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>INVENTORY ALERTS</span>
            <AlertTriangle size={16} color="#dc2626" />
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#dc2626', fontWeight: 800 }}>
            {lowStockItemsCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Items at or below reorder level</span>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '22px', overflowX: 'auto' }}>
        {[
          { id: 'ACCOUNTS', label: `Accounts & Staff (${users.length})`, icon: <Users size={15} /> },
          { id: 'PRODUCTS', label: `Catalog & Inventory (${products.length})`, icon: <Package size={15} /> },
          { id: 'ORDERS', label: `Orders Feed (${sales.length})`, icon: <Box size={15} /> },
          { id: 'AUDIT', label: `Audit Trail (${auditLogs.length})`, icon: <History size={15} /> },
          { id: 'BACKORDERS', label: `Back Orders (${backOrders.length})`, icon: <Clock size={15} /> },
          { id: 'REPORTS', label: 'Analytics & Reports', icon: <BarChart2 size={15} /> },
          { id: 'BACKUP', label: 'Backup & Restore', icon: <Download size={15} /> },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '10px 16px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '3px solid #2563eb' : '3px solid transparent',
              color: activeTab === t.id ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              marginBottom: '-2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* Tab 1: User & Staff Accounts */}
      {/* ======================================================== */}
      {activeTab === 'ACCOUNTS' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                System Accounts & Staff Roster
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Showing {filteredUsers.length} of {users.length} accounts. Live-synced from Supabase `accounts` table.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '180px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'EMPLOYEE', 'ADMIN', 'CUSTOMER'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleFilter(role)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: roleFilter === role ? '#2563eb' : '#ffffff',
                      color: roleFilter === role ? '#ffffff' : '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <PlusCircle size={14} />
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ACCOUNT USER</th>
                  <th>USERNAME</th>
                  <th>ROLE</th>
                  <th>LINKED MEMBER PROFILE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No user accounts found. Click "Sync Supabase" above to refresh cloud accounts.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const memberProfile = members.find(m => m.id === user.memberId);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {user.id}</div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {user.username}
                          </code>
                        </td>
                        <td>
                          <span className={`badge ${
                            user.role === 'ADMIN' ? 'badge-red' :
                            user.role === 'EMPLOYEE' ? 'badge-blue' : 'badge-green'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {memberProfile ? (
                            <div>
                              <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{memberProfile.name}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                                ID: {memberProfile.id} • {memberProfile.points} PTS
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${user.enabled ? 'badge-green' : 'badge-red'}`}>
                            {user.enabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                        <td>
                          {user.role !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => toggleUserEnabled(user.id)}
                              className={user.enabled ? 'btn-danger' : 'btn'}
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            >
                              {user.enabled ? 'Disable' : 'Enable'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 2: Products & Inventory Catalog */}
      {/* ======================================================== */}
      {activeTab === 'PRODUCTS' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Inventory Management & Spare Parts
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Manage stock levels, barcodes, prices, and low stock thresholds.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search item/barcode..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '180px' }}
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
                style={{ height: '34px', fontSize: '0.8rem', width: '140px' }}
              >
                {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              >
                <PlusCircle size={14} />
                <span>+ Add Product</span>
              </button>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>BARCODE / ID</th>
                  <th>ITEM NAME & DETAILS</th>
                  <th>CATEGORY</th>
                  <th>UNIT PRICE</th>
                  <th>POINTS YIELD</th>
                  <th>STOCK LEVEL</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const isLowStock = product.stock <= product.lowStockLevel && product.stock > 0;
                  const isOutOfStock = product.stock === 0;
                  const pointsEarned = Math.floor(product.price / pointsSettings.currencyPerPoint);

                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Barcode size={15} color="#64748b" />
                          <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>{product.barcode}</code>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ID: {product.id}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>
                          {product.name}
                        </strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {product.description}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">{product.category}</span>
                      </td>
                      <td>
                        <strong style={{ color: '#16a34a', fontSize: '0.92rem' }}>
                          ₱{product.price.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                          +{pointsEarned} PTS
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleQuickStock(product, -1)}
                            style={{ width: '22px', height: '22px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}
                          >-</button>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isOutOfStock ? '#dc2626' : isLowStock ? '#ea580c' : '#0f172a', minWidth: '24px', textAlign: 'center' }}>
                            {product.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStock(product, 1)}
                            style={{ width: '22px', height: '22px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}
                          >+</button>
                        </div>
                      </td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-red">OUT OF STOCK</span>
                        ) : isLowStock ? (
                          <span className="badge badge-yellow">LOW ({product.stock})</span>
                        ) : (
                          <span className="badge badge-green">IN STOCK</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 3: Customer Orders Feed (NEWEST FIRST) */}
      {/* ======================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Live Orders Feed (Sorted Newest First)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Manage counter sales and online orders. Advance order status through fulfillment lifecycle.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {(['ALL', 'ORDER PLACED', 'PREPARING', 'READY FOR PICKUP', 'OUT FOR DELIVERY', 'COMPLETED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderStatusFilter(st)}
                  style={{
                    padding: '5px 9px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: orderStatusFilter === st ? '#2563eb' : '#ffffff',
                    color: orderStatusFilter === st ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ORDER ID & DATE</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS ORDERED</th>
                  <th>FULFILLMENT</th>
                  <th>PAYMENT</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      No orders found matching status filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(sale => {
                    const memberProfile = members.find(m => m.id === sale.memberId);
                    return (
                      <tr key={sale.id}>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>{sale.id}</strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {sale.trackingCode && (
                            <div style={{ fontSize: '0.68rem', color: '#2563eb' }}>{sale.trackingCode}</div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {memberProfile?.name || (sale.notes?.includes('MEMBER:') ? sale.notes.split('MEMBER:')[1]?.replace(')', '').trim() : sale.memberId || 'Walk-In Customer')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {memberProfile?.contact || (sale.notes?.includes('PHONE:') ? sale.notes.split('PHONE:')[1]?.trim() : 'Counter Sale')}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem' }}>
                            {sale.items.map((it, idx) => (
                              <div key={idx} style={{ color: '#334155' }}>
                                • {it.name} × <strong>{it.quantity}</strong>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${sale.fulfillmentType === 'DELIVERY' ? 'badge-blue' : 'badge-yellow'}`}>
                            {sale.fulfillmentType || 'COUNTER'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sale.paymentMethod}</div>
                          {sale.paymentRef && (
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Ref: {sale.paymentRef}</div>
                          )}
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>₱{sale.total.toLocaleString()}</strong>
                        </td>
                        <td>
                          <span className={`badge ${
                            sale.orderStatus === 'COMPLETED' ? 'badge-green' :
                            sale.orderStatus === 'READY FOR PICKUP' ? 'badge-blue' :
                            sale.orderStatus === 'OUT FOR DELIVERY' ? 'badge-blue' : 'badge-yellow'
                          }`}>
                            {sale.orderStatus}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {sale.orderStatus !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => advanceOrderStatus(sale.id)}
                                className="btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                title="Advance to Next Status"
                              >
                                Advance
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(sale)}
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              title="Print Receipt"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 4: Audit Trail */}
      {/* ======================================================== */}
      {activeTab === 'AUDIT' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                System Audit Trail & Activity History
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Complete enterprise activity logging. Records user sessions, sales transactions, inventory updates, and administrative changes.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '200px' }}
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                style={{ height: '34px', fontSize: '0.8rem', width: '150px' }}
              >
                <option value="ALL">All Actions</option>
                <option value="SALE_COMPLETED">Sales</option>
                <option value="PRODUCT_SAVED">Product Changes</option>
                <option value="LOGIN">Logins</option>
                <option value="USER_REGISTERED">Registrations</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>ACTION TYPE</th>
                  <th>ACTIVITY DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      No audit logs found. Perform actions in the system to generate audit records.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{log.userName}</strong>
                      </td>
                      <td>
                        <span className={`badge ${
                          log.userRole === 'ADMIN' ? 'badge-red' :
                          log.userRole === 'EMPLOYEE' ? 'badge-blue' : 'badge-green'
                        }`}>
                          {log.userRole}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {log.action}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#334155' }}>{log.details}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 5: Back Orders */}
      {/* ======================================================== */}
      {activeTab === 'BACKORDERS' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Back Orders & Reservation Queue
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Track customer reservations for out-of-stock items and manage restock notification fulfillment.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'PENDING', 'NOTIFIED', 'FULFILLED'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBackOrderFilter(st)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: backOrderFilter === st ? '#2563eb' : '#ffffff',
                    color: backOrderFilter === st ? '#ffffff' : '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RESERVATION ID</th>
                  <th>ITEM REQUESTED</th>
                  <th>QTY</th>
                  <th>CUSTOMER</th>
                  <th>CONTACT</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredBackOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      No back orders recorded. When out-of-stock items are requested by customers, register them here.
                    </td>
                  </tr>
                ) : (
                  filteredBackOrders.map(bo => (
                    <tr key={bo.id}>
                      <td>
                        <strong>{bo.id}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(bo.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{bo.productName}</strong>
                      </td>
                      <td>
                        <strong>{bo.quantity}</strong>
                      </td>
                      <td>{bo.customerName || 'N/A'}</td>
                      <td>{bo.customerContact || 'N/A'}</td>
                      <td>
                        <span className={`badge ${
                          bo.status === 'FULFILLED' ? 'badge-green' :
                          bo.status === 'NOTIFIED' ? 'badge-blue' : 'badge-yellow'
                        }`}>
                          {bo.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {bo.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => updateBackOrderStatus(bo.id, 'NOTIFIED')}
                              className="btn"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            >
                              Mark Notified
                            </button>
                          )}
                          {bo.status !== 'FULFILLED' && (
                            <button
                              type="button"
                              onClick={() => updateBackOrderStatus(bo.id, 'FULFILLED')}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            >
                              Fulfill
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 6: Analytics & Reports (With Recharts) */}
      {/* ======================================================== */}
      {activeTab === 'REPORTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 4px 0', fontWeight: 800 }}>
              Sales & Inventory Analytics Overview
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: '#64748b' }}>
              Real-time analytics for revenue distribution, stock levels, and store performance.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Product Stock Chart */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '14px' }}>
                  INVENTORY STOCK LEVEL BY PRODUCT
                </strong>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productStockData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="stock" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Inventory Value Chart */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block', marginBottom: '14px' }}>
                  INVENTORY CAPITAL VALUE BY CATEGORY (₱)
                </strong>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryValueData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {categoryValueData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₱${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 7: Backup & Restore */}
      {/* ======================================================== */}
      {activeTab === 'BACKUP' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 6px 0', fontWeight: 800 }}>
            System Backup & Data Restore
          </h2>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.82rem', color: '#64748b' }}>
            Export and restore complete system snapshots for disaster recovery, data portability, and archival.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Export Card */}
            <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Download size={22} color="#2563eb" />
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Export Full Database Backup</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
                Downloads a comprehensive snapshot JSON file containing all users, registered members, inventory products, transaction sales, and audit logs.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                <Download size={15} />
                <span>Download JSON Backup</span>
              </button>
            </div>

            {/* Import Card */}
            <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Upload size={22} color="#16a34a" />
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Restore System From Backup</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
                Upload a previously saved Boss Rap backup JSON file to restore products, user records, and transaction logs.
              </p>
              <label className="btn" style={{ padding: '10px 18px', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={15} />
                <span>Upload & Restore Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Add Product Modal */}
      {/* ======================================================== */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
          <div className="modal" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Add New Product to Catalog
              </h2>
              <button type="button" onClick={() => setShowAddProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Semi-Synthetic 10W-40 800ml"
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Category *</label>
                <select
                  value={newProductForm.category}
                  onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                >
                  <option value="Lubricant">Lubricant</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Tires">Tires</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Engine & Drivetrain">Engine & Drivetrain</option>
                  <option value="Filters">Filters</option>
                  <option value="Accessories">Accessories</option>
                  <option value="CUSTOM">+ Custom Category</option>
                </select>
              </div>

              {newProductForm.category === 'CUSTOM' && (
                <div>
                  <label>Custom Category Name *</label>
                  <input
                    type="text"
                    placeholder="Enter category..."
                    value={newProductForm.customCategory}
                    onChange={e => setNewProductForm({ ...newProductForm, customCategory: e.target.value })}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Unit Price (₱) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProductForm.price}
                    onChange={e => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Initial Stock Qty *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newProductForm.stock}
                    onChange={e => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Low Stock Alert Level</label>
                  <input
                    type="number"
                    value={newProductForm.lowStockLevel}
                    onChange={e => setNewProductForm({ ...newProductForm, lowStockLevel: e.target.value })}
                  />
                </div>
                <div>
                  <label>Barcode (EAN-13)</label>
                  <input
                    type="text"
                    placeholder="Leave blank for auto"
                    value={newProductForm.barcode}
                    onChange={e => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea
                  rows={2}
                  placeholder="Part specifications, compatibility notes..."
                  value={newProductForm.description}
                  onChange={e => setNewProductForm({ ...newProductForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddProductModal(false)} className="btn" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Product to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Edit Product Modal */}
      {/* ======================================================== */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal" style={{ maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Edit Product: {editingProduct.name}
              </h2>
              <button type="button" onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>Item Name *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Unit Price (₱) *</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Low Stock Alert Level</label>
                  <input
                    type="number"
                    value={editingProduct.lowStockLevel}
                    onChange={e => setEditingProduct({ ...editingProduct, lowStockLevel: parseInt(e.target.value, 10) || 5 })}
                  />
                </div>
                <div>
                  <label>Barcode</label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label>Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setEditingProduct(null)} className="btn" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Add User Modal */}
      {/* ======================================================== */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal" style={{ maxWidth: '440px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Add New Staff or User
              </h2>
              <button type="button" onClick={() => setShowAddUserModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mike Reyes"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Username *</label>
                <input
                  type="text"
                  placeholder="e.g. mike"
                  value={newUserForm.username}
                  onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Enter login password"
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>System Role *</label>
                <select
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                >
                  <option value="EMPLOYEE">Staff Cashier (POS Access)</option>
                  <option value="ADMIN">System Administrator (Full Access)</option>
                  <option value="CUSTOMER">Customer Account</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save User to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Printable Receipt Modal */}
      {/* ======================================================== */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div id="receipt-print-area" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900 }}>BOSS RAP MOTOR SHOP</h2>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>JP Rizal St., Baliuag, Bulacan</div>
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>OFFICIAL STORE RECEIPT</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Order #: {activeReceipt.id}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date: {new Date(activeReceipt.date).toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Member ID: {activeReceipt.memberId || 'WALK-IN'}</div>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', marginBottom: '8px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                {activeReceipt.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{it.name} × {it.quantity}</span>
                    <strong>₱{(it.price * it.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>₱{activeReceipt.subtotal.toLocaleString()}</span>
              </div>
              {activeReceipt.discountApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
                  <span>Discount:</span>
                  <span>-₱{activeReceipt.discountApplied.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, margin: '6px 0' }}>
                <span>TOTAL:</span>
                <span>₱{activeReceipt.total.toLocaleString()}</span>
              </div>

              <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

              <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>
                <div>Payment Method: {activeReceipt.paymentMethod}</div>
                {activeReceipt.paymentRef && <div>Ref: {activeReceipt.paymentRef}</div>}
                <div>Status: {activeReceipt.orderStatus}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => window.print()} className="btn-primary" style={{ flex: 1 }}>
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
              <button type="button" onClick={() => setActiveReceipt(null)} className="btn" style={{ flex: 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Exports for backward-compatibility with main router
export const UserManagement: React.FC = () => <Dashboard />;
export const Inventory: React.FC = () => <Dashboard />;
