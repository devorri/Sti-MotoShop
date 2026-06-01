import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product, Sale, SaleItem } from '../context/AppContext';

export const Sales: React.FC = () => {
  const { products, setProducts, members, setMembers, sales, setSales, promos, pointsSettings } = useAppContext();
  const orderStatuses: NonNullable<Sale['orderStatus']>[] = ['ORDER PLACED', 'PREPARING', 'READY FOR PICKUP', 'OUT FOR DELIVERY', 'COMPLETED'];
  
  // Cart & Transaction states
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [orderType, setOrderType] = useState<'WALK-IN' | 'ONLINE/FACEBOOK'>('WALK-IN');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'E-WALLET' | 'ONLINE BANK'>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  
  // Scanners simulator states
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannerStatus, setScannerStatus] = useState<string | null>(null);
  
  // Post-purchase states
  const [showReceipt, setShowReceipt] = useState<any | null>(null);

  // Simulated Barcode Scanning
  const triggerSimulatedBarcodeScan = (barcode: string) => {
    setScannerStatus(`SCANNING PRODUCT BARCODE: ${barcode}...`);
    setTimeout(() => {
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        if (product.stock <= 0) {
          alert(`PRODUCT OUT OF STOCK: ${product.name}`);
        } else {
          addToCart(product);
          setScannerStatus(`ADDED: ${product.name}`);
        }
      } else {
        alert(`BARCODE NOT RECOGNIZED: ${barcode}`);
      }
      setTimeout(() => setScannerStatus(null), 1500);
    }, 600);
  };

  // Simulated Member QR Scanning
  const triggerSimulatedQRScan = (memberId: string) => {
    setScannerStatus(`SCANNING MEMBER QR CARD: ${memberId}...`);
    setTimeout(() => {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setSelectedMemberId(member.id);
        setScannerStatus(`LINKED MEMBER: ${member.name}`);
      } else {
        alert(`MEMBER QR INVALID: ${memberId}`);
      }
      setTimeout(() => setScannerStatus(null), 1500);
    }, 600);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    const cartQty = existing ? existing.quantity : 0;
    
    if (product.stock <= cartQty) {
      alert(`INSUFFICIENT STOCK: Only ${product.stock} units available.`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (qty <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    if (product.stock < qty) {
      alert(`INSUFFICIENT STOCK: Only ${product.stock} units available.`);
      return;
    }

    setCart(cart.map(item => 
      item.productId === productId ? { ...item, quantity: qty } : item
    ));
  };

  // Calculate Totals and Apply Promo Discounts
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Find highest valid discount active today
  let discountApplied = 0;
  let activePromoName = '';
  
  const todayStr = new Date().toISOString().split('T')[0];
  const activePromos = promos.filter(p => p.active && todayStr >= p.startDate && todayStr <= p.endDate);
  
  activePromos.forEach(p => {
    if (subtotal >= p.minSpend) {
      const discountVal = (subtotal * p.discountPercent) / 100;
      if (discountVal > discountApplied) {
        discountApplied = discountVal;
        activePromoName = p.name;
      }
    }
  });

  const total = subtotal - discountApplied;

  // Process Transaction
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('CART IS EMPTY!');
      return;
    }

    if (paymentMethod !== 'CASH' && !paymentRef) {
      alert('PLEASE ENTER THE E-PAYMENT REFERENCE NUMBER FOR RECONCILIATION.');
      return;
    }

    const saleId = `S${Date.now().toString().slice(-8)}`;
    const newSale = {
      id: saleId,
      items: [...cart],
      subtotal,
      discountApplied,
      total,
      date: new Date().toISOString(),
      memberId: selectedMemberId || undefined,
      channel: orderType,
      fulfillmentType: orderType === 'ONLINE/FACEBOOK' ? 'STORE PICKUP' as const : 'COUNTER' as const,
      orderStatus: orderType === 'ONLINE/FACEBOOK' ? 'ORDER PLACED' as const : 'COMPLETED' as const,
      trackingCode: `${orderType === 'ONLINE/FACEBOOK' ? 'PICKUP' : 'COUNTER'}-${saleId}`,
      notes: orderType === 'ONLINE/FACEBOOK' ? 'FACEBOOK / ONLINE ORDER RECORDED BY STAFF' : 'WALK-IN COUNTER SALE',
      paymentMethod,
      paymentRef: paymentMethod !== 'CASH' ? paymentRef : undefined
    };

    // 1. Deduct Stock in inventory
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(item => item.productId === p.id);
      return cartItem ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p;
    });
    setProducts(updatedProducts);

    // 2. Add loyalty points if member linked
    if (selectedMemberId) {
      const pointsEarned = Math.floor(total / pointsSettings.currencyPerPoint);
      const updatedMembers = members.map(m => 
        m.id === selectedMemberId ? { ...m, points: m.points + pointsEarned } : m
      );
      setMembers(updatedMembers);
    }

    // 3. Add to sales history
    setSales([...sales, newSale]);

    // 4. Save and trigger receipt modal
    setShowReceipt(newSale);
    
    // 5. Reset states
    setCart([]);
    setSelectedMemberId('');
    setPaymentRef('');
    setPaymentMethod('CASH');
  };

  const printReceipt = () => {
    window.print();
  };

  const updateOrderStatus = (saleId: string, status: NonNullable<Sale['orderStatus']>) => {
    setSales(sales.map(sale => 
      sale.id === saleId ? { ...sale, orderStatus: status } : sale
    ));
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '10px' }}>
      <h2 style={{ marginBottom: '24px' }}>POS CASHIER SYSTEM</h2>

      {scannerStatus && (
        <div style={{ 
          background: '#000', 
          color: '#fff', 
          padding: '12px 24px', 
          border: '2px solid #000',
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          fontWeight: 'bold',
          letterSpacing: '1px',
          boxShadow: '4px 4px 0px #aaa'
        }}>
          ⚡ {scannerStatus}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }} className="pos-grid">
        {/* Left Side: Product browsing & Scanners simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* HARDWARE SIMULATOR */}
          <div className="card" style={{ backgroundColor: '#f9f9f9', border: '3px solid #000' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '15px', color: '#000', borderBottom: '2px solid #000', paddingBottom: '5px' }}>🚨 INTEGRATED HARDWARE SCANNER SIMULATOR</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="simulator-columns">
              <div>
                <h4 style={{ fontSize: '0.7rem', marginBottom: '10px' }}>PRODUCT BARCODE SCAN</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {products.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => triggerSimulatedBarcodeScan(p.barcode)}
                      style={{ fontSize: '0.65rem', padding: '6px 10px', background: '#fff' }}
                    >
                      Scan: {p.name}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter manual barcode..." 
                    value={manualBarcode} 
                    onChange={e => setManualBarcode(e.target.value)}
                    style={{ fontSize: '0.7rem', padding: '6px' }}
                  />
                  <button 
                    onClick={() => {
                      triggerSimulatedBarcodeScan(manualBarcode);
                      setManualBarcode('');
                    }}
                    style={{ fontSize: '0.65rem' }}
                  >
                    SCAN
                  </button>
                </div>
              </div>
              <div style={{ borderLeft: '2px solid #000', paddingLeft: '20px' }} className="simulator-divider">
                <h4 style={{ fontSize: '0.7rem', marginBottom: '10px' }}>MEMBER QR CARD SCAN</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {members.map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => triggerSimulatedQRScan(m.id)}
                      style={{ fontSize: '0.65rem', padding: '6px 10px', background: '#fff' }}
                    >
                      Scan QR: {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT LIST */}
          <div className="card">
            <h3>PRODUCT DIRECTORY</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '15px',
              marginTop: '20px'
            }}>
              {products.map(p => (
                <div 
                  key={p.id} 
                  className="card" 
                  style={{ 
                    padding: '15px', 
                    fontSize: '0.8rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    opacity: p.stock <= 0 ? 0.5 : 1,
                    backgroundColor: p.stock <= p.lowStockLevel ? '#fffcf0' : '#fff'
                  }}
                  onClick={() => p.stock > 0 && addToCart(p)}
                >
                  <div>
                    <span className="badge" style={{ fontSize: '0.55rem', marginBottom: '5px' }}>{p.category}</span>
                    <h4 style={{ fontSize: '0.85rem', margin: '5px 0' }}>{p.name}</h4>
                    <p style={{ fontSize: '0.6rem', color: '#666' }}>BC: {p.barcode}</p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <span style={{ fontWeight: '900' }}>₱{p.price.toLocaleString()}</span>
                    <span style={{ fontSize: '0.65rem', color: p.stock <= p.lowStockLevel ? 'red' : 'inherit', fontWeight: 'bold' }}>
                      {p.stock > 0 ? `${p.stock} units` : 'OUT'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cart, Member, Payment Details, and Checkout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="card" style={{ border: '3px solid #000' }}>
            <h3>CURRENT ORDER</h3>
            
            <div style={{ margin: '15px 0' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>ORDER CHANNEL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setOrderType('WALK-IN')} 
                  className={orderType === 'WALK-IN' ? 'primary' : ''} 
                  style={{ flex: 1, fontSize: '0.65rem' }}
                >
                  WALK-IN
                </button>
                <button 
                  onClick={() => setOrderType('ONLINE/FACEBOOK')} 
                  className={orderType === 'ONLINE/FACEBOOK' ? 'primary' : ''} 
                  style={{ flex: 1, fontSize: '0.65rem' }}
                >
                  FACEBOOK / ONLINE
                </button>
              </div>
            </div>

            {/* CART ITEMS */}
            <div style={{ margin: '20px 0', maxHeight: '200px', overflowY: 'auto', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h4 style={{ fontSize: '0.7rem', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>ITEMS</h4>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#666', padding: '15px 0' }}>CART IS EMPTY</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cart.map(item => (
                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <div style={{ width: '45%' }}>
                        <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                        <br/>
                        <span style={{ fontSize: '0.6rem', color: '#666' }}>₱{item.price.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ padding: '2px 6px', fontSize: '0.6rem' }}>-</button>
                        <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ padding: '2px 6px', fontSize: '0.6rem' }}>+</button>
                      </div>
                      <div style={{ width: '25%', textAlign: 'right', fontWeight: 'bold' }}>
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LINKED MEMBER */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>ASSOCIATED MEMBER</label>
              <select 
                value={selectedMemberId} 
                onChange={e => setSelectedMemberId(e.target.value)} 
                style={{ fontSize: '0.75rem' }}
              >
                <option value="">WALK-IN (NO MEMBERSHIP)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.id} - {m.name} ({m.points} pts)</option>
                ))}
              </select>
              {selectedMemberId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: '6px', fontSize: '0.65rem', marginTop: '5px', border: '1px solid #000' }}>
                  <span>Points Earned This Sale:</span>
                  <span style={{ fontWeight: 'bold' }}>+{Math.floor(total / pointsSettings.currencyPerPoint)} pts</span>
                </div>
              )}
            </div>

            {/* PAYMENT INFORMATION */}
            <div style={{ borderTop: '2px solid #000', paddingTop: '15px', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PAYMENT METHOD</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {['CASH', 'E-WALLET', 'ONLINE BANK'].map((method) => (
                  <button 
                    key={method} 
                    type="button"
                    onClick={() => setPaymentMethod(method as any)} 
                    className={paymentMethod === method ? 'primary' : ''} 
                    style={{ flex: 1, fontSize: '0.6rem', padding: '6px 2px' }}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {paymentMethod !== 'CASH' && (
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>E-PAYMENT REF #</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ENTER REFERENCE NUMBER..." 
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '8px' }}
                  />
                </div>
              )}
            </div>

            {/* TOTALS SUMMARY */}
            <div style={{ borderTop: '2px solid #000', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span>SUBTOTAL:</span>
                <span>₱{subtotal.toLocaleString()}</span>
              </div>
              {discountApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'red', fontWeight: 'bold' }}>
                  <span>PROMO ({activePromoName}):</span>
                  <span>-₱{discountApplied.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', borderTop: '1px solid #000', paddingTop: '8px' }}>
                <span>GRAND TOTAL:</span>
                <span>₱{total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              className="primary" 
              style={{ width: '100%', marginTop: '20px', padding: '12px' }} 
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              COMPLETE TRANSACTION
            </button>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceipt && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '400px', padding: '24px' }}>
            {/* Printable Area */}
            <div id="receipt-print-area" style={{ fontFamily: 'Courier New, monospace', fontSize: '0.75rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>BOSS RAP MOTOR SHOP</h3>
                <p style={{ margin: '0 0 2px 0' }}>BRGY. SULIVAN, BALIUAG, BULACAN</p>
                <p style={{ margin: '0 0 10px 0' }}>TEL: +63 912 345 6789</p>
                <p style={{ margin: 0 }}>--------------------------------</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>SALES RECEIPT</p>
                <p style={{ margin: 0 }}>--------------------------------</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Receipt ID:</span>
                  <span>{showReceipt.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date:</span>
                  <span>{new Date(showReceipt.date).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Channel:</span>
                  <span>{showReceipt.channel || 'WALK-IN'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payment:</span>
                  <span>{showReceipt.paymentMethod}</span>
                </div>
                {showReceipt.paymentRef && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ref #:</span>
                    <span>{showReceipt.paymentRef}</span>
                  </div>
                )}
                {showReceipt.memberId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Member ID:</span>
                    <span>{showReceipt.memberId}</span>
                  </div>
                )}
              </div>

              <p style={{ margin: 0 }}>--------------------------------</p>
              <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {showReceipt.items.map((item: any, index: number) => (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.name}</span>
                      <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', paddingLeft: '10px' }}>
                      {item.quantity} x ₱{item.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0 }}>--------------------------------</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₱{showReceipt.subtotal.toLocaleString()}</span>
                </div>
                {showReceipt.discountApplied > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
                    <span>Discount:</span>
                    <span>-₱{showReceipt.discountApplied.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <span>GRAND TOTAL:</span>
                  <span>₱{showReceipt.total.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ margin: '0 0 5px 0' }}>THANK YOU FOR YOUR PATRONAGE!</p>
                <p style={{ margin: 0 }}>Please keep this receipt for return or replacement requests.</p>
                <p style={{ margin: '10px 0 0 0' }}>--------------------------------</p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }} className="no-print">
              <button className="primary" style={{ flex: 1 }} onClick={printReceipt}>PRINT RECEIPT</button>
              <button style={{ flex: 1 }} onClick={() => setShowReceipt(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '30px' }}>
        <h3>SALES TRANSACTION RECORDS</h3>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '5px 0 20px 0' }}>
          Monitor walk-in and Facebook / online transactions, payment references, and customer order status.
        </p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>RECEIPT ID</th>
                <th>DATE</th>
                <th>MEMBER</th>
                <th>CHANNEL</th>
                <th>PAYMENT</th>
                <th>REF #</th>
                <th>TOTAL</th>
                <th>ORDER STATUS</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center' }}>NO SALES RECORDED</td></tr>
              ) : (
                sales.slice().reverse().map(sale => (
                  <tr key={sale.id}>
                    <td style={{ fontWeight: 'bold' }}>{sale.id}</td>
                    <td style={{ fontSize: '0.7rem' }}>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>{sale.memberId || 'WALK-IN'}</td>
                    <td><span className="badge" style={{ fontSize: '0.55rem' }}>{sale.channel || 'WALK-IN'}</span></td>
                    <td>{sale.paymentMethod}</td>
                    <td style={{ fontSize: '0.7rem' }}>{sale.paymentRef || '-'}</td>
                    <td style={{ fontWeight: 'bold' }}>₱{sale.total.toLocaleString()}</td>
                    <td>
                      <select 
                        value={sale.orderStatus || 'COMPLETED'}
                        onChange={e => updateOrderStatus(sale.id, e.target.value as NonNullable<Sale['orderStatus']>)}
                        style={{ fontSize: '0.65rem', padding: '5px', minWidth: '150px' }}
                      >
                        {orderStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        @media (max-width: 900px) {
          .pos-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .simulator-columns { grid-template-columns: 1fr !important; }
          .simulator-divider { border-left: none !important; border-top: 2px solid #000; padding-left: 0 !important; padding-top: 15px; }
        }
      `}</style>
    </div>
  );
};
