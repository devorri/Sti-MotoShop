import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { ReturnRequest } from '../context/AppContext';

export const Returns: React.FC = () => {
  const { returnRequests, setReturnRequests, products, setProducts } = useAppContext();

  const handleAction = (request: ReturnRequest, action: 'APPROVED' | 'REJECTED') => {
    // Update request status
    const updatedRequests = returnRequests.map(r => 
      r.id === request.id ? { ...r, status: action } : r
    );
    setReturnRequests(updatedRequests);

    // If approved and is type 'RETURN', restock the inventory!
    if (action === 'APPROVED') {
      const updatedProducts = products.map(p => {
        const itemReturned = request.items.find(item => item.productId === p.id);
        if (itemReturned) {
          return { ...p, stock: p.stock + itemReturned.quantity };
        }
        return p;
      });
      setProducts(updatedProducts);
      alert(`REQUEST APPROVED. ${request.type === 'RETURN' ? 'ITEMS RESTOCKED TO INVENTORY.' : 'REPLACEMENT INITIATED.'}`);
    } else {
      alert('REQUEST REJECTED.');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Return & Replacement Requests</h2>
      
      <div className="card" style={{ marginTop: '30px' }}>
        <h3>CUSTOMER REPAIR & EXCHANGE TICKETS</h3>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '5px 0 25px 0' }}>
          Approve or reject customer requests. Approving a "Return" automatically returns the item quantities back into the active stock list.
        </p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>TICKET ID</th>
                <th>DATE SUBMITTED</th>
                <th>MEMBER ID</th>
                <th>RECEIPT ID</th>
                <th>TYPE</th>
                <th>ITEMS REQUESTED</th>
                <th>REASON FOR CLAIM</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {returnRequests.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center' }}>NO CLAIM TICKETS SUBMITTED YET</td></tr>
              ) : (
                returnRequests.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 'bold' }}>{r.id}</td>
                    <td style={{ fontSize: '0.7rem' }}>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.memberId}</td>
                    <td style={{ fontWeight: 'bold' }}>{r.saleId}</td>
                    <td>
                      <span className={`badge ${r.type === 'RETURN' ? 'danger' : ''}`} style={{ backgroundColor: r.type === 'RETURN' ? '#000' : 'transparent', color: r.type === 'RETURN' ? '#fff' : '#000' }}>
                        {r.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {r.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td>{r.reason}</td>
                    <td>
                      <span className={`badge`} style={{ 
                        borderColor: r.status === 'PENDING' ? '#aaa' : r.status === 'APPROVED' ? 'green' : 'red',
                        color: r.status === 'PENDING' ? '#666' : r.status === 'APPROVED' ? 'green' : 'red',
                        fontWeight: 'bold'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="primary" 
                            style={{ fontSize: '0.6rem', padding: '4px 8px', borderColor: 'green', backgroundColor: 'green', color: '#fff' }}
                            onClick={() => handleAction(r, 'APPROVED')}
                          >
                            APPROVE
                          </button>
                          <button 
                            style={{ fontSize: '0.6rem', padding: '4px 8px', color: 'red', borderColor: 'red' }}
                            onClick={() => handleAction(r, 'REJECTED')}
                          >
                            REJECT
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>COMPLETED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
