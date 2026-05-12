import { getDb } from "../database";

export function getAll() {
  const db = getDb();
  return db.getAllSync(
    "SELECT * FROM inventory_items ORDER BY created_at DESC"
  );
}

export function upsert(item) {
  const db = getDb();
  // Preserve existing image_uri if not provided
  const existing = item.id
    ? db.getFirstSync("SELECT image_uri FROM inventory_items WHERE id = ?", [item.id])
    : null;
  const imageUri = item.image_uri ?? existing?.image_uri ?? null;

  db.runSync(
    `INSERT OR REPLACE INTO inventory_items
      (id, local_id, name, category, production_cost, selling_price, stock, image_uri, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id || null,
      item.local_id || null,
      item.name,
      item.category,
      item.production_cost ?? item.productionCost,
      item.selling_price ?? item.sellingPrice,
      item.stock,
      imageUri,
      item.created_at ?? item.createdAt ?? new Date().toISOString(),
      item.updated_at ?? item.updatedAt ?? new Date().toISOString(),
    ]
  );
}

export function upsertBatch(items) {
  const db = getDb();
  for (const item of items) {
    upsert(item);
  }
}

export function getByLocalId(localId) {
  const db = getDb();
  return db.getFirstSync(
    "SELECT * FROM inventory_items WHERE local_id = ?",
    [localId]
  );
}

export function updateServerId(localId, serverId) {
  const db = getDb();
  db.runSync(
    "UPDATE inventory_items SET id = ? WHERE local_id = ?",
    [serverId, localId]
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
  db.runSync("DELETE FROM inventory_items WHERE id = ?", [itemId]);
}

export function deleteByLocalId(localId) {
  const db = getDb();
  db.runSync("DELETE FROM inventory_items WHERE local_id = ?", [localId]);
}
