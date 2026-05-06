import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';
const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
const UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set', 'dozen'];

const EMPTY_PRODUCT = { name: '', sku: '', vendor_id: '', category: '', hsn_code: '', cost_price: '', selling_price: '', gst_rate: 18, quantity_in_stock: 0, unit: 'pcs', notes: '' };

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [search, setSearch] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [prodRes, vendRes] = await Promise.all([
        fetch(`${API}/products`),
        fetch(`${API}/vendors`),
      ]);
      setProducts(await prodRes.json());
      setVendors(await vendRes.json());
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const url = editing ? `${API}/products/${editing.id}` : `${API}/products`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cost_price: parseFloat(form.cost_price), selling_price: parseFloat(form.selling_price), gst_rate: parseFloat(form.gst_rate), quantity_in_stock: parseInt(form.quantity_in_stock) }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      setSuccess(editing ? 'Product updated!' : 'Product created!');
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_PRODUCT);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return;
    await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, vendor_id: p.vendor_id, category: p.category || '', hsn_code: p.hsn_code || '', cost_price: p.cost_price, selling_price: p.selling_price, gst_rate: p.gst_rate, quantity_in_stock: p.quantity_in_stock, unit: p.unit, notes: p.notes || '' });
    setShowModal(true);
  }

  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) &&
    (!filterVendor || p.vendor_id === parseInt(filterVendor))
  );

  const margin = (cost, sell) => cost > 0 ? (((sell - cost) / cost) * 100).toFixed(1) : '0.0';

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_PRODUCT); setShowModal(true); }}>+ Add Product</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid-2">
          <input className="form-control" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-control" value={filterVendor} onChange={e => setFilterVendor(e.target.value)}>
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading">Loading...</div> : filtered.length === 0 ? (
          <div className="empty-state"><h3>No products found</h3></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>SKU</th><th>HSN</th><th>Vendor</th><th>Category</th>
                <th>Cost</th><th>Sell Price</th><th>Margin</th><th>GST</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><code>{p.sku}</code></td>
                  <td><code>{p.hsn_code}</code></td>
                  <td>{p.vendor_name}</td>
                  <td>{p.category || '-'}</td>
                  <td>₹{parseFloat(p.cost_price).toFixed(2)}</td>
                  <td>₹{parseFloat(p.selling_price).toFixed(2)}</td>
                  <td><span style={{ color: margin(p.cost_price, p.selling_price) > 0 ? '#27ae60' : '#e74c3c' }}>{margin(p.cost_price, p.selling_price)}%</span></td>
                  <td>{p.gst_rate}%</td>
                  <td>{p.quantity_in_stock} {p.unit}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    {' '}<button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input className="form-control" required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>HSN Code *</label>
                  <input className="form-control" required pattern="\d{4,8}" title="4–8 digit HSN code" value={form.hsn_code} onChange={e => setForm({ ...form, hsn_code: e.target.value })} placeholder="e.g. 85171200" />
                </div>
                <div className="form-group">
                  <label>Vendor *</label>
                  <select className="form-control" required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Cost Price (₹) *</label>
                  <input className="form-control" required type="number" min="0" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input className="form-control" required type="number" min="0" step="0.01" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>GST Rate</label>
                  <select className="form-control" value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: e.target.value })}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input className="form-control" type="number" min="0" value={form.quantity_in_stock} onChange={e => setForm({ ...form, quantity_in_stock: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              {form.cost_price && form.selling_price && (
                <div className="alert alert-success" style={{ marginBottom: 12 }}>
                  Margin: {margin(form.cost_price, form.selling_price)}% | Profit: ₹{(parseFloat(form.selling_price) - parseFloat(form.cost_price)).toFixed(2)}
                </div>
              )}
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
