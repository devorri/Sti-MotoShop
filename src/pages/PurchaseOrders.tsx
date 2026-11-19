import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  BadOrder,
  BadOrderStatus,
  Product
} from '../context/AppContext';
import { supabase } from '../supabase';
import {
  Truck,
  Building2,
  PackageX,
  Plus,
  X,
  PackageCheck,
  Pencil,
  Trash2,
  Ban,
  Zap,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Tags
} from 'lucide-react';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const peso = (n: number) => `₱${(Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const genId = (prefix: string) => `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

const STATUS_LABEL: Record<BadOrderStatus, string> = {
  PENDING: 'PENDING ACTION',
  RETURNED_TO_SUPPLIER: 'RETURNED TO SUPPLIER',
  REPLACED: 'REPLACEMENT RECEIVED',
  CREDITED: 'CREDITED / REFUNDED',
  ACCEPTED: 'ACCEPTED & STOCKED'
};

const labelStyle: React.CSSProperties = { fontSize: '0.68rem', fontWeight: 800, display: 'block', marginBottom: '4px', color: '#334155' };
const thSm: React.CSSProperties = { fontSize: '0.68rem' };

interface ReceiveLine {
  delivered: string;
  damaged: string;
}

type Tab = 'ORDERS' | 'SUPPLIERS' | 'BAD_ORDERS';

export const PurchaseOrders: React.FC = () => {
  const {
    products,
    saveProduct,
    purchaseOrders,
    savePurchaseOrder,
    deletePurchaseOrder,
    suppliers,
    saveSupplier,
    deleteSupplier,
    productSuppliers,
    saveProductSupplier,
    removeProductSupplier,
    badOrders,
    saveBadOrder
  } = useAppContext();

  const [tab, setTab] = useState<Tab>('ORDERS');

  // ------------------------------------------------------------------
  // Shared calculations
  // ------------------------------------------------------------------
  const getSupplierPrice = (supplierId: string | undefined, productId: string | undefined) =>
    productSuppliers.find(ps => ps.supplierId === supplierId && ps.productId === productId)?.supplierPrice;

  /** Amount Boss Rap actually owes the supplier for a PO. */
  const computePayable = (po: PurchaseOrder, bad: BadOrder[] = badOrders) => {
    const goods = po.items.reduce((sum, it) => sum + Math.min(it.receivedQty || 0, it.quantity) * it.costPrice, 0);
    const extras = bad
      .filter(b => b.purchaseOrderId === po.id && ((b.type === 'EXCESS' && b.status === 'ACCEPTED') || (b.type === 'DAMAGED' && b.status === 'REPLACED')))
      .reduce((sum, b) => sum + b.quantity * b.unitCost, 0);
    return goods + extras;
  };

  /** Adds stock using the latest DB value so concurrent POS sales are not overwritten. */
  const addStock = async (productId: string | undefined, qty: number) => {
    if (!productId || qty <= 0) return;
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const { data } = await supabase.from('products').select('stock').eq('id', productId).single();
    const freshStock = data ? Number(data.stock) || 0 : prod.stock;
    await saveProduct({ ...prod, stock: freshStock + qty });
  };

  // ==================================================================
  // TAB 1: PURCHASE ORDERS
  // ==================================================================
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Create PO modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDirectPO, setIsDirectPO] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(''); // linked saved supplier (optional, auto-filled)
  // Supplier info typed directly on the PO — no supplier account needed
  const emptySupInfo = { name: '', contactPerson: '', phone: '', address: '', deliveryDays: '' };
  const [supInfo, setSupInfo] = useState(emptySupInfo);
  const [poNotes, setPoNotes] = useState('');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>(''); // intentionally blank on product select (#18)
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [savePricesToList, setSavePricesToList] = useState(true);
  const [creating, setCreating] = useState(false);

  // Receive modal
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receiveLines, setReceiveLines] = useState<Record<number, ReceiveLine>>({});
  const [receiving, setReceiving] = useState(false);

  // View details modal
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

  const activeSuppliers = suppliers.filter(s => s.active);
  const selectedSupplier = suppliers.find(s => s.id === poSupplierId);

  // Products that need restocking: out of stock or at/below reorder level (#4)
  const needsRestock = (p: Product) => p.stock <= 0 || p.stock <= p.lowStockLevel;
  const productOptions = useMemo(() => {
    const list = products
      .filter(p => showAllProducts || needsRestock(p))
      .filter(p => !orderItems.some(it => it.productId === p.id));
    const supplierCarries = (p: Product) => productSuppliers.some(ps => ps.supplierId === poSupplierId && ps.productId === p.id);
    return list.sort((a, b) => {
      // supplier's own products first, then out-of-stock first, then lowest stock
      const sa = supplierCarries(a) ? 0 : 1;
      const sb = supplierCarries(b) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      if ((a.stock <= 0) !== (b.stock <= 0)) return a.stock <= 0 ? -1 : 1;
      return a.stock - b.stock || a.name.localeCompare(b.name);
    });
  }, [products, showAllProducts, orderItems, productSuppliers, poSupplierId]);

  const restockCount = products.filter(needsRestock).length;
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const priceOnFile = getSupplierPrice(poSupplierId, selectedProductId);

  const fillFromSavedSupplier = (id: string) => {
    const sp = suppliers.find(s => s.id === id);
    setPoSupplierId(id);
    setSelectedProductId('');
    setCostPrice('');
    if (!sp) { setSupInfo(emptySupInfo); return; }
    setSupInfo({
      name: sp.name,
      contactPerson: sp.contactPerson || '',
      phone: sp.phone || '',
      address: sp.address || '',
      deliveryDays: sp.deliveryDays !== undefined && sp.deliveryDays !== null ? String(sp.deliveryDays) : ''
    });
  };

  const handleSupplierNameChange = (name: string) => {
    setSupInfo(prev => ({ ...prev, name }));
    const match = suppliers.find(s => s.name.trim().toLowerCase() === name.trim().toLowerCase());
    setPoSupplierId(match ? match.id : '');
  };

  const deliveryDaysNum = parseInt(supInfo.deliveryDays, 10);
  const expectedDeliveryDate = !isNaN(deliveryDaysNum) && deliveryDaysNum >= 0
    ? new Date(Date.now() + deliveryDaysNum * 86400000)
    : null;

  const resetCreateForm = () => {
    setPoSupplierId('');
    setSupInfo(emptySupInfo);
    setPoNotes('');
    setOrderItems([]);
    setSelectedProductId('');
    setOrderQty('');
    setCostPrice('');
    setShowAllProducts(false);
    setIsDirectPO(false);
  };

  const openCreate = (direct: boolean) => {
    resetCreateForm();
    setIsDirectPO(direct);
    if (direct) setSupInfo({ ...emptySupInfo, deliveryDays: '0' }); // direct PO = delivered on the spot
    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    const qty = parseInt(orderQty, 10);
    const cost = parseFloat(costPrice);
    if (!selectedProduct) { alert('PLEASE SELECT A PRODUCT TO ORDER.'); return; }
    if (!qty || qty <= 0) { alert('ENTER THE QUANTITY TO ORDER (MUST BE GREATER THAN ZERO).'); return; }
    if (costPrice.trim() === '' || isNaN(cost) || cost <= 0) { alert('ENTER THE SUPPLIER PRICE (PURCHASE ORDER PRICE PER UNIT).'); return; }
    if (cost >= selectedProduct.price) {
      if (!window.confirm(`Supplier price ${peso(cost)} is NOT lower than the retail price ${peso(selectedProduct.price)}. Boss Rap will have no profit on this item. Add anyway?`)) return;
    }
    setOrderItems(prev => [...prev, {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      quantity: qty,
      costPrice: cost,
      receivedQty: 0,
      damagedQty: 0,
      excessQty: 0
    }]);
    setSelectedProductId('');
    setOrderQty('');
    setCostPrice('');
  };

  const updateOrderItem = (productId: string | undefined, patch: Partial<PurchaseOrderItem>) => {
    setOrderItems(prev => prev.map(it => it.productId === productId ? { ...it, ...patch } : it));
  };

  const orderTotals = orderItems.reduce((acc, it) => {
    const retail = products.find(p => p.id === it.productId)?.price || 0;
    acc.cost += it.costPrice * it.quantity;
    acc.sales += retail * it.quantity;
    return acc;
  }, { cost: 0, sales: 0 });

  // ------------------------------------------------------------------
  // Receiving (#4, #5, #9, #10)
  // ------------------------------------------------------------------
  const openReceive = (po: PurchaseOrder) => {
    const lines: Record<number, ReceiveLine> = {};
    po.items.forEach((it, idx) => {
      const remaining = Math.max(0, it.quantity - (it.receivedQty || 0));
      lines[idx] = { delivered: remaining > 0 ? String(remaining) : '0', damaged: '0' };
    });
    setReceiveLines(lines);
    setReceivingPO(po);
  };

  const handleCreatePO = async () => {
    const supName = supInfo.name.trim();
    const supPhone = supInfo.phone.trim();
    const days = parseInt(supInfo.deliveryDays, 10);
    if (!supName) { alert('ENTER THE SUPPLIER / COMPANY NAME.'); return; }
    if (!supPhone) { alert('ENTER THE SUPPLIER CONTACT NUMBER.'); return; }
    if (supInfo.deliveryDays.trim() === '' || isNaN(days) || days < 0) { alert('ENTER HOW MANY DAYS THE SUPPLIER WILL DELIVER TO BOSS RAP (0 = SAME DAY).'); return; }
    if (orderItems.length === 0) { alert('ADD AT LEAST ONE PRODUCT ITEM TO THE ORDER.'); return; }
    if (orderItems.some(it => !it.quantity || it.quantity <= 0 || !it.costPrice || it.costPrice <= 0)) {
      alert('EVERY ITEM NEEDS A QUANTITY AND A SUPPLIER PRICE GREATER THAN ZERO.');
      return;
    }
    setCreating(true);

    // Keep the supplier's info for next time (created automatically — no separate supplier account/registration)
    const existingSup = suppliers.find(s => s.id === poSupplierId)
      || suppliers.find(s => s.name.trim().toLowerCase() === supName.toLowerCase());
    const supRecord: Supplier = {
      id: existingSup?.id || `SUP${Date.now().toString().slice(-6)}`,
      name: existingSup?.name || supName,
      contactPerson: supInfo.contactPerson.trim(),
      phone: supPhone,
      email: existingSup?.email || '',
      address: supInfo.address.trim(),
      deliveryDays: days,
      active: true,
      createdAt: existingSup?.createdAt
    };
    const supSaved = await saveSupplier(supRecord);
    const linkedSupplierId = supSaved ? supRecord.id : existingSup?.id;

    const orderedAt = new Date();
    const newPO: PurchaseOrder = {
      id: genId(isDirectPO ? 'DPO' : 'PO'),
      supplierId: linkedSupplierId,
      supplierName: supName.toUpperCase(),
      supplierContact: supInfo.contactPerson.trim() || undefined,
      supplierPhone: supPhone,
      supplierAddress: supInfo.address.trim() || undefined,
      deliveryDays: days,
      expectedDelivery: new Date(orderedAt.getTime() + days * 86400000).toISOString(),
      items: orderItems.map(it => ({ ...it, receivedQty: 0, damagedQty: 0, excessQty: 0 })),
      totalCost: orderTotals.cost,
      amountPayable: 0,
      status: 'PENDING',
      poType: isDirectPO ? 'DIRECT' : 'STANDARD',
      notes: poNotes.trim() || undefined,
      dateOrdered: orderedAt.toISOString()
    };
    const ok = await savePurchaseOrder(newPO);
    if (ok && savePricesToList && linkedSupplierId) {
      for (const it of orderItems) {
        if (it.productId) {
          await saveProductSupplier({ supplierId: linkedSupplierId, productId: it.productId, supplierPrice: it.costPrice });
        }
      }
    }
    setCreating(false);
    if (!ok) return;
    setShowCreateModal(false);
    resetCreateForm();
    // Direct PO: items are on hand right away -> go straight to receiving (#7)
    if (newPO.poType === 'DIRECT') openReceive(newPO);
  };

  const computeLine = (it: PurchaseOrderItem, line?: ReceiveLine) => {
    const delivered = Math.max(0, parseInt(line?.delivered || '0', 10) || 0);
    const damaged = Math.min(delivered, Math.max(0, parseInt(line?.damaged || '0', 10) || 0));
    const good = delivered - damaged;
    const remaining = Math.max(0, it.quantity - (it.receivedQty || 0));
    const toStock = Math.min(good, remaining);
    const excess = good - toStock;
    return { delivered, damaged, good, remaining, toStock, excess };
  };

  const handleConfirmReceive = async () => {
    if (!receivingPO) return;
    const po = receivingPO;
    const calc = po.items.map((it, idx) => computeLine(it, receiveLines[idx]));
    if (calc.every(c => c.delivered === 0)) { alert('ENTER THE QUANTITY THAT ARRIVED FOR AT LEAST ONE ITEM.'); return; }
    const stockTotal = calc.reduce((s, c) => s + c.toStock, 0);
    const dmgTotal = calc.reduce((s, c) => s + c.damaged, 0);
    const excTotal = calc.reduce((s, c) => s + c.excess, 0);
    if (!window.confirm(
      `CONFIRM RECEIVING FOR ${po.id}\n\n` +
      `• ${stockTotal} good unit(s) will be ADDED TO STOCK\n` +
      (dmgTotal ? `• ${dmgTotal} damaged unit(s) → BAD ORDERS (Damaged)\n` : '') +
      (excTotal ? `• ${excTotal} excess unit(s) → BAD ORDERS (Over-delivery), NOT stocked\n` : '') +
      `\nContinue?`
    )) return;

    setReceiving(true);
    try {
      const now = new Date().toISOString();
      const stamp = Date.now().toString().slice(-6);
      const newBad: BadOrder[] = [];

      // 1. Stock + bad orders
      for (let i = 0; i < po.items.length; i++) {
        const it = po.items[i];
        const c = calc[i];
        if (c.toStock > 0) await addStock(it.productId, c.toStock);
        if (c.damaged > 0) {
          newBad.push({
            id: `BO-D-${stamp}-${i}`,
            type: 'DAMAGED', purchaseOrderId: po.id, supplierId: po.supplierId, supplierName: po.supplierName,
            productId: it.productId, productName: it.name, quantity: c.damaged, unitCost: it.costPrice,
            status: 'PENDING', remarks: 'Arrived damaged upon receiving', createdAt: now
          });
        }
        if (c.excess > 0) {
          newBad.push({
            id: `BO-E-${stamp}-${i}`,
            type: 'EXCESS', purchaseOrderId: po.id, supplierId: po.supplierId, supplierName: po.supplierName,
            productId: it.productId, productName: it.name, quantity: c.excess, unitCost: it.costPrice,
            status: 'PENDING', remarks: `Delivered more than ordered (${it.quantity})`, createdAt: now
          });
        }
      }
      for (const b of newBad) await saveBadOrder(b);

      // 2. Update the PO
      const items: PurchaseOrderItem[] = po.items.map((it, i) => ({
        ...it,
        receivedQty: (it.receivedQty || 0) + calc[i].toStock,
        damagedQty: (it.damagedQty || 0) + calc[i].damaged,
        excessQty: (it.excessQty || 0) + calc[i].excess
      }));
      const fullyReceived = items.every(it => (it.receivedQty || 0) >= it.quantity);
      const updated: PurchaseOrder = {
        ...po,
        items,
        status: fullyReceived ? 'RECEIVED' : 'PARTIAL',
        dateReceived: now
      };
      updated.amountPayable = computePayable(updated, [...newBad, ...badOrders]);
      await savePurchaseOrder(updated);

      setReceivingPO(null);
      alert(
        `${po.id} ${fullyReceived ? 'FULLY RECEIVED' : 'PARTIALLY RECEIVED'}.\n` +
        `Stock added: ${stockTotal} unit(s).\n` +
        `Amount payable to supplier: ${peso(updated.amountPayable || 0)} (only for good items received).` +
        (newBad.length ? `\n\n${newBad.length} item line(s) sent to BAD ORDERS — see the Bad Orders tab to return them to the supplier.` : '')
      );
    } finally {
      setReceiving(false);
    }
  };

  const handleCloseShort = async (po: PurchaseOrder) => {
    const missing = po.items.reduce((s, it) => s + Math.max(0, it.quantity - (it.receivedQty || 0)), 0);
    const payable = computePayable(po);
    if (!window.confirm(
      `CLOSE ${po.id} AS SHORT DELIVERY?\n\nThe supplier will no longer deliver the remaining ${missing} unit(s).\n` +
      `Boss Rap will only pay for what was received: ${peso(payable)} (instead of ${peso(po.totalCost)}).`
    )) return;
    await savePurchaseOrder({
      ...po,
      status: 'RECEIVED',
      amountPayable: payable,
      notes: `${po.notes ? po.notes + ' | ' : ''}CLOSED SHORT: ${missing} unit(s) not delivered`
    });
  };

  const handleCancelPO = async (po: PurchaseOrder) => {
    if (!window.confirm(`CANCEL ${po.id}? Nothing has been received yet, so no stock will change.`)) return;
    await savePurchaseOrder({ ...po, status: 'CANCELLED', amountPayable: 0 });
  };

  const handleDeletePO = async (po: PurchaseOrder) => {
    if (!window.confirm(`DELETE ${po.id} PERMANENTLY?`)) return;
    await deletePurchaseOrder(po.id);
  };

  const isShortClosed = (po: PurchaseOrder) => po.status === 'RECEIVED' && po.items.some(it => (it.receivedQty || 0) < it.quantity);

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesFilter = filter === 'ALL' || po.status === filter;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      po.id.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q) ||
      po.items.some(i => i.name.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const openPOCount = purchaseOrders.filter(p => p.status === 'PENDING' || p.status === 'PARTIAL').length;
  const outstandingPayable = purchaseOrders
    .filter(p => p.status === 'PARTIAL' || p.status === 'RECEIVED')
    .reduce((s, p) => s + (p.amountPayable || 0), 0);

  // ==================================================================
  // TAB 2: SUPPLIERS (#8) + supplier price list (#3, #6)
  // ==================================================================
  const emptySupplier: Supplier = { id: '', name: '', contactPerson: '', phone: '', email: '', address: '', active: true };
  const [supplierForm, setSupplierForm] = useState<Supplier | null>(null);
  const [priceListSupplier, setPriceListSupplier] = useState<Supplier | null>(null);
  const [plProductId, setPlProductId] = useState('');
  const [plPrice, setPlPrice] = useState('');
  const [plEdits, setPlEdits] = useState<Record<string, string>>({});

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm) return;
    const name = supplierForm.name.trim();
    if (!name) { alert('SUPPLIER NAME IS REQUIRED.'); return; }
    if (suppliers.some(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== supplierForm.id)) {
      alert('A SUPPLIER WITH THIS NAME ALREADY EXISTS.');
      return;
    }
    const ok = await saveSupplier({
      ...supplierForm,
      id: supplierForm.id || `SUP${Date.now().toString().slice(-6)}`,
      name: name.toUpperCase()
    });
    if (ok) setSupplierForm(null);
  };

  const handleAddPriceListItem = async () => {
    if (!priceListSupplier) return;
    const price = parseFloat(plPrice);
    if (!plProductId) { alert('SELECT A PRODUCT.'); return; }
    if (!price || price <= 0) { alert('ENTER THE SUPPLIER PRICE.'); return; }
    const ok = await saveProductSupplier({ supplierId: priceListSupplier.id, productId: plProductId, supplierPrice: price });
    if (ok) { setPlProductId(''); setPlPrice(''); }
  };

  // ==================================================================
  // TAB 3: BAD ORDERS (#10) — damaged and excess kept separate
  // ==================================================================
  const [badTab, setBadTab] = useState<'DAMAGED' | 'EXCESS'>('DAMAGED');
  const [badBusy, setBadBusy] = useState<string | null>(null);

  const resolveBadOrder = async (bo: BadOrder, status: BadOrderStatus) => {
    const prompts: Record<string, string> = {
      RETURNED_TO_SUPPLIER: `Mark ${bo.quantity} x ${bo.productName} as RETURNED TO SUPPLIER (${bo.supplierName || 'supplier'})?`,
      REPLACED: `Supplier sent ${bo.quantity} replacement unit(s) for ${bo.productName}?\nThe replacement will be ADDED TO STOCK and charged to the PO (${peso(bo.quantity * bo.unitCost)}).`,
      CREDITED: `Supplier refunded / credited ${bo.quantity} x ${bo.productName} (${peso(bo.quantity * bo.unitCost)})?\nNo stock will be added and Boss Rap will not pay for these units.`,
      ACCEPTED: `Keep the ${bo.quantity} extra unit(s) of ${bo.productName}?\nThey will be ADDED TO STOCK and ${peso(bo.quantity * bo.unitCost)} will be added to the amount payable.`
    };
    if (!window.confirm(prompts[status] || 'Update this bad order?')) return;
    const remark = window.prompt('Remarks (optional) — e.g. return slip #, courier, person who received:', '') || '';

    setBadBusy(bo.id);
    try {
      if (status === 'REPLACED' || status === 'ACCEPTED') await addStock(bo.productId, bo.quantity);
      const updated: BadOrder = {
        ...bo,
        status,
        remarks: [bo.remarks, remark.trim()].filter(Boolean).join(' | ') || undefined,
        resolvedAt: new Date().toISOString()
      };
      const ok = await saveBadOrder(updated);
      // Keep PO amount payable in sync when replacements / accepted excess are added
      if (ok && bo.purchaseOrderId && (status === 'REPLACED' || status === 'ACCEPTED')) {
        const po = purchaseOrders.find(p => p.id === bo.purchaseOrderId);
        if (po) {
          const nextBad = badOrders.map(b => b.id === bo.id ? updated : b);
          await savePurchaseOrder({ ...po, amountPayable: computePayable(po, nextBad) });
        }
      }
    } finally {
      setBadBusy(null);
    }
  };

  const isBadOpen = (b: BadOrder) => b.status === 'PENDING' || (b.type === 'DAMAGED' && b.status === 'RETURNED_TO_SUPPLIER');
  const damagedList = badOrders.filter(b => b.type === 'DAMAGED');
  const excessList = badOrders.filter(b => b.type === 'EXCESS');
  const pendingBad = badOrders.filter(isBadOpen).length;
  const badRows = badTab === 'DAMAGED' ? damagedList : excessList;

  // ==================================================================
  // RENDER
  // ==================================================================
  const tabBtn = (t: Tab, label: string, icon: React.ReactNode, count?: number) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      className={tab === t ? 'btn-primary' : 'btn'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span style={{ backgroundColor: tab === t ? '#ffffff' : '#ef4444', color: tab === t ? '#2563eb' : '#ffffff', borderRadius: '999px', padding: '0 7px', fontSize: '0.68rem', fontWeight: 800 }}>{count}</span>
      )}
    </button>
  );

  const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#2563eb', padding: 0, fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Purchase Orders & Restocking</h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '5px 0 0 0' }}>
            Order out-of-stock items from suppliers, receive deliveries (full or partial), and handle damaged or excess items.
          </p>
        </div>
        {tab === 'ORDERS' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn" onClick={() => openCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Items bought & received on the spot">
              <Zap size={15} /> DIRECT PO
            </button>
            <button type="button" className="btn-primary" onClick={() => openCreate(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} /> CREATE PURCHASE ORDER
            </button>
          </div>
        )}
        {tab === 'SUPPLIERS' && (
          <button type="button" className="btn-primary" onClick={() => setSupplierForm({ ...emptySupplier })} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> ADD SUPPLIER
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {tabBtn('ORDERS', 'Purchase Orders', <Truck size={15} />, openPOCount)}
        {tabBtn('SUPPLIERS', 'Suppliers', <Building2 size={15} />)}
        {tabBtn('BAD_ORDERS', 'Bad Orders', <PackageX size={15} />, pendingBad)}
      </div>

      {/* ============================ ORDERS TAB ============================ */}
      {tab === 'ORDERS' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>ITEMS NEEDING RESTOCK</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: restockCount ? '#dc2626' : '#16a34a' }}>{restockCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Out of stock or at reorder level</div>
            </div>
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>OPEN PURCHASE ORDERS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb' }}>{openPOCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pending or partially received</div>
            </div>
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>TOTAL PAYABLE (RECEIVED GOODS)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>{peso(outstandingPayable)}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Only items actually received</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search by PO ID, supplier, or product name..."
              value={searchTerm}
              style={{ maxWidth: '380px', margin: 0 }}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['ALL', 'PENDING', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const).map(type => (
                <button key={type} type="button" className={filter === type ? 'btn-primary' : 'btn'} onClick={() => setFilter(type)} style={{ fontSize: '0.68rem', padding: '6px 10px' }}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>SUPPLIER</th>
                  <th>DATES</th>
                  <th>ITEMS (RECEIVED / ORDERED)</th>
                  <th>ORDER COST</th>
                  <th>AMOUNT PAYABLE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>NO PURCHASE ORDERS FOUND</td></tr>
                ) : filteredPOs.map(po => {
                  const hasReceipts = po.items.some(it => (it.receivedQty || 0) + (it.damagedQty || 0) + (it.excessQty || 0) > 0);
                  return (
                    <tr key={po.id} style={{ backgroundColor: po.status === 'PENDING' || po.status === 'PARTIAL' ? '#fffcf0' : 'transparent' }}>
                      <td style={{ fontWeight: 800 }}>
                        <code>{po.id}</code>
                        {po.poType === 'DIRECT' && <div><span className="badge badge-blue" style={{ marginTop: '4px' }}>DIRECT PO</span></div>}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {po.supplierName}
                        {(po.supplierPhone || po.supplierContact) && (
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                            {po.supplierContact ? `${po.supplierContact} • ` : ''}{po.supplierPhone || ''}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.72rem' }}>
                        <div>Ordered: {new Date(po.dateOrdered).toLocaleDateString()}</div>
                        {po.expectedDelivery && (() => {
                          const open = po.status === 'PENDING' || po.status === 'PARTIAL';
                          const late = open && new Date(po.expectedDelivery).getTime() < new Date().setHours(0, 0, 0, 0);
                          return (
                            <div style={{ marginTop: '2px', color: late ? '#dc2626' : '#2563eb', fontWeight: late ? 800 : 600 }}>
                              Expected: {new Date(po.expectedDelivery).toLocaleDateString()}{po.deliveryDays !== undefined ? ` (${po.deliveryDays}d)` : ''}{late ? ' • LATE' : ''}
                            </div>
                          );
                        })()}
                        {po.dateReceived && <div style={{ color: '#16a34a', marginTop: '2px' }}>Last received: {new Date(po.dateReceived).toLocaleDateString()}</div>}
                      </td>
                      <td style={{ fontSize: '0.72rem', minWidth: '240px' }}>
                        {po.items.map((it, idx) => {
                          const rec = it.receivedQty || 0;
                          const complete = rec >= it.quantity;
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid #f1f5f9', padding: '2px 0' }}>
                              <span>{it.name}</span>
                              <span style={{ fontWeight: 800, whiteSpace: 'nowrap', color: complete ? '#16a34a' : rec > 0 ? '#d97706' : '#0f172a' }}>
                                {rec}/{it.quantity}
                                {(it.damagedQty || 0) > 0 && <span style={{ color: '#dc2626' }}> • {it.damagedQty} dmg</span>}
                                {(it.excessQty || 0) > 0 && <span style={{ color: '#7c3aed' }}> • +{it.excessQty} excess</span>}
                              </span>
                            </div>
                          );
                        })}
                      </td>
                      <td style={{ fontWeight: 700 }}>{peso(po.totalCost)}</td>
                      <td style={{ fontWeight: 900, color: '#0f172a' }}>
                        {po.status === 'PENDING' || po.status === 'CANCELLED' ? <span style={{ color: '#94a3b8' }}>—</span> : peso(po.amountPayable || 0)}
                      </td>
                      <td>
                        {po.status === 'PENDING' && <span className="badge badge-yellow">PENDING DELIVERY</span>}
                        {po.status === 'PARTIAL' && <span className="badge badge-yellow" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>PARTIALLY RECEIVED</span>}
                        {po.status === 'RECEIVED' && (isShortClosed(po)
                          ? <span className="badge badge-blue">CLOSED (SHORT)</span>
                          : <span className="badge badge-green">RECEIVED & STOCKED</span>)}
                        {po.status === 'CANCELLED' && <span className="badge badge-red">CANCELLED</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button type="button" className="btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => setViewPO(po)}>VIEW</button>
                          {(po.status === 'PENDING' || po.status === 'PARTIAL') && (
                            <button type="button" className="btn-primary" style={{ fontSize: '0.65rem', padding: '4px 8px', backgroundColor: '#16a34a', borderColor: '#16a34a' }} onClick={() => openReceive(po)}>
                              RECEIVE ITEMS
                            </button>
                          )}
                          {po.status === 'PARTIAL' && (
                            <button type="button" className="btn" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleCloseShort(po)} title="Supplier will not deliver the rest — pay only what was received">
                              CLOSE (SHORT)
                            </button>
                          )}
                          {po.status === 'PENDING' && !hasReceipts && (
                            <button type="button" className="btn" style={{ fontSize: '0.65rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => handleCancelPO(po)}>
                              <Ban size={11} /> CANCEL
                            </button>
                          )}
                          {!hasReceipts && (po.status === 'PENDING' || po.status === 'CANCELLED') && (
                            <button type="button" className="btn-danger" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => handleDeletePO(po)}>
                              DELETE
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============================ SUPPLIERS TAB ============================ */}
      {tab === 'SUPPLIERS' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SUPPLIER</th>
                <th>CONTACT</th>
                <th>ADDRESS / DELIVERY</th>
                <th>PRODUCTS SUPPLIED</th>
                <th>OPEN POs</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>NO SUPPLIERS YET — click ADD SUPPLIER to register your first supplier.</td></tr>
              ) : suppliers.map(sp => {
                const carried = productSuppliers.filter(ps => ps.supplierId === sp.id).length;
                const openPOs = purchaseOrders.filter(po => po.supplierId === sp.id && (po.status === 'PENDING' || po.status === 'PARTIAL')).length;
                return (
                  <tr key={sp.id} style={{ opacity: sp.active ? 1 : 0.55 }}>
                    <td style={{ fontWeight: 800 }}>{sp.name}<div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>{sp.id}</div></td>
                    <td style={{ fontSize: '0.75rem' }}>
                      <div>{sp.contactPerson || '—'}</div>
                      <div style={{ color: '#64748b' }}>{sp.phone || ''}{sp.email ? ` • ${sp.email}` : ''}</div>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {sp.address || '—'}
                      {sp.deliveryDays !== undefined && <div style={{ color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>Delivers in {sp.deliveryDays} day(s)</div>}
                    </td>
                    <td>
                      <button type="button" className="btn" style={{ fontSize: '0.68rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => { setPriceListSupplier(sp); setPlEdits({}); }}>
                        <Tags size={12} /> {carried} product(s) & prices
                      </button>
                    </td>
                    <td style={{ fontWeight: 700 }}>{openPOs}</td>
                    <td>
                      <button type="button" className={sp.active ? 'btn-primary' : 'btn'} style={{ fontSize: '0.65rem', padding: '4px 8px', width: '80px' }} onClick={() => saveSupplier({ ...sp, active: !sp.active })}>
                        {sp.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn" style={{ fontSize: '0.65rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => setSupplierForm({ ...sp })}><Pencil size={11} /> EDIT</button>
                        <button type="button" className="btn-danger" style={{ fontSize: '0.65rem', padding: '4px 8px' }} onClick={() => { if (window.confirm(`Delete supplier ${sp.name}?`)) deleteSupplier(sp.id); }}><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================ BAD ORDERS TAB ============================ */}
      {tab === 'BAD_ORDERS' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button type="button" className={badTab === 'DAMAGED' ? 'btn-primary' : 'btn'} onClick={() => setBadTab('DAMAGED')} style={{ fontSize: '0.78rem' }}>
              DAMAGED FROM SUPPLIER ({damagedList.filter(isBadOpen).length} open)
            </button>
            <button type="button" className={badTab === 'EXCESS' ? 'btn-primary' : 'btn'} onClick={() => setBadTab('EXCESS')} style={{ fontSize: '0.78rem' }}>
              EXCESS / OVER-DELIVERY ({excessList.filter(isBadOpen).length} open)
            </button>
          </div>

          <div className="card" style={{ padding: '12px 14px', marginBottom: '12px', fontSize: '0.78rem', color: '#334155', backgroundColor: badTab === 'DAMAGED' ? '#fef2f2' : '#f5f3ff', border: `1px solid ${badTab === 'DAMAGED' ? '#fecaca' : '#ddd6fe'}` }}>
            {badTab === 'DAMAGED' ? (
              <>
                <strong>HOW TO RETURN DAMAGED ITEMS TO THE SUPPLIER:</strong>
                <ol style={{ margin: '6px 0 0 18px', padding: 0, lineHeight: 1.6 }}>
                  <li>Damaged units are <strong>never added to stock</strong> and are <strong>not included</strong> in the amount payable.</li>
                  <li>Set the items aside, then click <strong>RETURNED TO SUPPLIER</strong> once they are sent back (note the return slip / courier).</li>
                  <li>When the supplier sends good units back, click <strong>REPLACEMENT RECEIVED</strong> — stock is added and the PO payable is updated.</li>
                  <li>If the supplier refunds or deducts it instead, click <strong>CREDITED</strong> — no stock, nothing to pay.</li>
                </ol>
              </>
            ) : (
              <>
                <strong>EXCESS / OVER-DELIVERED ITEMS:</strong> units delivered beyond the ordered quantity are kept separate and <strong>not added to stock</strong> until you decide.
                {' '}<strong>RETURN TO SUPPLIER</strong> sends them back (nothing to pay), or <strong>ACCEPT & STOCK</strong> keeps them (stock added and the extra amount is added to the PO payable).
              </>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>REF</th>
                  <th>DATE</th>
                  <th>PO / SUPPLIER</th>
                  <th>PRODUCT</th>
                  <th>QTY</th>
                  <th>VALUE</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {badRows.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    {badTab === 'DAMAGED' ? 'NO DAMAGED ITEMS RECORDED' : 'NO OVER-DELIVERIES RECORDED'}
                  </td></tr>
                ) : badRows.map(bo => {
                  const busy = badBusy === bo.id;
                  const open = isBadOpen(bo);
                  return (
                    <tr key={bo.id} style={{ opacity: open ? 1 : 0.7 }}>
                      <td><code style={{ fontSize: '0.7rem' }}>{bo.id}</code></td>
                      <td style={{ fontSize: '0.72rem' }}>{new Date(bo.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.72rem' }}><div style={{ fontWeight: 700 }}>{bo.purchaseOrderId || '—'}</div><div style={{ color: '#64748b' }}>{bo.supplierName || ''}</div></td>
                      <td style={{ fontWeight: 700, fontSize: '0.78rem' }}>{bo.productName}</td>
                      <td style={{ fontWeight: 900 }}>{bo.quantity}</td>
                      <td style={{ fontSize: '0.75rem' }}>{peso(bo.quantity * bo.unitCost)}</td>
                      <td>
                        <span className={`badge ${bo.status === 'PENDING' ? 'badge-yellow' : bo.status === 'RETURNED_TO_SUPPLIER' ? 'badge-blue' : 'badge-green'}`}>{STATUS_LABEL[bo.status]}</span>
                        {bo.resolvedAt && <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>{new Date(bo.resolvedAt).toLocaleDateString()}</div>}
                      </td>
                      <td style={{ fontSize: '0.7rem', color: '#475569', maxWidth: '200px' }}>{bo.remarks || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {bo.type === 'DAMAGED' && bo.status === 'PENDING' && (
                            <button type="button" className="btn" disabled={busy} style={{ fontSize: '0.62rem', padding: '4px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => resolveBadOrder(bo, 'RETURNED_TO_SUPPLIER')}>
                              <RotateCcw size={11} /> RETURNED TO SUPPLIER
                            </button>
                          )}
                          {bo.type === 'DAMAGED' && open && (
                            <>
                              <button type="button" className="btn-primary" disabled={busy} style={{ fontSize: '0.62rem', padding: '4px 7px', backgroundColor: '#16a34a', borderColor: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => resolveBadOrder(bo, 'REPLACED')}>
                                <PackageCheck size={11} /> REPLACEMENT RECEIVED
                              </button>
                              <button type="button" className="btn" disabled={busy} style={{ fontSize: '0.62rem', padding: '4px 7px' }} onClick={() => resolveBadOrder(bo, 'CREDITED')}>
                                CREDITED
                              </button>
                            </>
                          )}
                          {bo.type === 'EXCESS' && bo.status === 'PENDING' && (
                            <>
                              <button type="button" className="btn" disabled={busy} style={{ fontSize: '0.62rem', padding: '4px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => resolveBadOrder(bo, 'RETURNED_TO_SUPPLIER')}>
                                <RotateCcw size={11} /> RETURN TO SUPPLIER
                              </button>
                              <button type="button" className="btn-primary" disabled={busy} style={{ fontSize: '0.62rem', padding: '4px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={() => resolveBadOrder(bo, 'ACCEPTED')}>
                                <CheckCircle2 size={11} /> ACCEPT & STOCK
                              </button>
                            </>
                          )}
                          {!open && <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 700 }}>✓ Resolved</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============================ CREATE PO MODAL ============================ */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '940px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{isDirectPO ? 'CREATE DIRECT PURCHASE ORDER' : 'CREATE NEW SUPPLIER PURCHASE ORDER'}</h3>
              <button type="button" className="btn" style={{ padding: '4px 8px' }} onClick={() => { setShowCreateModal(false); resetCreateForm(); }}><X size={16} /></button>
            </div>
            {isDirectPO && (
              <div style={{ marginTop: '10px', fontSize: '0.78rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: '6px', padding: '8px 10px' }}>
                <strong>DIRECT PO:</strong> for items bought and delivered on the spot. After saving, the receiving form opens right away so you can stock the items.
              </div>
            )}

            {/* Supplier information — typed directly, no supplier account needed */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Building2 size={14} /> SUPPLIER INFORMATION</strong>
                {activeSuppliers.length > 0 && (
                  <select value={poSupplierId} onChange={e => fillFromSavedSupplier(e.target.value)} style={{ fontSize: '0.72rem', width: 'auto', maxWidth: '280px' }}>
                    <option value="">Fill from previous supplier (optional)</option>
                    {activeSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="builder-row">
                <div>
                  <label style={labelStyle}>SUPPLIER / COMPANY NAME *</label>
                  <input type="text" placeholder="e.g. MOTO DISTRIBUTORS INC." value={supInfo.name} onChange={e => handleSupplierNameChange(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>CONTACT PERSON</label>
                  <input type="text" placeholder="e.g. Juan Dela Cruz" value={supInfo.contactPerson} onChange={e => setSupInfo({ ...supInfo, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>CONTACT NUMBER *</label>
                  <input type="tel" placeholder="e.g. 0912 345 6789" value={supInfo.phone} onChange={e => setSupInfo({ ...supInfo, phone: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>ADDRESS</label>
                  <input type="text" placeholder="e.g. Malolos, Bulacan" value={supInfo.address} onChange={e => setSupInfo({ ...supInfo, address: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>DELIVERY TIME (DAYS) *</label>
                  <input type="number" min="0" step="1" placeholder="e.g. 3" value={supInfo.deliveryDays} onChange={e => setSupInfo({ ...supInfo, deliveryDays: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>EXPECTED DELIVERY TO BOSS RAP</label>
                  <div style={{ padding: '9px 10px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontSize: '0.8rem', fontWeight: 800, color: expectedDeliveryDate ? '#0f172a' : '#94a3b8' }}>
                    {expectedDeliveryDate
                      ? `${expectedDeliveryDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}${deliveryDaysNum === 0 ? ' (same day)' : ` (in ${deliveryDaysNum} day${deliveryDaysNum === 1 ? '' : 's'})`}`
                      : 'Enter delivery days'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '8px' }}>
                No supplier account needed — just type the supplier's details. They are saved automatically so you can reuse them on the next order.
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={labelStyle}>NOTES / REFERENCE (OPTIONAL)</label>
              <input type="text" placeholder="e.g. Supplier quotation #, terms" value={poNotes} onChange={e => setPoNotes(e.target.value)} />
            </div>

            {/* Item builder */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc', marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{ fontSize: '0.78rem' }}>ADD PRODUCT ITEMS</strong>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', margin: 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={showAllProducts} onChange={e => setShowAllProducts(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                  Also show products that still have stock
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 1fr auto', gap: '8px', alignItems: 'flex-end' }} className="builder-row">
                <div>
                  <label style={labelStyle}>PRODUCT {showAllProducts ? '(ALL)' : '(OUT OF STOCK / LOW STOCK ONLY)'}</label>
                  <select
                    value={selectedProductId}
                    onChange={e => { setSelectedProductId(e.target.value); setCostPrice(''); }}
                    style={{ fontSize: '0.78rem' }}
                    disabled={!supInfo.name.trim()}
                  >
                    <option value="">{supInfo.name.trim() ? `-- SELECT PRODUCT (${productOptions.length}) --` : '-- ENTER SUPPLIER NAME FIRST --'}</option>
                    {productOptions.map(p => {
                      const sp = getSupplierPrice(poSupplierId, p.id);
                      const tag = p.stock <= 0 ? 'OUT OF STOCK' : `LOW: ${p.stock} left`;
                      return (
                        <option key={p.id} value={p.id}>
                          {sp !== undefined ? '★ ' : ''}{p.name} — {needsRestock(p) ? tag : `Stock ${p.stock}`} • Retail ₱{p.price}
                        </option>
                      );
                    })}
                  </select>
                  {supInfo.name.trim() && productOptions.length === 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '4px' }}>All products are stocked. Tick “Also show products that still have stock” to order anyway.</div>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>QTY TO ORDER</label>
                  <input type="number" min={1} placeholder="Qty" value={orderQty} onChange={e => setOrderQty(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>SUPPLIER PRICE / UNIT (₱)</label>
                  <input type="number" min={0} step="0.01" placeholder="Enter price" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                </div>
                <button type="button" className="btn-primary" onClick={handleAddItem} style={{ height: '38px', whiteSpace: 'nowrap' }}>+ ADD</button>
              </div>
              {selectedProduct && (
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.72rem', marginTop: '8px', color: '#334155' }}>
                  <span>Current stock: <strong>{selectedProduct.stock}</strong> (reorder at {selectedProduct.lowStockLevel})</span>
                  <span>Boss Rap retail price: <strong>{peso(selectedProduct.price)}</strong></span>
                  {priceOnFile !== undefined && (
                    <span>
                      Last price from {selectedSupplier?.name || supInfo.name}: <strong>{peso(priceOnFile)}</strong>{' '}
                      <button type="button" style={linkBtn} onClick={() => setCostPrice(String(priceOnFile))}>use</button>
                    </span>
                  )}
                  {parseFloat(costPrice) > 0 && (() => {
                    const c = parseFloat(costPrice);
                    const profit = selectedProduct.price - c;
                    return (
                      <span style={{ fontWeight: 800, color: profit > 0 ? '#16a34a' : '#dc2626' }}>
                        Profit per unit: {peso(profit)} ({selectedProduct.price > 0 ? ((profit / selectedProduct.price) * 100).toFixed(1) : '0'}% margin)
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Items list with supplier price vs retail vs profit (#3) */}
            <div className="table-container" style={{ marginTop: '12px' }}>
              <table>
                <thead>
                  <tr>
                    <th style={thSm}>PRODUCT</th>
                    <th style={thSm}>QTY</th>
                    <th style={thSm}>SUPPLIER PRICE</th>
                    <th style={thSm}>BOSS RAP RETAIL</th>
                    <th style={thSm}>PROFIT / UNIT</th>
                    <th style={thSm}>LINE COST</th>
                    <th style={thSm}>EXPECTED PROFIT</th>
                    <th style={thSm}></th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>NO ITEMS ADDED YET</td></tr>
                  ) : orderItems.map(it => {
                    const retail = products.find(p => p.id === it.productId)?.price || 0;
                    const profit = retail - it.costPrice;
                    return (
                      <tr key={it.productId}>
                        <td style={{ fontSize: '0.76rem', fontWeight: 700 }}>{it.name}</td>
                        <td><input type="number" min={1} value={it.quantity} onChange={e => updateOrderItem(it.productId, { quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })} style={{ width: '70px', padding: '4px' }} /></td>
                        <td><input type="number" min={0} step="0.01" value={it.costPrice} onChange={e => updateOrderItem(it.productId, { costPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={{ width: '90px', padding: '4px' }} /></td>
                        <td style={{ fontSize: '0.76rem' }}>{peso(retail)}</td>
                        <td style={{ fontSize: '0.76rem', fontWeight: 800, color: profit > 0 ? '#16a34a' : '#dc2626' }}>{peso(profit)}</td>
                        <td style={{ fontSize: '0.76rem' }}>{peso(it.costPrice * it.quantity)}</td>
                        <td style={{ fontSize: '0.76rem', fontWeight: 800, color: profit > 0 ? '#16a34a' : '#dc2626' }}>{peso(profit * it.quantity)}</td>
                        <td><button type="button" className="btn-danger" style={{ fontSize: '0.6rem', padding: '3px 6px' }} onClick={() => setOrderItems(prev => prev.filter(x => x.productId !== it.productId))}>REMOVE</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '2px solid #0f172a', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
                <div><span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', fontWeight: 700 }}>TOTAL ORDER COST (TO SUPPLIER)</span><span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{peso(orderTotals.cost)}</span></div>
                <div><span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', fontWeight: 700 }}>EXPECTED SALES VALUE</span><span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{peso(orderTotals.sales)}</span></div>
                <div><span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', fontWeight: 700 }}>EXPECTED BOSS RAP PROFIT</span><span style={{ fontSize: '1.2rem', fontWeight: 900, color: orderTotals.sales - orderTotals.cost >= 0 ? '#16a34a' : '#dc2626' }}>{peso(orderTotals.sales - orderTotals.cost)}</span></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', margin: 0, cursor: 'pointer' }} title="Remember these prices in the supplier's price list">
                  <input type="checkbox" checked={savePricesToList} onChange={e => setSavePricesToList(e.target.checked)} style={{ width: 'auto', margin: 0 }} />
                  Save prices to supplier price list
                </label>
                <button type="button" className="btn-primary" disabled={creating} onClick={handleCreatePO}>
                  {creating ? 'SAVING...' : isDirectPO ? 'SAVE & RECEIVE NOW' : 'CREATE PURCHASE ORDER'}
                </button>
                <button type="button" className="btn" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================ RECEIVE MODAL ============================ */}
      {receivingPO && (() => {
        const po = receivingPO;
        const calc = po.items.map((it, idx) => computeLine(it, receiveLines[idx]));
        const previewPayable = computePayable({ ...po, items: po.items.map((it, i) => ({ ...it, receivedQty: (it.receivedQty || 0) + calc[i].toStock })) });
        return (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal" style={{ maxWidth: '900px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>RECEIVE DELIVERY — {po.id}</h3>
                <button type="button" className="btn" style={{ padding: '4px 8px' }} disabled={receiving} onClick={() => setReceivingPO(null)}><X size={16} /></button>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 12px 0' }}>
                Supplier: <strong>{po.supplierName}</strong>. Enter what physically arrived. Good units up to the ordered qty are stocked;
                damaged units go to <strong>Bad Orders (Damaged)</strong>; units beyond the ordered qty go to <strong>Bad Orders (Excess)</strong>.
              </p>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={thSm}>PRODUCT</th>
                      <th style={thSm}>ORDERED</th>
                      <th style={thSm}>ALREADY RECEIVED</th>
                      <th style={thSm}>STILL EXPECTED</th>
                      <th style={thSm}>ARRIVED NOW</th>
                      <th style={thSm}>OF WHICH DAMAGED</th>
                      <th style={thSm}>RESULT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((it, idx) => {
                      const c = calc[idx];
                      const line = receiveLines[idx] || { delivered: '0', damaged: '0' };
                      return (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.76rem', fontWeight: 700 }}>{it.name}<div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>@ {peso(it.costPrice)}</div></td>
                          <td style={{ fontWeight: 800 }}>{it.quantity}</td>
                          <td>{it.receivedQty || 0}</td>
                          <td style={{ fontWeight: 800, color: c.remaining > 0 ? '#d97706' : '#16a34a' }}>{c.remaining}</td>
                          <td><input type="number" min={0} value={line.delivered} onChange={e => setReceiveLines(prev => ({ ...prev, [idx]: { ...line, delivered: e.target.value } }))} style={{ width: '80px', padding: '4px' }} /></td>
                          <td><input type="number" min={0} value={line.damaged} onChange={e => setReceiveLines(prev => ({ ...prev, [idx]: { ...line, damaged: e.target.value } }))} style={{ width: '70px', padding: '4px' }} /></td>
                          <td style={{ fontSize: '0.7rem', lineHeight: 1.5 }}>
                            <div style={{ color: '#16a34a', fontWeight: 700 }}>+{c.toStock} to stock</div>
                            {c.damaged > 0 && <div style={{ color: '#dc2626', fontWeight: 700 }}>{c.damaged} damaged → Bad Order</div>}
                            {c.excess > 0 && <div style={{ color: '#7c3aed', fontWeight: 700 }}>{c.excess} excess → Bad Order</div>}
                            {c.toStock < c.remaining && <div style={{ color: '#d97706' }}>{c.remaining - c.toStock} still to follow</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', fontWeight: 700 }}>AMOUNT PAYABLE AFTER THIS DELIVERY</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{peso(previewPayable)}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}> of {peso(po.totalCost)} ordered — pay only for good items received</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn" disabled={receiving} onClick={() => setReceivingPO(null)}>CANCEL</button>
                  <button type="button" className="btn-primary" disabled={receiving} onClick={handleConfirmReceive} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                    {receiving ? 'SAVING...' : 'CONFIRM RECEIVING'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================ VIEW PO MODAL ============================ */}
      {viewPO && (() => {
        const po = purchaseOrders.find(p => p.id === viewPO.id) || viewPO;
        const related = badOrders.filter(b => b.purchaseOrderId === po.id);
        const totals = po.items.reduce((acc, it) => {
          const retail = products.find(p => p.id === it.productId)?.price || 0;
          acc.cost += it.costPrice * it.quantity;
          acc.sales += retail * it.quantity;
          return acc;
        }, { cost: 0, sales: 0 });
        return (
          <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setViewPO(null)}>
            <div className="modal" style={{ maxWidth: '880px', width: '96%', maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{po.id} {po.poType === 'DIRECT' && <span className="badge badge-blue">DIRECT PO</span>}</h3>
                <button type="button" className="btn" style={{ padding: '4px 8px' }} onClick={() => setViewPO(null)}><X size={16} /></button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', margin: '6px 0 12px' }}>
                Supplier: <strong>{po.supplierName}</strong> • Ordered {new Date(po.dateOrdered).toLocaleString()} • Status: <strong>{po.status}</strong>
                {(po.supplierContact || po.supplierPhone || po.supplierAddress || po.deliveryDays !== undefined) && (
                  <div style={{ marginTop: '4px' }}>
                    {po.supplierContact && <>Contact: <strong>{po.supplierContact}</strong> • </>}
                    {po.supplierPhone && <>Phone: <strong>{po.supplierPhone}</strong> • </>}
                    {po.supplierAddress && <>Address: <strong>{po.supplierAddress}</strong> • </>}
                    {po.deliveryDays !== undefined && <>Delivery: <strong>{po.deliveryDays} day(s)</strong></>}
                    {po.expectedDelivery && <> • Expected: <strong>{new Date(po.expectedDelivery).toLocaleDateString()}</strong></>}
                  </div>
                )}
                {po.notes && <div style={{ marginTop: '4px' }}>Notes: {po.notes}</div>}
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={thSm}>PRODUCT</th>
                      <th style={thSm}>ORDERED</th>
                      <th style={thSm}>RECEIVED</th>
                      <th style={thSm}>DMG / EXCESS</th>
                      <th style={thSm}>SUPPLIER PRICE</th>
                      <th style={thSm}>RETAIL</th>
                      <th style={thSm}>PROFIT / UNIT</th>
                      <th style={thSm}>PAYABLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((it, idx) => {
                      const retail = products.find(p => p.id === it.productId)?.price || 0;
                      const rec = Math.min(it.receivedQty || 0, it.quantity);
                      return (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.76rem', fontWeight: 700 }}>{it.name}</td>
                          <td>{it.quantity}</td>
                          <td style={{ fontWeight: 800, color: rec >= it.quantity ? '#16a34a' : '#d97706' }}>{rec}</td>
                          <td style={{ fontSize: '0.72rem' }}>{it.damagedQty || 0} / {it.excessQty || 0}</td>
                          <td>{peso(it.costPrice)}</td>
                          <td>{retail ? peso(retail) : '—'}</td>
                          <td style={{ fontWeight: 800, color: retail - it.costPrice > 0 ? '#16a34a' : '#dc2626' }}>{retail ? peso(retail - it.costPrice) : '—'}</td>
                          <td style={{ fontWeight: 800 }}>{peso(rec * it.costPrice)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', marginTop: '12px', fontSize: '0.8rem' }}>
                <div>Order cost: <strong>{peso(totals.cost)}</strong></div>
                <div>Expected sales: <strong>{peso(totals.sales)}</strong></div>
                <div>Expected profit: <strong style={{ color: '#16a34a' }}>{peso(totals.sales - totals.cost)}</strong></div>
                <div>Amount payable: <strong>{peso(po.amountPayable || 0)}</strong></div>
              </div>
              {related.length > 0 && (
                <div style={{ marginTop: '14px' }}>
                  <strong style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={14} color="#dc2626" /> BAD ORDERS FROM THIS PO</strong>
                  {related.map(b => (
                    <div key={b.id} style={{ fontSize: '0.75rem', borderBottom: '1px solid #f1f5f9', padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{b.type === 'DAMAGED' ? 'Damaged' : 'Excess'}: {b.quantity} x {b.productName}</span>
                      <span style={{ fontWeight: 700 }}>{STATUS_LABEL[b.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ============================ SUPPLIER FORM MODAL ============================ */}
      {supplierForm && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '520px', width: '94%' }}>
            <h3 style={{ marginTop: 0 }}>{supplierForm.id ? 'EDIT SUPPLIER' : 'ADD SUPPLIER'}</h3>
            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>SUPPLIER / COMPANY NAME *</label>
                <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} placeholder="e.g. MOTO DISTRIBUTORS INC." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>CONTACT PERSON</label>
                  <input type="text" value={supplierForm.contactPerson || ''} onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>PHONE</label>
                  <input type="tel" value={supplierForm.phone || ''} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input type="email" value={supplierForm.email || ''} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>ADDRESS</label>
                <input type="text" value={supplierForm.address || ''} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>DELIVERY TIME TO BOSS RAP (DAYS)</label>
                <input type="number" min="0" step="1" placeholder="e.g. 3" value={supplierForm.deliveryDays ?? ''} onChange={e => setSupplierForm({ ...supplierForm, deliveryDays: e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0) })} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="btn" onClick={() => setSupplierForm(null)}>CANCEL</button>
                <button type="submit" className="btn-primary">SAVE SUPPLIER</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================ SUPPLIER PRICE LIST MODAL ============================ */}
      {priceListSupplier && (() => {
        const links = productSuppliers.filter(ps => ps.supplierId === priceListSupplier.id);
        const available = products.filter(p => !links.some(l => l.productId === p.id));
        return (
          <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setPriceListSupplier(null)}>
            <div className="modal" style={{ maxWidth: '880px', width: '96%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>PRODUCTS SUPPLIED BY {priceListSupplier.name}</h3>
                <button type="button" className="btn" style={{ padding: '4px 8px' }} onClick={() => setPriceListSupplier(null)}><X size={16} /></button>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '6px 0 12px' }}>
                Supplier price = what Boss Rap pays this supplier. Profit = Boss Rap retail price − supplier price.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px', alignItems: 'flex-end', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>PRODUCT</label>
                  <select value={plProductId} onChange={e => setPlProductId(e.target.value)} style={{ fontSize: '0.78rem' }}>
                    <option value="">-- SELECT PRODUCT --</option>
                    {available.map(p => <option key={p.id} value={p.id}>{p.name} (Retail ₱{p.price})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>SUPPLIER PRICE (₱)</label>
                  <input type="number" min={0} step="0.01" value={plPrice} onChange={e => setPlPrice(e.target.value)} placeholder="Enter price" />
                </div>
                <button type="button" className="btn-primary" onClick={handleAddPriceListItem} style={{ height: '38px' }}>+ ADD</button>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={thSm}>PRODUCT</th>
                      <th style={thSm}>STOCK</th>
                      <th style={thSm}>SUPPLIER PRICE</th>
                      <th style={thSm}>BOSS RAP RETAIL</th>
                      <th style={thSm}>PROFIT / UNIT</th>
                      <th style={thSm}>MARGIN</th>
                      <th style={thSm}>UPDATED</th>
                      <th style={thSm}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>No products linked yet.</td></tr>
                    ) : links.map(l => {
                      const p = products.find(pr => pr.id === l.productId);
                      if (!p) return null;
                      const editVal = plEdits[l.productId];
                      const price = editVal !== undefined ? parseFloat(editVal) || 0 : l.supplierPrice;
                      const profit = p.price - price;
                      return (
                        <tr key={l.productId}>
                          <td style={{ fontSize: '0.76rem', fontWeight: 700 }}>{p.name}</td>
                          <td style={{ color: p.stock <= p.lowStockLevel ? '#dc2626' : '#0f172a', fontWeight: 700 }}>{p.stock}</td>
                          <td>
                            <input
                              type="number" min={0} step="0.01"
                              value={editVal !== undefined ? editVal : String(l.supplierPrice)}
                              onChange={e => setPlEdits(prev => ({ ...prev, [l.productId]: e.target.value }))}
                              onBlur={async () => {
                                if (editVal === undefined) return;
                                const v = parseFloat(editVal);
                                if (v > 0 && v !== l.supplierPrice) await saveProductSupplier({ ...l, supplierPrice: v });
                                setPlEdits(prev => { const n = { ...prev }; delete n[l.productId]; return n; });
                              }}
                              style={{ width: '100px', padding: '4px' }}
                            />
                          </td>
                          <td>{peso(p.price)}</td>
                          <td style={{ fontWeight: 800, color: profit > 0 ? '#16a34a' : '#dc2626' }}>{peso(profit)}</td>
                          <td style={{ fontSize: '0.75rem' }}>{p.price > 0 ? `${((profit / p.price) * 100).toFixed(1)}%` : '—'}</td>
                          <td style={{ fontSize: '0.68rem', color: '#64748b' }}>{l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '—'}</td>
                          <td><button type="button" className="btn-danger" style={{ fontSize: '0.6rem', padding: '3px 6px' }} onClick={() => removeProductSupplier(l.supplierId, l.productId)}>REMOVE</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @media (max-width: 700px) {
          .builder-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
