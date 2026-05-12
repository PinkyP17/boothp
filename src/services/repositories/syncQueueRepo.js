import { getDb } from "../database";

export function enqueue(entityType, operation, localId, serverId, payload) {
  const db = getDb();
  db.runSync(
    `INSERT INTO sync_queue
      (entity_type, operation, entity_local_id, entity_server_id, payload, created_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [
      entityType,
      operation,
      localId || null,
      serverId || null,
      typeof payload === "string" ? payload : JSON.stringify(payload),
      new Date().toISOString(),
    ]
  );
}

export function getPending() {
  const db = getDb();
  return db.getAllSync(
    "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC"
  );
}

export function markSyncing(id) {
  const db = getDb();
  db.runSync("UPDATE sync_queue SET status = 'syncing' WHERE id = ?", [id]);
}

export function markCompleted(id) {
  const db = getDb();
  db.runSync("UPDATE sync_queue SET status = 'completed' WHERE id = ?", [id]);
}

export function markFailed(id, errorMessage) {
  const db = getDb();
  db.runSync(
    "UPDATE sync_queue SET status = 'failed', error_message = ? WHERE id = ?",
    [errorMessage, id]
  );
}

export function incrementRetry(id) {
  const db = getDb();
  db.runSync(
    "UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?",
    [id]
  );
}

export function clearCompleted() {
  const db = getDb();
  db.runSync("DELETE FROM sync_queue WHERE status = 'completed'");
}

export function resetSyncing() {
  const db = getDb();
  db.runSync("UPDATE sync_queue SET status = 'pending' WHERE status = 'syncing'");
}

export function getPendingCount() {
  const db = getDb();
  const result = db.getFirstSync(
    "SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'"
  );
  return result?.count ?? 0;
}
