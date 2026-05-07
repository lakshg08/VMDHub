import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';

const EMPTY_ITEM = {
  item_name: '', product_id: '', quantity: 1,
  unit_price: 0, gst_rate: 18, amount: 0,
  igst: 0, cgst: 0, sgst: 0, total_with_tax: 0,
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

const STATUS_COLORS = {
  draft: '#6c757d', sent: '#0d6efd', accepted: '#198754', rejected: '#dc3545', converted: '#6610f2',
};

export default function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [saveNewCustomer, setSaveNewCustomer] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const customerRef = useRef(null);

  const [form, setForm] = useState({
    quotation_number: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    invoice_type: 'intrastate',
    customer_id: null,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_gst: '',
    customer_address: '',
    status: 'draft',
    notes: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  const isConverted = form.status === 'converted';

  useEffect(() => {
    apiFetch(`${API}/products`).then(r => r.json()).then(setProducts);
    apiFetch(`${API}/customers`).then(r => r.json()).then(setCustomers);

    if (id) {
      loadQuotation(id);
    } else {
      const today = new Date().toISOString().split('T')[0];
      apiFetch(`${API}/quotations/next-number?date=${today}`)
        .then(r => r.json())
        .then(d => setForm(f => ({ ...f, quotation_number: d.nextNumber })));
    }
  }, [id]);

  useEffect(() => {
    function handleClick(e) {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadQuotation(qId) {
    const res = await apiFetch(`${API}/quotations/${qId}`);
    const q = await res.json();
    setForm({
      quotation_number: q.quotationNumber,
      quotation_date: q.quotationDate,
      valid_until: q.validUntil || '',
      invoice_type: q.invoiceType,
      customer_id: q.customerId,
      customer_name: q.customerName,
      customer_email: q.customerEmail || '',
      customer_phone: q.customerPhone || '',
      customer_gst: q.customerGST || '',
      customer_address: q.customerAddress || '',
      status: q.status,
      notes: q.notes || '',
    });
    setCustomerSearch(q.customerName);
    setItems((q.items || []).map(i => ({
      item_name: i.itemName,
      product_id: i.productId || '',
      quantity: i.quantity,
      unit_price: i.unitPrice,
      gst_rate: i.gstRate,
      amount: i.amount,
      igst: i.igst,
      cgst: i.cgst,
      sgst: i.sgst,
      total_with_tax: i.totalWithTax,
    })));
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  function selectCustomer(customer) {
    setForm(f => ({
      ...f,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email || '',
      customer_phone: customer.phone || '',
      customer_gst: customer.gstNumber || '',
      customer_address: customer.shipToAddress || '',
    }));
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setIsNewCustomer(false);
    setSaveNewCustomer(false);
  }

  function handleCustomerSearchChange(val) {
    setCustomerSearch(val);
    setForm(f => ({ ...f, customer_name: val, customer_id: null }));
    setShowCustomerDropdown(true);
    const exact = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
    setIsNewCustomer(val.length > 0 && !exact);
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
        saveNewCustomer: saveNewCustomer && isNewCustomer,
        total_amount_before_tax: totals.beforeTax,
        total_igst: totals.igst,
        total_cgst: totals.cgst,
        total_sgst: totals.sgst,
        total_tax: totals.tax,
        total_amount_after_tax: totals.afterTax,
      };
      const url = id ? `${API}/quotations/${id}` : `${API}/quotations`;
      const method = id ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save quotation'); }
      navigate('/quotations');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.open(`/print/quotation/${id}`, '_blank');
  }

  async function handleConvert() {
    if (!window.confirm('Convert this quotation to an invoice? This cannot be undone.')) return;
    setConverting(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/quotations/${id}/convert`, { method: 'POST' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to convert'); }
      const invoice = await res.json();
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {id ? 'Edit Quotation' : 'New Quotation'}
          {form.status && (
            <span style={{
              fontSize: 13, fontWeight: 500, padding: '2px 10px', borderRadius: 12,
              background: STATUS_COLORS[form.status] + '22',
              color: STATUS_COLORS[form.status],
              border: `1px solid ${STATUS_COLORS[form.status]}44`,
            }}>
              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span>
          )}
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {id && (
            <button className="btn btn-outline" onClick={handlePrint}>
              Print Quotation
            </button>
          )}
          {id && !isConverted && (
            <button className="btn btn-primary" onClick={handleConvert} disabled={converting}>
              {converting ? 'Converting...' : 'Convert to Invoice'}
            </button>
          )}
          {isConverted && form.convertedInvoiceId && (
            <button className="btn btn-outline" onClick={() => navigate(`/invoices/${form.convertedInvoiceId}`)}>
              View Invoice
            </button>
          )}
          <button className="btn btn-outline" onClick={() => navigate('/quotations')}>← Back</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {isConverted && <div className="alert" style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', marginBottom: 16 }}>This quotation has been converted to an invoice and cannot be edited.</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Quotation Details</h3>
          <div className="grid-3">
            <div className="form-group">
              <label>Quotation Number *</label>
              <input className="form-control" required value={form.quotation_number}
                onChange={e => setForm({ ...form, quotation_number: e.target.value })}
                disabled={isConverted} />
            </div>
            <div className="form-group">
              <label>Quotation Date *</label>
              <input className="form-control" required type="date" value={form.quotation_date}
                onChange={e => setForm({ ...form, quotation_date: e.target.value })}
                disabled={isConverted} />
            </div>
            <div className="form-group">
              <label>Valid Until</label>
              <input className="form-control" type="date" value={form.valid_until}
                onChange={e => setForm({ ...form, valid_until: e.target.value })}
                disabled={isConverted} />
            </div>
            <div className="form-group">
              <label>Invoice Type *</label>
              <select className="form-control" value={form.invoice_type}
                onChange={e => handleTypeChange(e.target.value)}
                disabled={isConverted}>
                <option value="intrastate">Intrastate (CGST + SGST)</option>
                <option value="interstate">Interstate (IGST)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                disabled={isConverted}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 16 }}>Customer Details</h3>
          <div className="grid-2">
            <div className="form-group" style={{ position: 'relative' }} ref={customerRef}>
              <label>Customer Name *</label>
              <input
                className="form-control"
                required
                value={customerSearch}
                onChange={e => handleCustomerSearchChange(e.target.value)}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search or type new customer name"
                disabled={isConverted}
                autoComplete="off"
              />
              {showCustomerDropdown && customerSearch.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'white', border: '1px solid #ddd', borderRadius: 4,
                  maxHeight: 200, overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {filteredCustomers.length === 0 ? (
                    <div style={{ padding: '8px 12px', color: '#999', fontSize: 13 }}>
                      No existing customer found — fill details below
                    </div>
                  ) : (
                    filteredCustomers.map(c => (
                      <div key={c.id} onMouseDown={() => selectCustomer(c)} style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: 14,
                        borderBottom: '1px solid #f0f0f0',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        {c.phone && <div style={{ fontSize: 12, color: '#666' }}>{c.phone}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
              {isNewCustomer && !isConverted && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" id="saveCustomer" checked={saveNewCustomer}
                    onChange={e => setSaveNewCustomer(e.target.checked)} />
                  <label htmlFor="saveCustomer" style={{ fontSize: 13, color: '#0d6efd', cursor: 'pointer', marginBottom: 0 }}>
                    Save "{customerSearch}" as a new customer
                  </label>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={form.customer_email}
                onChange={e => setForm({ ...form, customer_email: e.target.value })}
                disabled={isConverted} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })}
                disabled={isConverted} />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input className="form-control" value={form.customer_gst}
                onChange={e => setForm({ ...form, customer_gst: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                disabled={isConverted} />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" rows={2} value={form.customer_address}
              onChange={e => setForm({ ...form, customer_address: e.target.value })}
              disabled={isConverted} />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>Items</h3>
            {!isConverted && (
              <button type="button" className="btn btn-primary btn-sm" onClick={addItem}>+ Add Item</button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Product / Item</th>
                  <th style={{ width: 80 }}>Qty</th>
                  <th style={{ width: 110 }}>Unit Price (₹)</th>
                  <th style={{ width: 80 }}>GST %</th>
                  <th style={{ width: 100 }}>Amount</th>
                  <th style={{ width: 90 }}>Tax</th>
                  <th style={{ width: 110 }}>Total</th>
                  {!isConverted && <th style={{ width: 50 }}></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className="form-control"
                        style={{ marginBottom: 4 }}
                        value={item.product_id || ''}
                        onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                        disabled={isConverted}
                      >
                        <option value="">— select product —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        className="form-control"
                        value={item.item_name}
                        onChange={e => handleItemChange(idx, 'item_name', e.target.value)}
                        placeholder="Or type item name"
                        disabled={isConverted}
                      />
                    </td>
                    <td>
                      <input className="form-control" type="number" min="0" step="0.01"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        disabled={isConverted} />
                    </td>
                    <td>
                      <input className="form-control" type="number" min="0" step="0.01"
                        value={item.unit_price}
                        onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                        disabled={isConverted} />
                    </td>
                    <td>
                      <div style={{
                        padding: '6px 10px', background: '#f8f9fa', border: '1px solid #dee2e6',
                        borderRadius: 4, fontSize: 14, color: '#495057', textAlign: 'center',
                      }}>
                        {item.gst_rate}%
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{(item.amount || 0).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>₹{((item.igst || 0) + (item.cgst || 0) + (item.sgst || 0)).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}><strong>₹{(item.total_with_tax || 0).toFixed(2)}</strong></td>
                    {!isConverted && (
                      <td>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <table style={{ width: 'auto' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>Amount Before Tax:</td>
                    <td style={{ padding: '4px 16px', textAlign: 'right', fontWeight: 600 }}>₹{totals.beforeTax.toFixed(2)}</td>
                  </tr>
                  {form.invoice_type === 'interstate' ? (
                    <tr>
                      <td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>IGST:</td>
                      <td style={{ padding: '4px 16px', textAlign: 'right' }}>₹{totals.igst.toFixed(2)}</td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>CGST:</td>
                        <td style={{ padding: '4px 16px', textAlign: 'right' }}>₹{totals.cgst.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 16px', textAlign: 'right', color: '#666' }}>SGST:</td>
                        <td style={{ padding: '4px 16px', textAlign: 'right' }}>₹{totals.sgst.toFixed(2)}</td>
                      </tr>
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
            <textarea className="form-control" rows={2} value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Terms, validity, additional notes..."
              disabled={isConverted} />
          </div>
        </div>

        {!isConverted && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/quotations')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (id ? 'Update Quotation' : 'Create Quotation')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
