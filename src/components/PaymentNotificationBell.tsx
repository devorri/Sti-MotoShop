import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Bell, 
  CreditCard, 
  Truck, 
  Package, 
  CheckCheck, 
  X,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  Mail,
  Tag,
  Calendar,
  Layers
} from 'lucide-react';

export interface SystemNotification {
  id: string;
  category: 'PAYMENT' | 'ORDER' | 'INVENTORY' | 'RETURN' | 'INQUIRY' | 'PROMO';
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: number;
  badgeText: string;
  badgeColor: string;
  linkPath: string;
}

interface NotificationBellProps {
  mode: 'ADMIN' | 'USER';
}

export const PaymentNotificationBell: React.FC<NotificationBellProps> = ({ mode }) => {
  const { 
    sales, 
    products, 
    returnRequests, 
    inquiries, 
    backOrders, 
    promos, 
    currentUser 
  } = useAppContext();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PAYMENT' | 'ORDER' | 'ALERT'>('ALL');
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageKey = mode === 'ADMIN' 
    ? 'motoshop_admin_read_notifications_v2' 
    : `motoshop_user_read_notifications_v2_${currentUser?.id || 'guest'}`;

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {}
  }, [storageKey]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Helper to extract customer name from notes
  const getCustomerName = (notes?: string, memberId?: string) => {
    if (notes) {
      const match = notes.match(/CUSTOMER:\s*([^.]+)/i);
      if (match) return match[1].trim();
    }
    return memberId ? `Member ${memberId}` : 'Customer';
  };

  // Compile overall notifications based on mode
  const notifications: SystemNotification[] = [];

  if (mode === 'ADMIN') {
    // 1. Payments Received
    sales.forEach(sale => {
      const hasOnlinePayment = 
        sale.paymentMethod !== 'CASH' || 
        !!sale.paymentRef || 
        sale.channel === 'ONLINE/FACEBOOK';

      if (hasOnlinePayment) {
        const customer = getCustomerName(sale.notes, sale.memberId);
        notifications.push({
          id: `pay_${sale.id}`,
          category: 'PAYMENT',
          title: `Payment: ₱${sale.total.toLocaleString()} from ${customer}`,
          subtitle: `${sale.paymentMethod} • Ref: ${sale.paymentRef || 'Verified'} • Order #${sale.id}`,
          timestamp: sale.date,
          amount: sale.total,
          badgeText: 'PAID ONLINE',
          badgeColor: 'badge-green',
          linkPath: '/admin/dashboard?tab=ORDERS'
        });
      }
    });

    // 2. Pending Orders to Fulfill
    sales.forEach(sale => {
      if (sale.orderStatus === 'PREPARING' || sale.orderStatus === 'ORDER PLACED') {
        const isDelivery = sale.fulfillmentType === 'DELIVERY';
        notifications.push({
          id: `ord_${sale.id}`,
          category: 'ORDER',
          title: `Order #${sale.id} Needs Fulfillment`,
          subtitle: `${sale.items.length} item(s) • ${isDelivery ? '🛵 Boss Rap Rider Delivery' : '📦 Counter Pickup'}`,
          timestamp: sale.date,
          badgeText: isDelivery ? 'RIDER DELIVERY' : 'PICKUP',
          badgeColor: 'badge-blue',
          linkPath: '/admin/dashboard?tab=ORDERS'
        });
      }
    });

    // 3. Inventory Stock Alerts
    products.forEach(prod => {
      if (prod.stock <= prod.lowStockLevel) {
        notifications.push({
          id: `stock_${prod.id}`,
          category: 'INVENTORY',
          title: prod.stock === 0 ? `OUT OF STOCK: ${prod.name}` : `Low Stock: ${prod.name}`,
          subtitle: prod.stock === 0 
            ? '0 units remaining! Restock needed immediately.' 
            : `Only ${prod.stock} left in stock (Alert threshold: ${prod.lowStockLevel})`,
          timestamp: new Date().toISOString(),
          badgeText: prod.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK',
          badgeColor: prod.stock === 0 ? 'badge-red' : 'badge-yellow',
          linkPath: '/admin/inventory'
        });
      }
    });

    // 4. Return Claims
    returnRequests.forEach(rr => {
      if (rr.status === 'PENDING') {
        notifications.push({
          id: `ret_${rr.id}`,
          category: 'RETURN',
          title: `Pending Return Claim: ${rr.type} #${rr.id}`,
          subtitle: `Reason: ${rr.reason} • Order #${rr.saleId}`,
          timestamp: rr.date,
          badgeText: 'RETURN CLAIM',
          badgeColor: 'badge-purple',
          linkPath: '/admin/returns'
        });
      }
    });

    // 5. Inquiries
    inquiries.forEach(inq => {
      notifications.push({
        id: `inq_${inq.id}`,
        category: 'INQUIRY',
        title: `Customer Message: ${inq.name}`,
        subtitle: inq.message.length > 70 ? `${inq.message.slice(0, 70)}...` : inq.message,
        timestamp: inq.date,
        badgeText: 'INQUIRY',
        badgeColor: 'badge-blue',
        linkPath: '/admin/inquiries'
      });
    });

    // 6. Back Orders
    backOrders.forEach(bo => {
      if (bo.status === 'PENDING') {
        notifications.push({
          id: `bo_${bo.id}`,
          category: 'ORDER',
          title: `Item Reservation: ${bo.quantity}x ${bo.productName}`,
          subtitle: `Customer: ${bo.customerName || 'Walk-in'} (${bo.customerContact || 'N/A'})`,
          timestamp: bo.createdAt,
          badgeText: 'BACK-ORDER',
          badgeColor: 'badge-yellow',
          linkPath: '/admin/dashboard?tab=BACKORDERS'
        });
      }
    });

  } else {
    // ==========================================
    // USER / CUSTOMER NOTIFICATIONS
    // ==========================================
    if (currentUser) {
      // 1. User Payments & Orders
      const userSales = sales.filter(s => {
        const matchesMemberId = currentUser.memberId && s.memberId === currentUser.memberId;
        const matchesName = s.notes?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
                            s.notes?.toLowerCase().includes(currentUser.username.toLowerCase());
        return matchesMemberId || matchesName;
      });

      userSales.forEach(sale => {
        // Payment confirmation
        if (sale.paymentMethod !== 'CASH' || sale.paymentRef) {
          notifications.push({
            id: `usr_pay_${sale.id}`,
            category: 'PAYMENT',
            title: `Payment Confirmed • ₱${sale.total.toLocaleString()}`,
            subtitle: `Paid via ${sale.paymentMethod} ${sale.paymentRef ? `(Ref: ${sale.paymentRef})` : ''}`,
            timestamp: sale.date,
            amount: sale.total,
            badgeText: 'PAID ONLINE',
            badgeColor: 'badge-green',
            linkPath: '/dashboard'
          });
        }

        // Delivery/Pickup status
        const isDelivered = sale.orderStatus === 'COMPLETED';
        const isTransit = sale.orderStatus === 'OUT FOR DELIVERY';
        notifications.push({
          id: `usr_stat_${sale.id}_${sale.orderStatus}`,
          category: 'ORDER',
          title: isDelivered 
            ? `Order #${sale.id} Delivered!` 
            : isTransit 
            ? `Order #${sale.id} is On The Way` 
            : `Order #${sale.id} Being Prepared`,
          subtitle: `${sale.fulfillmentType === 'DELIVERY' ? 'Boss Rap Rider Delivery' : 'Store Pickup'} • Tracking: ${sale.trackingCode || 'DELIVERY'}`,
          timestamp: sale.date,
          badgeText: sale.orderStatus || 'ORDER PLACED',
          badgeColor: isDelivered ? 'badge-green' : isTransit ? 'badge-blue' : 'badge-yellow',
          linkPath: '/dashboard'
        });
      });

      // 2. Return claims updates
      const userReturns = returnRequests.filter(rr => rr.memberId === currentUser.memberId);
      userReturns.forEach(rr => {
        notifications.push({
          id: `usr_ret_${rr.id}_${rr.status}`,
          category: 'RETURN',
          title: `Claim #${rr.id} Status: ${rr.status}`,
          subtitle: `Type: ${rr.type} for Order #${rr.saleId}`,
          timestamp: rr.date,
          badgeText: rr.status,
          badgeColor: rr.status === 'APPROVED' ? 'badge-green' : rr.status === 'REJECTED' ? 'badge-red' : 'badge-yellow',
          linkPath: '/dashboard'
        });
      });
    }

    // 3. Active Promos for all users
    promos.filter(p => p.active).forEach(promo => {
      notifications.push({
        id: `promo_${promo.id}`,
        category: 'PROMO',
        title: `🔥 Store Promo: ${promo.name}`,
        subtitle: `${promo.discountPercent}% OFF on purchases min ₱${promo.minSpend.toLocaleString()}`,
        timestamp: promo.startDate || new Date().toISOString(),
        badgeText: 'DISCOUNT',
        badgeColor: 'badge-red',
        linkPath: '/shop'
      });
    });
  }

  // Sort newest first
  const sortedNotifications = notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Unread count
  const unreadCount = sortedNotifications.filter(n => !readIds.includes(n.id)).length;

  // Filtered list
  const filteredNotifications = sortedNotifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PAYMENT') return n.category === 'PAYMENT';
    if (activeFilter === 'ORDER') return n.category === 'ORDER';
    if (activeFilter === 'ALERT') return n.category === 'INVENTORY' || n.category === 'RETURN' || n.category === 'INQUIRY' || n.category === 'PROMO';
    return true;
  });

  const handleMarkAllRead = () => {
    const allIds = sortedNotifications.map(n => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(allIds));
    } catch (e) {}
  };

  const handleItemClick = (notif: SystemNotification) => {
    if (!readIds.includes(notif.id)) {
      const updated = [...readIds, notif.id];
      setReadIds(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
    }
    setIsOpen(false);
    navigate(notif.linkPath);
  };

  const getCategoryIcon = (category: SystemNotification['category']) => {
    switch (category) {
      case 'PAYMENT':
        return <CreditCard size={18} color="#16a34a" />;
      case 'ORDER':
        return <Truck size={18} color="#2563eb" />;
      case 'INVENTORY':
        return <AlertTriangle size={18} color="#dc2626" />;
      case 'RETURN':
        return <RotateCcw size={18} color="#7c3aed" />;
      case 'INQUIRY':
        return <Mail size={18} color="#0284c7" />;
      case 'PROMO':
        return <Tag size={18} color="#e11d48" />;
      default:
        return <Package size={18} color="#64748b" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Overall Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={mode === 'ADMIN' ? "Overall Admin Notifications Center" : "Overall Notifications & Alerts"}
        style={{
          position: 'relative',
          background: 'none',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '7px 11px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? '#eff6ff' : '#ffffff',
          color: unreadCount > 0 ? '#2563eb' : '#475569',
          transition: 'all 0.15s ease'
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '0.65rem',
            fontWeight: 800,
            minWidth: '18px',
            height: '18px',
            padding: '0 4px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            animation: 'pulse 1.5s infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Overall Notification Center Dropdown Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '420px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>
                    {mode === 'ADMIN' ? 'Overall Notifications' : 'Notifications & Alerts'}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {unreadCount} unread • Boss Rap Live Center
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all notifications as read"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px'
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
              {(['ALL', 'PAYMENT', 'ORDER', 'ALERT'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFilter(tab)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeFilter === tab ? '#2563eb' : '#e2e8f0',
                    color: activeFilter === tab ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {tab === 'ALL' && `All (${sortedNotifications.length})`}
                  {tab === 'PAYMENT' && `Payments (${sortedNotifications.filter(n => n.category === 'PAYMENT').length})`}
                  {tab === 'ORDER' && `Orders (${sortedNotifications.filter(n => n.category === 'ORDER').length})`}
                  {tab === 'ALERT' && `Alerts (${sortedNotifications.filter(n => n.category === 'INVENTORY' || n.category === 'RETURN' || n.category === 'INQUIRY' || n.category === 'PROMO').length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Scroll List */}
          <div style={{ maxHeight: '390px', overflowY: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                <Layers size={32} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  No notifications in this filter
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  System updates, payments, and orders will show up here.
                </div>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const isUnread = !readIds.includes(notif.id);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isUnread ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                    onMouseEnter={e => {
                      if (!isUnread) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={e => {
                      if (!isUnread) e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    {/* Category Icon */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: isUnread ? '#dbeafe' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      {getCategoryIcon(notif.category)}
                    </div>

                    {/* Content Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ 
                          fontSize: '0.82rem', 
                          fontWeight: isUnread ? 800 : 700, 
                          color: '#0f172a',
                          lineHeight: 1.3
                        }}>
                          {notif.title}
                        </span>
                        <span className={`badge ${notif.badgeColor}`} style={{ fontSize: '0.62rem', flexShrink: 0, padding: '2px 6px' }}>
                          {notif.badgeText}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                        {notif.subtitle}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.68rem', color: '#94a3b8' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={11} />
                          <span>{new Date(notif.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </span>
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>Click to open →</span>
                      </div>
                    </div>

                    {/* Blue Unread Dot */}
                    {isUnread && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#2563eb',
                        flexShrink: 0,
                        marginTop: '6px'
                      }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (mode === 'ADMIN') {
                  navigate('/admin/dashboard?tab=ORDERS');
                } else {
                  navigate('/dashboard');
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{mode === 'ADMIN' ? 'Go to Admin Activity Dashboard' : 'View My Member Dashboard'}</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Alias export for backward compatibility
export const OverallNotificationBell = PaymentNotificationBell;
