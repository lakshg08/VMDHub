const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { getDatabase } = require('@vmd/shared');

const customerRoutes = require('./routes/customers');
const vendorRoutes = require('./routes/vendors');
const productRoutes = require('./routes/products');
const invoiceRoutes = require('./routes/invoices');
const gstRoutes = require('./routes/gst');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');
const plRoutes = require('./routes/pl');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/vmdhub.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Initialize database
const db = getDatabase(DB_PATH);
app.locals.db = db;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/pl', plRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`VMDHub API server running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});

module.exports = app;
