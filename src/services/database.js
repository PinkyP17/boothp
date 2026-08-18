import { openDatabaseSync } from "expo-sqlite";

let db = null;

export function initDatabase() {
  db = openDatabaseSync("artistbooth.db");

  db.runSync(`CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY,
    local_id TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    production_cost REAL NOT NULL,
    selling_price REAL NOT NULL,
    stock INTEGER NOT NULL,
    image_uri TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.runSync(`CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY,
    local_id TEXT UNIQUE,
    subtotal REAL NOT NULL,
    discount_type TEXT,
    discount_value REAL,
    discount_amount REAL,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL,
    timestamp TEXT NOT NULL
  )`);

  db.runSync(`CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    sale_local_id TEXT,
    item_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    original_price REAL NOT NULL
  )`);

  db.runSync(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    local_id TEXT UNIQUE,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL,
    currency TEXT DEFAULT 'MYR',
    notes TEXT,
    created_at TEXT NOT NULL
  )`);

  db.runSync(`CREATE TABLE IF NOT EXISTS event_expenses (
    id INTEGER PRIMARY KEY,
    local_id TEXT UNIQUE,
    event_id INTEGER,
    event_local_id TEXT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.runSync(`CREATE TABLE IF NOT EXISTS item_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    item_local_id TEXT,
    image_uri TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);

  db.runSync(`CREATE TABLE IF NOT EXISTS restocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    cost REAL NOT NULL,
    created_at TEXT NOT NULL
  )`);
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}
