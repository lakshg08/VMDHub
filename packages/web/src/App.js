import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VendorList from './components/VendorList';
import ProductList from './components/ProductList';
import InvoiceForm from './components/InvoiceForm';
import PLStatement from './components/PLStatement';
import GSTTracker from './components/GSTTracker';
import Settings from './components/Settings';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/vendors', label: 'Vendors', icon: '🏢' },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/invoices', label: 'Invoices', icon: '🧾' },
  { path: '/pl', label: 'P&L', icon: '💰' },
  { path: '/gst', label: 'GST Tracker', icon: '📋' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function Sidebar({ collapsed, onToggle }) {
  return (
    <nav style={{
      width: collapsed ? 60 : 240,
      minHeight: '100vh',
      background: '#2c3e50',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s',
      flexShrink: 0,
    }}>
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {!collapsed && <span style={{ fontWeight: 700, fontSize: 18 }}>VMDHub</span>}
        <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 18 }}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      <div style={{ flex: 1, paddingTop: 12 }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
              color: isActive ? '#3498db' : 'rgba(255,255,255,0.8)',
              background: isActive ? 'rgba(52,152,219,0.15)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? '3px solid #3498db' : '3px solid transparent',
            })}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
      {!collapsed && (
        <div style={{ padding: 16, fontSize: 11, color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          VMDHub v1.0.0
        </div>
      )}
    </nav>
  );
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />
        <main style={{ flex: 1, padding: 24, overflow: 'auto', background: '#f4f6f9' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/invoices" element={<InvoiceForm />} />
            <Route path="/invoices/new" element={<InvoiceForm />} />
            <Route path="/invoices/:id" element={<InvoiceForm />} />
            <Route path="/pl" element={<PLStatement />} />
            <Route path="/gst" element={<GSTTracker />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
