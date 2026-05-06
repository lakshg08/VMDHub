import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:3001/api';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [summaryRes, monthlyRes] = await Promise.all([
        fetch(`${API}/dashboard/summary`),
        fetch(`${API}/dashboard/monthly`),
      ]);
      const summaryData = await summaryRes.json();
      const monthly = await monthlyRes.json();
      setSummary(summaryData);
      setMonthlyData(monthly);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const stats = summary || {};

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: '#666', fontSize: 13 }}>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Monthly Revenue" value={`₹${(stats.monthlyRevenue || 0).toLocaleString('en-IN')}`} sub="This month" color="#3498db" />
        <StatCard label="Monthly Tax" value={`₹${(stats.monthlyTax || 0).toLocaleString('en-IN')}`} sub="GST collected" color="#e74c3c" />
        <StatCard label="Total Vendors" value={stats.totalVendors || 0} sub="Registered vendors" color="#27ae60" />
        <StatCard label="Total Products" value={stats.totalProducts || 0} sub="In catalog" color="#f39c12" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Monthly Revenue (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
              <Line type="monotone" dataKey="revenue" stroke="#3498db" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Invoice Count by Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData.slice(-6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#27ae60" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Recent Invoices</h3>
        {(stats.recentInvoices || []).length === 0 ? (
          <div className="empty-state"><p>No invoices yet. Create your first invoice!</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentInvoices || []).map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.invoice_date}</td>
                  <td>{inv.customer_name}</td>
                  <td>₹{(inv.total_amount_after_tax || 0).toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { paid: 'success', sent: 'info', draft: 'secondary', cancelled: 'danger' };
  return <span className={`badge badge-${map[status] || 'secondary'}`}>{status}</span>;
}
