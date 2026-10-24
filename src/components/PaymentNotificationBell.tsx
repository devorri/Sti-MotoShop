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
  Layers,
  MapPin,
  Sparkles
} from 'lucide-react';

export interface SystemNotification {
  id: string;
  category: 'PAYMENT' | 'ORDER' | 'INVENTORY' | 'RETURN' | 'INQUIRY' | 'PROMO' | 'RIDER_DISPATCH' | 'CLUB';
  title: string;
  subtitle: string;
  timestamp: string;
  amount?: number;
  badgeText: string;
  badgeColor: string;
  linkPath: string;
}

export type NotificationRole = 'ADMIN' | 'EMPLOYEE' | 'RIDER' | 'CUSTOMER' | 'GUEST';

interface NotificationBellProps {
  mode?: 'ADMIN' | 'USER' | 'RIDER' | 'EMPLOYEE' | 'CUSTOMER' | 'GUEST' | 'AUTO';
}

export const PaymentNotificationBell: React.FC<NotificationBellProps> = ({ mode = 'AUTO' }) => {
  const { 
    sales, 
    products, 
    returnRequests, 
    inquiries, 
    backOrders, 
    promos, 
    currentUser,
    members
  } = useAppContext();

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine effective role
  const effectiveRole: NotificationRole = (() => {
    if (mode === 'ADMIN') return 'ADMIN';
    if (mode === 'RIDER') return 'RIDER';
    if (mode === 'EMPLOYEE') return 'EMPLOYEE';
    if (mode === 'CUSTOMER') return 'CUSTOMER';
    if (mode === 'USER') {
      return (currentUser?.role as NotificationRole) || 'GUEST';
    }
    // AUTO mode: detect from currentUser
    if (currentUser?.role === 'ADMIN') return 'ADMIN';
    if (currentUser?.role === 'RIDER') return 'RIDER';
    if (currentUser?.role === 'EMPLOYEE') return 'EMPLOYEE';
    if (currentUser?.role === 'CUSTOMER') return 'CUSTOMER';
    return 'GUEST';
  })();

  // Role-based active tab filter
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [readIds, setReadIds] = useState<string[]>([]);

  // User-partitioned storage key (strictly isolates read states per user and role)
  const storageKey = `motoshop_notifs_read_v3_${currentUser?.id || 'guest'}_${effectiveRole}`;

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReadIds(JSON.parse(stored));
      } else {
        setReadIds([]);
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
  const getCustomerName = (notes?: string, memberId?: string, fallbackName?: string) => {
    if (notes) {
      const match = notes.match(/MEMBER:\s*([^.]+)/i) || notes.match(/CUSTOMER:\s*([^.]+)/i);
      if (match) return match[1].trim();
    }
    if (fallbackName) return fallbackName;
    return memberId ? `Member ${memberId}` : 'Customer';
  };

  // Compile role-appropriate and user-specific notifications
  const notifications: SystemNotification[] = [];

  // ============================================================================
  // 1. ADMIN ROLE NOTIFICATIONS (Store-wide Management & Audit)
  // ============================================================================
  if (effectiveRole === 'ADMIN') {
    // 1.1 Online Payments Received
    sales.forEach(sale => {
      const hasOnlinePayment = sale.paymentMethod !== 'CASH' || !!sale.paymentRef;
      if (hasOnlinePayment) {
        const customer = getCustomerName(sale.notes, sale.memberId, sale.customerName);
        notifications.push({
          id: `pay_${sale.id}`,
          category: 'PAYMENT',
          title: `Online Payment: ₱${sale.total.toLocaleString()} from ${customer}`,
          subtitle: `${sale.paymentMethod} • Ref: ${sale.paymentRef || 'Verified'} • Order #${sale.id}`,
          timestamp: sale.date,
          amount: sale.total,
          badgeText: 'PAID ONLINE',
          badgeColor: 'badge-green',
          linkPath: `/admin/dashboard?tab=ORDERS&orderId=${sale.id}`
        });
      }
    });

    // 1.2 Orders Requiring Action / Fulfillment
    sales.forEach(sale => {
      const isDelivery = sale.fulfillmentType === 'DELIVERY';
      const isReadyForRider = isDelivery && sale.orderStatus === 'READY FOR PICKUP';
      const isPendingPrep = sale.orderStatus === 'PREPARING' || sale.orderStatus === 'ORDER PLACED';

      if (isReadyForRider || isPendingPrep) {
        const customer = getCustomerName(sale.notes, sale.memberId, sale.customerName);
        notifications.push({
          id: `ord_${sale.id}`,
          category: 'ORDER',
          title: isReadyForRider 
            ? `Order #${sale.id} Packed (Awaiting Rider Pickup)`
            : `Order #${sale.id} Placed by ${customer}`,
          subtitle: `${sale.items.length} item(s) • ${isDelivery ? 'Boss Rap Rider Delivery' : 'Store Pickup'} • Status: ${sale.orderStatus}`,
          timestamp: sale.date,
          badgeText: isReadyForRider ? 'AWAITING RIDER' : isDelivery ? 'RIDER DELIVERY' : 'PICKUP',
          badgeColor: isReadyForRider ? 'badge-purple' : 'badge-blue',
          linkPath: `/admin/dashboard?tab=ORDERS&orderId=${sale.id}`
        });
      }
    });

    // 1.3 Out of Stock and Low Stock Alerts
    products.forEach(prod => {
      if (prod.stock <= prod.lowStockLevel) {
        notifications.push({
          id: `stock_${prod.id}`,
          category: 'INVENTORY',
          title: prod.stock === 0 ? `OUT OF STOCK: ${prod.name}` : `Low Stock: ${prod.name}`,
          subtitle: prod.stock === 0 
            ? '0 units remaining! Immediate restock order required.' 
            : `Only ${prod.stock} units left in stock (Alert threshold: ${prod.lowStockLevel})`,
          timestamp: new Date().toISOString(),
          badgeText: prod.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK',
          badgeColor: prod.stock === 0 ? 'badge-red' : 'badge-yellow',
          linkPath: `/admin/dashboard?tab=PRODUCTS&search=${encodeURIComponent(prod.name)}`
        });
      }
    });

    // 1.4 Pending Return & Warranty Claims
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

    // 1.5 Customer Support Inquiries
    inquiries.forEach(inq => {
      notifications.push({
        id: `inq_${inq.id}`,
        category: 'INQUIRY',
        title: `Customer Inquiry: ${inq.name}`,
        subtitle: inq.message.length > 70 ? `${inq.message.slice(0, 70)}...` : inq.message,
        timestamp: inq.date,
        badgeText: 'INQUIRY',
        badgeColor: 'badge-blue',
        linkPath: '/admin/inquiries'
      });
    });

    // 1.6 Back-Orders
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
  }

  // ============================================================================
  // 2. EMPLOYEE / CASHIER ROLE NOTIFICATIONS (Counter POS & Floor Operations)
  // ============================================================================
  else if (effectiveRole === 'EMPLOYEE') {
    // 2.1 Counter Store Pickups Ready
    sales.forEach(sale => {
      if (sale.fulfillmentType === 'STORE PICKUP' && sale.orderStatus === 'READY FOR PICKUP') {
        const customer = getCustomerName(sale.notes, sale.memberId, sale.customerName);
        notifications.push({
          id: `emp_pickup_${sale.id}`,
          category: 'ORDER',
          title: `Counter Pickup Ready: Order #${sale.id}`,
          subtitle: `Customer: ${customer} • Total: ₱${sale.total.toLocaleString()} • Ready at Baliuag Counter`,
          timestamp: sale.date,
          badgeText: 'COUNTER PICKUP',
          badgeColor: 'badge-green',
          linkPath: `/staff/pos`
        });
      }
    });

    // 2.2 Orders Needing Packing
    sales.forEach(sale => {
      if (sale.orderStatus === 'ORDER PLACED' || sale.orderStatus === 'PREPARING') {
        notifications.push({
          id: `emp_pack_${sale.id}`,
          category: 'ORDER',
          title: `Order #${sale.id} Needs Packing`,
          subtitle: `${sale.items.length} item(s) • Fulfillment: ${sale.fulfillmentType}`,
          timestamp: sale.date,
          badgeText: 'PACK ORDER',
          badgeColor: 'badge-yellow',
          linkPath: `/staff/pos`
        });
      }
    });

    // 2.3 Out of Stock & Low Stock Items
    products.forEach(prod => {
      if (prod.stock <= prod.lowStockLevel) {
        notifications.push({
          id: `emp_stock_${prod.id}`,
          category: 'INVENTORY',
          title: prod.stock === 0 ? `OUT OF STOCK: ${prod.name}` : `Low Stock: ${prod.name}`,
          subtitle: prod.stock === 0 ? '0 in inventory • Do not promise to counter customers' : `Only ${prod.stock} units remain`,
          timestamp: new Date().toISOString(),
          badgeText: prod.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK',
          badgeColor: prod.stock === 0 ? 'badge-red' : 'badge-yellow',
          linkPath: `/staff/pos`
        });
      }
    });

    // 2.4 Back-Order Product Holds
    backOrders.forEach(bo => {
      if (bo.status === 'PENDING') {
        notifications.push({
          id: `emp_bo_${bo.id}`,
          category: 'ORDER',
          title: `Back-Order Hold: ${bo.productName}`,
          subtitle: `Reserved for ${bo.customerName} (${bo.customerContact})`,
          timestamp: bo.createdAt,
          badgeText: 'RESERVED',
          badgeColor: 'badge-yellow',
          linkPath: `/staff/pos`
        });
      }
    });
  }

  // ============================================================================
  // 3. RIDER ROLE NOTIFICATIONS (Delivery Route & Dispatch Alerts)
  // ============================================================================
  else if (effectiveRole === 'RIDER') {
    sales.forEach(sale => {
      // Only delivery sales matter for riders
      if (sale.fulfillmentType !== 'DELIVERY') return;

      const customer = getCustomerName(sale.notes, sale.memberId, sale.customerName);
      const dest = sale.shippingAddress || 'Bulacan Delivery';

      // 3.1 Ready for Rider Pickup (Admin has prepared parcel)
      if (sale.orderStatus === 'READY FOR PICKUP') {
        notifications.push({
          id: `rider_ready_${sale.id}`,
          category: 'RIDER_DISPATCH',
          title: `🚀 Order #${sale.id} Ready for Rider Pickup!`,
          subtitle: `Pickup at Baliuag Shop • Customer: ${customer} • Destination: ${dest}`,
          timestamp: sale.date,
          badgeText: 'PICKUP READY',
          badgeColor: 'badge-purple',
          linkPath: `/rider/deliveries?orderId=${sale.id}`
        });
      }

      // 3.2 In Transit (Out for Delivery)
      else if (sale.orderStatus === 'OUT FOR DELIVERY') {
        notifications.push({
          id: `rider_transit_${sale.id}`,
          category: 'RIDER_DISPATCH',
          title: `📍 Order #${sale.id} Active Delivery Route`,
          subtitle: `In transit to ${customer} • Map pin navigation ready`,
          timestamp: sale.date,
          badgeText: 'IN TRANSIT',
          badgeColor: 'badge-blue',
          linkPath: `/rider/deliveries?orderId=${sale.id}`
        });
      }

      // 3.3 Delivered Today
      else if (sale.orderStatus === 'COMPLETED') {
        notifications.push({
          id: `rider_done_${sale.id}`,
          category: 'RIDER_DISPATCH',
          title: `✓ Order #${sale.id} Delivered Successfully`,
          subtitle: `Delivered to ${customer} • Transaction completed`,
          timestamp: sale.date,
          badgeText: 'DELIVERED',
          badgeColor: 'badge-green',
          linkPath: `/rider/deliveries`
        });
      }

      // 3.4 New Incoming Delivery Orders Being Prepared
      else if (sale.orderStatus === 'PREPARING' || sale.orderStatus === 'ORDER PLACED') {
        notifications.push({
          id: `rider_prep_${sale.id}`,
          category: 'RIDER_DISPATCH',
          title: `📦 Upcoming Delivery: Order #${sale.id}`,
          subtitle: `Shop is packing items for ${customer} • Stand by for dispatch`,
          timestamp: sale.date,
          badgeText: 'PREPARING',
          badgeColor: 'badge-yellow',
          linkPath: `/rider/deliveries`
        });
      }
    });
  }

  // ============================================================================
  // 4. CUSTOMER ROLE NOTIFICATIONS (Strictly User-Based & Personal Orders)
  // ============================================================================
  else if (effectiveRole === 'CUSTOMER' && currentUser) {
    // Filter sales STRICTLY to this user
    const userSales = sales.filter(s => {
      const matchMemberId = currentUser.memberId && s.memberId === currentUser.memberId;
      const matchName = s.customerName?.toLowerCase() === currentUser.name?.toLowerCase() ||
                        s.notes?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
                        s.notes?.toLowerCase().includes(currentUser.username.toLowerCase());
      return matchMemberId || matchName;
    });

    userSales.forEach(sale => {
      const isDelivery = sale.fulfillmentType === 'DELIVERY';

      // 4.1 Payment clearance confirmation
      if (sale.paymentMethod !== 'CASH' || sale.paymentRef) {
        notifications.push({
          id: `usr_pay_${sale.id}`,
          category: 'PAYMENT',
          title: `Payment Confirmed: ₱${sale.total.toLocaleString()}`,
          subtitle: `Paid via ${sale.paymentMethod} ${sale.paymentRef ? `(Ref: ${sale.paymentRef})` : ''} • Order #${sale.id}`,
          timestamp: sale.date,
          amount: sale.total,
          badgeText: 'PAID ONLINE',
          badgeColor: 'badge-green',
          linkPath: `/dashboard?tab=ORDERS&orderId=${sale.id}`
        });
      }

      // 4.2 Order status progression
      let title = `Order #${sale.id} Placed & Confirmed`;
      let subtitle = isDelivery ? 'Order received. We are gathering your items for delivery.' : 'Order received. We are packing your items for counter pickup.';
      let badgeText: string = sale.orderStatus || 'ORDER PLACED';
      let badgeColor = 'badge-yellow';

      if (sale.orderStatus === 'COMPLETED') {
        title = isDelivery ? `Order #${sale.id} Delivered!` : `Order #${sale.id} Claimed!`;
        subtitle = isDelivery ? 'Your parcel was successfully delivered. Ride safe!' : 'Claimed and completed at shop counter. Thank you!';
        badgeColor = 'badge-green';
      } else if (sale.orderStatus === 'OUT FOR DELIVERY') {
        title = `Order #${sale.id} is On The Way!`;
        subtitle = `Our delivery rider is on the road to your location. Keep your phone reachable!`;
        badgeColor = 'badge-blue';
      } else if (sale.orderStatus === 'READY FOR PICKUP') {
        title = isDelivery 
          ? `Order #${sale.id} Packed & Ready for Delivery Rider!` 
          : `Order #${sale.id} Ready for Store Pickup!`;
        subtitle = isDelivery 
          ? 'Packed and waiting for rider dispatch at Baliuag shop.' 
          : 'Your order is ready to claim at our Baliuag store counter.';
        badgeColor = isDelivery ? 'badge-purple' : 'badge-green';
        badgeText = isDelivery ? 'READY FOR DELIVERY' : 'READY FOR PICKUP';
      } else if (sale.orderStatus === 'PREPARING') {
        title = `Order #${sale.id} Being Gathered & Packed`;
        subtitle = 'Shop staff is carefully inspecting and packing your genuine parts.';
        badgeColor = 'badge-yellow';
      }

      notifications.push({
        id: `usr_stat_${sale.id}_${sale.orderStatus}`,
        category: 'ORDER',
        title,
        subtitle,
        timestamp: sale.date,
        badgeText,
        badgeColor,
        linkPath: `/dashboard?tab=ORDERS&orderId=${sale.id}`
      });
    });

    // 4.3 Return & Warranty claims updates for this customer
    const userReturns = returnRequests.filter(rr => rr.memberId === currentUser.memberId);
    userReturns.forEach(rr => {
      notifications.push({
        id: `usr_ret_${rr.id}_${rr.status}`,
        category: 'RETURN',
        title: `Claim #${rr.id} Status: ${rr.status}`,
        subtitle: `Warranty claim for Order #${rr.saleId} • ${rr.reason}`,
        timestamp: rr.date,
        badgeText: rr.status,
        badgeColor: rr.status === 'APPROVED' ? 'badge-green' : rr.status === 'REJECTED' ? 'badge-red' : 'badge-yellow',
        linkPath: '/dashboard?tab=RETURNS'
      });
    });

    // 4.4 Member loyalty points notification
    if (currentUser.memberId) {
      const member = members.find(m => m.id === currentUser.memberId);
      if (member) {
        notifications.push({
          id: `usr_pts_${member.id}_${member.points}`,
          category: 'CLUB',
          title: `Rider Club: ${member.points} Points Available`,
          subtitle: `Earn 1 point per ₱100 spend. Redeem points for discount vouchers on your next checkout!`,
          timestamp: member.joinDate || new Date().toISOString(),
          badgeText: `${member.points} PTS`,
          badgeColor: 'badge-purple',
          linkPath: '/dashboard?tab=POINTS'
        });
      }
    }

    // 4.5 Active Promos
    promos.filter(p => p.active).forEach(promo => {
      notifications.push({
        id: `usr_promo_${promo.id}`,
        category: 'PROMO',
        title: `🔥 Promo: ${promo.name} (${promo.discountPercent}% OFF)`,
        subtitle: `Valid on orders min ₱${promo.minSpend.toLocaleString()} • Shop genuine spares today!`,
        timestamp: promo.startDate || new Date().toISOString(),
        badgeText: `${promo.discountPercent}% OFF`,
        badgeColor: 'badge-red',
        linkPath: '/shop'
      });
    });
  }

  // ============================================================================
  // 5. GUEST / VISITOR NOTIFICATIONS
  // ============================================================================
  else {
    // 5.1 Welcome bonus
    notifications.push({
      id: 'guest_welcome',
      category: 'CLUB',
      title: 'Join Boss Rap Rider Club (+50 Pts Bonus)',
      subtitle: 'Create a free account to earn reward points on every spare parts and service purchase!',
      timestamp: new Date().toISOString(),
      badgeText: '+50 PTS',
      badgeColor: 'badge-purple',
      linkPath: '/register'
    });

    // 5.2 Active Promos
    promos.filter(p => p.active).forEach(promo => {
      notifications.push({
        id: `guest_promo_${promo.id}`,
        category: 'PROMO',
        title: `🔥 Store Promo: ${promo.name}`,
        subtitle: `${promo.discountPercent}% OFF on minimum purchases of ₱${promo.minSpend.toLocaleString()}`,
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

  // Role-specific Tabs definition
  const roleTabs = (() => {
    switch (effectiveRole) {
      case 'ADMIN':
        return [
          { id: 'ALL', label: `All (${sortedNotifications.length})` },
          { id: 'PAYMENT', label: `Payments (${sortedNotifications.filter(n => n.category === 'PAYMENT').length})` },
          { id: 'ORDER', label: `Orders (${sortedNotifications.filter(n => n.category === 'ORDER').length})` },
          { id: 'INVENTORY', label: `Stock (${sortedNotifications.filter(n => n.category === 'INVENTORY').length})` },
          { id: 'ALERT', label: `Claims (${sortedNotifications.filter(n => n.category === 'RETURN' || n.category === 'INQUIRY').length})` }
        ];
      case 'EMPLOYEE':
        return [
          { id: 'ALL', label: `All (${sortedNotifications.length})` },
          { id: 'ORDER', label: `Orders (${sortedNotifications.filter(n => n.category === 'ORDER').length})` },
          { id: 'INVENTORY', label: `Stock (${sortedNotifications.filter(n => n.category === 'INVENTORY').length})` }
        ];
      case 'RIDER':
        return [
          { id: 'ALL', label: `All (${sortedNotifications.length})` },
          { id: 'READY', label: `Ready (${sortedNotifications.filter(n => n.badgeText === 'PICKUP READY').length})` },
          { id: 'TRANSIT', label: `In Transit (${sortedNotifications.filter(n => n.badgeText === 'IN TRANSIT').length})` },
          { id: 'DONE', label: `Delivered (${sortedNotifications.filter(n => n.badgeText === 'DELIVERED').length})` }
        ];
      case 'CUSTOMER':
        return [
          { id: 'ALL', label: `All (${sortedNotifications.length})` },
          { id: 'ORDER', label: `My Orders (${sortedNotifications.filter(n => n.category === 'ORDER').length})` },
          { id: 'PAYMENT', label: `Payments (${sortedNotifications.filter(n => n.category === 'PAYMENT').length})` },
          { id: 'PROMO', label: `Promos (${sortedNotifications.filter(n => n.category === 'PROMO' || n.category === 'CLUB').length})` }
        ];
      default:
        return [
          { id: 'ALL', label: `All (${sortedNotifications.length})` },
          { id: 'PROMO', label: `Promos (${sortedNotifications.filter(n => n.category === 'PROMO' || n.category === 'CLUB').length})` }
        ];
    }
  })();

  // Filtered notifications
  const filteredNotifications = sortedNotifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    if (effectiveRole === 'RIDER') {
      if (activeFilter === 'READY') return n.badgeText === 'PICKUP READY';
      if (activeFilter === 'TRANSIT') return n.badgeText === 'IN TRANSIT';
      if (activeFilter === 'DONE') return n.badgeText === 'DELIVERED';
      return true;
    }
    if (activeFilter === 'PAYMENT') return n.category === 'PAYMENT';
    if (activeFilter === 'ORDER') return n.category === 'ORDER' || n.category === 'RIDER_DISPATCH';
    if (activeFilter === 'INVENTORY') return n.category === 'INVENTORY';
    if (activeFilter === 'PROMO') return n.category === 'PROMO' || n.category === 'CLUB';
    if (activeFilter === 'ALERT') return n.category === 'RETURN' || n.category === 'INQUIRY';
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
      case 'RIDER_DISPATCH':
        return <MapPin size={18} color="#9333ea" />;
      case 'INVENTORY':
        return <AlertTriangle size={18} color="#dc2626" />;
      case 'RETURN':
        return <RotateCcw size={18} color="#7c3aed" />;
      case 'INQUIRY':
        return <Mail size={18} color="#0284c7" />;
      case 'PROMO':
        return <Tag size={18} color="#e11d48" />;
      case 'CLUB':
        return <Sparkles size={18} color="#d97706" />;
      default:
        return <Package size={18} color="#64748b" />;
    }
  };

  // Header Title by Role
  const headerTitle = (() => {
    switch (effectiveRole) {
      case 'ADMIN':
        return 'Admin Control Center';
      case 'EMPLOYEE':
        return 'Staff Operations Center';
      case 'RIDER':
        return 'Rider Delivery Dispatch';
      case 'CUSTOMER':
        return `My Notifications (@${currentUser?.username || 'member'})`;
      default:
        return 'Store Announcements';
    }
  })();

  const headerSubtitle = (() => {
    switch (effectiveRole) {
      case 'ADMIN':
        return 'Store-wide Oversight & Alerts';
      case 'EMPLOYEE':
        return 'Counter Tasks & Stock Alerts';
      case 'RIDER':
        return 'Ready Pickups & Route Alerts';
      case 'CUSTOMER':
        return 'Personal Orders & Delivery Tracking';
      default:
        return 'Latest Promos & Updates';
    }
  })();

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`${headerTitle} • ${unreadCount} unread`}
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

      {/* Notification Center Popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '430px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
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
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: effectiveRole === 'RIDER' ? '#f3e8ff' : '#dbeafe',
                  color: effectiveRole === 'RIDER' ? '#7e22ce' : '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {effectiveRole === 'RIDER' ? <Truck size={17} /> : <Bell size={17} />}
                </div>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>
                    {headerTitle}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {unreadCount} unread • {headerSubtitle}
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
            <div style={{ display: 'flex', gap: '4px', marginTop: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
              {roleTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeFilter === tab.id ? '#2563eb' : '#e2e8f0',
                    color: activeFilter === tab.id ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {tab.label}
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
                  {effectiveRole === 'RIDER' 
                    ? 'Newly packed deliveries ready for pickup will appear here.'
                    : effectiveRole === 'CUSTOMER'
                    ? 'Your order tracking, payment updates and promos will show up here.'
                    : 'System alerts and order updates will show up here.'}
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

          {/* Footer Navigation */}
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
                if (effectiveRole === 'ADMIN') {
                  navigate('/admin/dashboard?tab=ORDERS');
                } else if (effectiveRole === 'RIDER') {
                  navigate('/rider/deliveries');
                } else if (effectiveRole === 'EMPLOYEE') {
                  navigate('/staff/pos');
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
              <span>
                {effectiveRole === 'ADMIN'
                  ? 'Go to Admin Activity Dashboard'
                  : effectiveRole === 'RIDER'
                  ? 'Go to Rider Deliveries Portal'
                  : effectiveRole === 'EMPLOYEE'
                  ? 'Go to POS Counter'
                  : 'View My Member Dashboard'}
              </span>
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
