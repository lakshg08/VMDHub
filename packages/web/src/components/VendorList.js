import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';

const EMPTY_VENDOR = { name: '', contact_person: '', email: '', phone: '', address: '', gst_number: '' };

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  async function fetchVendors() {
    try {
      const res = await apiFetch(`${API}/vendors`);
      const data = await res.json();
      setVendors(data);
    } catch (err) {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const url = editing ? `${API}/vendors/${editing.id}` : `${API}/vendors`;
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save vendor');
      }
      setSuccess(editing ? 'Vendor updated!' : 'Vendor created!');
      setShowModal(false);
      setEditing(null);
      setForm(EMPTY_VENDOR);
      fetchVendors();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await apiFetch(`${API}/vendors/${id}`, { method: 'DELETE' });
      fetchVendors();
    } catch (err) {
      setError('Failed to delete vendor');
    }
  }

  function openEdit(vendor) {
    setEditing(vendor);
    setForm({ name: vendor.name, contact_person: vendor.contact_person || '', email: vendor.email || '', phone: vendor.phone || '', address: vendor.address || '', gst_number: vendor.gst_number || '' });
    setShowModal(true);
  }

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.contact_person || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1>Vendors</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(EMPTY_VENDOR); setShowModal(true); }}>
          + Add Vendor
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          className="form-control"
          placeholder="Search vendors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">Loading vendors...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No vendors found</h3>
            <p>Add your first vendor to get started</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GST Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.name}</strong></td>
                  <td>{v.contact_person || '-'}</td>
                  <td>{v.email || '-'}</td>
                  <td>{v.phone || '-'}</td>
                  <td><code>{v.gst_number || '-'}</code></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}>Edit</button>
                    {' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>Delete</button>
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
              <h2>{editing ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Vendor name" />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input className="form-control" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} placeholder="Contact name" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input className="form-control" value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea className="form-control" rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'} Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
