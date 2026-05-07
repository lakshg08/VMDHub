import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';

const EMPTY_CUSTOMER = { name: '', email: '', phone: '', ship_to_address: '', bill_to_address: '', gst_number: '' };

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sameAddress, setSameAddress] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    try {
      const res = await apiFetch(`${API}/customers`);
      setCustomers(await res.json());
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const url = editing ? `${API}/customers/${editing.id}` : `${API}/customers`;
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save customer');
      }
      setSuccess(editing ? 'Customer updated!' : 'Customer created!');
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_CUSTOMER);
      fetchCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this customer?')) return;
    try {
      const res = await apiFetch(`${API}/customers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchCustomers();
    } catch (err) {
      setError('Failed to delete customer');
    }
  }

  function openEdit(c) {
    setEditing(c);
    const ship = c.shipToAddress || '';
    const bill = c.billToAddress || '';
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      ship_to_address: ship,
      bill_to_address: bill,
      gst_number: c.gstNumber || '',
    });
    setSameAddress(bill.length > 0 && ship === bill);
    setShowModal(true);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_CUSTOMER);
    setSameAddress(false);
    setError('');
    setShowModal(true);
  }

  function handleBillAddressChange(val) {
    setForm(f => ({ ...f, bill_to_address: val, ...(sameAddress ? { ship_to_address: val } : {}) }));
  }

  function handleSameAddressToggle(checked) {
    setSameAddress(checked);
    if (checked) setForm(f => ({ ...f, ship_to_address: f.bill_to_address }));
  }

  const filtered = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.gstNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || c.customerType === filterType;
    return matchesSearch && matchesType;
  });

  const corporateCount = customers.filter(c => c.customerType === 'corporate').length;
  const individualCount = customers.filter(c => c.customerType === 'individual').length;

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Corporate</div>
          <div className="stat-value" style={{ color: '#3498db' }}>{corporateCount}</div>
          <div className="stat-sub">With GST number</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Individual</div>
          <div className="stat-value" style={{ color: '#27ae60' }}>{individualCount}</div>
          <div className="stat-sub">Without GST number</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid-2">
          <input
            className="form-control"
            placeholder="Search by name, email or GST..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            <option value="corporate">Corporate (with GST)</option>
            <option value="individual">Individual (no GST)</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No customers found</h3>
            <p>Add your first customer to get started</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GST Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>
                    <span className={`badge badge-${c.customerType === 'corporate' ? 'info' : 'success'}`}>
                      {c.customerType}
                    </span>
                  </td>
                  <td>{c.email || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>
                    {c.gstNumber
                      ? <code style={{ fontSize: 12 }}>{c.gstNumber}</code>
                      : <span style={{ color: '#999' }}>—</span>}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                    {' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
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
              <h2>{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name or company name"
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="form-control"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>GST Number <span style={{ color: '#999', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(leave blank for individual customer)</span></label>
                <input
                  className="form-control"
                  value={form.gst_number}
                  onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
                {form.gst_number && (
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-info">Corporate</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>GST number provided — this is a corporate customer</span>
                  </div>
                )}
                {!form.gst_number && (
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-success">Individual</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>No GST number — this is an individual customer</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Bill To Address</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.bill_to_address}
                  onChange={e => handleBillAddressChange(e.target.value)}
                  placeholder="Billing address"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ marginBottom: 0 }}>Ship To Address</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', cursor: 'pointer', fontWeight: 400, marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={sameAddress}
                      onChange={e => handleSameAddressToggle(e.target.checked)}
                    />
                    Same as Bill To Address
                  </label>
                </div>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.ship_to_address}
                  onChange={e => setForm({ ...form, ship_to_address: e.target.value })}
                  placeholder="Shipping address (if different from billing)"
                  disabled={sameAddress}
                  style={sameAddress ? { background: '#f8f9fa', color: '#6c757d' } : {}}
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editing ? 'Update' : 'Create'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
