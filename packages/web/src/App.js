import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import VendorList from './components/VendorList';
import ProductList from './components/ProductList';
import InvoiceForm from './components/InvoiceForm';
import InvoiceList from './components/InvoiceList';
import InvoicePrint from './components/InvoicePrint';
import QuotationPrint from './components/QuotationPrint';
import QuotationList from './components/QuotationList';
import QuotationForm from './components/QuotationForm';
import PLStatement from './components/PLStatement';
import GSTTracker from './components/GSTTracker';
import Settings from './components/Settings';
import BackupModal from './components/BackupModal';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/vendors', label: 'Vendors', icon: '🏢', adminOnly: true },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/quotations', label: 'Quotations', icon: '📋' },
  { path: '/invoices', label: 'Invoices', icon: '🧾' },
  { path: '/pl', label: 'P&L', icon: '💰', adminOnly: true },
  { path: '/gst', label: 'GST Tracker', icon: '📋', adminOnly: true },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

function parseToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function Sidebar({ collapsed, onToggle, onBackupClick, onLogout, navItems, username, role }) {
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
        {navItems.map(item => (
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
      <button onClick={onBackupClick} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.8)', cursor: 'pointer', width: '100%',
        fontSize: 14, borderLeft: '3px solid transparent',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ fontSize: 18 }}>☁</span>
        {!collapsed && <span>Backup</span>}
      </button>
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            {username} <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{role}</span>
          </div>
          <button onClick={onLogout} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)',
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, width: '100%',
          }}>
            Sign Out
          </button>
        </div>
      )}
      {collapsed && (
        <button onClick={onLogout} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          padding: '10px', cursor: 'pointer', fontSize: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }} title="Sign Out">↩</button>
      )}
      {!collapsed && (
        <div style={{ padding: '8px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          VMDHub v1.0.0
        </div>
      )}
    </nav>
  );
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('vmd_token');
    if (!token) return null;
    const payload = parseToken(token);
    if (!payload) { localStorage.removeItem('vmd_token'); return null; }
    return { token, role: payload.role, username: payload.username };
  });

  function handleLogin(data) {
    localStorage.setItem('vmd_token', data.token);
    setAuth({ token: data.token, role: data.role, username: data.username });
  }

  function handleLogout() {
    localStorage.removeItem('vmd_token');
    setAuth(null);
  }

  if (!auth) return <LoginPage onLogin={handleLogin} />;

  const visibleNavItems = NAV_ITEMS.filter(item => auth.role === 'admin' || !item.adminOnly);

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/print/invoice/:id" element={<InvoicePrint />} />
          <Route path="/print/quotation/:id" element={<QuotationPrint />} />
          <Route path="*" element={
            <>
              <div style={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed(c => !c)}
                  onBackupClick={() => setShowBackup(true)}
                  onLogout={handleLogout}
                  navItems={visibleNavItems}
                  username={auth.username}
                  role={auth.role}
                />
                <main style={{ flex: 1, padding: 24, overflow: 'auto', background: '#f4f6f9' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/customers" element={<CustomerList />} />
                    <Route path="/vendors" element={<VendorList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/quotations" element={<QuotationList />} />
                    <Route path="/quotations/new" element={<QuotationForm />} />
                    <Route path="/quotations/:id" element={<QuotationForm />} />
                    <Route path="/invoices" element={<InvoiceList />} />
                    <Route path="/invoices/new" element={<InvoiceForm />} />
                    <Route path="/invoices/:id" element={<InvoiceForm />} />
                    <Route path="/pl" element={<PLStatement />} />
                    <Route path="/gst" element={<GSTTracker />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
              {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
            </>
          } />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
