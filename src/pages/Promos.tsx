import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Promos: React.FC = () => {
  const { promos, savePromo, deletePromo, sales } = useAppContext();
  const usageCount = (promoId: string) => sales.filter(s => s.promoId === promoId).length;
  const [editLimit, setEditLimit] = useState<{ id: string; value: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPromo, setNewPromo] = useState({
    name: '',
    description: '',
    discountPercent: 10,
    minSpend: 500,
    startDate: '',
    endDate: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FREE_SHIPPING',
    firstOrderOnly: false,
    singleUsePerCustomer: false,
    maxRedemptions: '' as string,
    appliesTo: 'ALL' as 'ALL' | 'WALK-IN' | 'ONLINE',
  });

  const handleAddPromo = async (e: React.FormEvent) => {
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
      discountType: newPromo.discountType,
      firstOrderOnly: newPromo.firstOrderOnly,
      singleUsePerCustomer: newPromo.singleUsePerCustomer,
      maxRedemptions: newPromo.maxRedemptions.trim() === '' ? undefined : Math.max(1, parseInt(newPromo.maxRedemptions, 10) || 1),
      appliesTo: newPromo.discountType === 'FREE_SHIPPING' ? 'ONLINE' as const : newPromo.appliesTo,
      active: true
    };

    await savePromo(newCampaign);
    setShowAdd(false);
    setNewPromo({
      name: '',
      description: '',
      discountPercent: 10,
      minSpend: 500,
      startDate: '',
      endDate: '',
      discountType: 'PERCENT',
      firstOrderOnly: false,
      singleUsePerCustomer: false,
      maxRedemptions: '',
      appliesTo: 'ALL',
    });
  };

  const togglePromoStatus = async (promo: (typeof promos)[number]) => {
    await savePromo({ ...promo, active: !promo.active });
  };

  const handleDeletePromo = async (id: string) => {
    if (confirm('ARE YOU SURE YOU WANT TO DELETE THIS CAMPAIGN?')) {
      await deletePromo(id);
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
                <th>BENEFIT</th>
                <th>WHO CAN USE</th>
                <th>REDEEMED / LIMIT</th>
                <th>MIN. SPEND</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center' }}>NO CAMPAIGNS CREATED YET</td></tr>
              ) : (
                promos.map(p => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                    <td>{p.description}</td>
                    <td>
                      <span className="badge" style={{ borderColor: 'green', color: 'green', fontWeight: 'bold' }}>
                        {p.discountType === 'FREE_SHIPPING' ? 'FREE SHIPPING' : `${p.discountPercent}% OFF`}
                      </span>
                      {(p.firstOrderOnly || p.singleUsePerCustomer) && (
                        <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '4px' }}>
                          {p.firstOrderOnly ? 'FIRST ORDER' : 'ONE USE / CUSTOMER'}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {p.appliesTo === 'WALK-IN' ? 'WALK-IN ONLY' : p.appliesTo === 'ONLINE' ? 'ONLINE ONLY' : 'WALK-IN & ONLINE'}
                      </span>
                    </td>
                    <td style={{ minWidth: '130px' }}>
                      {(() => {
                        const used = usageCount(p.id);
                        const limit = p.maxRedemptions;
                        const full = limit !== undefined && used >= limit;
                        if (editLimit?.id === p.id) {
                          return (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input type="number" min={1} placeholder="∞" value={editLimit.value} onChange={e => setEditLimit({ id: p.id, value: e.target.value })} style={{ width: '70px', padding: '4px', fontSize: '0.75rem' }} />
                              <button type="button" className="btn-primary" style={{ fontSize: '0.6rem', padding: '3px 6px' }} onClick={async () => {
                                const v = editLimit.value.trim();
                                await savePromo({ ...p, maxRedemptions: v === '' ? undefined : Math.max(1, parseInt(v, 10) || 1) });
                                setEditLimit(null);
                              }}>SAVE</button>
                            </div>
                          );
                        }
                        return (
                          <div>
                            <strong style={{ color: full ? '#dc2626' : '#0f172a' }}>{used} / {limit !== undefined ? limit : '∞'}</strong>
                            {full && <div style={{ fontSize: '0.62rem', color: '#dc2626', fontWeight: 700 }}>LIMIT REACHED</div>}
                            {limit !== undefined && !full && <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{limit - used} left</div>}
                            <button type="button" onClick={() => setEditLimit({ id: p.id, value: limit !== undefined ? String(limit) : '' })} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline' }}>edit limit</button>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>₱{p.minSpend.toLocaleString()}</td>
                    <td>{p.startDate}</td>
                    <td>{p.endDate}</td>
                    <td>
                      <button 
                        onClick={() => togglePromoStatus(p)}
                        className={p.active ? 'btn-primary' : 'btn'}
                        style={{ fontSize: '0.65rem', padding: '4px 8px', width: '80px' }}
                      >
                        {p.active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td>
                      <button 
                        className="btn-danger"
                        style={{ fontSize: '0.65rem', padding: '4px 8px' }}
                        onClick={() => handleDeletePromo(p.id)}
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
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>VOUCHER BENEFIT</label>
                  <select value={newPromo.discountType} onChange={e => setNewPromo({...newPromo, discountType: e.target.value as 'PERCENT' | 'FREE_SHIPPING'})}>
                    <option value="PERCENT">Percentage Discount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>DISCOUNT PERCENTAGE (%)</label>
                  <input 
                    type="number" 
                    required={newPromo.discountType === 'PERCENT'}
                    min={1}
                    max={100}
                    value={newPromo.discountPercent}
                    onChange={e => setNewPromo({...newPromo, discountPercent: Number(e.target.value)})}
                    disabled={newPromo.discountType === 'FREE_SHIPPING'}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>MAX. NO. OF REDEMPTIONS</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Blank = unlimited"
                    value={newPromo.maxRedemptions}
                    onChange={e => setNewPromo({...newPromo, maxRedemptions: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>WHO CAN REDEEM</label>
                <select
                  value={newPromo.discountType === 'FREE_SHIPPING' ? 'ONLINE' : newPromo.appliesTo}
                  disabled={newPromo.discountType === 'FREE_SHIPPING'}
                  onChange={e => setNewPromo({...newPromo, appliesTo: e.target.value as 'ALL' | 'WALK-IN' | 'ONLINE'})}
                >
                  <option value="ALL">Walk-in & Online customers</option>
                  <option value="WALK-IN">Walk-in (POS counter) only</option>
                  <option value="ONLINE">Online orders only</option>
                </select>
                <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '4px 0 0' }}>
                  Example: a 10% walk-in promo limited to 50 redemptions stops applying at the POS after the 50th sale.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newPromo.firstOrderOnly} onChange={e => setNewPromo({...newPromo, firstOrderOnly: e.target.checked, singleUsePerCustomer: e.target.checked || newPromo.singleUsePerCustomer})} />
                  First order only (automatically limited to one use per customer)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newPromo.singleUsePerCustomer} onChange={e => setNewPromo({...newPromo, singleUsePerCustomer: e.target.checked})} />
                  Limit to one use per customer
                </label>
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
