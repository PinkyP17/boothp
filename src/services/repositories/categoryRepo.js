import { getDb } from "../database";

export function getAll() {
  const db = getDb();
  return db.getAllSync("SELECT * FROM categories ORDER BY id ASC");
}

export function insert(name) {
  const db = getDb();
  const result = db.runSync(
    "INSERT INTO categories (name, created_at) VALUES (?, ?)",
    [name, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export function deleteByName(name) {
  const db = getDb();
  db.runSync("DELETE FROM categories WHERE name = ?", [name]);
}
