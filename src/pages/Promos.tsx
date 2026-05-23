import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Promos: React.FC = () => {
  const { promos, setPromos } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [newPromo, setNewPromo] = useState({
    name: '',
    description: '',
    discountPercent: 10,
    minSpend: 500,
    startDate: '',
    endDate: '',
  });

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.name || !newPromo.description || !newPromo.startDate || !newPromo.endDate) {
      alert('PLEASE FILL OUT ALL REQUIRED FIELDS.');
      return;
    }

    const id = `P${Date.now().toString().slice(-4)}`;
    const newCampaign = {
      id,
      name: newPromo.name.toUpperCase().replace(/\s+/g, '_'),
      description: newPromo.description,
      discountPercent: Number(newPromo.discountPercent),
      minSpend: Number(newPromo.minSpend),
      startDate: newPromo.startDate,
      endDate: newPromo.endDate,
      active: true
    };

    setPromos([...promos, newCampaign]);
    setShowAdd(false);
    setNewPromo({
      name: '',
      description: '',
      discountPercent: 10,
      minSpend: 500,
      startDate: '',
      endDate: '',
    });
  };

  const togglePromoStatus = (id: string) => {
    const updated = promos.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    );
    setPromos(updated);
  };

  const deletePromo = (id: string) => {
    if (confirm('ARE YOU SURE YOU WANT TO DELETE THIS CAMPAIGN?')) {
      setPromos(promos.filter(p => p.id !== id));
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <h2>Promotions & Discount Campaigns</h2>
        <button className="primary" onClick={() => setShowAdd(true)}>+ CREATE CAMPAIGN</button>
      </div>

      <div className="card">
        <h3>ACTIVE & SCHEDULED PROMOTIONS</h3>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '5px 0 25px 0' }}>
          These discounts will be automatically evaluated at the POS terminal checkout based on subtotal limits.
        </p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>CODE / NAME</th>
                <th>DESCRIPTION</th>
                <th>DISCOUNT (%)</th>
                <th>MIN. SPEND</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center' }}>NO CAMPAIGNS CREATED YET</td></tr>
              ) : (
                promos.map(p => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                    <td>{p.description}</td>
                    <td>
                      <span className="badge" style={{ borderColor: 'green', color: 'green', fontWeight: 'bold' }}>{p.discountPercent}% OFF</span>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>₱{p.minSpend.toLocaleString()}</td>
                    <td>{p.startDate}</td>
                    <td>{p.endDate}</td>
                    <td>
                      <button 
                        onClick={() => togglePromoStatus(p.id)}
                        className={p.active ? 'primary' : ''}
                        style={{ fontSize: '0.6rem', padding: '4px 8px', width: '80px' }}
                      >
                        {p.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td>
                      <button 
                        style={{ fontSize: '0.6rem', padding: '4px 8px', color: 'red', borderColor: 'red' }}
                        onClick={() => deletePromo(p.id)}
                      >
                        DELETE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <h3>CREATE DISCOUNT CAMPAIGN</h3>
            <p style={{ fontSize: '0.7rem', opacity: 0.7, margin: '8px 0 20px' }}>
              Create discount triggers linked to purchases at the cash register.
            </p>

            <form onSubmit={handleAddPromo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PROMO CODE / NAME</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.G. RAMADAN_15"
                  value={newPromo.name}
                  onChange={e => setNewPromo({...newPromo, name: e.target.value})}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>CAMPAIGN DESCRIPTION</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.G. 15% discount for walk-in and online purchases"
                  value={newPromo.description}
                  onChange={e => setNewPromo({...newPromo, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>DISCOUNT PERCENTAGE (%)</label>
                  <input 
                    type="number" 
                    required 
                    min={1}
                    max={100}
                    value={newPromo.discountPercent}
                    onChange={e => setNewPromo({...newPromo, discountPercent: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>MINIMUM PURCHASE (₱)</label>
                  <input 
                    type="number" 
                    required 
                    min={0}
                    value={newPromo.minSpend}
                    onChange={e => setNewPromo({...newPromo, minSpend: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>START VALID DATE</label>
                  <input 
                    type="date" 
                    required 
                    value={newPromo.startDate}
                    onChange={e => setNewPromo({...newPromo, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>END EXPIRY DATE</label>
                  <input 
                    type="date" 
                    required 
                    value={newPromo.endDate}
                    onChange={e => setNewPromo({...newPromo, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>SAVE CAMPAIGN</button>
                <button type="button" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
