import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Sale } from '../context/AppContext';
import { PaginationControls } from '../components/PaginationControls';
import { Printer, Download, AlertTriangle } from 'lucide-react';

// ------------------------------------------------------------------
// Sales Report (#14)
// - Counts only PAID / settled sales (unpaid pickup / unverified bank orders listed separately)
// - Gross sales, promo discounts, points redeemed, delivery fees, net sales
// - Cost of goods (from supplier prices / PO costs) and gross profit
// - Breakdown by day, payment method, channel and product
// - Printable and exportable to CSV (Excel)
// ------------------------------------------------------------------

type RangeType = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

const peso = (n: number) => `₱${(Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const channelLabel = (s: Sale) => {
  if (s.channel !== 'ONLINE/FACEBOOK') return 'WALK-IN (POS)';
  return s.fulfillmentType === 'DELIVERY' ? 'ONLINE – DELIVERY' : 'ONLINE – STORE PICKUP';
};

/** A sale is counted as revenue once it is paid (completed or payment confirmed). */
const isSettled = (s: Sale) => s.orderStatus === 'COMPLETED' || Boolean(s.paymentVerified);

export const Reports: React.FC = () => {
  const { sales, products, members, purchaseOrders, productSuppliers } = useAppContext();

  const [filterType, setFilterType] = useState<RangeType>('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [journalPage, setJournalPage] = useState(1);
  const [journalPageSize, setJournalPageSize] = useState(10);

  // ---------------- Date range ----------------
  const range = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    switch (filterType) {
      case 'TODAY': return { start: todayStart, end: todayStart + dayMs - 1, label: `Today (${new Date(todayStart).toLocaleDateString()})` };
      case 'YESTERDAY': return { start: todayStart - dayMs, end: todayStart - 1, label: `Yesterday (${new Date(todayStart - dayMs).toLocaleDateString()})` };
      case 'WEEK': return { start: todayStart - 6 * dayMs, end: todayStart + dayMs - 1, label: 'Last 7 days' };
      case 'MONTH': {
        const s = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
        return { start: s, end: todayStart + dayMs - 1, label: today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) };
      }
      case 'YEAR': return { start: new Date(today.getFullYear(), 0, 1).getTime(), end: todayStart + dayMs - 1, label: `Year ${today.getFullYear()}` };
      case 'CUSTOM': {
        const s = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;
        const e = endDate ? new Date(endDate + 'T23:59:59').getTime() : todayStart + dayMs - 1;
        return { start: s, end: e, label: `${startDate || 'Beginning'} to ${endDate || 'Today'}` };
      }
    }
  }, [filterType, startDate, endDate]);

  const inRange = sales
    .filter(s => {
      const t = new Date(s.date).getTime();
      return t >= range.start && t <= range.end;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const settled = inRange.filter(isSettled);
  const unsettled = inRange.filter(s => !isSettled(s));

  // ---------------- Unit cost lookup ----------------
  // Latest supplier price on file, else latest PO cost for that product.
  const unitCostOf = useMemo(() => {
    const map: Record<string, number> = {};
    const stamp: Record<string, number> = {};
    purchaseOrders
      .filter(po => po.status !== 'CANCELLED')
      .forEach(po => {
        const t = new Date(po.dateOrdered).getTime();
        po.items.forEach(it => {
          if (!it.productId || !it.costPrice) return;
          if (stamp[it.productId] === undefined || t > stamp[it.productId]) {
            stamp[it.productId] = t;
            map[it.productId] = it.costPrice;
          }
        });
      });
    productSuppliers.forEach(ps => {
      const t = ps.updatedAt ? new Date(ps.updatedAt).getTime() : 0;
      if (stamp[ps.productId] === undefined || t >= stamp[ps.productId]) {
        stamp[ps.productId] = t;
        map[ps.productId] = ps.supplierPrice;
      }
    });
    return (productId: string) => map[productId];
  }, [purchaseOrders, productSuppliers]);

  // ---------------- Totals ----------------
  let grossSales = 0, promoDiscounts = 0, pointsRedeemed = 0, pointsRedeemedPts = 0, deliveryFees = 0, netSales = 0, cogs = 0, unitsSold = 0;
  let missingCostUnits = 0;
  const productAgg: Record<string, { name: string; qty: number; sales: number; cost: number; hasCost: boolean }> = {};
  const methodAgg: Record<string, { count: number; amount: number }> = {};
  const channelAgg: Record<string, { count: number; amount: number }> = {};
  const dailyAgg: Record<string, { count: number; gross: number; discounts: number; net: number; cost: number }> = {};

  settled.forEach(s => {
    const fee = s.fulfillmentType === 'DELIVERY' ? (s.deliveryFee || 0) : 0;
    const pts = s.pointsDiscount || 0;
    grossSales += s.subtotal;
    promoDiscounts += s.discountApplied || 0;
    pointsRedeemed += pts;
    pointsRedeemedPts += s.pointsRedeemed || 0;
    deliveryFees += fee;
    netSales += s.total;

    let saleCost = 0;
    s.items.forEach(it => {
      unitsSold += it.quantity;
      const uc = unitCostOf(it.productId);
      const lineCost = uc !== undefined ? uc * it.quantity : 0;
      if (uc === undefined) missingCostUnits += it.quantity;
      saleCost += lineCost;
      const key = it.productId || it.name;
      if (!productAgg[key]) productAgg[key] = { name: it.name, qty: 0, sales: 0, cost: 0, hasCost: uc !== undefined };
      productAgg[key].qty += it.quantity;
      productAgg[key].sales += it.price * it.quantity;
      productAgg[key].cost += lineCost;
      if (uc === undefined) productAgg[key].hasCost = false;
    });
    cogs += saleCost;

    const m = s.paymentMethod;
    methodAgg[m] = methodAgg[m] || { count: 0, amount: 0 };
    methodAgg[m].count += 1;
    methodAgg[m].amount += s.total;

    const c = channelLabel(s);
    channelAgg[c] = channelAgg[c] || { count: 0, amount: 0 };
    channelAgg[c].count += 1;
    channelAgg[c].amount += s.total;

    const d = dayKey(s.date);
    dailyAgg[d] = dailyAgg[d] || { count: 0, gross: 0, discounts: 0, net: 0, cost: 0 };
    dailyAgg[d].count += 1;
    dailyAgg[d].gross += s.subtotal;
    dailyAgg[d].discounts += (s.discountApplied || 0) + pts;
    dailyAgg[d].net += s.total;
    dailyAgg[d].cost += saleCost;
  });

  const merchandiseNet = netSales - deliveryFees;
  const grossProfit = merchandiseNet - cogs;
  const txCount = settled.length;
  const avgTicket = txCount ? netSales / txCount : 0;

  const productRows = Object.values(productAgg).sort((a, b) => b.sales - a.sales);
  const dailyRows = Object.entries(dailyAgg).sort((a, b) => b[0].localeCompare(a[0]));
  const soldIds = new Set(settled.flatMap(s => s.items.map(i => i.productId)));
  const slowMoving = products.filter(p => !soldIds.has(p.id));

  // Top members
  const memberAgg: Record<string, { name: string; total: number; count: number }> = {};
  settled.forEach(s => {
    if (!s.memberId) return;
    const name = members.find(m => m.id === s.memberId)?.name || s.customerName || s.memberId;
    memberAgg[s.memberId] = memberAgg[s.memberId] || { name, total: 0, count: 0 };
    memberAgg[s.memberId].total += s.total;
    memberAgg[s.memberId].count += 1;
  });
  const topMembers = Object.entries(memberAgg).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  const journal = settled.slice((journalPage - 1) * journalPageSize, journalPage * journalPageSize);

  // ---------------- Export CSV ----------------
  const exportCsv = () => {
    const esc = (v: unknown) => {
      const str = String(v ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const lines: string[] = [];
    lines.push('BOSS RAP MOTOR SHOP - SALES REPORT');
    lines.push(`Period,${esc(range.label)}`);
    lines.push(`Generated,${esc(new Date().toLocaleString())}`);
    lines.push('');
    lines.push('SUMMARY');
    lines.push(`Transactions,${txCount}`);
    lines.push(`Units Sold,${unitsSold}`);
    lines.push(`Gross Sales,${grossSales.toFixed(2)}`);
    lines.push(`Promo Discounts,${promoDiscounts.toFixed(2)}`);
    lines.push(`Points Redeemed,${pointsRedeemed.toFixed(2)}`);
    lines.push(`Delivery Fees,${deliveryFees.toFixed(2)}`);
    lines.push(`Net Sales (Collected),${netSales.toFixed(2)}`);
    lines.push(`Cost of Goods Sold,${cogs.toFixed(2)}`);
    lines.push(`Gross Profit,${grossProfit.toFixed(2)}`);
    lines.push('');
    lines.push('TRANSACTIONS');
    lines.push('Sale ID,Date,Channel,Customer,Payment Method,Reference,Subtotal,Promo Discount,Points Redeemed,Delivery Fee,Total,Items');
    settled.forEach(s => {
      lines.push([
        s.id,
        new Date(s.date).toLocaleString(),
        channelLabel(s),
        s.customerName || s.memberId || 'Walk-in',
        s.paymentMethod,
        s.paymentRef || '',
        s.subtotal.toFixed(2),
        (s.discountApplied || 0).toFixed(2),
        (s.pointsDiscount || 0).toFixed(2),
        (s.fulfillmentType === 'DELIVERY' ? s.deliveryFee || 0 : 0).toFixed(2),
        s.total.toFixed(2),
        s.items.map(i => `${i.name} x${i.quantity}`).join('; ')
      ].map(esc).join(','));
    });
    lines.push('');
    lines.push('PRODUCT SALES');
    lines.push('Product,Qty Sold,Sales,Cost,Profit');
    productRows.forEach(p => lines.push([p.name, p.qty, p.sales.toFixed(2), p.hasCost ? p.cost.toFixed(2) : 'N/A', p.hasCost ? (p.sales - p.cost).toFixed(2) : 'N/A'].map(esc).join(',')));

    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BossRap_Sales_Report_${filterType}_${dayKey(new Date().toISOString())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpi = (label: string, value: string, sub?: string, color = '#0f172a') => (
    <div className="card report-kpi" style={{ padding: '14px' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 900, color, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }} id="sales-report-print">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Sales Report</h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0' }}>
            Boss Rap Motor Shop • Period: <strong>{range.label}</strong> • Generated {new Date().toLocaleString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }} className="no-print">
          <button type="button" className="btn" onClick={exportCsv} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} /> EXPORT CSV / EXCEL
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={15} /> PRINT REPORT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card no-print" style={{ padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as RangeType[]).map(t => (
            <button key={t} type="button" className={filterType === t ? 'btn-primary' : 'btn'} style={{ fontSize: '0.7rem', padding: '6px 10px' }} onClick={() => { setFilterType(t); setJournalPage(1); }}>
              {t === 'WEEK' ? 'LAST 7 DAYS' : t === 'MONTH' ? 'THIS MONTH' : t === 'YEAR' ? 'THIS YEAR' : t}
            </button>
          ))}
        </div>
        {filterType === 'CUSTOM' && (
          <>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block' }}>FROM</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setJournalPage(1); }} style={{ margin: 0 }} />
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, display: 'block' }}>TO</label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setJournalPage(1); }} style={{ margin: 0 }} />
            </div>
          </>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {kpi('GROSS SALES', peso(grossSales), `${unitsSold} unit(s) sold`)}
        {kpi('PROMO DISCOUNTS', `-${peso(promoDiscounts)}`, undefined, '#16a34a')}
        {kpi('POINTS REDEEMED', `-${peso(pointsRedeemed)}`, `${pointsRedeemedPts} pts used`, '#a16207')}
        {kpi('DELIVERY FEES', peso(deliveryFees))}
        {kpi('NET SALES (COLLECTED)', peso(netSales), `${txCount} paid transaction(s) • avg ${peso(avgTicket)}`, '#2563eb')}
        {kpi('COST OF GOODS SOLD', peso(cogs), 'Based on supplier prices')}
        {kpi('GROSS PROFIT', peso(grossProfit), merchandiseNet > 0 ? `${((grossProfit / merchandiseNet) * 100).toFixed(1)}% margin` : undefined, grossProfit >= 0 ? '#16a34a' : '#dc2626')}
      </div>

      {(unsettled.length > 0 || missingCostUnits > 0) && (
        <div className="card" style={{ padding: '10px 14px', marginBottom: '16px', fontSize: '0.76rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            {unsettled.length > 0 && (
              <div><strong>{unsettled.length}</strong> unpaid / pending order(s) worth <strong>{peso(unsettled.reduce((s, x) => s + x.total, 0))}</strong> are NOT counted yet (e.g. cash-on-pickup orders not yet claimed).</div>
            )}
            {missingCostUnits > 0 && (
              <div><strong>{missingCostUnits}</strong> unit(s) sold have no supplier price on file, so their cost is not included. Add the price in Purchase Orders → Suppliers.</div>
            )}
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="report-grid">
        <div className="card" style={{ padding: '14px' }}>
          <h4 style={{ margin: '0 0 8px' }}>BY PAYMENT METHOD</h4>
          <table>
            <thead><tr><th>METHOD</th><th>TRANSACTIONS</th><th>AMOUNT</th><th>SHARE</th></tr></thead>
            <tbody>
              {Object.keys(methodAgg).length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No paid sales in this period</td></tr>
              ) : Object.entries(methodAgg).sort((a, b) => b[1].amount - a[1].amount).map(([m, v]) => (
                <tr key={m}><td style={{ fontWeight: 700 }}>{m}</td><td>{v.count}</td><td style={{ fontWeight: 800 }}>{peso(v.amount)}</td><td>{netSales ? ((v.amount / netSales) * 100).toFixed(1) : '0'}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <h4 style={{ margin: '0 0 8px' }}>BY SALES CHANNEL</h4>
          <table>
            <thead><tr><th>CHANNEL</th><th>TRANSACTIONS</th><th>AMOUNT</th><th>SHARE</th></tr></thead>
            <tbody>
              {Object.keys(channelAgg).length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No paid sales in this period</td></tr>
              ) : Object.entries(channelAgg).sort((a, b) => b[1].amount - a[1].amount).map(([c, v]) => (
                <tr key={c}><td style={{ fontWeight: 700 }}>{c}</td><td>{v.count}</td><td style={{ fontWeight: 800 }}>{peso(v.amount)}</td><td>{netSales ? ((v.amount / netSales) * 100).toFixed(1) : '0'}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily summary */}
      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px' }}>DAILY SALES SUMMARY</h4>
        <div className="table-container">
          <table>
            <thead><tr><th>DATE</th><th>TRANSACTIONS</th><th>GROSS SALES</th><th>DISCOUNTS & POINTS</th><th>NET SALES</th><th>COST</th><th>PROFIT</th></tr></thead>
            <tbody>
              {dailyRows.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8' }}>No paid sales in this period</td></tr>
              ) : dailyRows.map(([d, v]) => (
                <tr key={d}>
                  <td style={{ fontWeight: 700 }}>{new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{v.count}</td>
                  <td>{peso(v.gross)}</td>
                  <td style={{ color: '#16a34a' }}>-{peso(v.discounts)}</td>
                  <td style={{ fontWeight: 800 }}>{peso(v.net)}</td>
                  <td>{peso(v.cost)}</td>
                  <td style={{ fontWeight: 800, color: '#16a34a' }}>{peso(v.net - v.cost)}</td>
                </tr>
              ))}
              {dailyRows.length > 0 && (
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ fontWeight: 900 }}>TOTAL</td>
                  <td style={{ fontWeight: 900 }}>{txCount}</td>
                  <td style={{ fontWeight: 900 }}>{peso(grossSales)}</td>
                  <td style={{ fontWeight: 900, color: '#16a34a' }}>-{peso(promoDiscounts + pointsRedeemed)}</td>
                  <td style={{ fontWeight: 900 }}>{peso(netSales)}</td>
                  <td style={{ fontWeight: 900 }}>{peso(cogs)}</td>
                  <td style={{ fontWeight: 900, color: '#16a34a' }}>{peso(netSales - cogs)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product sales */}
      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px' }}>SALES BY PRODUCT (BEST SELLERS FIRST)</h4>
        <div className="table-container">
          <table>
            <thead><tr><th>#</th><th>PRODUCT</th><th>QTY SOLD</th><th>SALES</th><th>COST</th><th>PROFIT</th></tr></thead>
            <tbody>
              {productRows.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>No products sold in this period</td></tr>
              ) : productRows.map((p, i) => (
                <tr key={p.name + i}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td>{p.qty}</td>
                  <td style={{ fontWeight: 800 }}>{peso(p.sales)}</td>
                  <td>{p.hasCost ? peso(p.cost) : <span style={{ color: '#d97706', fontSize: '0.72rem' }}>no supplier price</span>}</td>
                  <td style={{ fontWeight: 800, color: '#16a34a' }}>{p.hasCost ? peso(p.sales - p.cost) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {slowMoving.length > 0 && (
          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '8px 0 0' }}>
            <strong>No sales in this period ({slowMoving.length}):</strong> {slowMoving.slice(0, 12).map(p => p.name).join(', ')}{slowMoving.length > 12 ? '…' : ''}
          </p>
        )}
      </div>

      {/* Journal */}
      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px' }}>PAID TRANSACTIONS (MOST RECENT FIRST)</h4>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>SALE ID</th><th>DATE</th><th>CHANNEL</th><th>CUSTOMER</th><th>ITEMS</th><th>METHOD</th><th>DISCOUNT</th><th>POINTS</th><th>TOTAL</th></tr>
            </thead>
            <tbody>
              {journal.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#94a3b8' }}>No paid transactions in this period</td></tr>
              ) : journal.map(s => (
                <tr key={s.id}>
                  <td><code>{s.id}</code></td>
                  <td style={{ fontSize: '0.72rem' }}>{new Date(s.date).toLocaleString()}</td>
                  <td style={{ fontSize: '0.72rem' }}>{channelLabel(s)}</td>
                  <td style={{ fontSize: '0.75rem' }}>{s.customerName || (s.memberId ? members.find(m => m.id === s.memberId)?.name || s.memberId : 'Walk-in')}</td>
                  <td style={{ fontSize: '0.72rem', maxWidth: '240px' }}>{s.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
                  <td style={{ fontSize: '0.72rem' }}>{s.paymentMethod}{s.paymentRef ? <div style={{ color: '#64748b' }}>{s.paymentRef}</div> : null}</td>
                  <td style={{ color: '#16a34a' }}>{s.discountApplied ? `-${peso(s.discountApplied)}` : '—'}</td>
                  <td style={{ color: '#a16207' }}>{s.pointsDiscount ? `-${peso(s.pointsDiscount)}` : '—'}</td>
                  <td style={{ fontWeight: 800 }}>{peso(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="no-print">
          <PaginationControls
            currentPage={journalPage}
            totalItems={settled.length}
            pageSize={journalPageSize}
            onPageChange={setJournalPage}
            onPageSizeChange={size => { setJournalPageSize(size); setJournalPage(1); }}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="transactions"
          />
        </div>
      </div>

      {/* Top members */}
      <div className="card" style={{ padding: '14px' }}>
        <h4 style={{ margin: '0 0 8px' }}>TOP MEMBER CUSTOMERS</h4>
        <table>
          <thead><tr><th>RANK</th><th>MEMBER ID</th><th>NAME</th><th>TRANSACTIONS</th><th>TOTAL SPEND</th></tr></thead>
          <tbody>
            {topMembers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No member purchases in this period</td></tr>
            ) : topMembers.map(([id, v], i) => (
              <tr key={id}><td style={{ fontWeight: 800 }}>#{i + 1}</td><td>{id}</td><td>{v.name}</td><td>{v.count}</td><td style={{ fontWeight: 800 }}>{peso(v.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sales-report-print, #sales-report-print * { visibility: visible; }
          #sales-report-print { position: absolute; left: 0; top: 0; width: 100%; color: #000; background: #fff; }
          #sales-report-print .no-print { display: none !important; }
          #sales-report-print .card { box-shadow: none !important; border: 1px solid #999 !important; break-inside: avoid; }
          #sales-report-print .table-container { overflow: visible !important; max-height: none !important; }
        }
        @media (max-width: 900px) {
          .report-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
