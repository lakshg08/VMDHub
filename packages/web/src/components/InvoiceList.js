import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';

const STATUS_COLORS = {
  draft: '#6c757d', sent: '#0d6efd', paid: '#198754', cancelled: '#dc3545',
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await apiFetch(`${API}/invoices`);
      const data = await res.json();
      setInvoices(data);
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, invoiceNumber) {
    if (!window.confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`${API}/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setInvoices(inv => inv.filter(x => x.id !== id));
    } catch {
      setError('Failed to delete invoice');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>+ New Invoice</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="card"><p>Loading invoices...</p></div>
      ) : invoices.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#666', marginBottom: 16 }}>No invoices yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>Create First Invoice</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const num = inv.invoiceNumber || inv.invoice_number;
                const date = inv.invoiceDate || inv.invoice_date;
                const customer = inv.customerName || inv.customer_name;
                const amount = inv.totalAmountAfterTax || inv.total_amount_after_tax || 0;
                const type = inv.invoiceType || inv.invoice_type;
                return (
                  <tr key={inv.id}>
                    <td><strong>{num}</strong></td>
                    <td>{date}</td>
                    <td>{customer}</td>
                    <td style={{ textTransform: 'capitalize' }}>{type}</td>
                    <td style={{ textAlign: 'right' }}>₹{parseFloat(amount).toFixed(2)}</td>
                    <td>
                      <span style={{
                        background: STATUS_COLORS[inv.status] || '#6c757d',
                        color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 12,
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: 4 }}
                        onClick={() => window.open(`/print/invoice/${inv.id}?mode=quotation`, '_blank')}
                      >Quotation</button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: 4, opacity: inv.status === 'paid' ? 1 : 0.4, cursor: inv.status === 'paid' ? 'pointer' : 'not-allowed' }}
                        title={inv.status !== 'paid' ? 'Invoice available only when status is Paid' : ''}
                        disabled={inv.status !== 'paid'}
                        onClick={() => window.open(`/print/invoice/${inv.id}?mode=invoice`, '_blank')}
                      >Invoice</button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginRight: 4 }}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                      >Edit</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(inv.id, num)}
                      >Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #dee2e6', background: '#f8f9fa' }}>
                <td colSpan={4} style={{ fontWeight: 600, padding: '10px 12px' }}>
                  Total ({invoices.length} invoice{invoices.length !== 1 ? 's' : ''})
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, padding: '10px 12px' }}>
                  ₹{invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmountAfterTax || inv.total_amount_after_tax || 0), 0).toFixed(2)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
