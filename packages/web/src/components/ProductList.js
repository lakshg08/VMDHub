import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../AuthContext';

const API = 'http://localhost:3001/api';
const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
const UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set', 'dozen'];
const DIM_UNITS = ['mm', 'cm', 'm', 'in', 'ft'];
const GAUGE_UNITS = ['SWG', 'AWG', 'mm', 'in'];
const WEIGHT_UNITS = ['kg', 'g', 'lb', 'oz', 'ton'];

const EMPTY_PRODUCT = {
  name: '', sku: '', vendor_id: '', category: '', hsn_code: '',
  cost_price: '', selling_price: '', gst_rate: 18, quantity_in_stock: 0, unit: 'pcs', notes: '',
  description: '',
  length: '', length_unit: 'mm',
  width: '', width_unit: 'mm',
  height: '', height_unit: 'mm',
  gauge: '', gauge_unit: 'SWG',
  weight: '', weight_unit: 'kg',
  dimension: '',
};

function physicalSummary(p) {
  const parts = [];
  const dims = [p.length, p.width, p.height].filter(v => v != null && v !== '');
  if (dims.length) parts.push(dims.join('×') + ' ' + (p.length_unit || p.width_unit || p.height_unit || ''));
  if (p.gauge != null && p.gauge !== '') parts.push(`G${p.gauge} ${p.gauge_unit || ''}`);
  if (p.weight != null && p.weight !== '') parts.push(`${p.weight} ${p.weight_unit || 'kg'}`);
  return parts.join(' | ') || '—';
}

const DIFF_FIELDS = [
  { key: 'cost_price', label: 'Cost' },
  { key: 'selling_price', label: 'Sell' },
  { key: 'quantity_in_stock', label: 'Stock' },
  { key: 'gst_rate', label: 'GST' },
  { key: 'unit', label: 'Unit' },
  { key: 'description', label: 'Desc' },
  { key: 'weight', label: 'Weight' },
];

function conflictDiff(existing, incoming) {
  const changes = [];
  for (const { key, label } of DIFF_FIELDS) {
    const ex = existing[key];
    const inc = incoming[key];
    if (inc !== '' && inc !== null && inc !== undefined && String(ex) !== String(inc)) {
      changes.push(`${label}: ${ex ?? '—'} → ${inc}`);
    }
  }
  return changes.length ? changes.join('  ·  ') : 'No changes detected';
}

export default function ProductList() {
  const { role } = useAuth();
  const fileInputRef = useRef(null);

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

  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedConflicts, setSelectedConflicts] = useState(new Set());
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [prodRes, vendRes] = await Promise.all([
        apiFetch(`${API}/products`),
        apiFetch(`${API}/vendors`),
      ]);
      setProducts(await prodRes.json());
      setVendors(await vendRes.json());
    } catch {
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
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cost_price: parseFloat(form.cost_price) || 0,
          selling_price: parseFloat(form.selling_price) || 0,
          gst_rate: parseFloat(form.gst_rate),
          quantity_in_stock: parseInt(form.quantity_in_stock),
          length: form.length !== '' ? parseFloat(form.length) : null,
          width: form.width !== '' ? parseFloat(form.width) : null,
          height: form.height !== '' ? parseFloat(form.height) : null,
          gauge: form.gauge !== '' ? parseFloat(form.gauge) : null,
          weight: form.weight !== '' ? parseFloat(form.weight) : null,
        }),
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
    await apiFetch(`${API}/products/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, vendor_id: p.vendor_id, category: p.category || '',
      hsn_code: p.hsn_code || '', cost_price: p.cost_price, selling_price: p.selling_price,
      gst_rate: p.gst_rate, quantity_in_stock: p.quantity_in_stock, unit: p.unit, notes: p.notes || '',
      description: p.description || '',
      length: p.length ?? '', length_unit: p.length_unit || 'mm',
      width: p.width ?? '', width_unit: p.width_unit || 'mm',
      height: p.height ?? '', height_unit: p.height_unit || 'mm',
      gauge: p.gauge ?? '', gauge_unit: p.gauge_unit || 'SWG',
      weight: p.weight ?? '', weight_unit: p.weight_unit || 'kg',
      dimension: p.dimension || '',
    });
    setShowModal(true);
  }

  async function handleExport() {
    try {
      const res = await apiFetch(`${API}/products/export`);
      if (!res.ok) throw new Error((await res.json()).error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export products');
    }
  }

  async function handleBulkUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBulkLoading(true);
    setBulkResult(null);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch(`${API}/products/bulk`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBulkResult(data);
      if (data.created > 0 || data.updated > 0) fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleConfirmConflicts() {
    const toConfirm = [...selectedConflicts].map(i => {
      const c = bulkResult.conflicts[i];
      return { id: c.existing.id, ...c.incoming, sku: c.existing.sku };
    });
    setConfirmLoading(true);
    setConfirmResult(null);
    try {
      const res = await apiFetch(`${API}/products/bulk/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toConfirm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfirmResult(data);
      if (data.updated > 0) {
        fetchData();
        const resolved = new Set(selectedConflicts);
        setBulkResult(prev => ({
          ...prev,
          updated: (prev.updated || 0) + data.updated,
          conflicts: prev.conflicts.filter((_, i) => !resolved.has(i)),
        }));
        setSelectedConflicts(new Set());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirmLoading(false);
    }
  }

  function openConflictModal() {
    setConfirmResult(null);
    setSelectedConflicts(new Set());
    setShowConflictModal(true);
  }

  const filtered = products.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) &&
    (!filterVendor || p.vendor_id === parseInt(filterVendor))
  );

  const margin = (cost, sell) => cost > 0 ? (((sell - cost) / cost) * 100).toFixed(1) : '0.0';

  const f = (field, label, type = 'text', extra = {}) => (
    <div className="form-group">
      <label>{label}</label>
      <input className="form-control" type={type} value={form[field]}
        onChange={e => setForm({ ...form, [field]: e.target.value })} {...extra} />
    </div>
  );

  const dimField = (valueField, unitField, label, units) => (
    <div className="form-group">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className="form-control" type="number" min="0" step="any"
          value={form[valueField]} placeholder="—"
          onChange={e => setForm({ ...form, [valueField]: e.target.value })}
          style={{ flex: 2 }} />
        <select className="form-control" value={form[unitField]}
          onChange={e => setForm({ ...form, [unitField]: e.target.value })}
          style={{ flex: 1 }}>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );

  const conflicts = bulkResult?.conflicts ?? [];
  const allSelected = conflicts.length > 0 && selectedConflicts.size === conflicts.length;

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleExport}>Export Products</button>
          <label className="btn btn-outline" style={{ cursor: 'pointer', marginBottom: 0, opacity: bulkLoading ? 0.6 : 1 }}>
            {bulkLoading ? 'Uploading…' : 'Upload Excel'}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBulkUpload} disabled={bulkLoading} />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_PRODUCT); setShowModal(true); }}>+ Add Product</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {bulkResult && (
        <div className={`alert ${bulkResult.created > 0 || bulkResult.updated > 0 ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              {bulkResult.created > 0 && <span>{bulkResult.created} product(s) created. </span>}
              {bulkResult.updated > 0 && <span>{bulkResult.updated} product(s) updated. </span>}
              {conflicts.length > 0 && (
                <span style={{ color: '#e67e22' }}>
                  {conflicts.length} duplicate(s) need review.{' '}
                  <button className="btn btn-outline btn-sm" onClick={openConflictModal} style={{ verticalAlign: 'middle' }}>
                    Review
                  </button>
                </span>
              )}
              {bulkResult.errors?.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <strong>{bulkResult.errors.length} row(s) failed:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                    {bulkResult.errors.map((e, i) => (
                      <li key={i} style={{ color: '#c0392b' }}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setBulkResult(null)} style={{ flexShrink: 0 }}>Dismiss</button>
          </div>
        </div>
      )}

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
                {role === 'admin' && <th>Cost</th>}
                <th>Sell Price</th>
                {role === 'admin' && <th>Margin</th>}
                <th>GST</th><th>Stock</th><th>Physical</th>
                {role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td><code>{p.sku}</code></td>
                  <td><code>{p.hsn_code}</code></td>
                  <td>{p.vendor_name}</td>
                  <td>{p.category || '—'}</td>
                  {role === 'admin' && <td>₹{parseFloat(p.cost_price).toFixed(2)}</td>}
                  <td>₹{parseFloat(p.selling_price).toFixed(2)}</td>
                  {role === 'admin' && (
                    <td><span style={{ color: margin(p.cost_price, p.selling_price) > 0 ? '#27ae60' : '#e74c3c' }}>{margin(p.cost_price, p.selling_price)}%</span></td>
                  )}
                  <td>{p.gst_rate}%</td>
                  <td>{p.quantity_in_stock} {p.unit}</td>
                  <td style={{ fontSize: 12, color: '#555', whiteSpace: 'nowrap' }}>{physicalSummary(p)}</td>
                  {role === 'admin' && (
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      {' '}<button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Del</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit product modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {role === 'staff' && !editing && (
              <p style={{ fontSize: 13, color: '#888', marginTop: 4, marginBottom: 12 }}>
                Cost price and selling price will be filled by admin later.
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>Basic Info</p>
              <div className="grid-2">
                {f('name', 'Product Name *', 'text', { required: true })}
                {f('sku', 'SKU', 'text', { placeholder: editing ? '' : 'Auto-generated if blank' })}
                {f('hsn_code', 'HSN Code *', 'text', { required: true, pattern: '\\d{4,8}', title: '4–8 digit HSN code', placeholder: 'e.g. 85171200' })}
                <div className="form-group">
                  <label>Vendor *</label>
                  <select className="form-control" required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                {f('category', 'Category')}
                <div className="form-group">
                  <label>GST Rate</label>
                  <select className="form-control" value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: e.target.value })}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                {f('quantity_in_stock', 'Stock Quantity', 'number', { min: 0 })}
                <div className="form-group">
                  <label>Unit</label>
                  <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {role === 'admin' && f('cost_price', 'Cost Price (₹)', 'number', { min: 0, step: '0.01' })}
                {role === 'admin' && f('selling_price', 'Selling Price (₹)', 'number', { min: 0, step: '0.01' })}
              </div>

              {role === 'admin' && form.cost_price && form.selling_price && (
                <div className="alert alert-success" style={{ marginBottom: 12 }}>
                  Margin: {margin(form.cost_price, form.selling_price)}% | Profit: ₹{(parseFloat(form.selling_price) - parseFloat(form.cost_price)).toFixed(2)}
                </div>
              )}

              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <p style={{ fontWeight: 600, fontSize: 13, margin: '16px 0 8px', color: '#333' }}>Physical Specs</p>
              <div className="grid-2">
                {dimField('length', 'length_unit', 'Length', DIM_UNITS)}
                {dimField('width', 'width_unit', 'Width', DIM_UNITS)}
                {dimField('height', 'height_unit', 'Height', DIM_UNITS)}
                {dimField('gauge', 'gauge_unit', 'Gauge', GAUGE_UNITS)}
                {dimField('weight', 'weight_unit', 'Weight', WEIGHT_UNITS)}
                {f('dimension', 'Dimension (free text)', 'text', { placeholder: 'e.g. 10×20×30 mm' })}
              </div>

              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict review modal */}
      {showConflictModal && (
        <div className="modal-overlay" onClick={confirmLoading ? undefined : () => setShowConflictModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2>Duplicate Products ({conflicts.length})</h2>
              <button className="modal-close" disabled={confirmLoading} onClick={() => setShowConflictModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: '#555', margin: '4px 0 16px' }}>
              These rows matched existing products by name and vendor. Select which ones to overwrite.
            </p>

            {confirmResult && (
              <div className="alert alert-success" style={{ marginBottom: 12 }}>
                {confirmResult.updated} product(s) updated.
                {confirmResult.errors.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                    {confirmResult.errors.map((e, i) => <li key={i} style={{ color: '#c0392b' }}>{e.error}</li>)}
                  </ul>
                )}
              </div>
            )}

            {conflicts.length === 0 ? (
              <p style={{ color: '#27ae60', fontWeight: 600 }}>All conflicts resolved.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input type="checkbox" checked={allSelected}
                        onChange={e => setSelectedConflicts(e.target.checked ? new Set(conflicts.map((_, i) => i)) : new Set())} />
                    </th>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Vendor</th>
                    <th>Existing SKU</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map((c, i) => (
                    <tr key={i} style={{ background: selectedConflicts.has(i) ? '#f0f7ff' : undefined }}>
                      <td>
                        <input type="checkbox" checked={selectedConflicts.has(i)}
                          onChange={() => {
                            const next = new Set(selectedConflicts);
                            next.has(i) ? next.delete(i) : next.add(i);
                            setSelectedConflicts(next);
                          }} />
                      </td>
                      <td>{c.row}</td>
                      <td><strong>{c.existing.name}</strong></td>
                      <td>{c.existing.vendor_name}</td>
                      <td><code>{c.existing.sku}</code></td>
                      <td style={{ fontSize: 12, color: '#555' }}>{conflictDiff(c.existing, c.incoming)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" disabled={confirmLoading} onClick={() => setShowConflictModal(false)}>
                {conflicts.length === 0 ? 'Close' : 'Skip All'}
              </button>
              {conflicts.length > 0 && (
                <button className="btn btn-primary"
                  disabled={selectedConflicts.size === 0 || confirmLoading}
                  onClick={handleConfirmConflicts}>
                  {confirmLoading ? 'Updating…' : `Update Selected (${selectedConflicts.size})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
