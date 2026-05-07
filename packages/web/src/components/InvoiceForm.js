import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';
const GST_RATES = [0, 3, 5, 12, 18, 28];
const UNITS = ['PCS', 'KGS', 'MTR', 'LTR', 'BOX', 'SET'];

const EMPTY_ITEM = {
  item_name: '', product_id: '', quantity: 1, unit: 'PCS',
  unit_price: 0, gst_rate: 18, hsn_code: '',
  amount: 0, igst: 0, cgst: 0, sgst: 0, total_with_tax: 0,
};

function calcItem(item, type) {
  const amount = Math.round((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0) * 100) / 100;
  const gstRate = parseFloat(item.gst_rate) || 0;
  let igst = 0, cgst = 0, sgst = 0;
  if (type === 'interstate') {
    igst = Math.round(amount * gstRate / 100 * 100) / 100;
  } else {
    cgst = Math.round(amount * (gstRate / 2) / 100 * 100) / 100;
    sgst = cgst;
  }
  return { ...item, amount, igst, cgst, sgst, total_with_tax: Math.round((amount + igst + cgst + sgst) * 100) / 100 };
}

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    invoice_number: '', invoice_date: new Date().toISOString().split('T')[0],
    invoice_type: 'intrastate', customer_name: '', customer_email: '',
    customer_address: '', ship_to_address: '', customer_gst: '', status: 'draft', notes: '',
    transaction_reference: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const customerSearchTimeout = React.useRef(null);

  useEffect(() => {
    apiFetch(`${API}/products`).then(r => r.json()).then(setProducts);
    if (id) loadInvoice(id);
    else {
      const today = new Date().toISOString().split('T')[0];
      apiFetch(`${API}/invoices/next-number?date=${today}`).then(r => r.json()).then(d => setForm(f => ({ ...f, invoice_number: d.nextNumber })));
    }
  }, [id]);

  async function loadInvoice(invoiceId) {
    const res = await apiFetch(`${API}/invoices/${invoiceId}`);
    const inv = await res.json();
    setForm({
      invoice_number: inv.invoiceNumber || inv.invoice_number,
      invoice_date: inv.invoiceDate || inv.invoice_date,
      invoice_type: inv.invoiceType || inv.invoice_type,
      customer_name: inv.customerName || inv.customer_name,
      customer_email: inv.customerEmail || inv.customer_email || '',
      customer_address: inv.customerAddress || inv.customer_address || '',
      ship_to_address: inv.shipToAddress || inv.ship_to_address || '',
      customer_gst: inv.customerGST || inv.customer_gst || '',
      status: inv.status,
      notes: inv.notes || '',
      transaction_reference: inv.transactionReference || inv.transaction_reference || '',
    });
    setItems((inv.items || []).map(i => ({
      item_name: i.itemName || i.item_name || '',
      product_id: i.productId || i.product_id || '',
      quantity: i.quantity,
      unit: i.unit || 'PCS',
      unit_price: i.unitPrice || i.unit_price,
      gst_rate: i.gstRate || i.gst_rate,
      hsn_code: i.hsnCode || i.hsn_code || '',
      amount: i.amount,
      igst: i.igst,
      cgst: i.cgst,
      sgst: i.sgst,
      total_with_tax: i.totalWithTax || i.total_with_tax,
    })));
  }

  function handleItemChange(idx, field, value) {
    const newItems = [...items];
    let updated = { ...newItems[idx], [field]: value };
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updated = {
          ...updated,
          item_name: product.name,
          unit_price: product.selling_price,
          gst_rate: product.gst_rate,
          hsn_code: product.hsn_code || '',
          unit: product.unit || 'PCS',
        };
      }
    }
    newItems[idx] = calcItem(updated, form.invoice_type);
    setItems(newItems);
  }

  function handleTypeChange(newType) {
    setForm(f => ({ ...f, invoice_type: newType }));
    setItems(items.map(item => calcItem(item, newType)));
  }

  function addItem() { setItems([...items, { ...EMPTY_ITEM }]); }
  function removeItem(idx) { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); }

  function handleCustomerNameChange(value) {
    setForm(f => ({ ...f, customer_name: value }));
    clearTimeout(customerSearchTimeout.current);
    if (!value.trim()) { setCustomerSuggestions([]); setShowSuggestions(false); return; }
    customerSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`${API}/customers?search=${encodeURIComponent(value)}`);
        const data = await res.json();
        setCustomerSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch { setCustomerSuggestions([]); }
    }, 200);
  }

  function selectCustomer(customer) {
    setForm(f => ({
      ...f,
      customer_name: customer.name,
      customer_email: customer.email || '',
      customer_address: customer.billToAddress || '',
      ship_to_address: customer.shipToAddress || '',
      customer_gst: customer.gstNumber || '',
    }));
    setCustomerSuggestions([]);
    setShowSuggestions(false);
  }

  const totals = items.reduce((acc, item) => ({
    beforeTax: acc.beforeTax + (item.amount || 0),
    igst: acc.igst + (item.igst || 0),
    cgst: acc.cgst + (item.cgst || 0),
    sgst: acc.sgst + (item.sgst || 0),
    tax: acc.tax + (item.igst || 0) + (item.cgst || 0) + (item.sgst || 0),
    afterTax: acc.afterTax + (item.total_with_tax || 0),
  }), { beforeTax: 0, igst: 0, cgst: 0, sgst: 0, tax: 0, afterTax: 0 });

  const isPaid = form.status === 'paid';
  const canMarkPaid = form.notes.trim() && form.transaction_reference.trim();

  function handleStatusChange(newStatus) {
    if (newStatus === 'paid' && !canMarkPaid) {
      setError('To mark as Paid, you must fill in both Notes and Transaction Reference.');
      return;
    }
    setError('');
    setForm(f => ({ ...f, status: newStatus }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.status === 'paid' && !canMarkPaid) {
      setError('To mark as Paid, you must fill in both Notes and Transaction Reference.');
      return;
    }
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
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
        <div style={{ display: 'flex', gap: 8 }}>
          {id && (
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => window.open(`/print/invoice/${id}?mode=quotation`, '_blank')}
              >
                Download Quotation
              </button>
              <button
                type="button"
                className={`btn ${isPaid ? 'btn-primary' : 'btn-outline'}`}
                disabled={!isPaid}
                title={!isPaid ? 'Mark invoice as Paid to download Invoice' : ''}
                onClick={() => window.open(`/print/invoice/${id}?mode=invoice`, '_blank')}
              >
                Download Invoice
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={() => navigate('/invoices')}>← Back</button>
        </div>
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
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Customer Name *</label>
              <input
                className="form-control"
                required
                autoComplete="off"
                value={form.customer_name}
                onChange={e => handleCustomerNameChange(e.target.value)}
                onFocus={() => { if (customerSuggestions.length > 0) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type to search customers..."
              />
              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: '#fff', border: '1px solid #ddd', borderRadius: 4,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: 200, overflowY: 'auto',
                }}>
                  {customerSuggestions.map(c => (
                    <div
                      key={c.id}
                      onMouseDown={() => selectCustomer(c)}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f7ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      {(c.gstNumber || c.email) && (
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {c.gstNumber && <span>{c.gstNumber}</span>}
                          {c.gstNumber && c.email && <span> · </span>}
                          {c.email && <span>{c.email}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input className="form-control" value={form.customer_gst} onChange={e => setForm({ ...form, customer_gst: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Bill To Address</label>
              <textarea className="form-control" rows={3} value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} placeholder="Billing address..." />
            </div>
            <div className="form-group">
              <label>Ship To Address</label>
              <textarea className="form-control" rows={3} value={form.ship_to_address} onChange={e => setForm({ ...form, ship_to_address: e.target.value })} placeholder="Shipping address (if different from billing)..." />
            </div>
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
                  <th style={{ minWidth: 160 }}>Product / Item</th>
                  <th style={{ width: 90 }}>HSN/SAC</th>
                  <th style={{ width: 70 }}>Qty</th>
                  <th style={{ width: 80 }}>Unit</th>
                  <th style={{ width: 100 }}>Rate (₹)</th>
                  <th style={{ width: 80 }}>GST%</th>
                  <th style={{ width: 100 }}>Amount</th>
                  <th style={{ width: 80 }}>Tax</th>
                  <th style={{ width: 110 }}>Total</th>
                  <th style={{ width: 40 }}></th>
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
                        {products.map(p => <option key={p.id} value={p.name} data-id={p.id} />)}
                      </datalist>
                      <select
                        className="form-control"
                        style={{ marginTop: 4, fontSize: 12 }}
                        value={item.product_id || ''}
                        onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                      >
                        <option value="">— select product —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={item.hsn_code || ''}
                        onChange={e => handleItemChange(idx, 'hsn_code', e.target.value)}
                        placeholder="HSN"
                      />
                    </td>
                    <td>
                      <input className="form-control" type="number" min="0" step="0.001" value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                    </td>
                    <td>
                      <select className="form-control" value={item.unit || 'PCS'}
                        onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td>
                      <input className="form-control" type="number" min="0" step="0.01" value={item.unit_price}
                        onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
                    </td>
                    <td>
                      <select className="form-control" value={item.gst_rate}
                        onChange={e => handleItemChange(idx, 'gst_rate', e.target.value)}>
                        {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{(item.amount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{((item.igst || 0) + (item.cgst || 0) + (item.sgst || 0)).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}><strong>₹{(item.total_with_tax || 0).toFixed(2)}</strong></td>
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
          <h3 style={{ marginBottom: 4 }}>Payment & Status</h3>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
            Fill in Notes and Transaction Reference to unlock the <strong>Paid</strong> status and enable Invoice download.
          </p>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>
                Notes {form.status === 'paid' && <span style={{ color: '#dc3545' }}>*</span>}
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment notes, remarks..."
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>
                Transaction Reference {form.status === 'paid' && <span style={{ color: '#dc3545' }}>*</span>}
              </label>
              <input
                className="form-control"
                value={form.transaction_reference}
                onChange={e => setForm({ ...form, transaction_reference: e.target.value })}
                placeholder="UPI ref / cheque no. / transfer ID..."
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'draft', label: 'Draft', color: '#6c757d' },
                { value: 'paid', label: 'Paid', color: '#198754' },
                { value: 'cancelled', label: 'Cancelled', color: '#dc3545' },
              ].map(opt => {
                const isSelected = form.status === opt.value;
                const isDisabled = opt.value === 'paid' && !canMarkPaid;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    title={isDisabled ? 'Fill Notes and Transaction Reference first' : ''}
                    disabled={isDisabled}
                    onClick={() => handleStatusChange(opt.value)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 20,
                      border: `2px solid ${opt.color}`,
                      background: isSelected ? opt.color : 'transparent',
                      color: isSelected ? '#fff' : opt.color,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontWeight: isSelected ? 700 : 400,
                      fontSize: 13,
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
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
