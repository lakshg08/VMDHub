import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:3001/api';

export default function PLStatement() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPL(); }, [year]);

  async function fetchPL() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/pl?year=${year}`);
      setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function exportPDF() {
    const res = await fetch(`${API}/pl/export?year=${year}&format=html`);
    const html = await res.text();
    const win = window.open('', '_blank');
    win.document.write(html);
    win.print();
  }

  if (loading) return <div className="loading">Loading P&L data...</div>;

  const monthly = data?.monthly || [];
  const yearly = data?.yearly || {};

  const chartData = monthly.map(m => ({
    month: m.yearMonth.slice(5),
    revenue: m.revenue || 0,
    cost: m.cost || 0,
    profit: m.profit || 0,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Profit & Loss Statement</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="form-control" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: 100 }}>
            {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-outline" onClick={exportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-label">Revenue</div><div className="stat-value" style={{ color: '#3498db' }}>₹{(yearly.revenue || 0).toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">Cost</div><div className="stat-value" style={{ color: '#e74c3c' }}>₹{(yearly.cost || 0).toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">Profit</div><div className="stat-value" style={{ color: '#27ae60' }}>₹{(yearly.profit || 0).toLocaleString('en-IN')}</div></div>
        <div className="stat-card"><div className="stat-label">Margin</div><div className="stat-value" style={{ color: '#f39c12' }}>{(yearly.margin || 0).toFixed(1)}%</div></div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Monthly Revenue vs Cost</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
            <Legend />
            <Bar dataKey="revenue" fill="#3498db" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cost" fill="#e74c3c" name="Cost" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Monthly Profit Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
            <Line type="monotone" dataKey="profit" stroke="#27ae60" strokeWidth={2} dot={{ r: 4 }} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Monthly Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Month</th><th>Invoices</th><th>Revenue</th><th>Cost</th>
              <th>Profit</th><th>Margin</th><th>Tax</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(m => (
              <tr key={m.yearMonth}>
                <td><strong>{m.yearMonth}</strong></td>
                <td>{m.invoiceCount || 0}</td>
                <td>₹{(m.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>₹{(m.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ color: m.profit >= 0 ? '#27ae60' : '#e74c3c' }}>
                  ₹{(m.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td>{(m.margin || 0).toFixed(1)}%</td>
                <td>₹{(m.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: '#f0f4ff', borderTop: '2px solid #2c3e50' }}>
              <td>Total</td>
              <td></td>
              <td>₹{(yearly.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td>₹{(yearly.cost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td style={{ color: yearly.profit >= 0 ? '#27ae60' : '#e74c3c' }}>₹{(yearly.profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              <td>{(yearly.margin || 0).toFixed(1)}%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
