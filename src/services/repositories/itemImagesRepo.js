import { getDb } from "../database";

export function getByItemId(itemId) {
  const db = getDb();
  return db.getAllSync(
    "SELECT * FROM item_images WHERE item_id = ? ORDER BY sort_order ASC",
    [itemId]
  );
}

export function replaceImages(itemId, imageUris) {
  const db = getDb();
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM item_images WHERE item_id = ?", [itemId]);
    imageUris.forEach((uri, index) => {
      db.runSync(
        `INSERT INTO item_images (item_id, image_uri, sort_order, created_at)
         VALUES (?, ?, ?, ?)`,
        [itemId, uri, index, new Date().toISOString()]
      );
    });
  });
}
