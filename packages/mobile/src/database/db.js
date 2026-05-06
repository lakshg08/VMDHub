import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  vendor_id INTEGER,
  category TEXT,
  cost_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  gst_rate REAL NOT NULL DEFAULT 18,
  quantity_in_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date TEXT NOT NULL,
  invoice_type TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_gst TEXT,
  total_amount_before_tax REAL DEFAULT 0,
  total_tax REAL DEFAULT 0,
  total_amount_after_tax REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  amount REAL NOT NULL,
  gst_rate REAL DEFAULT 0,
  total_with_tax REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  company_gst TEXT,
  currency TEXT DEFAULT 'INR'
);
`;

export async function getDB() {
  if (!db) {
    db = await SQLite.openDatabase({ name: 'vmdhub.db', location: 'default' });
    const statements = SCHEMA.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      await db.executeSql(stmt + ';');
    }
  }
  return db;
}

export async function query(sql, params = []) {
  const database = await getDB();
  const [results] = await database.executeSql(sql, params);
  const rows = [];
  for (let i = 0; i < results.rows.length; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
}

export async function execute(sql, params = []) {
  const database = await getDB();
  const [results] = await database.executeSql(sql, params);
  return results;
}
