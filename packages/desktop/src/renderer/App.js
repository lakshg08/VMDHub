import React, { useState } from 'react';
import { MemoryRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';

// Desktop app uses window.vmdAPI (IPC) instead of HTTP fetch
// Components are identical to web but use vmdAPI instead of fetch

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/vendors', label: 'Vendors', icon: '🏢' },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/invoices', label: 'Invoices', icon: '🧾' },
  { path: '/pl', label: 'P&L', icon: '💰' },
  { path: '/gst', label: 'GST', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function Sidebar({ collapsed, onToggle }) {
  return (
    <nav style={{
      width: collapsed ? 60 : 220,
      minHeight: '100vh',
      background: '#2c3e50',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s',
      flexShrink: 0,
    }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', WebkitAppRegion: 'drag' }}>
        {!collapsed && <span style={{ fontWeight: 700, fontSize: 16 }}>VMDHub</span>}
        <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, WebkitAppRegion: 'no-drag' }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      <div style={{ flex: 1, paddingTop: 8 }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
              color: isActive ? '#3498db' : 'rgba(255,255,255,0.8)',
              background: isActive ? 'rgba(52,152,219,0.15)' : 'transparent',
              textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? '3px solid #3498db' : '3px solid transparent',
            })}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

// Desktop-aware pages that use window.vmdAPI
function DesktopDashboard() {
  const [summary, setSummary] = React.useState(null);
  React.useEffect(() => {
    if (window.vmdAPI) {
      window.vmdAPI.getDashboardSummary().then(setSummary);
    }
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      {summary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Monthly Revenue', value: `₹${(summary.monthlyRevenue || 0).toLocaleString('en-IN')}`, color: '#3498db' },
            { label: 'Monthly Tax', value: `₹${(summary.monthlyTax || 0).toLocaleString('en-IN')}`, color: '#e74c3c' },
            { label: 'Total Vendors', value: summary.totalVendors || 0, color: '#27ae60' },
            { label: 'Total Products', value: summary.totalProducts || 0, color: '#f39c12' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, margin: '4px 0' }}>{s.value}</div>
            </div>
          ))}
        </div>
      ) : <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading...</div>}
    </div>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <MemoryRouter>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 14 }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <main style={{ flex: 1, padding: 24, overflow: 'auto', background: '#f4f6f9' }}>
          <Routes>
            <Route path="/" element={<DesktopDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </MemoryRouter>
  );
}
