import React from 'react';
import { useAppContext } from '../context/AppContext';

export const Inquiries: React.FC = () => {
  const { inquiries, setInquiries } = useAppContext();

  const handleDelete = (id: string) => {
    if (confirm('ARE YOU SURE YOU WANT TO DELETE THIS MESSAGE?')) {
      setInquiries(inquiries.filter(i => i.id !== id));
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h2>Customer Inquiries & Messages</h2>

      <div className="card" style={{ marginTop: '30px' }}>
        <h3>MESSAGE INBOX</h3>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: '5px 0 25px 0' }}>
          This inbox lists the inquiries submitted via the public contact form on the home page.
        </p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>DATE RECEIVED</th>
                <th>CUSTOMER NAME</th>
                <th>EMAIL ADDRESS</th>
                <th>INQUIRY DETAILS / MESSAGE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>INBOX IS EMPTY</td></tr>
              ) : (
                inquiries.slice().reverse().map(inq => (
                  <tr key={inq.id}>
                    <td style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{new Date(inq.date).toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold' }}>{inq.name}</td>
                    <td><a href={`mailto:${inq.email}`} style={{ color: '#000', fontWeight: 'bold' }}>{inq.email}</a></td>
                    <td style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>{inq.message}</td>
                    <td>
                      <button 
                        style={{ fontSize: '0.6rem', padding: '4px 8px', color: 'red', borderColor: 'red' }}
                        onClick={() => handleDelete(inq.id)}
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
    </div>
  );
};
