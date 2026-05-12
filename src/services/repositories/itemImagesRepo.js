import { getDb } from "../database";

export function getByItemId(itemId) {
  const db = getDb();
  return db.getAllSync(
    "SELECT * FROM item_images WHERE item_id = ? ORDER BY sort_order ASC",
    [itemId]
  );
}

export function getByItemLocalId(localId) {
  const db = getDb();
  return db.getAllSync(
    "SELECT * FROM item_images WHERE item_local_id = ? ORDER BY sort_order ASC",
    [localId]
  );
}

export function getForItem(item) {
  if (item.id) return getByItemId(item.id);
  if (item.local_id) return getByItemLocalId(item.local_id);
  return [];
}

export function addImage(itemId, itemLocalId, imageUri, sortOrder) {
  const db = getDb();
  db.runSync(
    `INSERT INTO item_images (item_id, item_local_id, image_uri, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [itemId || null, itemLocalId || null, imageUri, sortOrder, new Date().toISOString()]
  );
}

export function removeImage(imageId) {
  const db = getDb();
  db.runSync("DELETE FROM item_images WHERE id = ?", [imageId]);
}

export function removeAllForItem(itemId) {
  const db = getDb();
  db.runSync("DELETE FROM item_images WHERE item_id = ?", [itemId]);
}

export function removeAllForLocalId(localId) {
  const db = getDb();
  db.runSync("DELETE FROM item_images WHERE item_local_id = ?", [localId]);
}

export function replaceImages(itemId, itemLocalId, imageUris) {
  const db = getDb();
  // Remove existing
  if (itemId) db.runSync("DELETE FROM item_images WHERE item_id = ?", [itemId]);
  if (itemLocalId) db.runSync("DELETE FROM item_images WHERE item_local_id = ?", [itemLocalId]);
  // Insert new
  imageUris.forEach((uri, index) => {
    db.runSync(
      `INSERT INTO item_images (item_id, item_local_id, image_uri, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [itemId || null, itemLocalId || null, uri, index, new Date().toISOString()]
    );
  });
}

export function updateItemId(localId, serverId) {
  const db = getDb();
  db.runSync(
    "UPDATE item_images SET item_id = ? WHERE item_local_id = ?",
    [serverId, localId]
  );
}
