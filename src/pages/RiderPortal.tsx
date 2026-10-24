import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, type Sale } from '../context/AppContext';
import { 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Package, 
  Clock, 
  RefreshCw, 
  LogOut, 
  ExternalLink,
  Navigation,
  ShieldCheck,
  Check,
  Calendar,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { PaymentNotificationBell } from '../components/PaymentNotificationBell';
import { sendOutForDeliverySms, sendDeliveryCompletedSms } from '../services/smsService';

export const RiderPortal: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    sales, 
    syncWithSupabase, 
    updateSaleOrderStatus 
  } = useAppContext();

  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'READY' | 'PREPARING' | 'OUT FOR DELIVERY' | 'COMPLETED'>('ALL');
  const [syncing, setSyncing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmCompleteModal, setConfirmCompleteModal] = useState<string | null>(null);
  const [confirmStartModal, setConfirmStartModal] = useState<Sale | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync on mount
  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncWithSupabase();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setSyncing(false), 500);
    }
  };

  // Filter only delivery orders
  const deliverySales = sales
    .filter(s => s.fulfillmentType === 'DELIVERY' || s.notes?.includes('SHIPPING:'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics
  const totalDeliveries = deliverySales.length;
  const readyCount = deliverySales.filter(s => s.orderStatus === 'READY FOR PICKUP').length;
  const inTransitCount = deliverySales.filter(s => s.orderStatus === 'OUT FOR DELIVERY').length;
  const completedCount = deliverySales.filter(s => s.orderStatus === 'COMPLETED').length;
  const preparingCount = deliverySales.filter(s => s.orderStatus === 'PREPARING' || s.orderStatus === 'ORDER PLACED').length;

  // Filtered view
  const filteredSales = deliverySales.filter(s => {
    if (filter === 'ALL') return true;
    if (filter === 'READY') return s.orderStatus === 'READY FOR PICKUP';
    if (filter === 'PREPARING') return s.orderStatus === 'PREPARING' || s.orderStatus === 'ORDER PLACED';
    return s.orderStatus === filter;
  });

  // Helper to parse address, customer contact, and GPS coordinates from sale
  const getDeliveryDetails = (sale: Sale) => {
    let customer = sale.customerName || 'Customer';
    let phone = sale.customerPhone || 'N/A';
    let address = sale.shippingAddress || 'Baliuag, Bulacan';
    let lat = sale.latitude;
    let lng = sale.longitude;

    if (sale.notes) {
      if (!sale.customerName) {
        const custMatch = sale.notes.match(/CUSTOMER:\s*([^.]+)/i);
        if (custMatch) customer = custMatch[1].trim();
      }
      if (!sale.customerPhone) {
        const phoneMatch = sale.notes.match(/PHONE:\s*([^.]+)/i);
        if (phoneMatch) phone = phoneMatch[1].trim();
      }
      if (!sale.shippingAddress) {
        const addrMatch = sale.notes.match(/ADDR:\s*(.+)$/i);
        if (addrMatch) address = addrMatch[1].trim();
      }
      if (lat === undefined || lng === undefined) {
        const gpsMatch = sale.notes.match(/GPS:\s*([0-9.-]+)\s*,\s*([0-9.-]+)/i);
        if (gpsMatch) {
          lat = parseFloat(gpsMatch[1]);
          lng = parseFloat(gpsMatch[2]);
        }
      }
    }

    return { customer, phone, address, lat, lng };
  };

  const handleUpdateStatus = async (saleId: string, newStatus: 'OUT FOR DELIVERY' | 'COMPLETED') => {
    setProcessingId(saleId);
    try {
      const ok = await updateSaleOrderStatus(saleId, newStatus);
      if (ok) {
        // Send real-time SMS to customer via TranslertPH
        const targetSale = sales.find(s => s.id === saleId);
        if (targetSale) {
          const { customer, phone, address } = getDeliveryDetails(targetSale);
          if (phone && phone !== 'N/A') {
            if (newStatus === 'OUT FOR DELIVERY') {
              sendOutForDeliverySms({
                phone,
                orderId: saleId,
                riderName: currentUser?.name || 'Kuya Dennis',
                address
              }).catch(e => console.warn('SMS dispatch error:', e));
            } else if (newStatus === 'COMPLETED') {
              sendDeliveryCompletedSms({
                phone,
                orderId: saleId,
                customerName: customer
              }).catch(e => console.warn('SMS dispatch error:', e));
            }
          }
        }

        setSuccessToast(
          newStatus === 'COMPLETED' 
            ? `Order #${saleId} marked as DELIVERED & customer SMS notified!` 
            : `Order #${saleId} is now OUT FOR DELIVERY & customer SMS notified!`
        );
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } finally {
      setProcessingId(null);
      setConfirmCompleteModal(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner Notice */}
      <div style={{
        backgroundColor: '#7c3aed',
        color: '#ffffff',
        fontSize: '0.78rem',
        fontWeight: 700,
        textAlign: 'center',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        <Truck size={16} />
        <span>BOSS RAP MOTOR SHOP • LIVE RIDER DELIVERY DISPATCH SYSTEM</span>
      </div>

      {/* Main Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src="/boss-rap-logo.png" 
            alt="BOSS RAP MOTOR SHOP" 
            style={{ height: '42px', objectFit: 'contain' }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Rider Portal
              </h1>
              <span style={{
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #bbf7d0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                ON DUTY
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
              Driver: <strong>{currentUser?.name || 'In-House Rider'}</strong> • Baliuag Delivery Hub
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn"
            style={{ 
              fontSize: '0.8rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 14px'
            }}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Live Refresh'}</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="btn"
            style={{ 
              fontSize: '0.8rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 14px'
            }}
            title="My Rider Profile"
          >
            <UserCheck size={14} />
            <span>Profile</span>
          </button>

          <PaymentNotificationBell mode="RIDER" />

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="btn-danger"
            style={{ 
              fontSize: '0.8rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '8px 14px'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '24px 16px', flex: 1 }}>
        {/* Success Toast */}
        {successToast && (
          <div style={{
            backgroundColor: '#15803d',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <CheckCircle2 size={20} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Top KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Total Delivery Parcels */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                TOTAL PARCELS
              </span>
              <Package size={20} color="#2563eb" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
              {totalDeliveries}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              All delivery requests
            </div>
          </div>

          {/* Ready to Pick Up */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9', letterSpacing: '0.04em' }}>
                READY TO PICK UP
              </span>
              <Package size={20} color="#7c3aed" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#7c3aed', marginTop: '6px' }}>
              {readyCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Packed & waiting at counter
            </div>
          </div>

          {/* Pending / Preparing */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                AWAITING PREP
              </span>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', marginTop: '6px' }}>
              {preparingCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Shop staff is packing
            </div>
          </div>

          {/* In Transit */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                OUT FOR DELIVERY
              </span>
              <Truck size={20} color="#2563eb" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: '6px' }}>
              {inTransitCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Currently on the road
            </div>
          </div>

          {/* Delivered */}
          <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #16a34a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em' }}>
                DELIVERED
              </span>
              <CheckCircle2 size={20} color="#16a34a" />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '6px' }}>
              {completedCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Completed drop-offs
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Live Delivery Orders Feed
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Orders marked "Ready for Delivery" by Admin can be picked up and taken on the road.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['ALL', 'READY', 'PREPARING', 'OUT FOR DELIVERY', 'COMPLETED'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '7px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: filter === tab ? '#7c3aed' : '#ffffff',
                    color: filter === tab ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab === 'ALL' && `All (${deliverySales.length})`}
                  {tab === 'READY' && `Ready to Pick Up (${readyCount})`}
                  {tab === 'PREPARING' && `Awaiting Prep (${preparingCount})`}
                  {tab === 'OUT FOR DELIVERY' && `In Transit (${inTransitCount})`}
                  {tab === 'COMPLETED' && `Delivered (${completedCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Feed List */}
        {filteredSales.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
            <Package size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', margin: 0 }}>
              No deliveries match this filter
            </h3>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
              Check back for newly placed customer delivery orders.
            </p>
            <button
              onClick={() => setFilter('ALL')}
              className="btn"
              style={{ marginTop: '12px', fontSize: '0.8rem' }}
            >
              View All Deliveries
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredSales.map(sale => {
              const { customer, phone, address, lat, lng } = getDeliveryDetails(sale);
              const isCompleted = sale.orderStatus === 'COMPLETED';
              const isOutForDelivery = sale.orderStatus === 'OUT FOR DELIVERY';
              const isReadyForPickup = sale.orderStatus === 'READY FOR PICKUP';
              const isPreparing = !isCompleted && !isOutForDelivery && !isReadyForPickup;
              const isProcessing = processingId === sale.id;

              const hasExactGps = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
              const mapsUrl = hasExactGps
                ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ', Bulacan, Philippines')}`;

              return (
                <div 
                  key={sale.id}
                  className="card"
                  style={{
                    padding: '20px 24px',
                    borderLeft: `6px solid ${
                      isCompleted ? '#16a34a' : isOutForDelivery ? '#2563eb' : isReadyForPickup ? '#7c3aed' : '#f59e0b'
                    }`,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '14px',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                          Order #{sale.id}
                        </span>
                        <span className={`badge ${
                          isCompleted ? 'badge-green' : isOutForDelivery ? 'badge-blue' : isReadyForPickup ? 'badge-purple' : 'badge-yellow'
                        }`} style={{ 
                          fontSize: '0.72rem', 
                          padding: '3px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          ...(isReadyForPickup ? { backgroundColor: '#f3e8ff', color: '#6d28d9', border: '1px solid #d8b4fe' } : {})
                        }}>
                          {isCompleted ? (
                            <><CheckCircle2 size={12} color="#16a34a" /> DELIVERED</>
                          ) : isOutForDelivery ? (
                            <><Truck size={12} color="#2563eb" /> OUT FOR DELIVERY</>
                          ) : isReadyForPickup ? (
                            <><Package size={12} color="#7c3aed" /> READY FOR PICKUP</>
                          ) : (
                            <><Clock size={12} color="#d97706" /> PREPARING AT SHOP</>
                          )}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} />
                          {new Date(sale.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span>•</span>
                        <span>Tracking: <strong>{sale.trackingCode || 'DELIVERY'}</strong></span>
                        <span>•</span>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>
                          {sale.paymentMethod} • PAID ONLINE
                        </span>
                        {sale.paymentRef && (
                          <span style={{ color: '#475569' }}>Ref: {sale.paymentRef}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Maps & Contact */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          backgroundColor: hasExactGps ? '#ecfdf5' : '#f8fafc',
                          border: `1px solid ${hasExactGps ? '#a7f3d0' : '#cbd5e1'}`,
                          borderRadius: '6px',
                          color: hasExactGps ? '#047857' : '#2563eb',
                          boxShadow: hasExactGps ? '0 1px 3px rgba(16, 185, 129, 0.2)' : 'none'
                        }}
                        title={hasExactGps ? `Open Turn-by-Turn GPS Navigation (${lat.toFixed(5)}, ${lng.toFixed(5)})` : 'Search Address on Google Maps'}
                      >
                        <Navigation size={14} />
                        <span>{hasExactGps ? 'Start GPS Navigation' : 'Google Maps'}</span>
                        <ExternalLink size={12} />
                      </a>

                      {phone && phone !== 'N/A' && (
                        <a
                          href={`tel:${phone}`}
                          style={{
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            color: '#1d4ed8'
                          }}
                        >
                          <Phone size={14} />
                          <span>Call: {phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delivery Location & Recipient Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px',
                    backgroundColor: '#f8fafc',
                    padding: '14px 18px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontWeight: 800, fontSize: '0.8rem', marginBottom: '4px' }}>
                        <MapPin size={15} />
                        <span>DELIVERY DESTINATION</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {address}
                      </div>
                      {hasExactGps ? (
                        <div style={{
                          marginTop: '8px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #bbf7d0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 800, color: '#166534' }}>
                            <MapPin size={13} color="#16a34a" />
                            <span>PINPOINTED DELIVERY LOCATION</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#15803d',
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Open exact pinpoint in Google Maps"
                          >
                            <span>Open Pin on Map</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          Courier: Boss Rap In-House Rider • Flat ₱100 Delivery Fee Paid
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 800, fontSize: '0.8rem', marginBottom: '4px' }}>
                        <ShieldCheck size={15} />
                        <span>RECIPIENT / CONTACT</span>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        {customer}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Contact: {phone}
                      </div>
                    </div>
                  </div>

                  {/* Parcel Items & Total */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                      PARCEL CONTENTS:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {sale.items.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            padding: '6px 10px',
                            backgroundColor: '#ffffff',
                            borderRadius: '6px',
                            border: '1px solid #f1f5f9'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.quantity}x</span>{' '}
                            <span>{item.name}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: '#334155' }}>
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}

                      {/* Delivery Fee Line */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        padding: '4px 10px',
                        color: '#64748b'
                      }}>
                        <span>Delivery Fee (Rider Flat)</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>₱{(sale.deliveryFee || 100).toLocaleString()}</span>
                      </div>

                      {/* Total */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.95rem',
                        padding: '8px 10px',
                        fontWeight: 900,
                        backgroundColor: '#eff6ff',
                        borderRadius: '6px',
                        border: '1px solid #dbeafe',
                        color: '#1e40af'
                      }}>
                        <span>TOTAL PARCEL VALUE</span>
                        <span>₱{sale.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Rider */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '12px',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '14px'
                  }}>
                    {isPreparing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '0.74rem', 
                          color: '#b45309', 
                          backgroundColor: '#fffbeb', 
                          border: '1px solid #fde68a', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          fontWeight: 700, 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '5px' 
                        }}>
                          <Clock size={13} color="#b45309" />
                          <span>Shop is packing parcel • Unlocks when Admin marks "Ready"</span>
                        </span>
                        <button
                          disabled
                          className="btn"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#94a3b8',
                            borderColor: '#e2e8f0',
                            cursor: 'not-allowed',
                            padding: '10px 18px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: 0.85
                          }}
                          title="Admin or shop staff must reach 'Ready for Delivery' before you can pick up this parcel"
                        >
                          <Truck size={15} color="#94a3b8" />
                          <span>Pickup Disabled (Not Ready)</span>
                        </button>
                      </div>
                    )}

                    {isReadyForPickup && (
                      <button
                        onClick={() => setConfirmStartModal(sale)}
                        disabled={isProcessing}
                        className="btn-primary"
                        style={{
                          backgroundColor: '#7c3aed',
                          borderColor: '#6d28d9',
                          padding: '10px 22px',
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                        }}
                      >
                        <Truck size={16} />
                        <span>{isProcessing ? 'Updating...' : 'Pick Up Parcel & Start Delivery'}</span>
                      </button>
                    )}

                    {isOutForDelivery && (
                      <button
                        onClick={() => setConfirmCompleteModal(sale.id)}
                        disabled={isProcessing}
                        className="btn-primary"
                        style={{
                          backgroundColor: '#16a34a',
                          borderColor: '#15803d',
                          padding: '12px 24px',
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>{isProcessing ? 'Saving to Database...' : 'Complete Delivery (Delivered)'}</span>
                      </button>
                    )}

                    {isCompleted && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 800
                      }}>
                        <Check size={16} />
                        <span>Parcel Successfully Delivered</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Modal to Start Delivery (Out for Delivery) */}
      {confirmStartModal && (() => {
        const { customer, phone, address, lat, lng } = getDeliveryDetails(confirmStartModal);
        const hasGps = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);

        return (
          <div className="modal-overlay" onClick={() => processingId !== confirmStartModal.id && setConfirmStartModal(null)}>
            <div className="modal" style={{ maxWidth: '440px', width: '92%', padding: '24px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#ede9fe',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Truck size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    Simulan ang Delivery?
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Order #{confirmStartModal.id}</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Customer:</span>
                  <strong style={{ color: '#0f172a' }}>{customer}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Contact #:</span>
                  <strong style={{ color: '#0f172a' }}>{phone}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: hasGps ? '6px' : '0' }}>
                  <span style={{ color: '#64748b' }}>Address:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right', maxWidth: '240px' }}>{address}</span>
                </div>
                {hasGps && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem' }}>
                    <span style={{ color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} color="#16a34a" /> Delivery Pin:
                    </span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#15803d', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Open turn-by-turn navigation in Google Maps"
                    >
                      <span>Pinned Location on Map</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', marginBottom: '18px', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} color="#b45309" style={{ flexShrink: 0 }} />
                <span><strong>Paalala:</strong> Kapag kinumpirma mo ito, magiging <strong>OUT FOR DELIVERY</strong> ang status at awtomatikong magpapadala ng SMS notification sa customer na kasama ang iyong pangalan bilang rider.</span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmStartModal(null)}
                  className="btn"
                  disabled={processingId === confirmStartModal.id}
                  style={{ flex: 1, padding: '10px' }}
                >
                  Kanselahin
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const saleId = confirmStartModal.id;
                    await handleUpdateStatus(saleId, 'OUT FOR DELIVERY');
                    setConfirmStartModal(null);
                  }}
                  className="btn-primary"
                  disabled={processingId === confirmStartModal.id}
                  style={{
                    flex: 1.4,
                    padding: '10px',
                    backgroundColor: '#7c3aed',
                    borderColor: '#6d28d9',
                    fontWeight: 800
                  }}
                >
                  {processingId === confirmStartModal.id ? 'Updating...' : 'Oo, Simulan ang Delivery'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Modal to Mark as Delivered */}
      {confirmCompleteModal && (
        <div className="modal-overlay" onClick={() => setConfirmCompleteModal(null)}>
          <div className="modal" style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <CheckCircle2 size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Complete Delivery?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
              Confirm that parcel <strong>#{confirmCompleteModal}</strong> has been successfully received by the customer.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              margin: '16px 0',
              fontSize: '0.8rem',
              color: '#475569',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0 }} />
              <span>This will immediately update order status to <strong>COMPLETED</strong> in the cloud database.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmCompleteModal(null)}
                className="btn"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(confirmCompleteModal, 'COMPLETED')}
                disabled={processingId === confirmCompleteModal}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#16a34a',
                  borderColor: '#15803d',
                  fontWeight: 800
                }}
              >
                {processingId === confirmCompleteModal ? 'Updating...' : 'Yes, Complete Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
