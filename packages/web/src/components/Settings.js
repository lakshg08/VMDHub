import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const API = 'http://localhost:3001/api';

export default function Settings() {
  const [form, setForm] = useState({
    company_name: '', company_email: '', company_address: '',
    company_gst: '', company_phone: '', company_website: '',
    financial_year_start: 4, currency: 'INR',
    upi_id: '', bank_name: '', bank_account_number: '', bank_account_type: '', bank_ifsc: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      const res = await apiFetch(`${API}/settings`);
      const data = await res.json();
      if (data) setForm({ ...form, ...data });
    } catch (err) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    const res = await apiFetch(`${API}/backup/export`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vmdhub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = await apiFetch(`${API}/backup/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: text }),
      });
      if (!res.ok) throw new Error('Import failed');
      setSuccess('Backup imported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div>
      <div className="page-header"><h1>Settings</h1></div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #e0e0e0' }}>
        {['company', 'backup'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: activeTab === tab ? '2px solid #3498db' : 'none',
            color: activeTab === tab ? '#3498db' : '#666',
            fontWeight: activeTab === tab ? 600 : 400,
            cursor: 'pointer', textTransform: 'capitalize', marginBottom: -2,
          }}>{tab === 'company' ? 'Company Info' : 'Backup & Restore'}</button>
        ))}
      </div>

      {activeTab === 'company' && (
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16 }}>Company Information</h3>
            <div className="grid-2">
              <div className="form-group">
                <label>Company Name</label>
                <input className="form-control" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Your Company Pvt. Ltd." />
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input className="form-control" value={form.company_gst} onChange={e => setForm({ ...form, company_gst: e.target.value.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.company_email} onChange={e => setForm({ ...form, company_email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.company_phone} onChange={e => setForm({ ...form, company_phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input className="form-control" value={form.company_website} onChange={e => setForm({ ...form, company_website: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select className="form-control" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea className="form-control" rows={3} value={form.company_address} onChange={e => setForm({ ...form, company_address: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Financial Year Start Month</label>
              <select className="form-control" value={form.financial_year_start} onChange={e => setForm({ ...form, financial_year_start: parseInt(e.target.value) })} style={{ width: 200 }}>
                <option value={1}>January</option>
                <option value={4}>April (India)</option>
                <option value={7}>July</option>
              </select>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 16 }}>Bank Details</h3>
            <div className="grid-2">
              <div className="form-group">
                <label>UPI ID</label>
                <input className="form-control" value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} placeholder="yourname@bank" />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input className="form-control" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Punjab National Bank" />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input className="form-control" value={form.bank_account_number} onChange={e => setForm({ ...form, bank_account_number: e.target.value })} placeholder="0000000000000000" />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select className="form-control" value={form.bank_account_type} onChange={e => setForm({ ...form, bank_account_type: e.target.value })}>
                  <option value="">— select —</option>
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                </select>
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input className="form-control" value={form.bank_ifsc} onChange={e => setForm({ ...form, bank_ifsc: e.target.value.toUpperCase() })} placeholder="PUNB0237900" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </form>
      )}

      {activeTab === 'backup' && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Backup & Restore</h3>
          <div style={{ display: 'flex', gap: 16, flexDirection: 'column', maxWidth: 400 }}>
            <div>
              <h4>Export Backup</h4>
              <p style={{ color: '#666', marginBottom: 12 }}>Download all your data as a JSON backup file.</p>
              <button className="btn btn-success" onClick={handleExport}>Download Backup</button>
            </div>
            <hr />
            <div>
              <h4>Import Backup</h4>
              <p style={{ color: '#666', marginBottom: 12 }}>Restore data from a previous backup file.</p>
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} id="import-file" />
              <label htmlFor="import-file" className="btn btn-primary" style={{ cursor: 'pointer' }}>Choose Backup File</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
