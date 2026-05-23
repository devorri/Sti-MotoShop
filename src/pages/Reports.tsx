import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const Reports: React.FC = () => {
  const { sales, products, members } = useAppContext();
  
  // Date Filters
  const [filterType, setFilterType] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Helper to filter sales based on date
  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.date);
    const today = new Date();
    
    // Normalize today to start of day
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (filterType === 'TODAY') {
      return saleDate >= todayStart;
    } else if (filterType === 'WEEK') {
      const oneWeekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= oneWeekAgo;
    } else if (filterType === 'MONTH') {
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return saleDate >= oneMonthAgo;
    } else if (filterType === 'CUSTOM') {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date();
      return saleDate >= start && saleDate <= end;
    }
    return true;
  });

  // Calculate Metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalTransactions = filteredSales.length;
  const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Product Movement (Fast / Slow-moving analysis)
  // Track quantities sold
  const productQuantities: { [key: string]: { name: string, qty: number, category: string } } = {};
  
  // Initialize all products with 0
  products.forEach(p => {
    productQuantities[p.id] = { name: p.name, qty: 0, category: p.category };
  });

  // Accumulate quantities sold from filtered sales
  filteredSales.forEach(s => {
    s.items.forEach(item => {
      if (productQuantities[item.productId]) {
        productQuantities[item.productId].qty += item.quantity;
      } else {
        // Fallback for deleted products
        productQuantities[item.productId] = { name: item.name, qty: item.quantity, category: 'N/A' };
      }
    });
  });

  const sortedProductMovement = Object.values(productQuantities).sort((a, b) => b.qty - a.qty);
  const fastMoving = sortedProductMovement.filter(p => p.qty > 0);
  const slowMoving = sortedProductMovement.filter(p => p.qty === 0);

  // Customer Activity (Top Customers)
  const memberSpending: { [key: string]: { name: string, totalSpend: number, count: number } } = {};
  filteredSales.forEach(s => {
    if (s.memberId) {
      const member = members.find(m => m.id === s.memberId);
      const name = member ? member.name : s.memberId;
      if (!memberSpending[s.memberId]) {
        memberSpending[s.memberId] = { name, totalSpend: 0, count: 0 };
      }
      memberSpending[s.memberId].totalSpend += s.total;
      memberSpending[s.memberId].count += 1;
    }
  });
  const topCustomers = Object.values(memberSpending).sort((a, b) => b.totalSpend - a.totalSpend);

  // Render SVG Sales Trend Chart (Last 7 Days)
  const getChartData = () => {
    const data: { label: string; amount: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const daySales = sales.filter(s => {
        const sDate = new Date(s.date);
        return sDate.getFullYear() === d.getFullYear() &&
               sDate.getMonth() === d.getMonth() &&
               sDate.getDate() === d.getDate();
      });
      
      const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
      data.push({ label: dateString, amount: dayTotal });
    }
    return data;
  };

  const chartData = getChartData();
  const maxAmount = Math.max(...chartData.map(d => d.amount), 1000); // Avoid divide-by-zero, min height 1000

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header and Print Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }} className="no-print">
        <h2>Business Analytics & Reports</h2>
        <button className="primary" onClick={handlePrint}>🖨️ PRINT REPORT</button>
      </div>

      {/* Printable Report Header */}
      <div className="print-only-header" style={{ display: 'none', fontFamily: 'Courier New, monospace', marginBottom: '30px' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>BOSS RAP MOTOR SHOP</h2>
        <p style={{ textAlign: 'center', margin: '0 0 15px 0' }}>BUSINESS PERFORMANCE & OPERATIONS REPORT</p>
        <p style={{ margin: '5px 0' }}><strong>Report Date Range:</strong> {filterType} {filterType === 'CUSTOM' ? `(${startDate} to ${endDate})` : ''}</p>
        <p style={{ margin: '5px 0' }}><strong>Generated On:</strong> {new Date().toLocaleString()}</p>
        <div style={{ borderBottom: '2px solid #000', margin: '15px 0' }}></div>
      </div>

      {/* Filters (Hidden on Print) */}
      <div className="card no-print" style={{ marginBottom: '30px' }}>
        <h3>FILTER DATA</h3>
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>TIME RANGE</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map(type => (
                <button 
                  key={type} 
                  className={filterType === type ? 'primary' : ''} 
                  onClick={() => setFilterType(type)}
                  style={{ fontSize: '0.65rem' }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {filterType === 'CUSTOM' && (
            <>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>START DATE</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  style={{ fontSize: '0.75rem', padding: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>END DATE</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  style={{ fontSize: '0.75rem', padding: '6px' }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="card" style={{ border: '2px solid #000' }}>
          <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>TOTAL SALES REVENUE</span>
          <h3 style={{ fontSize: '2rem', margin: '5px 0' }}>₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>After discounts are deducted</span>
        </div>
        <div className="card" style={{ border: '2px solid #000' }}>
          <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>TRANSACTIONS RECORDED</span>
          <h3 style={{ fontSize: '2rem', margin: '5px 0' }}>{totalTransactions}</h3>
          <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>Walk-in and Facebook orders combined</span>
        </div>
        <div className="card" style={{ border: '2px solid #000' }}>
          <span style={{ fontSize: '0.65rem', color: '#666', fontWeight: 'bold' }}>AVERAGE TRANSACTION VALUE</span>
          <h3 style={{ fontSize: '2rem', margin: '5px 0' }}>₱{avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>Average basket size value</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }} className="reports-middle-grid">
        
        {/* Sales Trend Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3>7-DAY SALES REVENUE TREND</h3>
          <div style={{ flex: 1, minHeight: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '30px', padding: '0 10px', borderBottom: '2px solid #000' }}>
            {chartData.map((d, i) => {
              const barHeight = `${(d.amount / maxAmount) * 100}%`;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 'bold', marginBottom: '5px' }}>₱{d.amount > 0 ? d.amount.toLocaleString() : '0'}</span>
                  <div style={{ width: '100%', height: barHeight, backgroundColor: '#000', transition: 'height 0.8s ease' }}></div>
                  <span style={{ fontSize: '0.55rem', marginTop: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Movement Report */}
        <div className="card">
          <h3>PRODUCT MOVEMENT ANALYSIS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <h4 style={{ fontSize: '0.7rem', color: 'green', borderBottom: '1px solid green', paddingBottom: '5px', marginBottom: '10px' }}>FAST-MOVING ITEMS</h4>
              {fastMoving.length === 0 ? (
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>No sales recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {fastMoving.slice(0, 5).map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{idx+1}. {p.name}</span>
                      <span className="badge" style={{ borderColor: 'green' }}>{p.qty} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 style={{ fontSize: '0.7rem', color: 'red', borderBottom: '1px solid red', paddingBottom: '5px', marginBottom: '10px' }}>SLOW-MOVING (ZERO SALES)</h4>
              {slowMoving.length === 0 ? (
                <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>All stock moving.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {slowMoving.slice(0, 5).map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span>{p.name}</span>
                      <span className="badge danger">0 sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="reports-bottom-grid">
        
        {/* Sales Log */}
        <div className="card">
          <h3>SALES TRANSACTION JOURNAL</h3>
          <div className="table-container" style={{ marginTop: '20px', maxHeight: '300px' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DATE</th>
                  <th>ITEMS</th>
                  <th>METHOD</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>NO TRANSACTIONS IN FILTER RANGE</td></tr>
                ) : (
                  filteredSales.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 'bold' }}>{s.id}</td>
                      <td style={{ fontSize: '0.7rem' }}>{new Date(s.date).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.65rem' }}>
                        {s.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                      </td>
                      <td>
                        <span className="badge" style={{ fontSize: '0.55rem' }}>{s.paymentMethod}</span>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>₱{s.total.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Member Customers */}
        <div className="card">
          <h3>TOP MEMBER CUSTOMERS</h3>
          <div className="table-container" style={{ marginTop: '20px' }}>
            <table>
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>MEMBER ID</th>
                  <th>NAME</th>
                  <th>TRANSACTIONS</th>
                  <th>TOTAL SPEND</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>NO MEMBER PURCHASES IN RANGE</td></tr>
                ) : (
                  topCustomers.slice(0, 5).map((c, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>#{idx+1}</td>
                      <td>{idx === 0 || idx === 1 || idx === 2 ? '👑 ' : ''}{members.find(m => m.name === c.name)?.id || 'MEMBER'}</td>
                      <td>{c.name}</td>
                      <td>{c.count} sales</td>
                      <td style={{ fontWeight: 'bold' }}>₱{c.totalSpend.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only-header, .print-only-header * {
            display: block !important;
            visibility: visible;
          }
          .reports-middle-grid, .reports-middle-grid *,
          .reports-bottom-grid, .reports-bottom-grid *,
          .card:not(.no-print), .card:not(.no-print) * {
            visibility: visible;
          }
          .reports-middle-grid, .reports-bottom-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 20px !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            background-color: #fff;
            color: #000;
          }
          .card {
            border: 1px solid #000 !important;
            box-shadow: none !important;
          }
        }
        @media (max-width: 900px) {
          .reports-middle-grid, .reports-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
