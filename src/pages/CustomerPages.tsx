import React from 'react';
import { useAppContext } from '../context/AppContext';

export const CustomerDashboard = () => {
  const { currentUser, members, sales } = useAppContext();

  // Find membership profile
  const profile = members.find(m => m.id === currentUser?.memberId);
  // Find transactions for this member
  const history = sales.filter(s => s.memberId === currentUser?.memberId);

  if (!profile) {
    return (
      <div style={{ padding: '5vw', textAlign: 'center' }}>
        <h2>ACCOUNT NOT LINKED</h2>
        <p style={{ marginTop: '20px' }}>PLEASE CONTACT THE SHOP TO LINK YOUR MEMBERSHIP PROFILE.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '5vw', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '30px', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', lineHeight: 1 }}>HELLO, {profile.name}!</h1>
          <p style={{ fontSize: '0.8rem', letterSpacing: '2px', marginTop: '10px' }}>OFFICIAL MEMBER SINCE {new Date(profile.joinDate).getFullYear()}</p>
        </div>
        <div className="card" style={{ padding: '30px', textAlign: 'center', minWidth: '250px' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>CURRENT POINTS</p>
          <h2 style={{ fontSize: '3rem', margin: '10px 0' }}>{profile.points}</h2>
          <div style={{ width: '100%', height: '8px', background: '#eee', marginTop: '10px', position: 'relative' }}>
            <div style={{ 
              width: `${Math.min((profile.points / 500) * 100, 100)}%`, 
              height: '100%', 
              background: '#000', 
              transition: 'width 1s ease-out' 
            }}></div>
          </div>
          <p style={{ fontSize: '0.6rem', marginTop: '10px', color: '#666' }}>{500 - (profile.points % 500)} POINTS TO NEXT REWARD</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        <div className="card">
          <h3>PURCHASE HISTORY</h3>
          <div className="table-container" style={{ marginTop: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>ITEMS</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center' }}>NO TRANSACTIONS FOUND</td></tr>
                ) : (
                  history.slice().reverse().map(sale => (
                    <tr key={sale.id}>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(sale.date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.7rem' }}>
                        {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>₱{sale.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '30px' }}>
            <h3>MEMBERSHIP STATUS</h3>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>MEMBER ID</span>
                <span style={{ fontWeight: 'bold' }}>{profile.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>CONTACT</span>
                <span style={{ fontWeight: 'bold' }}>{profile.contact}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', color: '#666' }}>TIER</span>
                <span className="badge">PLATINUM</span>
              </div>
            </div>
          </div>

          <div style={{ 
            background: '#000', 
            color: '#fff', 
            padding: '40px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <h4 style={{ letterSpacing: '4px' }}>BOSS RAP</h4>
            <div style={{ 
              border: '2px solid #fff', 
              padding: '20px', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{profile.name}</p>
              <p style={{ fontSize: '0.6rem', letterSpacing: '5px', margin: 0 }}>ID: {profile.id}</p>
            </div>
            <p style={{ fontSize: '0.5rem', opacity: 0.7 }}>PRESENT THIS CARD AT THE COUNTER FOR REWARDS</p>
          </div>
        </div>
      </div>
    </div>
  );
};
