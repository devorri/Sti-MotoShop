import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Dashboard = () => {
  const { sales, products, members } = useAppContext();
  
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Dashboard Overview</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginTop: '24px' 
      }}>
        <StatCard label="TOTAL SALES" value={`₱${sales.reduce((sum, s) => sum + s.total, 0).toLocaleString()}`} />
        <StatCard label="PRODUCTS" value={products.length.toString()} />
        <StatCard label="MEMBERS" value={members.length.toString()} />
        <StatCard label="LOW STOCK" value={products.filter(p => p.stock <= p.lowStockLevel).length.toString()} highlight={products.filter(p => p.stock <= p.lowStockLevel).length > 0} />
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
                <tr><th>PRODUCT</th><th>STOCK</th></tr>
              </thead>
              <tbody>
                {products.filter(p => p.stock <= p.lowStockLevel).length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center' }}>NO LOW STOCK</td></tr>
                ) : (
                  products.filter(p => p.stock <= p.lowStockLevel).map(p => (
                    <tr key={p.id}><td>{p.name}</td><td style={{ fontWeight: 'bold' }}>{p.stock}</td></tr>
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
                <tr><th>DATE</th><th>TOTAL</th></tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center' }}>NO SALES YET</td></tr>
                ) : (
                  sales.slice(-5).reverse().map(s => (
                    <tr key={s.id}><td>{new Date(s.date).toLocaleDateString()}</td><td>₱{s.total.toLocaleString()}</td></tr>
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
    if (newUser.name && newUser.username) {
      setUsers([...users, { ...newUser, id: Date.now().toString() }]);
      setShowAdd(false);
      setNewUser({ name: '', username: '', password: '', role: 'EMPLOYEE' });
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h2>User Management</h2>
        <button className="primary" onClick={() => setShowAdd(true)}>+ ADD EMPLOYEE</button>
      </div>

      <div className="table-container" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr><th>ID</th><th>NAME</th><th>USERNAME</th><th>ROLE</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.username}</td>
                <td><span className="badge">{u.role}</span></td>
                <td><button disabled={u.role === 'ADMIN'} style={{ fontSize: '0.6rem' }}>DISABLE</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>CREATE EMPLOYEE ACCOUNT</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <input placeholder="FULL NAME" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}/>
              <input placeholder="USERNAME" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}/>
              <input type="password" placeholder="PASSWORD" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}/>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
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
  const { products } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h2>Inventory Control</h2>
        <button className="primary">+ ADD PRODUCT</button>
      </div>
      <input 
        type="text" 
        placeholder="SEARCH STOCK..." 
        style={{ margin: '24px 0', maxWidth: '400px' }}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="table-container">
        <table>
          <thead>
            <tr><th>NAME</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th></tr>
          </thead>
          <tbody>
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>₱{p.price.toLocaleString()}</td>
                <td>{p.stock}</td>
                <td>{p.stock <= p.lowStockLevel ? <span className="badge danger">LOW STOCK</span> : <span className="badge">OK</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

