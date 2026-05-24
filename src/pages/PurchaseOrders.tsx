import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { PurchaseOrder, PurchaseOrderItem } from '../context/AppContext';

export const PurchaseOrders: React.FC = () => {
  const { products, setProducts, purchaseOrders, setPurchaseOrders } = useAppContext();

  // Filters state
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  
  // Dynamic order items builder state
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [orderQty, setOrderQty] = useState<number>(1);
  const [costPrice, setCostPrice] = useState<number>(0);

  // Auto-generate PO ID
  const generatePOId = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PO-${year}-${rand}`;
  };

  // Add Item to current building PO list
  const handleAddItem = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('PLEASE SELECT A PRODUCT TO ORDER.');
      return;
    }
    if (orderQty <= 0) {
      alert('QUANTITY MUST BE GREATER THAN ZERO.');
      return;
    }
    if (costPrice < 0) {
      alert('COST PRICE CANNOT BE NEGATIVE.');
      return;
    }

    const matchedProduct = products.find(p => p.id === selectedProductId);
    if (!matchedProduct) return;

    // Check if already in list
    const existingIndex = orderItems.findIndex(item => item.productId === selectedProductId);
    if (existingIndex > -1) {
      // Update quantity and cost price
      const updated = [...orderItems];
      updated[existingIndex].quantity += orderQty;
      updated[existingIndex].costPrice = costPrice; // update with latest cost price
      setOrderItems(updated);
    } else {
      // Add new
      const newItem: PurchaseOrderItem = {
        productId: selectedProductId,
        name: matchedProduct.name,
        quantity: orderQty,
        costPrice: costPrice
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset items form fields
    setSelectedProductId('');
    setOrderQty(1);
    setCostPrice(0);
  };

  // Remove Item from building list
  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  // Save the complete Purchase Order
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('SUPPLIER NAME IS REQUIRED.');
      return;
    }
    if (orderItems.length === 0) {
      alert('ADD AT LEAST ONE PRODUCT ITEM TO THE ORDER.');
      return;
    }

    const totalCost = orderItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);

    const newPO: PurchaseOrder = {
      id: generatePOId(),
      supplierName: supplierName.toUpperCase(),
      items: orderItems,
      totalCost,
      status: 'PENDING',
      dateOrdered: new Date().toISOString()
    };

    setPurchaseOrders([newPO, ...purchaseOrders]);
    
    // Reset Modal Form
    setSupplierName('');
    setOrderItems([]);
    setShowCreateModal(false);
  };

  // Transition PO to RECEIVED and increment stock levels
  const handleMarkAsReceived = (po: PurchaseOrder) => {
    if (po.status === 'RECEIVED') return;

    const confirmReceive = confirm(`MARK ${po.id} AS RECEIVED?\nThis will automatically ADD all ordered item quantities to your product inventory stocks.`);
    if (!confirmReceive) return;

    // 1. Update Product Inventory stocks
    const updatedProducts = products.map(p => {
      const poItem = po.items.find(item => item.productId === p.id);
      if (poItem) {
        return {
          ...p,
          stock: p.stock + poItem.quantity
        };
      }
      return p;
    });

    // 2. Update Purchase Order Status
    const updatedPOs = purchaseOrders.map(o => {
      if (o.id === po.id) {
        return {
          ...o,
          status: 'RECEIVED' as const,
          dateReceived: new Date().toISOString()
        };
      }
      return o;
    });

    setProducts(updatedProducts);
    setPurchaseOrders(updatedPOs);
    alert(`Success! Stocks replenished successfully for ${po.id}.\nStock values updated in Inventory.`);
  };

  // Delete a PO
  const handleDeletePO = (id: string) => {
    if (confirm('ARE YOU SURE YOU WANT TO DELETE THIS PURCHASE ORDER RECORD?')) {
      setPurchaseOrders(purchaseOrders.filter(o => o.id !== id));
    }
  };

  // Filter Purchase Orders list
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesFilter = 
      filter === 'ALL' || 
      (filter === 'PENDING' && po.status === 'PENDING') || 
      (filter === 'RECEIVED' && po.status === 'RECEIVED');

    const matchesSearch = 
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2>Purchase Orders & Restocking</h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '5px 0 0 0' }}>
            Track and manage orders from suppliers. Mark orders as received to replenish your inventory levels.
          </p>
        </div>
        <button className="primary" onClick={() => setShowCreateModal(true)}>+ CREATE PURCHASE ORDER</button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '20px', margin: '24px 0', alignItems: 'center', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="SEARCH BY PO ID, SUPPLIER, OR PRODUCT NAME..." 
          value={searchTerm}
          style={{ maxWidth: '400px', margin: 0 }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'PENDING', 'RECEIVED'] as const).map(type => (
            <button 
              key={type} 
              className={filter === type ? 'primary' : ''} 
              onClick={() => setFilter(type)}
              style={{ fontSize: '0.65rem', padding: '8px 12px' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main PO List Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>PO ID</th>
              <th>SUPPLIER</th>
              <th>DATE ORDERED</th>
              <th>ITEMS & QTY</th>
              <th>TOTAL COST</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredPOs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>NO PURCHASE ORDERS FOUND</td></tr>
            ) : (
              filteredPOs.map(po => (
                <tr key={po.id} style={{ backgroundColor: po.status === 'PENDING' ? '#fffcf0' : 'transparent' }}>
                  <td style={{ fontWeight: 'bold' }}><code>{po.id}</code></td>
                  <td style={{ fontWeight: 'bold' }}>{po.supplierName}</td>
                  <td style={{ fontSize: '0.75rem' }}>
                    <div>Ordered: {new Date(po.dateOrdered).toLocaleDateString()}</div>
                    {po.dateReceived && (
                      <div style={{ color: 'green', fontSize: '0.65rem', marginTop: '2px' }}>
                        Received: {new Date(po.dateReceived).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', maxWidth: '300px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {po.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '2px' }}>
                          <span>{item.name}</span>
                          <span style={{ fontWeight: 'bold' }}>x{item.quantity} <span style={{ opacity: 0.5, fontWeight: 'normal' }}>(₱{item.costPrice})</span></span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>₱{po.totalCost.toLocaleString()}</td>
                  <td>
                    {po.status === 'PENDING' ? (
                      <span className="badge" style={{ borderColor: 'orange', color: 'orange' }}>PENDING DELIVERY</span>
                    ) : (
                      <span className="badge" style={{ borderColor: 'green', color: 'green' }}>RECEIVED & STOCKED</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {po.status === 'PENDING' && (
                        <button 
                          className="primary" 
                          style={{ fontSize: '0.6rem', padding: '4px 8px', backgroundColor: 'green', color: '#fff', border: 'none' }}
                          onClick={() => handleMarkAsReceived(po)}
                        >
                          RECEIVE ITEMS
                        </button>
                      )}
                      <button 
                        style={{ fontSize: '0.6rem', padding: '4px 8px', color: 'red', borderColor: 'red' }} 
                        onClick={() => handleDeletePO(po.id)}
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '650px', width: '90%' }}>
            <h3>CREATE NEW SUPPLIER PURCHASE ORDER</h3>
            
            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              
              {/* Supplier Name */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SUPPLIER NAME</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.G. MOTO DISTRIBUTORS INC." 
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                />
              </div>

              {/* Items Section Builder */}
              <div style={{ border: '2px solid #000', padding: '15px', backgroundColor: '#f9f9f9' }}>
                <h4 style={{ fontSize: '0.75rem', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>ADD PRODUCT ITEMS</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }} className="builder-row">
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>SELECT INVENTORY PRODUCT</label>
                    <select 
                      value={selectedProductId} 
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        // Auto-fill cost price with a default markup subtraction from retail price
                        const matched = products.find(p => p.id === e.target.value);
                        if (matched) {
                          setCostPrice(Math.round(matched.price * 0.7)); // 30% margin default
                        }
                      }}
                      style={{ fontSize: '0.75rem', padding: '6px' }}
                    >
                      <option value="">-- SELECT PRODUCT --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}, Retail: ₱{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>QUANTITY</label>
                    <input 
                      type="number" 
                      min={1}
                      value={orderQty}
                      style={{ fontSize: '0.75rem', padding: '6px' }}
                      onChange={e => setOrderQty(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>COST PRICE (₱)</label>
                    <input 
                      type="number" 
                      min={0}
                      value={costPrice}
                      style={{ fontSize: '0.75rem', padding: '6px' }}
                      onChange={e => setCostPrice(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleAddItem}
                  style={{ width: '100%', marginTop: '12px', padding: '6px', fontSize: '0.65rem' }}
                >
                  + ADD PRODUCT TO LIST
                </button>
              </div>

              {/* Items List in Modal */}
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '0.7rem', borderBottom: '1px solid #000', paddingBottom: '3px', marginBottom: '10px' }}>ORDERED ITEMS LIST</h4>
                {orderItems.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'center', padding: '10px 0' }}>NO ITEMS ADDED YET</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {orderItems.map(item => (
                      <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                        <div style={{ width: '50%', fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ width: '30%' }}>
                          {item.quantity} units x ₱{item.costPrice.toLocaleString()}
                        </div>
                        <div style={{ width: '20%', textAlign: 'right' }}>
                          <button 
                            type="button" 
                            style={{ fontSize: '0.55rem', padding: '2px 6px', color: 'red', borderColor: 'red' }}
                            onClick={() => handleRemoveItem(item.productId)}
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Running Total & Save */}
              <div style={{ borderTop: '2px solid #000', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#666', display: 'block' }}>ESTIMATED TOTAL COST:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900' }}>
                    ₱{orderItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0).toLocaleString()}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="primary">CREATE PURCHASE ORDER</button>
                  <button type="button" onClick={() => {
                    setSupplierName('');
                    setOrderItems([]);
                    setShowCreateModal(false);
                  }}>CANCEL</button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .builder-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
