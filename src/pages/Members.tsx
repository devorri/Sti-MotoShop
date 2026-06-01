import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Members: React.FC = () => {
  const { members, setMembers, users, setUsers, sales, pointsSettings, setPointsSettings } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', contact: '', address: '', username: '', password: '' });
  const [activeQRMember, setActiveQRMember] = useState<any | null>(null);
  const [activeHistoryMember, setActiveHistoryMember] = useState<any | null>(null);
  
  // Local points settings form state
  const [ptsRule, setPtsRule] = useState({
    currencyPerPoint: pointsSettings.currencyPerPoint,
    pointValue: pointsSettings.pointValue
  });
  const [ruleSaved, setRuleSaved] = useState(false);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.contact || !newMember.username || !newMember.password) {
      alert('PLEASE FILL OUT ALL FIELDS.');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === newMember.username.toLowerCase())) {
      alert('USERNAME ALREADY EXISTS.');
      return;
    }

    const memberId = `M${(members.length + 1).toString().padStart(3, '0')}`;
    const newMemberProfile = {
      id: memberId,
      name: newMember.name.toUpperCase(),
      contact: newMember.contact,
      address: newMember.address || 'N/A',
      joinDate: new Date().toISOString().split('T')[0],
      points: 0
    };

    const newMemberUser = {
      id: `U_${memberId}`,
      name: newMember.name.toUpperCase(),
      username: newMember.username,
      password: newMember.password,
      role: 'CUSTOMER' as const,
      memberId: memberId,
      enabled: true
    };

    setMembers([...members, newMemberProfile]);
    setUsers([...users, newMemberUser]);

    setNewMember({ name: '', contact: '', address: '', username: '', password: '' });
    setShowAdd(false);
    alert(`MEMBERSHIP REGISTERED SUCCESSFULLY! ID: ${memberId}`);
  };

  const handleSavePointsSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPointsSettings({
      currencyPerPoint: Number(ptsRule.currencyPerPoint),
      pointValue: Number(ptsRule.pointValue)
    });
    setRuleSaved(true);
    setTimeout(() => setRuleSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <h2>Membership Management</h2>
        <button className="primary" onClick={() => setShowAdd(true)}>+ REGISTER MEMBER</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }} className="members-grid">
        
        {/* Members List */}
        <div className="card">
          <h3>ACTIVE MEMBERS</h3>
          <div className="table-container" style={{ marginTop: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>MEMBER ID</th>
                  <th>NAME</th>
                  <th>CONTACT</th>
                  <th>ADDRESS</th>
                  <th>JOIN DATE</th>
                  <th>POINTS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center' }}>NO MEMBERS FOUND</td></tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 'bold' }}>{m.id}</td>
                      <td>{m.name}</td>
                      <td>{m.contact}</td>
                      <td>{m.address}</td>
                      <td>{m.joinDate}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#000', color: '#fff' }}>{m.points} pts</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button 
                            style={{ fontSize: '0.65rem', padding: '4px 8px' }}
                            onClick={() => setActiveQRMember(m)}
                          >
                            VIEW QR CARD
                          </button>
                          <button 
                            style={{ fontSize: '0.65rem', padding: '4px 8px' }}
                            onClick={() => setActiveHistoryMember(m)}
                          >
                            VIEW HISTORY
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loyalty Rules Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3>POINTS & LOYALTY RULES</h3>
          <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '10px 0 20px' }}>
            Configure how membership points are calculated and valued at checkout.
          </p>

          <form onSubmit={handleSavePointsSettings} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SPEND THRESHOLD (PHP PER 1 POINT)</label>
              <input 
                type="number" 
                required 
                min={1}
                value={ptsRule.currencyPerPoint}
                onChange={e => setPtsRule({...ptsRule, currencyPerPoint: Number(e.target.value)})}
              />
              <span style={{ fontSize: '0.6rem', color: '#666' }}>E.G., ₱100 spent = 1 point</span>
            </div>

            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>POINT CASH-VALUE (PHP VALUE PER 1 PT)</label>
              <input 
                type="number" 
                required 
                min={0}
                step={0.1}
                value={ptsRule.pointValue}
                onChange={e => setPtsRule({...ptsRule, pointValue: Number(e.target.value)})}
              />
              <span style={{ fontSize: '0.6rem', color: '#666' }}>Used during checkout redemptions.</span>
            </div>

            {ruleSaved && (
              <p style={{ color: 'green', fontSize: '0.7rem', fontWeight: 'bold' }}>LOYALTY POLICY RULES UPDATED!</p>
            )}

            <button type="submit" className="primary" style={{ width: '100%', marginTop: '10px' }}>SAVE LOYALTY RULES</button>
          </form>
        </div>
      </div>

      {/* QR MODAL */}
      {activeQRMember && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '350px', textAlign: 'center' }}>
            <h4 style={{ letterSpacing: '4px', marginBottom: '10px' }}>BOSS RAP MEMBER ID</h4>
            <div style={{ border: '2px solid #000', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', background: '#fff' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${activeQRMember.id}`} 
                alt={`QR code for ${activeQRMember.name}`}
                style={{ border: '1px solid #000', width: '150px', height: '150px' }}
              />
              <div>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{activeQRMember.name}</p>
                <p style={{ fontSize: '0.7rem', letterSpacing: '2px', color: '#666', margin: '5px 0' }}>MEMBER ID: {activeQRMember.id}</p>
                <span className="badge" style={{ marginTop: '5px' }}>Points: {activeQRMember.points}</span>
              </div>
            </div>
            <button style={{ marginTop: '20px', width: '100%' }} onClick={() => setActiveQRMember(null)}>CLOSE CARD</button>
          </div>
        </div>
      )}

      {/* MEMBER TRANSACTION HISTORY MODAL */}
      {activeHistoryMember && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h3>{activeHistoryMember.name} TRANSACTION HISTORY</h3>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '5px' }}>
                  Member ID: {activeHistoryMember.id} | Points: {activeHistoryMember.points}
                </p>
              </div>
              <button onClick={() => setActiveHistoryMember(null)} style={{ fontSize: '0.7rem' }}>CLOSE</button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>RECEIPT ID</th>
                    <th>DATE</th>
                    <th>CHANNEL</th>
                    <th>ITEMS</th>
                    <th>PAYMENT</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.filter(s => s.memberId === activeHistoryMember.id).length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>NO TRANSACTIONS FOUND FOR THIS MEMBER</td></tr>
                  ) : (
                    sales
                      .filter(s => s.memberId === activeHistoryMember.id)
                      .slice()
                      .reverse()
                      .map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 'bold' }}>{s.id}</td>
                          <td style={{ fontSize: '0.7rem' }}>{new Date(s.date).toLocaleDateString()}</td>
                          <td><span className="badge" style={{ fontSize: '0.55rem' }}>{s.channel || 'WALK-IN'}</span></td>
                          <td style={{ fontSize: '0.7rem' }}>{s.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
                          <td style={{ fontSize: '0.7rem' }}>{s.paymentMethod}{s.paymentRef ? ` / ${s.paymentRef}` : ''}</td>
                          <td style={{ fontWeight: 'bold' }}>₱{s.total.toLocaleString()}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAdd && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '450px' }}>
            <h3>REGISTER CUSTOMER MEMBERSHIP</h3>
            <p style={{ fontSize: '0.7rem', opacity: 0.7, margin: '8px 0 20px' }}>
              Create a new customer profile and login account in one step.
            </p>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>FULL NAME</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.G. JUAN DELA CRUZ"
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>CONTACT #</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="E.G. 09123456789"
                    value={newMember.contact}
                    onChange={e => setNewMember({...newMember, contact: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>ADDRESS</label>
                  <input 
                    type="text" 
                    placeholder="E.G. BALIUAG, BULACAN"
                    value={newMember.address}
                    onChange={e => setNewMember({...newMember, address: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '5px' }}>
                <h4 style={{ fontSize: '0.7rem', marginBottom: '15px' }}>LOGIN CREDENTIALS</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>USERNAME</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="E.G. juan123"
                      value={newMember.username}
                      onChange={e => setNewMember({...newMember, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>PASSWORD</label>
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={newMember.password}
                      onChange={e => setNewMember({...newMember, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>CREATE ACCOUNT</button>
                <button type="button" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .members-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
