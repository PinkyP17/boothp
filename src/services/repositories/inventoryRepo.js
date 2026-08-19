import { getDb } from "../database";

export function getAll() {
  const db = getDb();
  return db.getAllSync(
    "SELECT * FROM inventory_items ORDER BY created_at DESC"
  );
}

export function getById(id) {
  const db = getDb();
  return db.getFirstSync("SELECT * FROM inventory_items WHERE id = ?", [id]);
}

export function insert(item) {
  const db = getDb();
  const result = db.runSync(
    `INSERT INTO inventory_items
      (name, category, production_cost, selling_price, stock, image_uri, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.name,
      item.category,
      item.production_cost,
      item.selling_price,
      item.stock,
      item.image_uri ?? null,
      item.created_at,
      item.updated_at,
    ]
  );
  return result.lastInsertRowId;
}

export function update(item) {
  const db = getDb();
  // Preserve existing image_uri if not provided
  const existing = db.getFirstSync(
    "SELECT image_uri FROM inventory_items WHERE id = ?",
    [item.id]
  );
  const imageUri = item.image_uri ?? existing?.image_uri ?? null;

  db.runSync(
    `UPDATE inventory_items
    SET name = ?, category = ?, production_cost = ?, selling_price = ?, stock = ?, image_uri = ?, updated_at = ?
    WHERE id = ?`,
    [
      item.name,
      item.category,
      item.production_cost,
      item.selling_price,
      item.stock,
      imageUri,
      item.updated_at,
      item.id,
    ]
  );
}

export function updateStock(itemId, newStock) {
  const db = getDb();
  db.runSync(
    "UPDATE inventory_items SET stock = ? WHERE id = ?",
    [newStock, itemId]
  );
}

export function deleteItem(itemId) {
  const db = getDb();
  // item_images and restocks rows are removed automatically via ON DELETE CASCADE
  db.runSync("DELETE FROM inventory_items WHERE id = ?", [itemId]);
}
