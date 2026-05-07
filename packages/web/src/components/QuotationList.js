import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { generateQuotationPdf } from '../lib/quotationPdf';

const API = 'http://localhost:3001/api';

const STATUS_COLORS = {
  draft: '#6c757d', sent: '#0d6efd', accepted: '#198754', rejected: '#dc3545', converted: '#6610f2',
};

export default function QuotationList() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuotations();
    apiFetch(`${API}/settings`).then(r => r.json()).then(s => setSettings(s || {}));
  }, []);

  async function loadQuotations() {
    setLoading(true);
    try {
      const res = await apiFetch(`${API}/quotations`);
      const data = await res.json();
      setQuotations(data);
    } catch {
      setError('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this quotation?')) return;
    try {
      await apiFetch(`${API}/quotations/${id}`, { method: 'DELETE' });
      setQuotations(q => q.filter(x => x.id !== id));
    } catch {
      setError('Failed to delete quotation');
    }
  }

  async function handleConvert(q) {
    if (!window.confirm(`Convert quotation ${q.quotationNumber} to an invoice?`)) return;
    setConverting(q.id);
    setError('');
    try {
      const res = await apiFetch(`${API}/quotations/${q.id}/convert`, { method: 'POST' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const invoice = await res.json();
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err.message || 'Failed to convert');
      setConverting(null);
    }
  }

  async function handleExportPdf(q) {
    try {
      const res = await apiFetch(`${API}/quotations/${q.id}`);
      const full = await res.json();
      generateQuotationPdf(full, settings);
    } catch {
      setError('Failed to generate PDF');
    }
  }

  const counts = quotations.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Quotations</h1>
        <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>+ New Quotation</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{
            padding: '8px 16px', background: color + '15', border: `1px solid ${color}40`,
            borderRadius: 8, fontSize: 13,
          }}>
            <span style={{ color, fontWeight: 600 }}>{(counts[status] || 0)}</span>
            <span style={{ color: '#555', marginLeft: 6 }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
      ) : quotations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No quotations yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first quotation to get started</div>
          <button className="btn btn-primary" onClick={() => navigate('/quotations/new')}>+ New Quotation</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Customer</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id}>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                      onClick={() => navigate(`/quotations/${q.id}`)}
                    >
                      {q.quotationNumber}
                    </button>
                  </td>
                  <td>{q.quotationDate}</td>
                  <td style={{ color: q.validUntil && new Date(q.validUntil) < new Date() ? '#dc3545' : undefined }}>
                    {q.validUntil || '—'}
                  </td>
                  <td>{q.customerName}</td>
                  <td>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      background: (STATUS_COLORS[q.status] || '#aaa') + '22',
                      color: STATUS_COLORS[q.status] || '#aaa',
                      border: `1px solid ${(STATUS_COLORS[q.status] || '#aaa')}44`,
                    }}>
                      {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{(q.totalAmountAfterTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleExportPdf(q)} title="Export PDF">PDF</button>
                      {q.status !== 'converted' && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/quotations/${q.id}`)}>Edit</button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleConvert(q)}
                            disabled={converting === q.id}
                          >
                            {converting === q.id ? '...' : 'To Invoice'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>Delete</button>
                        </>
                      )}
                      {q.status === 'converted' && (
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/quotations/${q.id}`)}>View</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
