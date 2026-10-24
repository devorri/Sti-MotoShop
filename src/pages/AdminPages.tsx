import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Sale, Product, User } from '../context/AppContext';
import { supabase, uploadFileToBucket } from '../supabase';
import {
  Users,
  Search,
  Trash2,
  Edit3,
  X,
  Barcode,
  Box,
  PlusCircle,
  RefreshCw,
  Printer,
  Download,
  Upload,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Truck,
  Store,
  MapPin,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react';
import { PaginationControls } from '../components/PaginationControls';
import { createEan13, Ean13Barcode, isEan13, toEan13 } from '../components/Ean13Barcode';
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
    auditLogs,
    backOrders,
    updateBackOrderStatus,
    addBackOrder,
    pointsSettings,
    verifySalePayment
  } = useAppContext();

  // Active Tab synchronized with URL search params (controlled by the left sidebar navigation)
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabs = ['ACCOUNTS', 'PRODUCTS', 'ORDERS', 'AUDIT', 'BACKORDERS', 'REPORTS', 'BACKUP'] as const;
  type TabType = typeof validTabs[number];

  const tabFromUrl = searchParams.get('tab') as TabType;
  const activeTab: TabType = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'ACCOUNTS';

  // Sales Overview Date Filter states (Today, Yesterday, Week, Month, Annually, Custom Date)
  const [overviewPeriod, setOverviewPeriod] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // User tab states & Pagination
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'EMPLOYEE' | 'ADMIN' | 'CUSTOMER' | 'RIDER'>('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'EMPLOYEE' as User['role']
  });

  // Product tab states & Pagination
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState<'ALL' | 'LOW' | 'OUT_OF_STOCK' | 'IN_STOCK'>('ALL');
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(10);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodePreview, setBarcodePreview] = useState<Product | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    description: '',
    category: 'Lubricant',
    customCategory: '',
    price: '',
    stock: '',
    lowStockLevel: '5',
    barcode: '',
    imageUrl: '',
    weightKg: '0.5',
    isBulky: false
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Orders tab states (Sorted MOST RECENT FIRST by default, with Date, Channel, and Pagination)
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'ORDER PLACED' | 'PREPARING' | 'READY FOR PICKUP' | 'OUT FOR DELIVERY' | 'COMPLETED'>('ALL');
  const [orderChannelFilter, setOrderChannelFilter] = useState<'ALL' | 'WALK-IN' | 'ONLINE'>('ALL');
  const [orderDateFilter, setOrderDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSortBy, setOrderSortBy] = useState<'DATE' | 'TOTAL' | 'ID' | 'CUSTOMER' | 'STATUS'>('DATE');
  const [orderSortOrder, setOrderSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  const [viewingReceiptSale, setViewingReceiptSale] = useState<Sale | null>(null);
  const [advanceModalOrder, setAdvanceModalOrder] = useState<Sale | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);

  // Audit Log tab states & Pagination
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(15);

  // Back Orders tab states & Pagination & Modal
  const [backOrderFilter, setBackOrderFilter] = useState<'ALL' | 'PENDING' | 'NOTIFIED' | 'FULFILLED'>('ALL');
  const [backOrderSearch, setBackOrderSearch] = useState('');
  const [backOrderPage, setBackOrderPage] = useState(1);
  const [backOrderPageSize, setBackOrderPageSize] = useState(10);
  const [showAddBackOrderModal, setShowAddBackOrderModal] = useState(false);
  const [isCustomBackOrderProduct, setIsCustomBackOrderProduct] = useState(false);
  const [newBackOrderForm, setNewBackOrderForm] = useState({
    productId: '',
    customProductName: '',
    quantity: 1,
    selectedMemberId: '',
    customerName: '',
    customerContact: '',
    notes: ''
  });
  const [submittingBackOrder, setSubmittingBackOrder] = useState(false);

  // Sync on mount
  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  const orderIdFromUrl = searchParams.get('orderId');
  const searchFromUrl = searchParams.get('search');

  // Shopee-style: Automatically open specific receipt if orderId is in URL
  useEffect(() => {
    if (orderIdFromUrl && sales.length > 0) {
      const targetSale = sales.find(s => s.id === orderIdFromUrl);
      if (targetSale) {
        setActiveReceipt(targetSale);
      }
    }
  }, [orderIdFromUrl, sales]);

  // Sync search filter from URL
  useEffect(() => {
    if (searchFromUrl) {
      if (activeTab === 'PRODUCTS') {
        setProductSearch(searchFromUrl);
      } else if (activeTab === 'AUDIT') {
        setAuditSearch(searchFromUrl);
      }
    }
  }, [searchFromUrl, activeTab]);

  // Metric calculations
  const totalUsers = users.length;
  const staffMembers = users.filter(u => u.role === 'EMPLOYEE');
  const staffCount = staffMembers.length;
  const activeStaffCount = staffMembers.filter(u => u.enabled).length;

  // Helper to filter any sales list by date range
  const filterSalesByDate = (salesList: Sale[], period: string, customDateStr: string) => {
    if (period === 'ALL') return salesList;
    const now = new Date();
    // Midnight today in local time
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;

    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const yesterdayEnd = todayStart - 1;

    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    return salesList.filter(s => {
      const saleTime = new Date(s.date).getTime();
      if (isNaN(saleTime)) return false;

      if (period === 'TODAY') {
        return saleTime >= todayStart && saleTime <= todayEnd;
      }
      if (period === 'YESTERDAY') {
        return saleTime >= yesterdayStart && saleTime <= yesterdayEnd;
      }
      if (period === 'WEEK') {
        return saleTime >= weekStart;
      }
      if (period === 'MONTH') {
        return saleTime >= monthStart;
      }
      if (period === 'YEAR') {
        return saleTime >= yearStart;
      }
      if (period === 'CUSTOM' && customDateStr) {
        const parts = customDateStr.split('-');
        if (parts.length === 3) {
          const cStart = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
          const cEnd = cStart + 24 * 60 * 60 * 1000 - 1;
          return saleTime >= cStart && saleTime <= cEnd;
        }
      }
      return true;
    });
  };

  // Period Overview Sales (Recalculates based on Today, Yesterday, Week, Month, Annually, Custom Date)
  const periodOverviewSales = filterSalesByDate(sales, overviewPeriod, customDate);

  const periodOnlineSales = periodOverviewSales.filter(s => 
    s.channel === 'ONLINE/FACEBOOK' || 
    s.fulfillmentType === 'DELIVERY' || 
    s.id.startsWith('S_ONL')
  );
  const periodWalkInSales = periodOverviewSales.filter(s => 
    s.channel !== 'ONLINE/FACEBOOK' && 
    s.fulfillmentType !== 'DELIVERY' && 
    !s.id.startsWith('S_ONL')
  );

  const periodTotalRevenue = periodOverviewSales.reduce((sum, s) => sum + s.total, 0);
  const periodWalkInRevenue = periodWalkInSales.reduce((sum, s) => sum + s.total, 0);
  const periodOnlineRevenue = periodOnlineSales.reduce((sum, s) => sum + s.total, 0);
  const periodTotalOrdersCount = periodOverviewSales.length;
  const periodWalkInSalesCount = periodWalkInSales.length;
  const periodOnlineSalesCount = periodOnlineSales.length;

  const pendingOrdersCount = sales.filter(s => s.orderStatus && s.orderStatus !== 'COMPLETED').length;
  const lowStockItemsCount = products.filter(p => p.stock <= p.lowStockLevel).length;

  // Overview Card Click Handlers (Make Overview Cards Clickable!)
  const handleTotalRevenueCardClick = () => {
    setSearchParams({ tab: 'ORDERS' });
    setOrderDateFilter(overviewPeriod);
    setOrderChannelFilter('ALL');
    setOrderStatusFilter('ALL');
    setOrderPage(1);
  };

  const handleWalkInCardClick = () => {
    setSearchParams({ tab: 'ORDERS' });
    setOrderDateFilter(overviewPeriod);
    setOrderChannelFilter('WALK-IN');
    setOrderStatusFilter('ALL');
    setOrderPage(1);
  };

  const handleOnlineCardClick = () => {
    setSearchParams({ tab: 'ORDERS' });
    setOrderDateFilter(overviewPeriod);
    setOrderChannelFilter('ONLINE');
    setOrderStatusFilter('ALL');
    setOrderPage(1);
  };

  const handlePendingCardClick = () => {
    setSearchParams({ tab: 'ORDERS' });
    setOrderStatusFilter('PREPARING');
    setOrderChannelFilter('ALL');
    setOrderDateFilter('ALL');
    setOrderPage(1);
  };

  const handleInventoryCardClick = () => {
    setSearchParams({ tab: 'PRODUCTS' });
    setProductStockFilter('LOW');
    setProductPage(1);
  };

  const handleUsersCardClick = () => {
    setSearchParams({ tab: 'ACCOUNTS' });
    setRoleFilter('ALL');
    setUserPage(1);
  };

  // Helper for Order Table Column Sorting Toggle
  const handleOrderSortToggle = (col: 'DATE' | 'TOTAL' | 'ID' | 'CUSTOMER' | 'STATUS') => {
    if (orderSortBy === col) {
      setOrderSortOrder(prev => (prev === 'DESC' ? 'ASC' : 'DESC'));
    } else {
      setOrderSortBy(col);
      setOrderSortOrder(col === 'DATE' || col === 'TOTAL' ? 'DESC' : 'ASC');
    }
    setOrderPage(1);
  };

  // Filtered Users with Pagination
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });
  const paginatedUsers = filteredUsers.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  // Filtered Orders (MOST RECENT FIRST BY DEFAULT) with Status, Channel, Date, Search, and Pagination
  let filteredOrders = sales.filter(s => {
    const matchStatus = orderStatusFilter === 'ALL' || s.orderStatus === orderStatusFilter;
    const isOnline = s.channel === 'ONLINE/FACEBOOK' || s.fulfillmentType === 'DELIVERY' || s.id.startsWith('S_ONL');
    const matchChannel = orderChannelFilter === 'ALL' || (orderChannelFilter === 'ONLINE' ? isOnline : !isOnline);
    
    const searchLow = orderSearch.toLowerCase().trim();
    const matchSearch = !searchLow ||
      s.id.toLowerCase().includes(searchLow) ||
      (s.customerName && s.customerName.toLowerCase().includes(searchLow)) ||
      (s.notes && s.notes.toLowerCase().includes(searchLow)) ||
      (s.paymentRef && s.paymentRef.toLowerCase().includes(searchLow)) ||
      (s.trackingCode && s.trackingCode.toLowerCase().includes(searchLow)) ||
      s.items.some(it => it.name.toLowerCase().includes(searchLow));

    return matchStatus && matchChannel && matchSearch;
  });

  // Apply Date range filter to Orders Feed
  filteredOrders = filterSalesByDate(filteredOrders, orderDateFilter, customDate);

  // Sort Orders: Default is DATE + DESC (Strictly Most Recent First)
  filteredOrders.sort((a, b) => {
    if (orderSortBy === 'DATE') {
      const timeA = new Date(a.date).getTime() || 0;
      const timeB = new Date(b.date).getTime() || 0;
      return orderSortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    }
    if (orderSortBy === 'TOTAL') {
      return orderSortOrder === 'DESC' ? b.total - a.total : a.total - b.total;
    }
    if (orderSortBy === 'ID') {
      return orderSortOrder === 'DESC' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id);
    }
    if (orderSortBy === 'CUSTOMER') {
      const nameA = (a.customerName || a.notes || '').toLowerCase();
      const nameB = (b.customerName || b.notes || '').toLowerCase();
      return orderSortOrder === 'DESC' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
    }
    if (orderSortBy === 'STATUS') {
      const stA = a.orderStatus || '';
      const stB = b.orderStatus || '';
      return orderSortOrder === 'DESC' ? stB.localeCompare(stA) : stA.localeCompare(stB);
    }
    return 0;
  });

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / orderPageSize));
  const safeOrderPage = Math.min(orderPage, totalOrderPages);
  const paginatedOrders = filteredOrders.slice((safeOrderPage - 1) * orderPageSize, safeOrderPage * orderPageSize);

  // Filtered Products with Stock Filter & Pagination
  const productCategories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
    const matchesStock = productStockFilter === 'ALL' 
      ? true 
      : productStockFilter === 'LOW' 
        ? p.stock <= p.lowStockLevel 
        : productStockFilter === 'OUT_OF_STOCK' 
          ? p.stock === 0 
          : p.stock > p.lowStockLevel;
    return matchesSearch && matchesCat && matchesStock;
  });
  const paginatedProducts = filteredProducts.slice((productPage - 1) * productPageSize, productPage * productPageSize);

  // Filtered Audit Logs with Pagination
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase());
    const matchAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
    return matchSearch && matchAction;
  });
  const paginatedAuditLogs = filteredAuditLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);

  // Filtered Back Orders with Pagination & Search
  const filteredBackOrders = backOrders.filter(bo => {
    const matchStatus = backOrderFilter === 'ALL' || bo.status === backOrderFilter;
    const q = backOrderSearch.toLowerCase().trim();
    const matchSearch = !q ||
      (bo.productName && bo.productName.toLowerCase().includes(q)) ||
      (bo.customerName && bo.customerName.toLowerCase().includes(q)) ||
      (bo.customerContact && bo.customerContact.includes(q)) ||
      (bo.id && bo.id.toLowerCase().includes(q)) ||
      (bo.notes && bo.notes.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });
  const paginatedBackOrders = filteredBackOrders.slice((backOrderPage - 1) * backOrderPageSize, backOrderPage * backOrderPageSize);

  // Helper to determine the logical next status depending on fulfillment type
  const getNextStatus = (sale: Sale): Sale['orderStatus'] => {
    const isPickup = sale.fulfillmentType === 'STORE PICKUP' || sale.channel !== 'ONLINE/FACEBOOK';
    if (isPickup) {
      if (sale.orderStatus === 'ORDER PLACED') return 'PREPARING';
      if (sale.orderStatus === 'PREPARING') return 'READY FOR PICKUP';
      if (sale.orderStatus === 'READY FOR PICKUP') return 'COMPLETED';
      return 'COMPLETED';
    } else {
      if (sale.orderStatus === 'ORDER PLACED') return 'PREPARING';
      if (sale.orderStatus === 'PREPARING') return 'READY FOR PICKUP';
      if (sale.orderStatus === 'READY FOR PICKUP') return 'OUT FOR DELIVERY';
      if (sale.orderStatus === 'OUT FOR DELIVERY') return 'COMPLETED';
      return 'COMPLETED';
    }
  };

  // Order status advance
  const advanceOrderStatus = async (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    const newStatus = getNextStatus(sale);

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

  // Upload product image to Supabase 'Files' bucket
  const handleUploadProductImage = async (file: File, isEdit: boolean) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }
    setUploadingImage(true);
    try {
      const publicUrl = await uploadFileToBucket(file, 'products');
      if (publicUrl) {
        if (isEdit && editingProduct) {
          setEditingProduct({ ...editingProduct, imageUrl: publicUrl });
        } else {
          setNewProductForm(prev => ({ ...prev, imageUrl: publicUrl }));
        }
      } else {
        alert('Failed to upload image. Please check your Supabase storage bucket settings.');
      }
    } catch (err: any) {
      alert('Upload error: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploadingImage(false);
    }
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

    const barcodeVal = newProductForm.barcode.trim() || createEan13();
    if (!isEan13(barcodeVal)) {
      alert('Barcode must be a valid 13-digit EAN-13 code. Use Generate to create one automatically.');
      return;
    }
    if (products.some(product => product.barcode === barcodeVal)) {
      alert('This barcode is already assigned to another product. Generate a new one.');
      return;
    }
    const productId = `PROD-${Date.now().toString().slice(-6)}`;

    const newProd: Product = {
      id: productId,
      name: newProductForm.name.trim(),
      description: newProductForm.description.trim() || 'High performance motorcycle part/accessory.',
      category: categoryVal,
      price: priceVal,
      stock: stockVal,
      lowStockLevel: lowStockVal,
      barcode: barcodeVal,
      imageUrl: newProductForm.imageUrl.trim() || undefined,
      weightKg: parseFloat(newProductForm.weightKg) || 0.5,
      isBulky: newProductForm.isBulky
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
        barcode: '',
        imageUrl: '',
        weightKg: '0.5',
        isBulky: false
      });
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!isEan13(editingProduct.barcode)) {
      alert('Barcode must be a valid 13-digit EAN-13 code. Use Generate to create one automatically.');
      return;
    }
    if (products.some(product => product.id !== editingProduct.id && product.barcode === editingProduct.barcode)) {
      alert('This barcode is already assigned to another product. Generate a new one.');
      return;
    }
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
        padding: '16px 20px',
        marginBottom: '14px',
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
            Admin workspace
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Welcome back, {currentUser?.name}. Manage the store from one place.
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

      {activeTab === 'ACCOUNTS' && <>
      {/* Sales Overview Filter Bar (Today, Yesterday, Week, Month, Annually, Custom Date) */}
      <div className="card" style={{
        padding: '12px 16px',
        marginBottom: '12px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
              OVERVIEW PERIOD
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Choose the period for the summary below.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as const).map(p => {
            const isActive = overviewPeriod === p;
            let label = p as string;
            if (p === 'ALL') label = 'All Time';
            if (p === 'TODAY') label = 'Today';
            if (p === 'YESTERDAY') label = 'Yesterday';
            if (p === 'WEEK') label = 'This Week';
            if (p === 'MONTH') label = 'This Month';
            if (p === 'YEAR') label = `Annually (${new Date().getFullYear()})`;
            if (p === 'CUSTOM') label = 'Custom Date';

            return (
              <button
                key={p}
                type="button"
                onClick={() => setOverviewPeriod(p)}
                style={{
                  padding: '5px 11px',
                  fontSize: '0.74rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: '6px',
                  border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: isActive ? '#2563eb' : '#ffffff',
                  color: isActive ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {label}
              </button>
            );
          })}

          {overviewPeriod === 'CUSTOM' && (
            <input
              type="date"
              value={customDate}
              onChange={e => {
                setCustomDate(e.target.value);
                setOverviewPeriod('CUSTOM');
              }}
              style={{
                fontSize: '0.76rem',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #2563eb',
                height: '30px'
              }}
            />
          )}
        </div>
      </div>

      {/* Date Period Summary */}
      <div style={{
        marginBottom: '12px',
        padding: '8px 12px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#475569',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <span>Showing Sales for: </span>
          <strong style={{ color: '#0f172a' }}>
            {overviewPeriod === 'ALL' && 'All Time Historical Records'}
            {overviewPeriod === 'TODAY' && `Today (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`}
            {overviewPeriod === 'YESTERDAY' && (() => {
              const yd = new Date();
              yd.setDate(yd.getDate() - 1);
              return `Yesterday (${yd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
            })()}
            {overviewPeriod === 'WEEK' && 'This Week (Last 7 Days)'}
            {overviewPeriod === 'MONTH' && `This Month (${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`}
            {overviewPeriod === 'YEAR' && `Annually (${new Date().getFullYear()} Calendar Year)`}
            {overviewPeriod === 'CUSTOM' && `Selected Date: ${customDate}`}
          </strong>
          <span> • Total Revenue: </span>
          <strong style={{ color: '#16a34a' }}>₱{periodTotalRevenue.toLocaleString()}</strong>
          <span> ({periodTotalOrdersCount} total orders)</span>
        </div>
      </div>

      {/* 6 Metric Overview Cards (ALL CLICKABLE) */}
      <div className="admin-overview-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '10px',
        marginBottom: '18px'
      }}>
        {/* Total Sales Revenue */}
        <div 
          className="card" 
          onClick={handleTotalRevenueCardClick}
          style={{ 
            padding: '14px', 
            borderLeft: '4px solid #2563eb', 
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          title="Click to view all orders for this period"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>TOTAL REVENUE</span>
            <span className="badge badge-blue">{overviewPeriod}</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#2563eb', fontWeight: 800 }}>
            ₱{periodTotalRevenue.toLocaleString()}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>{periodTotalOrdersCount} Total Transactions</span>
            <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>View Orders →</span>
          </div>
        </div>

        {/* Walk-In Revenue */}
        <div 
          className="card" 
          onClick={handleWalkInCardClick}
          style={{ 
            padding: '14px', 
            borderLeft: '4px solid #10b981', 
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          title="Click to view walk-in / counter sales"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>WALK-IN REVENUE</span>
            <span className="badge badge-green">COUNTER</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#059669', fontWeight: 800 }}>
            ₱{periodWalkInRevenue.toLocaleString()}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>{periodWalkInSalesCount} In-Store Sales</span>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>View Counter →</span>
          </div>
        </div>

        {/* Online Revenue */}
        <div 
          className="card" 
          onClick={handleOnlineCardClick}
          style={{ 
            padding: '14px', 
            borderLeft: '4px solid #0284c7', 
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          title="Click to view online & courier delivery orders"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>ONLINE REVENUE</span>
            <span className="badge badge-blue">ONLINE / COURIER</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#0284c7', fontWeight: 800 }}>
            ₱{periodOnlineRevenue.toLocaleString()}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>{periodOnlineSalesCount} Web & Courier Orders</span>
            <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>View Online →</span>
          </div>
        </div>

        {/* Active Customer Orders */}
        <div 
          className="card" 
          onClick={handlePendingCardClick}
          style={{ 
            padding: '14px', 
            borderLeft: '4px solid #f59e0b', 
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          title="Click to view orders needing packing or fulfillment"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>PENDING ORDERS</span>
            <Box size={16} color="#d97706" />
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#d97706', fontWeight: 800 }}>
            {pendingOrdersCount}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Needs Counter Fulfillment</span>
            <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>Inspect Queue →</span>
          </div>
        </div>

        {/* Low Stock Items Alert */}
        <div 
          className="card" 
          onClick={handleInventoryCardClick}
          style={{ 
            padding: '14px', 
            borderLeft: '4px solid #ef4444', 
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          title="Click to filter products at or below reorder level"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>INVENTORY ALERTS</span>
            <AlertTriangle size={16} color="#dc2626" />
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#dc2626', fontWeight: 800 }}>
            {lowStockItemsCount}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Items at or below reorder</span>
            <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>Inspect Stock →</span>
          </div>
        </div>

        {/* Total Users & Staff */}
        <div 
          className="card" 
          onClick={handleUsersCardClick}
          style={{ 
            padding: '14px', 
            borderLeft: '4px solid #8b5cf6', 
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          title="Click to manage staff and user accounts"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>STAFF & ACCOUNTS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#6d28d9" />
              <span className="badge badge-purple">{staffCount} Staff</span>
            </div>
          </div>
          <h3 style={{ fontSize: '1.75rem', margin: '6px 0 2px', color: '#6d28d9', fontWeight: 800 }}>
            {activeStaffCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/ {totalUsers} Users</span>
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748b' }}>Active Cashier Sessions</span>
            <span style={{ fontSize: '0.7rem', color: '#6d28d9', fontWeight: 700 }}>Manage Users →</span>
          </div>
        </div>
      </div>
      </>}


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
                  onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '180px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'EMPLOYEE', 'ADMIN', 'CUSTOMER', 'RIDER'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setRoleFilter(role); setUserPage(1); }}
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
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No user accounts found. Click "Sync Supabase" above to refresh cloud accounts.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => {
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
                            user.role === 'EMPLOYEE' ? 'badge-blue' :
                            user.role === 'RIDER' ? 'badge-purple' : 'badge-green'
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
                          <span className="badge badge-green">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={userPage}
            totalItems={filteredUsers.length}
            pageSize={userPageSize}
            onPageChange={setUserPage}
            onPageSizeChange={setUserPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            itemLabel="accounts"
          />
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
                  onChange={e => { setProductSearch(e.target.value); setProductPage(1); }}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '180px' }}
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={e => { setProductCategoryFilter(e.target.value); setProductPage(1); }}
                style={{ height: '34px', fontSize: '0.8rem', width: '140px' }}
              >
                {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={productStockFilter}
                onChange={e => { setProductStockFilter(e.target.value as any); setProductPage(1); }}
                style={{ height: '34px', fontSize: '0.8rem', width: '130px' }}
              >
                <option value="ALL">All Stock</option>
                <option value="LOW">Low Stock Alert</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="IN_STOCK">In Stock Only</option>
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
                  <th style={{ width: '48px', textAlign: 'center' }}>PHOTO</th>
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
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      No products match your search or filter.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map(product => {
                    const isLowStock = product.stock <= product.lowStockLevel && product.stock > 0;
                    const isOutOfStock = product.stock === 0;
                    const pointsEarned = Math.floor(product.price / pointsSettings.currencyPerPoint);

                    return (
                      <tr key={product.id}>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            overflow: 'hidden',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            verticalAlign: 'middle'
                          }}>
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <ImageIcon size={18} color="#94a3b8" />
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Barcode size={15} color="#64748b" />
                            <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>{toEan13(product.barcode) || product.barcode}</code>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ID: {product.id}</span>
                          {toEan13(product.barcode) && <div style={{ width: '148px', marginTop: '5px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '3px', background: '#ffffff' }}><Ean13Barcode value={product.barcode} height={40} /></div>}
                          {toEan13(product.barcode) && <button type="button" onClick={() => setBarcodePreview(product)} style={{ marginTop: '4px', padding: '3px 6px', fontSize: '0.66rem', border: '1px solid #bfdbfe', borderRadius: '4px', color: '#1d4ed8', background: '#eff6ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Barcode size={11} /> View / print</button>}
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
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={productPage}
            totalItems={filteredProducts.length}
            pageSize={productPageSize}
            onPageChange={setProductPage}
            onPageSizeChange={setProductPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            itemLabel="products"
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* Tab 3: Customer Orders Feed (NEWEST FIRST BY DEFAULT) */}
      {/* ======================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                  Live Orders Feed
                </h2>
                <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                  {orderSortBy === 'DATE' && orderSortOrder === 'DESC' ? 'MOST RECENT FIRST' : `SORTED BY ${orderSortBy}`}
                </span>
                {orderDateFilter !== 'ALL' && (
                  <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                    DATE: {orderDateFilter}
                  </span>
                )}
                {orderChannelFilter !== 'ALL' && (
                  <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                    CHANNEL: {orderChannelFilter}
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Manage counter sales and courier deliveries. Showing {paginatedOrders.length} of {filteredOrders.length} filtered orders.
              </p>
            </div>

            {/* Filter and Search Toolbar */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Order Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search order #, customer, tracking..."
                  value={orderSearch}
                  onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '220px' }}
                />
              </div>

              {/* Channel Filter */}
              <select
                value={orderChannelFilter}
                onChange={e => { setOrderChannelFilter(e.target.value as any); setOrderPage(1); }}
                style={{ height: '34px', fontSize: '0.8rem', width: '135px' }}
                title="Filter by sales channel / fulfillment"
              >
                <option value="ALL">All Channels</option>
                <option value="WALK-IN">Walk-In Counter</option>
                <option value="ONLINE">Courier Delivery</option>
              </select>

              {/* Date Filter */}
              <select
                value={orderDateFilter}
                onChange={e => { setOrderDateFilter(e.target.value as any); setOrderPage(1); }}
                style={{ height: '34px', fontSize: '0.8rem', width: '135px' }}
                title="Filter orders by date range"
              >
                <option value="ALL">All Dates</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
                <option value="YEAR">Annually</option>
                <option value="CUSTOM">Custom Date</option>
              </select>

              {orderDateFilter === 'CUSTOM' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={e => { setCustomDate(e.target.value); setOrderPage(1); }}
                  style={{ height: '34px', fontSize: '0.78rem', padding: '4px 8px' }}
                />
              )}

              {/* Sort Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <ArrowUpDown size={13} color="#2563eb" />
                <select
                  value={`${orderSortBy}_${orderSortOrder}`}
                  onChange={e => {
                    const [by, ord] = e.target.value.split('_');
                    setOrderSortBy(by as any);
                    setOrderSortOrder(ord as any);
                    setOrderPage(1);
                  }}
                  style={{ height: '30px', fontSize: '0.78rem', border: 'none', backgroundColor: 'transparent', outline: 'none', cursor: 'pointer', fontWeight: 600, color: '#0f172a' }}
                >
                  <option value="DATE_DESC">Date: Most Recent First</option>
                  <option value="DATE_ASC">Date: Oldest First</option>
                  <option value="TOTAL_DESC">Amount: Highest First</option>
                  <option value="TOTAL_ASC">Amount: Lowest First</option>
                  <option value="ID_DESC">Order ID (Z to A)</option>
                  <option value="ID_ASC">Order ID (A to Z)</option>
                  <option value="CUSTOMER_ASC">Customer Name (A to Z)</option>
                  <option value="STATUS_ASC">Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(['ALL', 'ORDER PLACED', 'PREPARING', 'READY FOR PICKUP', 'OUT FOR DELIVERY', 'COMPLETED'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => { setOrderStatusFilter(st); setOrderPage(1); }}
                style={{
                  padding: '5px 10px',
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

          <div className="table-container">
            <table className="orders-feed-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleOrderSortToggle('DATE')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Date (Default: Most Recent First)"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>ORDER ID & DATE</span>
                      {orderSortBy === 'DATE' ? (
                        orderSortOrder === 'DESC' ? <ArrowDown size={13} color="#2563eb" /> : <ArrowUp size={13} color="#2563eb" />
                      ) : (
                        <ArrowUpDown size={12} color="#94a3b8" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleOrderSortToggle('CUSTOMER')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Customer Name"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>CUSTOMER</span>
                      {orderSortBy === 'CUSTOMER' ? (
                        orderSortOrder === 'DESC' ? <ArrowDown size={13} color="#2563eb" /> : <ArrowUp size={13} color="#2563eb" />
                      ) : (
                        <ArrowUpDown size={12} color="#94a3b8" />
                      )}
                    </div>
                  </th>
                  <th>ITEMS ORDERED</th>
                  <th>FULFILLMENT</th>
                  <th>PAYMENT</th>
                  <th 
                    onClick={() => handleOrderSortToggle('TOTAL')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Total Amount"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>TOTAL</span>
                      {orderSortBy === 'TOTAL' ? (
                        orderSortOrder === 'DESC' ? <ArrowDown size={13} color="#2563eb" /> : <ArrowUp size={13} color="#2563eb" />
                      ) : (
                        <ArrowUpDown size={12} color="#94a3b8" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleOrderSortToggle('STATUS')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Click to sort by Status"
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>STATUS</span>
                      {orderSortBy === 'STATUS' ? (
                        orderSortOrder === 'DESC' ? <ArrowDown size={13} color="#2563eb" /> : <ArrowUp size={13} color="#2563eb" />
                      ) : (
                        <ArrowUpDown size={12} color="#94a3b8" />
                      )}
                    </div>
                  </th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      No orders found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map(sale => {
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
                          <div className="order-feed-customer" style={{ fontWeight: 700, color: '#0f172a' }}>
                            {memberProfile?.name || (sale.notes?.includes('MEMBER:') ? sale.notes.split('MEMBER:')[1]?.replace(')', '').trim() : sale.memberId || 'Walk-In Customer')}
                          </div>
                          <div className="order-feed-secondary" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {memberProfile?.contact || (sale.notes?.includes('PHONE:') ? sale.notes.split('PHONE:')[1]?.trim() : 'Counter Sale')}
                          </div>
                        </td>
                        <td>
                          <div className="order-feed-items" style={{ fontSize: '0.8rem' }}>
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
                          {sale.fulfillmentType === 'DELIVERY' && (
                            <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                              Fee: ₱{(sale.deliveryFee ?? 100).toLocaleString()}
                            </div>
                          )}
                          {sale.fulfillmentType === 'DELIVERY' && sale.latitude && sale.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${sale.latitude},${sale.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                fontSize: '0.67rem', 
                                color: '#16a34a', 
                                fontWeight: 700, 
                                marginTop: '3px', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '3px', 
                                textDecoration: 'none',
                                backgroundColor: '#ecfdf5',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid #bbf7d0'
                              }}
                              title="View pinned delivery location in Google Maps"
                            >
                              <MapPin size={10} /> Pinned on Map
                            </a>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sale.paymentMethod}</div>
                          {sale.paymentRef && (
                            <div className="order-feed-secondary" style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              Ref: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{sale.paymentRef}</strong>
                            </div>
                          )}
                          {sale.receiptUrl && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setViewingReceiptSale(sale)}
                                style={{
                                  marginTop: '3px',
                                  padding: '2px 7px',
                                  fontSize: '0.66rem',
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Click to view and inspect uploaded payment receipt screenshot"
                              >
                                <ImageIcon size={11} color="#2563eb" />
                                <span>Receipt Proof</span>
                              </button>
                            </div>
                          )}
                          <div style={{ marginTop: '3px' }}>
                            {sale.paymentVerified || sale.orderStatus === 'COMPLETED' ? (
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '1px 6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle2 size={11} color="#047857" /> VERIFIED
                              </span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '0.65rem', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '4px', padding: '1px 6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <AlertTriangle size={11} color="#b45309" /> UNVERIFIED
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Confirm payment of ₱${sale.total.toLocaleString()} for Order #${sale.id} (Ref: ${sale.paymentRef || 'N/A'})? This will unlock the customer's Official Sales Receipt.`)) {
                                      await verifySalePayment(sale.id);
                                    }
                                  }}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '0.65rem',
                                    backgroundColor: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 700
                                  }}
                                  title="Verify Payment Received & Unlock Official Receipt"
                                >
                                  Verify Pay
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>₱{sale.total.toLocaleString()}</strong>
                          {sale.fulfillmentType === 'DELIVERY' && (
                            <div style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>
                              +₱{(sale.deliveryFee ?? 100).toLocaleString()} delivery
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            sale.orderStatus === 'COMPLETED' ? 'badge-green' :
                            sale.orderStatus === 'READY FOR PICKUP' ? (sale.fulfillmentType === 'DELIVERY' ? 'badge-blue' : 'badge-blue') :
                            sale.orderStatus === 'OUT FOR DELIVERY' ? 'badge-blue' : 'badge-yellow'
                          }`}>
                            {sale.orderStatus === 'READY FOR PICKUP' && sale.fulfillmentType === 'DELIVERY'
                              ? 'READY FOR DELIVERY'
                              : sale.orderStatus}
                          </span>
                          {sale.orderStatus === 'READY FOR PICKUP' && sale.fulfillmentType === 'DELIVERY' && (
                            <div style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                              Waiting for Rider Pickup
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {sale.receiptUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingReceiptSale(sale)}
                                className="btn"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}
                                title="Inspect Uploaded Payment Receipt"
                              >
                                <ImageIcon size={13} />
                              </button>
                            )}
                            {sale.orderStatus !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => setAdvanceModalOrder(sale)}
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
          <PaginationControls
            currentPage={orderPage}
            totalItems={filteredOrders.length}
            pageSize={orderPageSize}
            onPageChange={setOrderPage}
            onPageSizeChange={setOrderPageSize}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            itemLabel="orders"
          />
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
                  onChange={e => { setAuditSearch(e.target.value); setAuditPage(1); }}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '200px' }}
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={e => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
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
                  paginatedAuditLogs.map(log => (
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
          <PaginationControls
            currentPage={auditPage}
            totalItems={filteredAuditLogs.length}
            pageSize={auditPageSize}
            onPageChange={setAuditPage}
            onPageSizeChange={setAuditPageSize}
            pageSizeOptions={[10, 15, 25, 50]}
            itemLabel="activity logs"
          />
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

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search reservations..."
                  value={backOrderSearch}
                  onChange={e => { setBackOrderSearch(e.target.value); setBackOrderPage(1); }}
                  style={{ paddingLeft: '30px', fontSize: '0.8rem', height: '34px', width: '180px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['ALL', 'PENDING', 'NOTIFIED', 'FULFILLED'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => { setBackOrderFilter(st); setBackOrderPage(1); }}
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

              <button
                type="button"
                onClick={() => {
                  setShowAddBackOrderModal(true);
                  setIsCustomBackOrderProduct(false);
                  setNewBackOrderForm({
                    productId: products[0]?.id || '',
                    customProductName: '',
                    quantity: 1,
                    selectedMemberId: '',
                    customerName: '',
                    customerContact: '',
                    notes: ''
                  });
                }}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px', fontWeight: 700 }}
              >
                <PlusCircle size={15} />
                <span>Add Back Order Reservation</span>
              </button>
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
                      No back orders found. Click "Add Back Order Reservation" above to queue a customer request.
                    </td>
                  </tr>
                ) : (
                  paginatedBackOrders.map(bo => {
                    const currentProduct = products.find(p => p.id === bo.productId || p.name.toLowerCase() === bo.productName.toLowerCase());
                    const isRestocked = currentProduct && currentProduct.stock > 0;
                    return (
                      <tr key={bo.id}>
                        <td>
                          <strong>{bo.id}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(bo.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#0f172a' }}>{bo.productName}</strong>
                            {currentProduct ? (
                              isRestocked ? (
                                <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                  ✓ In Stock: {currentProduct.stock} (Ready to Fulfill)
                                </span>
                              ) : (
                                <span className="badge badge-yellow" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                                  0 in stock
                                </span>
                              )
                            ) : (
                              <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 6px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                                Special Item
                              </span>
                            )}
                          </div>
                          {bo.notes && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic', marginTop: '3px' }}>
                              Note: {bo.notes}
                            </div>
                          )}
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.9rem' }}>{bo.quantity}</strong>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{bo.customerName || 'N/A'}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{bo.customerContact || 'N/A'}</span>
                        </td>
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
                                title="Mark customer as notified via SMS or phone call"
                              >
                                Mark Notified
                              </button>
                            )}
                            {bo.status !== 'FULFILLED' && (
                              <button
                                type="button"
                                onClick={() => updateBackOrderStatus(bo.id, 'FULFILLED')}
                                className="btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.72rem', backgroundColor: isRestocked ? '#10b981' : undefined }}
                                title="Mark reservation as claimed / fulfilled"
                              >
                                Fulfill
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={backOrderPage}
            totalItems={filteredBackOrders.length}
            pageSize={backOrderPageSize}
            onPageChange={setBackOrderPage}
            onPageSizeChange={setBackOrderPageSize}
            pageSizeOptions={[5, 10, 25, 50]}
            itemLabel="back-orders"
          />
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" inputMode="numeric" placeholder="Generate or enter 13 digits" value={newProductForm.barcode} onChange={e => setNewProductForm({ ...newProductForm, barcode: e.target.value.replace(/\D/g, '').slice(0, 13) })} />
                    <button type="button" className="btn" onClick={() => setNewProductForm({ ...newProductForm, barcode: createEan13() })} style={{ padding: '6px 8px', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>Generate</button>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Leave blank to generate automatically when saved.</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Weight (kg) — for Delivery</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="0.5"
                    value={newProductForm.weightKg}
                    onChange={e => setNewProductForm({ ...newProductForm, weightKg: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      checked={newProductForm.isBulky}
                      onChange={e => setNewProductForm({ ...newProductForm, isBulky: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Box size={14} color="#64748b" /> Bulky / Heavy Cargo (Tires, Exhaust, Shocks)
                    </span>
                  </label>
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

              {/* Product Photo Upload Section */}
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <label style={{ margin: '0 0 8px 0', fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Product Photo (Supabase Storage: Files)
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {newProductForm.imageUrl ? (
                      <img src={newProductForm.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={26} color="#94a3b8" />
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label className="btn" style={{
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#eff6ff',
                        borderColor: '#bfdbfe',
                        color: '#1d4ed8'
                      }}>
                        {uploadingImage ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProductImage(file, false);
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {newProductForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewProductForm(prev => ({ ...prev, imageUrl: '' }))}
                          style={{ padding: '6px 10px', fontSize: '0.72rem', background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste external image URL..."
                      value={newProductForm.imageUrl}
                      onChange={e => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                      style={{ fontSize: '0.75rem', padding: '6px 8px', height: '30px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAddProductModal(false)} className="btn" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={uploadingImage} className="btn-primary" style={{ flex: 1 }}>
                  {uploadingImage ? 'Uploading Image...' : 'Save Product to Supabase'}
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" inputMode="numeric" value={editingProduct.barcode} onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value.replace(/\D/g, '').slice(0, 13) })} />
                    <button type="button" className="btn" onClick={() => setEditingProduct({ ...editingProduct, barcode: createEan13() })} style={{ padding: '6px 8px', fontSize: '0.7rem' }}>Generate</button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>Weight (kg) — for Delivery</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editingProduct.weightKg ?? 0.5}
                    onChange={e => setEditingProduct({ ...editingProduct, weightKg: parseFloat(e.target.value) || 0.5 })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      checked={editingProduct.isBulky ?? false}
                      onChange={e => setEditingProduct({ ...editingProduct, isBulky: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Box size={14} color="#64748b" /> Bulky / Heavy Cargo (Tires, Exhaust, Shocks)
                    </span>
                  </label>
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

              {/* Product Photo Upload Section */}
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <label style={{ margin: '0 0 8px 0', fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                  Product Photo (Supabase Storage: Files)
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {editingProduct.imageUrl ? (
                      <img src={editingProduct.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={26} color="#94a3b8" />
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label className="btn" style={{
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#eff6ff',
                        borderColor: '#bfdbfe',
                        color: '#1d4ed8'
                      }}>
                        {uploadingImage ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                        <span>{uploadingImage ? 'Uploading...' : editingProduct.imageUrl ? 'Change Photo' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadProductImage(file, true);
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {editingProduct.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, imageUrl: undefined })}
                          style={{ padding: '6px 10px', fontSize: '0.72rem', background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Or paste external image URL..."
                      value={editingProduct.imageUrl || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                      style={{ fontSize: '0.75rem', padding: '6px 8px', height: '30px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setEditingProduct(null)} className="btn" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={uploadingImage} className="btn-primary" style={{ flex: 1 }}>
                  {uploadingImage ? 'Uploading Image...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {barcodePreview && (
        <div className="modal-overlay" onClick={() => setBarcodePreview(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '100%' }} onClick={event => event.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>Product Barcode Label</h2>
                <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#64748b' }}>{barcodePreview.name}</p>
              </div>
              <button type="button" onClick={() => setBarcodePreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '8px', padding: '20px' }}>
              <Ean13Barcode value={barcodePreview.barcode} height={150} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="btn" onClick={() => setBarcodePreview(null)} style={{ flex: 1 }}>Close</button>
              <button type="button" className="btn-primary" onClick={() => window.print()} style={{ flex: 1 }}><Printer size={15} /> Print Label</button>
            </div>
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
                  <option value="RIDER">Delivery Driver / Rider (Delivery Feed)</option>
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
      {activeReceipt && (() => {
        const isPaid = Boolean(
          activeReceipt.paymentVerified || 
          activeReceipt.orderStatus === 'COMPLETED' || 
          (activeReceipt.channel === 'WALK-IN' && activeReceipt.paymentMethod === 'CASH')
        );
        const customerName = activeReceipt.customerName || members.find(m => m.id === activeReceipt.memberId)?.name || 'Walk-in Customer';
        const customerPhone = activeReceipt.customerPhone || members.find(m => m.id === activeReceipt.memberId)?.contact || 'N/A';
        const deliveryAddress = activeReceipt.shippingAddress || (activeReceipt.fulfillmentType === 'DELIVERY' ? 'Address on File' : null);

        return (
          <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
            <div className="modal" style={{ maxWidth: '440px', width: '100%' }} onClick={e => e.stopPropagation()}>
              <div id="receipt-print-area" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f172a' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900 }}>BOSS RAP MOTOR SHOP</h2>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>JP Rizal St., Baliuag, Bulacan</div>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>Tel: (0905) 123-4567 • Tax Reg 2008</div>
                  <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />
                  
                  {/* Dynamic Header: Invoice (Unpaid) vs Official Receipt (Paid) */}
                  <div style={{
                    padding: '5px 8px',
                    borderRadius: '4px',
                    margin: '6px 0',
                    backgroundColor: isPaid ? '#ecfdf5' : '#fffbeb',
                    border: `1px solid ${isPaid ? '#a7f3d0' : '#fde68a'}`,
                    color: isPaid ? '#065f46' : '#92400e',
                    fontWeight: 800,
                    fontSize: '0.82rem'
                  }}>
                    {isPaid ? 'OFFICIAL SALES RECEIPT (PAID)' : 'ORDER INVOICE / ACKNOWLEDGEMENT (UNPAID)'}
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
                    <strong>{activeReceipt.id}</strong>
                  </div>
                  {activeReceipt.trackingCode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Tracking Code:</span>
                      <strong>{activeReceipt.trackingCode}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Date & Time:</span>
                    <span>{new Date(activeReceipt.date).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Customer Name:</span>
                    <strong>{customerName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Contact Number:</span>
                    <span>{customerPhone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Member ID:</span>
                    <span>{activeReceipt.memberId || 'WALK-IN / NON-MEMBER'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Fulfillment:</span>
                    <strong style={{ color: activeReceipt.fulfillmentType === 'DELIVERY' ? '#2563eb' : '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {activeReceipt.fulfillmentType === 'DELIVERY' ? (
                        <><Truck size={12} color="#2563eb" /> HOME DELIVERY</>
                      ) : (
                        <><Store size={12} color="#64748b" /> STORE PICKUP</>
                      )}
                    </strong>
                  </div>
                  {deliveryAddress && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ color: '#64748b' }}>Address:</span>
                      <span style={{ textAlign: 'right', maxWidth: '65%' }}>{deliveryAddress}</span>
                    </div>
                  )}
                  {activeReceipt.latitude && activeReceipt.longitude && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Delivery Pin:</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${activeReceipt.latitude},${activeReceipt.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#16a34a', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="View pinned location on Google Maps"
                      >
                        <MapPin size={11} color="#16a34a" />
                        <span>Pinned Location on Map</span>
                      </a>
                    </div>
                  )}
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
                    <span>{activeReceipt.promoCode ? `Voucher (${activeReceipt.promoCode}):` : 'Discount:'}</span>
                    <span>-₱{activeReceipt.discountApplied.toLocaleString()}</span>
                  </div>
                )}
                {activeReceipt.fulfillmentType === 'DELIVERY' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#2563eb' }}>
                    <span>Delivery Fee:</span>
                    <span>+₱{(activeReceipt.deliveryFee ?? 100).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, margin: '6px 0' }}>
                  <span>TOTAL:</span>
                  <span>₱{activeReceipt.total.toLocaleString()}</span>
                </div>

                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />

                {/* Payment Verification Status Box */}
                <div style={{
                  marginTop: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: isPaid ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${isPaid ? '#bbf7d0' : '#fef3c7'}`,
                  textAlign: 'center',
                  fontSize: '0.72rem'
                }}>
                  <div style={{ fontWeight: 800, color: isPaid ? '#15803d' : '#b45309', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {isPaid ? (
                      <><CheckCircle2 size={13} color="#16a34a" /> PAYMENT STATUS: PAID & VERIFIED</>
                    ) : (
                      <><AlertTriangle size={13} color="#d97706" /> PAYMENT STATUS: PENDING / UNPAID</>
                    )}
                  </div>
                  <div>Payment Method: <strong>{activeReceipt.paymentMethod}</strong> {activeReceipt.paymentRef ? `(Ref: ${activeReceipt.paymentRef})` : ''}</div>
                  <div>Order Status: <strong>{activeReceipt.orderStatus}</strong></div>
                  {!isPaid && (
                    <div style={{ marginTop: '4px', color: '#b45309', fontStyle: 'italic', fontSize: '0.68rem' }}>
                      {activeReceipt.paymentMethod === 'CASH' 
                        ? '* Payment to be collected at the counter or upon delivery.'
                        : '* Online payment reference is awaiting admin verification.'}
                    </div>
                  )}
                  {activeReceipt.receiptUrl && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700, marginBottom: '4px' }}>
                        PROOF OF PAYMENT SCREENSHOT (FILES BUCKET)
                      </span>
                      <a
                        href={activeReceipt.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          textDecoration: 'none'
                        }}
                      >
                        <ImageIcon size={12} />
                        <span>View Attached Payment Receipt</span>
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
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
        );
      })()}

      {/* ======================================================== */}
      {/* Payment Proof Verification & Inspection Modal */}
      {/* ======================================================== */}
      {viewingReceiptSale && (() => {
        const isVerified = viewingReceiptSale.paymentVerified || viewingReceiptSale.orderStatus === 'COMPLETED';
        const cleanRef = (viewingReceiptSale.paymentRef || '').replace(/[\s-]/g, '');
        return (
          <div className="modal-overlay" onClick={() => setViewingReceiptSale(null)}>
            <div className="modal" style={{ maxWidth: '560px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isVerified ? '#ecfdf5' : '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isVerified ? '#16a34a' : '#2563eb',
                    flexShrink: 0
                  }}>
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800 }}>
                      Payment Proof Inspection
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Order #{viewingReceiptSale.id} • {viewingReceiptSale.paymentMethod} (Files Bucket)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingReceiptSale(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Order & Reference Details Summary */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.8rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700 }}>CUSTOMER</span>
                  <strong style={{ color: '#0f172a' }}>{viewingReceiptSale.customerName || viewingReceiptSale.memberId || 'Customer'}</strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>{viewingReceiptSale.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700 }}>AMOUNT TO VERIFY</span>
                  <strong style={{ color: '#2563eb', fontSize: '1.05rem' }}>₱{viewingReceiptSale.total.toLocaleString()}</strong>
                </div>
                <div style={{ gridColumn: 'span 2', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700 }}>
                      SUBMITTED REFERENCE NUMBER {cleanRef ? `(${cleanRef.length} digits)` : ''}
                    </span>
                    <strong style={{ fontSize: '1rem', color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                      {viewingReceiptSale.paymentRef || 'No Reference Provided'}
                    </strong>
                  </div>
                  {viewingReceiptSale.paymentRef && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(viewingReceiptSale.paymentRef || '');
                        alert(`Copied reference number: ${viewingReceiptSale.paymentRef}`);
                      }}
                      className="btn"
                      style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                    >
                      Copy Ref
                    </button>
                  )}
                </div>
              </div>

              {/* Receipt Image Display */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', position: 'relative' }}>
                {viewingReceiptSale.receiptUrl ? (
                  <>
                    <img
                      src={viewingReceiptSale.receiptUrl}
                      alt="Uploaded Payment Receipt"
                      style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '6px' }}
                    />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <a
                        href={viewingReceiptSale.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <span>Open Full High-Res Image</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#94a3b8', padding: '30px', textAlign: 'center', fontSize: '0.85rem' }}>
                    <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0 }}>No screenshot was uploaded for this order.</p>
                  </div>
                )}
              </div>

              {/* Verification Controls */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setViewingReceiptSale(null)}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  Close
                </button>
                {!isVerified ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Verify payment of ₱${viewingReceiptSale.total.toLocaleString()} for Order #${viewingReceiptSale.id} against this receipt?`)) {
                        await verifySalePayment(viewingReceiptSale.id);
                        setViewingReceiptSale(prev => prev ? { ...prev, paymentVerified: true } : null);
                      }
                    }}
                    className="btn-primary"
                    style={{ flex: 1.6, backgroundColor: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirm & Mark as Verified</span>
                  </button>
                ) : (
                  <div style={{ flex: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} color="#047857" />
                    <span>Payment Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* Advance Order Status Confirmation Modal */}
      {/* ======================================================== */}
      {advanceModalOrder && (() => {
        const nextStatus = getNextStatus(advanceModalOrder);
        return (
          <div className="modal-overlay" onClick={() => !advancingStatus && setAdvanceModalOrder(null)}>
            <div className="modal" style={{ maxWidth: '440px', width: '92%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  backgroundColor: '#eff6ff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#2563eb',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    Confirm Status Advance
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Order #{advanceModalOrder.id}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <strong style={{ color: '#0f172a' }}>{advanceModalOrder.customerName || advanceModalOrder.memberId || 'Customer'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Fulfillment Method:</span>
                  <span className="badge badge-blue">{advanceModalOrder.fulfillmentType || 'COUNTER'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700 }}>CURRENT STATUS</span>
                    <span className="badge badge-yellow" style={{ marginTop: '2px' }}>{advanceModalOrder.orderStatus}</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', color: '#2563eb', fontWeight: 900 }}>➔</span>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 700 }}>ADVANCING TO</span>
                    <span className="badge badge-green" style={{ marginTop: '2px' }}>
                      {nextStatus === 'READY FOR PICKUP' && advanceModalOrder.fulfillmentType === 'DELIVERY'
                        ? 'READY FOR DELIVERY'
                        : nextStatus}
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                {nextStatus === 'READY FOR PICKUP' && advanceModalOrder.fulfillmentType === 'DELIVERY' ? (
                  <>Confirm that this parcel has been packed. Advancing it to <strong>READY FOR DELIVERY</strong> enables parcel pickup in the <strong>Rider Portal</strong> so the rider can collect and deliver it.</>
                ) : (
                  <>Advance this order to <strong>{nextStatus}</strong>? Its status will update across all system portals in real time.</>
                )}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setAdvanceModalOrder(null)} 
                  className="btn" 
                  disabled={advancingStatus}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    setAdvancingStatus(true);
                    await advanceOrderStatus(advanceModalOrder.id);
                    setAdvancingStatus(false);
                    setAdvanceModalOrder(null);
                  }} 
                  className="btn-primary" 
                  disabled={advancingStatus}
                  style={{ flex: 1.4 }}
                >
                  {advancingStatus ? 'Updating...' : `Yes, Advance to ${nextStatus === 'READY FOR PICKUP' && advanceModalOrder.fulfillmentType === 'DELIVERY' ? 'Ready for Delivery' : nextStatus}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ======================================================== */}
      {/* Add Back Order Reservation Modal */}
      {/* ======================================================== */}
      {showAddBackOrderModal && (
        <div className="modal-overlay" onClick={() => !submittingBackOrder && setShowAddBackOrderModal(false)}>
          <div className="modal" style={{ maxWidth: '520px', width: '94%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  flexShrink: 0
                }}>
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>
                    Add Back Order Reservation
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Reserve out-of-stock items in queue for customer restock notification
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBackOrderModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const prodName = isCustomBackOrderProduct
                  ? newBackOrderForm.customProductName.trim()
                  : (products.find(p => p.id === newBackOrderForm.productId)?.name || '');

                if (!prodName) {
                  alert('Please select or specify the item requested for back order.');
                  return;
                }
                if (!newBackOrderForm.customerName.trim()) {
                  alert('Please provide the customer name.');
                  return;
                }
                if (!newBackOrderForm.customerContact.trim()) {
                  alert('Please provide customer contact phone number for SMS notification upon restock.');
                  return;
                }

                setSubmittingBackOrder(true);
                try {
                  await addBackOrder({
                    productId: isCustomBackOrderProduct ? '' : (newBackOrderForm.productId || ''),
                    productName: prodName,
                    quantity: Math.max(1, Number(newBackOrderForm.quantity) || 1),
                    customerName: newBackOrderForm.customerName.trim(),
                    customerContact: newBackOrderForm.customerContact.trim(),
                    status: 'PENDING',
                    notes: newBackOrderForm.notes.trim() || undefined
                  });

                  setShowAddBackOrderModal(false);
                  setNewBackOrderForm({
                    productId: '',
                    customProductName: '',
                    quantity: 1,
                    selectedMemberId: '',
                    customerName: '',
                    customerContact: '',
                    notes: ''
                  });
                  alert(`Back order reservation for "${prodName}" (${newBackOrderForm.customerName}) added successfully!`);
                } catch (err: any) {
                  console.error('Error adding back order:', err);
                  alert('Failed to add back order: ' + (err.message || 'Unknown error'));
                } finally {
                  setSubmittingBackOrder(false);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Product Selection */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Item / Product to Reserve *
                  </label>
                  <label style={{ fontSize: '0.72rem', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={isCustomBackOrderProduct}
                      onChange={e => {
                        setIsCustomBackOrderProduct(e.target.checked);
                        if (!e.target.checked && !newBackOrderForm.productId && products.length > 0) {
                          setNewBackOrderForm(prev => ({ ...prev, productId: products[0].id }));
                        }
                      }}
                    />
                    <span>Custom / Special Order Item</span>
                  </label>
                </div>

                {isCustomBackOrderProduct ? (
                  <input
                    type="text"
                    placeholder="e.g. Michelin Pilot Street 90/80-17 Tire or Specific Tuning Part"
                    value={newBackOrderForm.customProductName}
                    onChange={e => setNewBackOrderForm({ ...newBackOrderForm, customProductName: e.target.value })}
                    required
                    style={{ height: '38px', fontSize: '0.85rem' }}
                  />
                ) : (
                  <div>
                    <select
                      value={newBackOrderForm.productId}
                      onChange={e => setNewBackOrderForm({ ...newBackOrderForm, productId: e.target.value })}
                      required
                      style={{ height: '38px', fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="">-- Choose an Inventory Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category}) - ₱{p.price.toLocaleString()} [{p.stock > 0 ? `${p.stock} in stock` : 'OUT OF STOCK'}]
                        </option>
                      ))}
                    </select>
                    {newBackOrderForm.productId && (() => {
                      const sel = products.find(p => p.id === newBackOrderForm.productId);
                      if (!sel) return null;
                      return (
                        <span style={{ fontSize: '0.7rem', color: sel.stock > 0 ? '#16a34a' : '#ea580c', fontWeight: 700, marginTop: '3px', display: 'block' }}>
                          {sel.stock > 0 ? `Current Stock: ${sel.stock} units available` : 'Currently OUT OF STOCK (0 units) - Reservation will queue for restocking'}
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', display: 'block' }}>
                  Quantity to Reserve *
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={newBackOrderForm.quantity}
                  onChange={e => setNewBackOrderForm({ ...newBackOrderForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  required
                  style={{ height: '38px', fontSize: '0.88rem', fontWeight: 700 }}
                />
              </div>

              {/* Customer Type / Selection */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                    Customer Details
                  </span>
                  {members.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Link registered member or enter walk-in
                    </span>
                  )}
                </div>

                {members.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Pick Registered Member (Optional Auto-Fill)
                    </label>
                    <select
                      value={newBackOrderForm.selectedMemberId}
                      onChange={e => {
                        const mid = e.target.value;
                        const mem = members.find(m => m.id === mid);
                        setNewBackOrderForm(prev => ({
                          ...prev,
                          selectedMemberId: mid,
                          customerName: mem ? mem.name : prev.customerName,
                          customerContact: mem ? (mem.contact || '') : prev.customerContact
                        }));
                      }}
                      style={{ height: '34px', fontSize: '0.8rem', width: '100%' }}
                    >
                      <option value="">-- Manual Walk-In Customer --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.id}) {m.contact ? `• ${m.contact}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Raphael Garcia"
                      value={newBackOrderForm.customerName}
                      onChange={e => setNewBackOrderForm({ ...newBackOrderForm, customerName: e.target.value })}
                      required
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                      Contact Phone (for SMS) *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0912 345 6789"
                      value={newBackOrderForm.customerContact}
                      onChange={e => setNewBackOrderForm({ ...newBackOrderForm, customerContact: e.target.value })}
                      required
                      style={{ height: '36px', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes / Special Instructions */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px', display: 'block' }}>
                  Reservation Notes / Specifications (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer will pick up in person. Wants 10W-40 viscosity specifically."
                  value={newBackOrderForm.notes}
                  onChange={e => setNewBackOrderForm({ ...newBackOrderForm, notes: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddBackOrderModal(false)}
                  className="btn"
                  disabled={submittingBackOrder}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingBackOrder}
                  style={{ flex: 1.5, fontWeight: 800 }}
                >
                  {submittingBackOrder ? 'Adding to Queue...' : 'Add to Reservation Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Exports for backward-compatibility with main router
export const UserManagement: React.FC = () => <Dashboard />;
export const Inventory: React.FC = () => <Dashboard />;
