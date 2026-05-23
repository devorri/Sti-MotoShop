import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const CustomerDashboard = () => {
  const { currentUser, members, sales, returnRequests, setReturnRequests } = useAppContext();

  // Active view tab state
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'RETURN_CLAIM'>('PROFILE');

  // Return request form state
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState('');
  const [claimType, setClaimType] = useState<'RETURN' | 'REPLACE'>('RETURN');
  const [reason, setReason] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Find membership profile
  const profile = members.find(m => m.id === currentUser?.memberId);
  // Find transactions for this member
  const history = sales.filter(s => s.memberId === currentUser?.memberId);
  // Find return requests for this member
  const myClaims = returnRequests.filter(r => r.memberId === currentUser?.memberId);

  if (!profile) {
    return (
      <div style={{ padding: '5vw', textAlign: 'center' }}>
        <h2>ACCOUNT NOT LINKED</h2>
        <p style={{ marginTop: '20px' }}>PLEASE CONTACT THE SHOP TO LINK YOUR MEMBERSHIP PROFILE.</p>
      </div>
    );
  }

  // Find items of the selected sale to let the customer select
  const currentSale = history.find(s => s.id === selectedSaleId);
  const eligibleItems = currentSale ? currentSale.items : [];

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleId || selectedItemIndex === '' || !reason) {
      alert('PLEASE FILL OUT ALL FORM FIELDS.');
      return;
    }

    const item = eligibleItems[Number(selectedItemIndex)];
    const ticketId = `TKT${Date.now().toString().slice(-6)}`;
    const newRequest = {
      id: ticketId,
      saleId: selectedSaleId,
      memberId: profile.id,
      items: [{ productId: item.productId, name: item.name, quantity: item.quantity, price: item.price }],
      reason,
      type: claimType,
      status: 'PENDING' as const,
      date: new Date().toISOString()
    };

    setReturnRequests([...returnRequests, newRequest]);
    setTicketSubmitted(true);
    setSelectedSaleId('');
    setSelectedItemIndex('');
    setReason('');
    setTimeout(() => {
      setTicketSubmitted(false);
      setActiveTab('PROFILE');
    }, 3000);
  };

  return (
    <div style={{ padding: '5vw', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '30px', marginBottom: '45px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1 }}>HELLO, {profile.name}!</h1>
          <p style={{ fontSize: '0.8rem', letterSpacing: '2px', marginTop: '10px' }}>OFFICIAL MEMBER SINCE {new Date(profile.joinDate).getFullYear()}</p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={activeTab === 'PROFILE' ? 'primary' : ''} 
            onClick={() => setActiveTab('PROFILE')}
            style={{ fontSize: '0.75rem' }}
          >
            My Profile & History
          </button>
          <button 
            className={activeTab === 'RETURN_CLAIM' ? 'primary' : ''} 
            onClick={() => setActiveTab('RETURN_CLAIM')}
            style={{ fontSize: '0.75rem' }}
          >
            File Return/Replace Request
          </button>
        </div>
      </div>

      {activeTab === 'PROFILE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }} className="customer-grid">
          
          {/* Purchase History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="card">
              <h3>PURCHASE JOURNAL</h3>
              <div className="table-container" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>RECEIPT ID</th>
                      <th>DATE Purchased</th>
                      <th>ITEMS</th>
                      <th>PAYMENT</th>
                      <th>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center' }}>NO TRANSACTIONS FOUND</td></tr>
                    ) : (
                      history.slice().reverse().map(sale => (
                        <tr key={sale.id}>
                          <td style={{ fontWeight: 'bold' }}>{sale.id}</td>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(sale.date).toLocaleDateString()}</td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                          </td>
                          <td>
                            <span className="badge" style={{ fontSize: '0.6rem' }}>{sale.paymentMethod}</span>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>₱{sale.total.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submitted Claims */}
            <div className="card">
              <h3>MY RETURN & REPLACE TICKETS</h3>
              <div className="table-container" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>TICKET ID</th>
                      <th>DATE SUBMITTED</th>
                      <th>RECEIPT ID</th>
                      <th>CLAIM TYPE</th>
                      <th>ITEMS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myClaims.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center' }}>NO TICKETS SUBMITTED</td></tr>
                    ) : (
                      myClaims.map(claim => (
                        <tr key={claim.id}>
                          <td style={{ fontWeight: 'bold' }}>{claim.id}</td>
                          <td style={{ fontSize: '0.75rem' }}>{new Date(claim.date).toLocaleDateString()}</td>
                          <td>{claim.saleId}</td>
                          <td>
                            <span className={`badge ${claim.type === 'RETURN' ? 'danger' : ''}`} style={{ fontSize: '0.65rem' }}>
                              {claim.type}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {claim.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                          </td>
                          <td>
                            <span className="badge" style={{ 
                              borderColor: claim.status === 'PENDING' ? '#aaa' : claim.status === 'APPROVED' ? 'green' : 'red',
                              color: claim.status === 'PENDING' ? '#666' : claim.status === 'APPROVED' ? 'green' : 'red',
                              fontWeight: 'bold'
                            }}>
                              {claim.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Member Card & Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Loyalty points card */}
            <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>ACCUMULATED REWARDS POINTS</p>
              <h2 style={{ fontSize: '3.5rem', margin: '10px 0', fontWeight: '900' }}>{profile.points}</h2>
              <div style={{ width: '100%', height: '10px', background: '#eee', marginTop: '10px', position: 'relative' }}>
                <div style={{ 
                  width: `${Math.min((profile.points / 500) * 100, 100)}%`, 
                  height: '100%', 
                  background: '#000', 
                  transition: 'width 1s ease-out' 
                }}></div>
              </div>
              <p style={{ fontSize: '0.6rem', marginTop: '10px', color: '#666' }}>
                {profile.points >= 500 ? 'CONGRATS! CHAT WITH COUNTER FOR LOYALTY DISCOUNT REDEMPTION.' : `${500 - (profile.points % 500)} PTS TO BRONZE LEVEL REDEMPTION`}
              </p>
            </div>

            {/* Member Details */}
            <div className="card">
              <h3>MEMBERSHIP STATUS</h3>
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>MEMBER ID</span>
                  <span style={{ fontWeight: 'bold' }}>{profile.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>CONTACT #</span>
                  <span style={{ fontWeight: 'bold' }}>{profile.contact}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>ADDRESS</span>
                  <span style={{ fontWeight: 'bold' }}>{profile.address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.7rem', color: '#666' }}>TIER</span>
                  <span className="badge">LOYAL CUSTOMER</span>
                </div>
              </div>
            </div>

            {/* Simulated QR card */}
            <div style={{ 
              background: '#000', 
              color: '#fff', 
              padding: '40px 30px', 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              border: '3px solid #000',
              boxShadow: '8px 8px 0px #eee'
            }}>
              <h4 style={{ letterSpacing: '4px', color: '#fff', margin: 0 }}>BOSS RAP</h4>
              <div style={{ 
                border: '2px solid #fff', 
                padding: '20px', 
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px',
                width: '100%'
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${profile.id}`} 
                  alt="Member QR Code"
                  style={{ width: '140px', height: '140px' }}
                />
                <div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#000', margin: 0 }}>{profile.name}</p>
                  <p style={{ fontSize: '0.6rem', letterSpacing: '4px', color: '#666', margin: '4px 0 0 0' }}>ID: {profile.id}</p>
                </div>
              </div>
              <p style={{ fontSize: '0.55rem', opacity: 0.8, margin: 0 }}>PRESENT THIS QR CARD AT THE COUNTER FOR REGISTER SCANNING & REWARDS</p>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'RETURN_CLAIM' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>SUBMIT A RETURN OR REPLACE CLAIM</h3>
          <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '5px 0 30px 0' }}>
            Choose a previous transaction receipt, specify the product item, write down the reason for the claim, and submit.
          </p>

          {ticketSubmitted ? (
            <div style={{ border: '2px solid #000', padding: '30px', textAlign: 'center', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <span style={{ fontSize: '2rem' }}>🔧</span>
              <h4 style={{ margin: 0 }}>TICKET SUBMITTED SUCCESSFULLY!</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Your ticket is registered. An Admin will review the transaction logs and update its status soon.</p>
            </div>
          ) : (
            <form onSubmit={handleReturnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SELECT TRANSACTION RECEIPT</label>
                <select 
                  required 
                  value={selectedSaleId} 
                  onChange={e => {
                    setSelectedSaleId(e.target.value);
                    setSelectedItemIndex('');
                  }}
                >
                  <option value="">-- SELECT RECEIPT ID --</option>
                  {history.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {new Date(s.date).toLocaleDateString()} (Total: ₱{s.total.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSaleId && (
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>SELECT CLAIMED PRODUCT</label>
                  <select 
                    required 
                    value={selectedItemIndex} 
                    onChange={e => setSelectedItemIndex(e.target.value)}
                  >
                    <option value="">-- SELECT PRODUCT ITEM --</option>
                    {eligibleItems.map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.name} - Qty: {item.quantity} (₱{item.price} each)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>REQUEST TYPE</label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="claimType" 
                      value="RETURN"
                      checked={claimType === 'RETURN'} 
                      onChange={() => setClaimType('RETURN')} 
                      style={{ width: 'auto' }}
                    />
                    RETURN (REFUND & RESTOCK)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="claimType" 
                      value="REPLACE"
                      checked={claimType === 'REPLACE'} 
                      onChange={() => setClaimType('REPLACE')} 
                      style={{ width: 'auto' }}
                    />
                    REPLACE (DEFECT EXCHANGE)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>REASON FOR RETURN / REPLACEMENT</label>
                <textarea 
                  required 
                  rows={4}
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="EXPLAIN IN DETAIL: E.G., DEFECTIVE PARTS, COMPATIBILITY ISSUE, RECEIVED WRONG ITEM SIZE..." 
                  style={{ width: '100%', padding: '8px', border: '2px solid #000', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="primary" style={{ marginTop: '10px', width: '100%' }}>SUBMIT CLAIM TICKET</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
export default CustomerDashboard;
