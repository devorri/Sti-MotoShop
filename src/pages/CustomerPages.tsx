import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { Sale, ReturnRequest } from '../context/AppContext';
import {
  ShoppingBag,
  ClipboardList,
  Package,
  Printer,
  X,
  Award,
  RotateCcw,
  Sparkles,
  Send
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const {
    currentUser,
    members,
    sales,
    pointsSettings,
    returnRequests,
    saveReturnRequest
  } = useAppContext();

  const navigate = useNavigate();

  // Find membership profile strictly for current user
  const profile = members.find(m => m.id === currentUser?.memberId);

  // Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'RETURNS'>('OVERVIEW');

  // Modals
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnType, setReturnType] = useState<'RETURN' | 'REPLACE'>('REPLACE');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // BUG FIX: Strictly filter orders by current user's memberId without 'M001' fallback!
  const customerMemberId = currentUser?.memberId;
  const customerOrders = customerMemberId
    ? sales
        .filter(s => s.memberId === customerMemberId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Customer returns
  const customerReturns = customerMemberId
    ? returnRequests.filter(r => r.memberId === customerMemberId)
    : [];

  const points = profile ? profile.points : 0;
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.total, 0);

  // Calculate membership tier
  const getTier = (pts: number) => {
    if (pts >= 500) return { name: 'PLATINUM RIDER', color: '#8b5cf6', next: null, progress: 100 };
    if (pts >= 250) return { name: 'GOLD RIDER', color: '#eab308', next: 500, progress: (pts / 500) * 100 };
    if (pts >= 100) return { name: 'SILVER RIDER', color: '#0ea5e9', next: 250, progress: (pts / 250) * 100 };
    return { name: 'BRONZE MEMBER', color: '#f97316', next: 100, progress: (pts / 100) * 100 };
  };

  const tier = getTier(points);

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalSale || !customerMemberId) return;
    if (!returnReason.trim()) {
      alert('Please specify the reason for the claim.');
      return;
    }

    setSubmittingReturn(true);
    const newRequest: ReturnRequest = {
      id: `RET-${Date.now().toString().slice(-6)}`,
      saleId: returnModalSale.id,
      memberId: customerMemberId,
      items: returnModalSale.items,
      reason: returnReason.trim(),
      type: returnType,
      status: 'PENDING',
      date: new Date().toISOString()
    };

    const success = await saveReturnRequest(newRequest);
    setSubmittingReturn(false);
    if (success) {
      alert('Your return/replacement claim has been submitted for admin review!');
      setReturnModalSale(null);
      setReturnReason('');
      setActiveTab('RETURNS');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', width: '100%' }}>
      {/* Top Welcome Banner */}
      <div className="card" style={{
        backgroundColor: '#ffffff',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-green">MEMBER DASHBOARD</span>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Member ID: {currentUser?.memberId || 'N/A'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', color: '#0f172a', margin: '4px 0', fontWeight: 800 }}>
            Welcome back, {currentUser?.name}!
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Boss Rap Motor Shop Rider Club Portal • Track Orders & Loyalty Rewards
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <ShoppingBag size={15} />
            <span>Store Catalog</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Points Card */}
        <div className="card" style={{ padding: '20px', borderLeft: `5px solid ${tier.color}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              REWARD POINTS
            </span>
            <Sparkles size={18} color={tier.color} />
          </div>
          <h2 style={{ fontSize: '2rem', margin: '8px 0 4px', color: '#0f172a', fontWeight: 900 }}>
            {points} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>PTS</span>
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '6px' }}>
            <span>Tier: <strong style={{ color: tier.color }}>{tier.name}</strong></span>
            {tier.next && <span>Next: {tier.next} pts</span>}
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, tier.progress)}%`, height: '100%', backgroundColor: tier.color, borderRadius: '4px' }} />
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              MY TOTAL ORDERS
            </span>
            <ClipboardList size={18} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: '2rem', margin: '8px 0 4px', color: '#2563eb', fontWeight: 900 }}>
            {customerOrders.length}
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {customerOrders.filter(o => o.orderStatus !== 'COMPLETED').length} Active / In Progress
          </span>
        </div>

        {/* Total Purchases Card */}
        <div className="card" style={{ padding: '20px', borderLeft: '5px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              TOTAL PURCHASED
            </span>
            <Award size={18} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '2rem', margin: '8px 0 4px', color: '#16a34a', fontWeight: 900 }}>
            ₱{totalSpent.toLocaleString()}
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Lifetime Store Spend
          </span>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          style={{
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'OVERVIEW' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'OVERVIEW' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Club Overview & Points
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ORDERS')}
          style={{
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ORDERS' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'ORDERS' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          My Orders ({customerOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RETURNS')}
          style={{
            padding: '10px 18px',
            fontSize: '0.85rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'RETURNS' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'RETURNS' ? '#2563eb' : '#64748b',
            cursor: 'pointer',
            marginBottom: '-2px'
          }}
        >
          Returns & Replacements ({customerReturns.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: '0 0 8px 0' }}>
              How Boss Rap Points Work
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Every time you purchase parts or services with your Club ID (<strong>{currentUser?.memberId || 'N/A'}</strong>), you earn <strong>1 Point</strong> per <strong>₱{pointsSettings.currencyPerPoint}</strong> spent. Points can be redeemed for discounts on upcoming orders.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span className="badge badge-green" style={{ marginBottom: '6px' }}>TIER 1 • BRONZE</span>
                <p style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, margin: '4px 0' }}>0 - 99 Points</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Standard member discounts & free tire gauge checks</span>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>TIER 2 • SILVER</span>
                <p style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, margin: '4px 0' }}>100 - 249 Points</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>5% off labor costs on preventive maintenance</span>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fef08a' }}>
                <span className="badge badge-yellow" style={{ marginBottom: '6px' }}>TIER 3 • GOLD</span>
                <p style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, margin: '4px 0' }}>250 - 499 Points</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Priority queueing at cashier & free oil change labor</span>
              </div>
              <div style={{ padding: '16px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', marginBottom: '6px' }}>TIER 4 • PLATINUM</span>
                <p style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 700, margin: '4px 0' }}>500+ Points</p>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>VIP race tuning consultation & seasonal parts discount</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Preview */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                Recent Purchases (Latest First)
              </h2>
              {customerOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('ORDERS')}
                  className="btn"
                  style={{ fontSize: '0.78rem' }}
                >
                  View All Orders
                </button>
              )}
            </div>

            {customerOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: '#64748b' }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>No orders yet!</p>
                <p style={{ fontSize: '0.82rem', margin: '0 0 16px 0' }}>
                  Browse our catalog and place your first order or visit our Baliuag counter.
                </p>
                <button type="button" onClick={() => navigate('/shop')} className="btn-primary" style={{ padding: '8px 18px' }}>
                  <ShoppingBag size={14} />
                  <span>Start Shopping</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customerOrders.slice(0, 3).map(order => (
                  <div key={order.id} style={{
                    padding: '14px 18px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{order.id}</strong>
                        <span className={`badge ${
                          order.orderStatus === 'COMPLETED' ? 'badge-green' :
                          order.orderStatus === 'READY FOR PICKUP' ? 'badge-blue' : 'badge-yellow'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(order.date).toLocaleDateString()} • {order.items.length} item(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                        ₱{order.total.toLocaleString()}
                      </strong>
                      <button
                        type="button"
                        onClick={() => setActiveReceipt(order)}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Printer size={13} />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Orders List */}
      {activeTab === 'ORDERS' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
              Order History & Tracking
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              Showing {customerOrders.length} order(s) sorted newest first.
            </p>
          </div>

          {customerOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
              <Package size={48} style={{ opacity: 0.25, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '6px' }}>No Orders Found</h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
                You have not placed any orders yet. Visit our catalog to add parts to your cart.
              </p>
              <button type="button" onClick={() => navigate('/shop')} className="btn-primary">
                <ShoppingBag size={15} />
                <span>Browse Store Catalog</span>
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ORDER ID & DATE</th>
                    <th>ITEMS PURCHASED</th>
                    <th>FULFILLMENT</th>
                    <th>PAYMENT</th>
                    <th>TOTAL</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {customerOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>
                          {order.id}
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {order.trackingCode && (
                          <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>
                            {order.trackingCode}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ color: '#334155' }}>
                              • {it.name} × <strong>{it.quantity}</strong> (₱{it.price.toLocaleString()})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${order.fulfillmentType === 'DELIVERY' ? 'badge-blue' : 'badge-yellow'}`}>
                          {order.fulfillmentType || 'STORE PICKUP'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{order.paymentMethod}</div>
                        {order.paymentRef && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Ref: {order.paymentRef}</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>
                          ₱{order.total.toLocaleString()}
                        </strong>
                        {order.discountApplied > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>
                            -₱{order.discountApplied.toLocaleString()} off
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          order.orderStatus === 'COMPLETED' ? 'badge-green' :
                          order.orderStatus === 'READY FOR PICKUP' ? 'badge-blue' :
                          order.orderStatus === 'OUT FOR DELIVERY' ? 'badge-blue' : 'badge-yellow'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(order)}
                            className="btn"
                            style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                            title="Print / View Receipt"
                          >
                            <Printer size={13} />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReturnModalSale(order); setReturnReason(''); }}
                            className="btn"
                            style={{ padding: '5px 8px', fontSize: '0.72rem', color: '#ea580c' }}
                            title="Request Return or Replacement"
                          >
                            <RotateCcw size={13} />
                            <span>Claim</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Returns & Claims */}
      {activeTab === 'RETURNS' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
              My Return & Replacement Claims
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>
              Claims are verified by shop administration for defect or replacement eligibility.
            </p>
          </div>

          {customerReturns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
              <RotateCcw size={40} style={{ opacity: 0.25, marginBottom: '10px' }} />
              <p style={{ fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>No return claims submitted</p>
              <span style={{ fontSize: '0.8rem' }}>
                If you receive a defective part, go to "My Orders" tab and click "Claim" to submit a request.
              </span>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>CLAIM ID & DATE</th>
                    <th>SALE ORDER</th>
                    <th>TYPE</th>
                    <th>REASON</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {customerReturns.map(ret => (
                    <tr key={ret.id}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{ret.id}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(ret.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <code>{ret.saleId}</code>
                      </td>
                      <td>
                        <span className="badge badge-blue">{ret.type}</span>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#334155' }}>{ret.reason}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          ret.status === 'APPROVED' ? 'badge-green' :
                          ret.status === 'REJECTED' ? 'badge-red' : 'badge-yellow'
                        }`}>
                          {ret.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalSale && (
        <div className="modal-overlay" onClick={() => setReturnModalSale(null)}>
          <div className="modal" style={{ maxWidth: '480px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0, fontWeight: 800 }}>
                Submit Return / Replacement Claim
              </h2>
              <button type="button" onClick={() => setReturnModalSale(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px' }}>
              Order Reference: <strong>{returnModalSale.id}</strong> (₱{returnModalSale.total.toLocaleString()})
            </p>

            <form onSubmit={handleCreateReturn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>Claim Type</label>
                <select value={returnType} onChange={e => setReturnType(e.target.value as any)}>
                  <option value="REPLACE">Product Replacement (Defective Item)</option>
                  <option value="RETURN">Return & Refund</option>
                </select>
              </div>

              <div>
                <label>Reason for Claim *</label>
                <textarea
                  rows={3}
                  placeholder="Describe the issue (e.g. incorrect sizing, manufacturer defect, leaking brake fluid)..."
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setReturnModalSale(null)} className="btn" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingReturn} className="btn-primary" style={{ flex: 1 }}>
                  <Send size={14} />
                  <span>{submittingReturn ? 'Submitting...' : 'Submit Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal" style={{ maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div id="receipt-print-area" style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0f172a' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 900 }}>BOSS RAP MOTOR SHOP</h2>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>JP Rizal St., Baliuag, Bulacan</div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>Tel: (0905) 123-4567 • Tax Reg 2008</div>
                <div style={{ borderBottom: '1px dashed #cbd5e1', margin: '8px 0' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>OFFICIAL STORE RECEIPT</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Receipt #: {activeReceipt.id}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Date: {new Date(activeReceipt.date).toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Member ID: {activeReceipt.memberId || 'GUEST'}</div>
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
                  <span>Discount Applied:</span>
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
                <div style={{ marginTop: '8px', fontWeight: 700, color: '#0f172a' }}>
                  THANK YOU FOR SHOPPING AT BOSS RAP!
                </div>
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
