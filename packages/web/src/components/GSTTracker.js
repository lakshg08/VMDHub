import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function GSTTracker() {
  const [gstData, setGstData] = useState([]);
  const [invoiceGST, setInvoiceGST] = useState({});
  const [year, setYear] = useState(new Date().getFullYear());
  const [editMonth, setEditMonth] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [year]);

  async function fetchData() {
    setLoading(true);
    try {
      const [gstRes, invGSTRes] = await Promise.all([
        fetch(`${API}/gst?year=${year}`),
        fetch(`${API}/gst/invoice-summary?year=${year}`),
      ]);
      setGstData(await gstRes.json());
      setInvoiceGST(await invGSTRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getMonthData(month) {
    const ym = `${year}-${String(month).padStart(2, '0')}`;
    return gstData.find(d => d.year_month === ym) || { year_month: ym, input_igst: 0, input_cgst: 0, input_sgst: 0, output_igst: 0, output_cgst: 0, output_sgst: 0 };
  }

  function getInvoiceGST(month) {
    const ym = `${year}-${String(month).padStart(2, '0')}`;
    return invoiceGST[ym] || { igst: 0, cgst: 0, sgst: 0 };
  }

  function openEdit(month) {
    const d = getMonthData(month);
    const inv = getInvoiceGST(month);
    setEditForm({
      year_month: d.year_month,
      input_igst: d.input_igst || inv.igst,
      input_cgst: d.input_cgst || inv.cgst,
      input_sgst: d.input_sgst || inv.sgst,
      input_notes: d.input_notes || '',
      output_igst: d.output_igst || 0,
      output_cgst: d.output_cgst || 0,
      output_sgst: d.output_sgst || 0,
    });
    setEditMonth(month);
  }

  async function handleSave(e) {
    e.preventDefault();
    await fetch(`${API}/gst`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditMonth(null);
    fetchData();
  }

  if (loading) return <div className="loading">Loading GST data...</div>;

  const totals = Array.from({ length: 12 }, (_, i) => i + 1).reduce((acc, m) => {
    const d = getMonthData(m);
    acc.inIGST += parseFloat(d.input_igst) || 0;
    acc.inCGST += parseFloat(d.input_cgst) || 0;
    acc.inSGST += parseFloat(d.input_sgst) || 0;
    acc.outIGST += parseFloat(d.output_igst) || 0;
    acc.outCGST += parseFloat(d.output_cgst) || 0;
    acc.outSGST += parseFloat(d.output_sgst) || 0;
    return acc;
  }, { inIGST: 0, inCGST: 0, inSGST: 0, outIGST: 0, outCGST: 0, outSGST: 0 });

  const netPayable = Math.max(0, (totals.outIGST + totals.outCGST + totals.outSGST) - (totals.inIGST + totals.inCGST + totals.inSGST));

  return (
    <div>
      <div className="page-header">
        <h1>GST Tracker</h1>
        <select className="form-control" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: 100 }}>
          {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-label">Total Output GST</div><div className="stat-value" style={{ color: '#e74c3c' }}>₹{(totals.outIGST + totals.outCGST + totals.outSGST).toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Total Input GST</div><div className="stat-value" style={{ color: '#27ae60' }}>₹{(totals.inIGST + totals.inCGST + totals.inSGST).toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Net Payable</div><div className="stat-value" style={{ color: '#f39c12' }}>₹{netPayable.toFixed(2)}</div></div>
        <div className="stat-card"><div className="stat-label">Year</div><div className="stat-value">{year}</div></div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Input IGST</th><th>Input CGST</th><th>Input SGST</th>
              <th>Output IGST</th><th>Output CGST</th><th>Output SGST</th>
              <th>Net Payable</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
              const d = getMonthData(m);
              const inTotal = parseFloat(d.input_igst || 0) + parseFloat(d.input_cgst || 0) + parseFloat(d.input_sgst || 0);
              const outTotal = parseFloat(d.output_igst || 0) + parseFloat(d.output_cgst || 0) + parseFloat(d.output_sgst || 0);
              const net = Math.max(0, outTotal - inTotal);
              return (
                <tr key={m}>
                  <td><strong>{MONTHS[m - 1]} {year}</strong></td>
                  <td>₹{parseFloat(d.input_igst || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(d.input_cgst || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(d.input_sgst || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(d.output_igst || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(d.output_cgst || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(d.output_sgst || 0).toFixed(2)}</td>
                  <td style={{ color: net > 0 ? '#e74c3c' : '#27ae60', fontWeight: 600 }}>₹{net.toFixed(2)}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editMonth && (
        <div className="modal-overlay" onClick={() => setEditMonth(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit GST - {MONTHS[editMonth - 1]} {year}</h2>
              <button className="modal-close" onClick={() => setEditMonth(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <h3 style={{ marginBottom: 12, color: '#27ae60' }}>Input GST (Purchase)</h3>
              <div className="grid-3">
                <div className="form-group"><label>Input IGST</label><input className="form-control" type="number" step="0.01" value={editForm.input_igst} onChange={e => setEditForm({ ...editForm, input_igst: e.target.value })} /></div>
                <div className="form-group"><label>Input CGST</label><input className="form-control" type="number" step="0.01" value={editForm.input_cgst} onChange={e => setEditForm({ ...editForm, input_cgst: e.target.value })} /></div>
                <div className="form-group"><label>Input SGST</label><input className="form-control" type="number" step="0.01" value={editForm.input_sgst} onChange={e => setEditForm({ ...editForm, input_sgst: e.target.value })} /></div>
              </div>
              <h3 style={{ marginBottom: 12, color: '#e74c3c' }}>Output GST (Sales)</h3>
              <div className="grid-3">
                <div className="form-group"><label>Output IGST</label><input className="form-control" type="number" step="0.01" value={editForm.output_igst} onChange={e => setEditForm({ ...editForm, output_igst: e.target.value })} /></div>
                <div className="form-group"><label>Output CGST</label><input className="form-control" type="number" step="0.01" value={editForm.output_cgst} onChange={e => setEditForm({ ...editForm, output_cgst: e.target.value })} /></div>
                <div className="form-group"><label>Output SGST</label><input className="form-control" type="number" step="0.01" value={editForm.output_sgst} onChange={e => setEditForm({ ...editForm, output_sgst: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" rows={2} value={editForm.input_notes} onChange={e => setEditForm({ ...editForm, input_notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditMonth(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
