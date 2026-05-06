import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API = 'http://localhost:3001/api';
const GST_RATES = [0, 5, 12, 18, 28];

const EMPTY_ITEM = { item_name: '', product_id: '', quantity: 1, unit_price: 0, gst_rate: 18, amount: 0, igst: 0, cgst: 0, sgst: 0, total_with_tax: 0 };

function calcItem(item, type) {
  const amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  const gstRate = parseFloat(item.gst_rate) || 0;
  let igst = 0, cgst = 0, sgst = 0;
  if (type === 'interstate') {
    igst = Math.round(amount * gstRate / 100 * 100) / 100;
  } else {
    cgst = Math.round(amount * (gstRate / 2) / 100 * 100) / 100;
    sgst = cgst;
  }
  return { ...item, amount: Math.round(amount * 100) / 100, igst, cgst, sgst, total_with_tax: Math.round((amount + igst + cgst + sgst) * 100) / 100 };
}

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    invoice_number: '', invoice_date: new Date().toISOString().split('T')[0],
    invoice_type: 'intrastate', customer_name: '', customer_email: '',
    customer_address: '', customer_gst: '', status: 'draft', notes: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/products`).then(r => r.json()).then(setProducts);
    if (id) loadInvoice(id);
    else {
      const today = new Date().toISOString().split('T')[0];
      fetch(`${API}/invoices/next-number?date=${today}`).then(r => r.json()).then(d => setForm(f => ({ ...f, invoice_number: d.nextNumber })));
    }
  }, [id]);

  async function loadInvoice(invoiceId) {
    const res = await fetch(`${API}/invoices/${invoiceId}`);
    const inv = await res.json();
    setForm({
      invoice_number: inv.invoice_number, invoice_date: inv.invoice_date,
      invoice_type: inv.invoice_type, customer_name: inv.customer_name,
      customer_email: inv.customer_email || '', customer_address: inv.customer_address || '',
      customer_gst: inv.customer_gst || '', status: inv.status, notes: inv.notes || '',
    });
    setItems((inv.items || []).map(i => ({ ...i, item_name: i.item_name, unit_price: i.unit_price })));
  }

  function handleItemChange(idx, field, value) {
    const newItems = [...items];
    newItems[idx] = calcItem({ ...newItems[idx], [field]: value }, form.invoice_type);
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newItems[idx] = calcItem({ ...newItems[idx], item_name: product.name, unit_price: product.selling_price, gst_rate: product.gst_rate }, form.invoice_type);
      }
    }
    setItems(newItems);
  }

  function handleTypeChange(newType) {
    setForm(f => ({ ...f, invoice_type: newType }));
    setItems(items.map(item => calcItem(item, newType)));
  }

  function addItem() { setItems([...items, { ...EMPTY_ITEM }]); }
  function removeItem(idx) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }

  const totals = items.reduce((acc, item) => ({
    beforeTax: acc.beforeTax + (item.amount || 0),
    igst: acc.igst + (item.igst || 0),
    cgst: acc.cgst + (item.cgst || 0),
    sgst: acc.sgst + (item.sgst || 0),
    tax: acc.tax + (item.igst || 0) + (item.cgst || 0) + (item.sgst || 0),
    afterTax: acc.afterTax + (item.total_with_tax || 0),
  }), { beforeTax: 0, igst: 0, cgst: 0, sgst: 0, tax: 0, afterTax: 0 });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        items,
        total_amount_before_tax: totals.beforeTax,
        total_igst: totals.igst,
        total_cgst: totals.cgst,
        total_sgst: totals.sgst,
        total_tax: totals.tax,
        total_amount_after_tax: totals.afterTax,
      };
      const url = id ? `${API}/invoices/${id}` : `${API}/invoices`;
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save invoice'); }
      navigate('/invoices');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>{id ? 'Edit Invoice' : 'New Invoice'}</h1>
        <button className="btn btn-outline" onClick={() => navigate('/invoices')}>← Back</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Invoice Details</h3>
          <div className="grid-3">
            <div className="form-group">
              <label>Invoice Number *</label>
              <input className="form-control" required value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Invoice Date *</label>
              <input className="form-control" required type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Invoice Type *</label>
              <select className="form-control" value={form.invoice_type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="intrastate">Intrastate (CGST + SGST)</option>
                <option value="interstate">Interstate (IGST)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Customer Details</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Customer Name *</label>
              <input className="form-control" required value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input className="form-control" value={form.customer_gst} onChange={e => setForm({ ...form, customer_gst: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" rows={2} value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Items</h3>
            <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>+ Add Item</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 180 }}>Item</th>
                  <th style={{ width: 80 }}>Qty</th>
                  <th style={{ width: 100 }}>Unit Price</th>
                  <th style={{ width: 80 }}>GST%</th>
                  <th style={{ width: 100 }}>Amount</th>
                  <th style={{ width: 80 }}>Tax</th>
                  <th style={{ width: 110 }}>Total</th>
                  <th style={{ width: 50 }}>Del</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        className="form-control"
                        value={item.item_name}
                        onChange={e => handleItemChange(idx, 'item_name', e.target.value)}
                        placeholder="Item name"
                        list={`products-${idx}`}
                      />
                      <datalist id={`products-${idx}`}>
                        {products.map(p => <option key={p.id} value={p.name} />)}
                      </datalist>
                    </td>
                    <td><input className="form-control" type="number" min="0" step="0.01" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} /></td>
                    <td><input className="form-control" type="number" min="0" step="0.01" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} /></td>
                    <td>
                      <select className="form-control" value={item.gst_rate} onChange={e => handleItemChange(idx, 'gst_rate', e.target.value)}>
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    <td>₹{(item.amount || 0).toFixed(2)}</td>
                    <td>₹{((item.igst || 0) + (item.cgst || 0) + (item.sgst || 0)).toFixed(2)}</td>
                    <td><strong>₹{(item.total_with_tax || 0).toFixed(2)}</strong></td>
                    <td><button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <table style={{ width: 'auto' }}>
                <tbody>
                  <tr><td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>Amount Before Tax:</td><td style={{ padding: '4px 16px', textAlign: 'right', fontWeight: 600 }}>₹{totals.beforeTax.toFixed(2)}</td></tr>
                  {form.invoice_type === 'interstate' ? (
                    <tr><td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>IGST:</td><td style={{ padding: '4px 16px', textAlign: 'right' }}>₹{totals.igst.toFixed(2)}</td></tr>
                  ) : (
                    <>
                      <tr><td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>CGST:</td><td style={{ padding: '4px 16px', textAlign: 'right' }}>₹{totals.cgst.toFixed(2)}</td></tr>
                      <tr><td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>SGST:</td><td style={{ padding: '4px 16px', textAlign: 'right' }}>₹{totals.sgst.toFixed(2)}</td></tr>
                    </>
                  )}
                  <tr style={{ borderTop: '2px solid #ddd' }}>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>Total Amount:</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#2c3e50' }}>₹{totals.afterTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/invoices')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (id ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </form>
    </div>
  );
}
