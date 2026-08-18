import { getDb } from "../database";

export function insert(itemId, quantity, cost) {
  const db = getDb();
  db.runSync(
    `INSERT INTO restocks (item_id, quantity, cost, created_at) VALUES (?, ?, ?, ?)`,
    [itemId, quantity, cost, new Date().toISOString()]
  );
}

export function getAll() {
  const db = getDb();
  return db.getAllSync("SELECT * FROM restocks ORDER BY created_at DESC");
}
