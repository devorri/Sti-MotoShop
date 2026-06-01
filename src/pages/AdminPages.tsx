import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../context/AppContext';

export const Dashboard = () => {
  const { sales, products, members, returnRequests, promos, inquiries } = useAppContext();
  
  const pendingReturns = returnRequests.filter(r => r.status === 'PENDING').length;
  const activePromos = promos.filter(p => p.active).length;
  const pendingInquiries = inquiries.length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Dashboard Overview</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginTop: '24px' 
      }}>
        <StatCard label="TOTAL SALES" value={`₱${sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}`} />
        <StatCard label="PRODUCTS" value={products.length.toString()} />
        <StatCard label="MEMBERS" value={members.length.toString()} />
        <StatCard label="LOW STOCK" value={products.filter(p => p.stock <= p.lowStockLevel).length.toString()} highlight={products.filter(p => p.stock <= p.lowStockLevel).length > 0} />
        <StatCard label="PENDING RETURNS" value={pendingReturns.toString()} highlight={pendingReturns > 0} />
        <StatCard label="ACTIVE PROMOS" value={activePromos.toString()} />
        <StatCard label="CUSTOMER MESSAGES" value={pendingInquiries.toString()} highlight={pendingInquiries > 0} />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '30px', 
        marginTop: '40px' 
      }}>
        <div className="card">
          <h3>LOW STOCK ALERTS</h3>
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr><th>PRODUCT</th><th>BARCODE</th><th>STOCK</th></tr>
              </thead>
              <tbody>
                {products.filter(p => p.stock <= p.lowStockLevel).length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>NO LOW STOCK</td></tr>
                ) : (
                  products.filter(p => p.stock <= p.lowStockLevel).map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td><code>{p.barcode}</code></td>
                      <td style={{ fontWeight: 'bold', color: 'red' }}>{p.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>RECENT SALES</h3>
          <div className="table-container" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr><th>DATE</th><th>METHOD</th><th>TOTAL</th></tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>NO SALES YET</td></tr>
                ) : (
                  sales.slice(-5).reverse().map(s => (
                    <tr key={s.id}>
                      <td>{new Date(s.date).toLocaleDateString()}</td>
                      <td><span className="badge">{s.paymentMethod}</span></td>
                      <td style={{ fontWeight: 'bold' }}>₱{s.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <div className="card" style={{ border: highlight ? '4px solid #000' : '2px solid #000', display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>{label}</p>
    <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{value}</h3>
  </div>
);

export const UserManagement = () => {
  const { users, setUsers } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'EMPLOYEE' as any });

  const addUser = () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      alert('PLEASE COMPLETE THE STAFF ACCOUNT DETAILS.');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      alert('USERNAME ALREADY EXISTS.');
      return;
    }

    setUsers([...users, { ...newUser, id: `U_${Date.now()}`, enabled: true }]);
    setShowAdd(false);
    setNewUser({ name: '', username: '', password: '', role: 'EMPLOYEE' });
  };

  const toggleUserStatus = (id: string) => {
    const updated = users.map(u => 
      u.id === id ? { ...u, enabled: !u.enabled } : u
    );
    setUsers(updated);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h2>User Account Management</h2>
        <button className="primary" onClick={() => setShowAdd(true)}>+ ADD STAFF ACCOUNT</button>
      </div>

      <div className="table-container" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr><th>NAME</th><th>USERNAME</th><th>ROLE</th><th>STATUS</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ opacity: u.enabled ? 1 : 0.5 }}>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td><span className="badge">{u.role}</span></td>
                <td>
                  <span className="badge" style={{ 
                    borderColor: u.enabled ? 'green' : 'red', 
                    color: u.enabled ? 'green' : 'red' 
                  }}>
                    {u.enabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td>
                  <button 
                    disabled={u.role === 'ADMIN'} 
                    onClick={() => toggleUserStatus(u.id)}
                    style={{ fontSize: '0.65rem', width: '90px' }}
                  >
                    {u.enabled ? 'DISABLE' : 'ENABLE'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h3>CREATE STAFF ACCOUNT</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>FULL NAME</label>
                <input placeholder="E.G. MIKE CORLEONE" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value.toUpperCase()})}/>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>USERNAME</label>
                <input placeholder="E.G. mike123" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}/>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>PASSWORD</label>
                <input type="password" placeholder="••••••••" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}/>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>ROLE SYSTEM ACCESS</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                  <option value="EMPLOYEE">EMPLOYEE / STAFF</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button className="primary" onClick={addUser}>CREATE ACCOUNT</button>
                <button onClick={() => setShowAdd(false)}>CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Inventory = () => {
  const { products, setProducts } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState<any | null>(null); // Null = closed, 'ADD' = adding, Product = editing
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    lowStockLevel: 5,
    description: '',
    barcode: ''
  });

  const [activeBarcodeCard, setActiveBarcodeCard] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Parts',
      price: 0,
      stock: 0,
      lowStockLevel: 5,
      description: '',
      barcode: `501${Math.floor(100000000 + Math.random() * 900000000)}` // Auto-generate random 12-digit UPC barcode
    });
    setShowForm('ADD');
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      lowStockLevel: p.lowStockLevel,
      description: p.description || '',
      barcode: p.barcode || ''
    });
    setShowForm(p);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode) {
      alert('PRODUCT NAME AND BARCODE ARE REQUIRED.');
      return;
    }

    if (showForm === 'ADD') {
      const newProduct: Product = {
        id: `P${Date.now()}`,
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        lowStockLevel: Number(formData.lowStockLevel),
        description: formData.description,
        barcode: formData.barcode
      };
      setProducts([...products, newProduct]);
    } else {
      // Editing existing
      const updated = products.map(p => 
        p.id === showForm.id ? {
          ...p,
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          stock: Number(formData.stock),
          lowStockLevel: Number(formData.lowStockLevel),
          description: formData.description,
          barcode: formData.barcode
        } : p
      );
      setProducts(updated);
    }
    setShowForm(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('ARE YOU SURE YOU WANT TO DELETE THIS PRODUCT?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h2>Inventory Control panel</h2>
        <button className="primary" onClick={handleOpenAdd}>+ ADD PRODUCT</button>
      </div>

      <input 
        type="text" 
        placeholder="SEARCH BY PRODUCT NAME OR BARCODE..." 
        value={searchTerm}
        style={{ margin: '24px 0', maxWidth: '400px' }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>BARCODE</th>
              <th>NAME</th>
              <th>DESCRIPTION</th>
              <th>CATEGORY</th>
              <th>PRICE</th>
              <th>STOCK</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p => 
              p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(p => (
              <tr key={p.id} style={{ backgroundColor: p.stock <= p.lowStockLevel ? '#fffcf0' : 'transparent' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <code>{p.barcode}</code>
                    <button 
                      style={{ fontSize: '0.55rem', padding: '2px 5px' }}
                      onClick={() => setActiveBarcodeCard(p.barcode)}
                    >
                      SHOW CARD
                    </button>
                  </div>
                </td>
                <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ fontSize: '0.75rem', maxWidth: '250px' }}>{p.description}</td>
                <td><span className="badge">{p.category}</span></td>
                <td style={{ fontWeight: 'bold' }}>₱{p.price.toLocaleString()}</td>
                <td style={{ fontWeight: 'bold' }}>{p.stock}</td>
                <td>
                  {p.stock <= p.lowStockLevel ? (
                    <span className="badge danger">LOW STOCK (min: {p.lowStockLevel})</span>
                  ) : (
                    <span className="badge" style={{ borderColor: 'green', color: 'green' }}>OK</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ fontSize: '0.6rem', padding: '4px 8px' }} onClick={() => handleOpenEdit(p)}>EDIT</button>
                    <button style={{ fontSize: '0.6rem', padding: '4px 8px', color: 'red', borderColor: 'red' }} onClick={() => handleDeleteProduct(p.id)}>DELETE</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BARCODE MODAL */}
      {activeBarcodeCard && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '350px', textAlign: 'center' }}>
            <h4 style={{ letterSpacing: '4px', marginBottom: '15px' }}>BARCODE GENERATOR</h4>
            <div style={{ border: '2px solid #000', padding: '25px 15px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              {/* Simulated barcode using CSS bars */}
              <div style={{ display: 'flex', height: '60px', width: '220px', background: '#fff', justifyContent: 'center', alignItems: 'stretch' }}>
                {activeBarcodeCard.split('').map((char, index) => {
                  const val = Number(char) || index;
                  const width = (val % 3) + 1;
                  const gap = (val % 2) + 1;
                  return (
                    <React.Fragment key={index}>
                      <div style={{ width: `${width}px`, backgroundColor: '#000' }}></div>
                      <div style={{ width: `${gap}px` }}></div>
                    </React.Fragment>
                  );
                })}
              </div>
              <code style={{ fontSize: '1rem', letterSpacing: '3px', fontWeight: 'bold', display: 'block', marginTop: '10px' }}>{activeBarcodeCard}</code>
              <p style={{ fontSize: '0.6rem', opacity: 0.6, margin: 0 }}>BOSS RAP INVENTORY IDENTIFIER</p>
            </div>
            <button style={{ marginTop: '20px', width: '100%' }} onClick={() => setActiveBarcodeCard(null)}>CLOSE BARCODE</button>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h3>{showForm === 'ADD' ? 'ADD PRODUCT TO STOCK' : 'EDIT PRODUCT PROFILE'}</h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>BARCODE</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>CATEGORY</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Parts">SPARE PARTS</option>
                    <option value="Lubricant">LUBRICANTS</option>
                    <option value="Brakes">BRAKES</option>
                    <option value="Tires">TIRES</option>
                    <option value="Electrical">ELECTRICAL</option>
                    <option value="Accessories">ACCESSORIES</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PRODUCT NAME</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.G. YOSHIMURA EXHAUST SYSTEM"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PRODUCT DESCRIPTION</label>
                <input 
                  type="text" 
                  placeholder="E.G. Full exhaust system upgrade for 150cc scooters"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PRICE (₱)</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>STOCK QTY</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>MIN. ALARM</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    value={formData.lowStockLevel}
                    onChange={e => setFormData({...formData, lowStockLevel: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>SAVE PRODUCT</button>
                <button type="button" style={{ flex: 1 }} onClick={() => setShowForm(null)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
