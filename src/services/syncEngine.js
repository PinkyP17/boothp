import { API_BASE_URL } from "../config/api";
import * as syncQueueRepo from "./repositories/syncQueueRepo";
import * as inventoryRepo from "./repositories/inventoryRepo";
import * as salesRepo from "./repositories/salesRepo";
import * as eventsRepo from "./repositories/eventsRepo";
import { getDb } from "./database";

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function syncAll(token, dispatch) {
  // Crash recovery: reset any stuck "syncing" entries
  syncQueueRepo.resetSyncing();

  // Push local changes to server
  await pushPendingChanges(token);

  // Pull latest from server into SQLite
  await pullFromServer(token);

  // Hydrate app state from SQLite
  hydrateState(dispatch);

  // Cleanup
  syncQueueRepo.clearCompleted();
}

async function pushPendingChanges(token) {
  const pending = syncQueueRepo.getPending();

  for (const entry of pending) {
    syncQueueRepo.markSyncing(entry.id);

    try {
      const payload = JSON.parse(entry.payload);
      const result = await pushEntry(token, entry, payload);

      if (result.success) {
        syncQueueRepo.markCompleted(entry.id);

        // If CREATE, update local entity with server-returned id
        if (entry.operation === "CREATE" && result.serverId) {
          updateLocalServerId(entry.entity_type, entry.entity_local_id, result.serverId);
        }
      } else if (result.retry) {
        syncQueueRepo.incrementRetry(entry.id);
        if (entry.retry_count >= 2) {
          syncQueueRepo.markFailed(entry.id, result.error || "Max retries exceeded");
        } else {
          // Revert to pending for next sync
          syncQueueRepo.resetSyncing();
        }
      } else {
        syncQueueRepo.markFailed(entry.id, result.error || "Request failed");
      }
    } catch (error) {
      if (isNetworkError(error)) {
        // Still offline — stop pushing, revert remaining to pending
        syncQueueRepo.resetSyncing();
        return;
      }
      syncQueueRepo.markFailed(entry.id, error.message);
    }
  }
}

async function pushEntry(token, entry, payload) {
  const { entity_type, operation, entity_server_id } = entry;

  let url;
  let method;

  switch (`${entity_type}:${operation}`) {
    case "inventory_item:CREATE":
      url = `${API_BASE_URL}/api/v1/inventory`;
      method = "POST";
      break;
    case "inventory_item:UPDATE":
      url = `${API_BASE_URL}/api/v1/inventory/${entity_server_id}`;
      method = "PUT";
      break;
    case "restock:CREATE": {
      const itemServerId = payload._itemServerId || entity_server_id;
      url = `${API_BASE_URL}/api/v1/inventory/${itemServerId}/restock`;
      method = "POST";
      delete payload._itemServerId;
      break;
    }
    case "sale:CREATE":
      url = `${API_BASE_URL}/api/v1/sales`;
      method = "POST";
      break;
    case "event:CREATE":
      url = `${API_BASE_URL}/api/v1/events`;
      method = "POST";
      break;
    case "event:UPDATE":
      url = `${API_BASE_URL}/api/v1/events/${entity_server_id}`;
      method = "PUT";
      break;
    case "event_expense:CREATE": {
      const eventServerId = payload._eventServerId || entity_server_id;
      url = `${API_BASE_URL}/api/v1/events/${eventServerId}/expenses`;
      method = "POST";
      delete payload._eventServerId;
      break;
    }
    case "event_expense:DELETE": {
      const evtId = payload._eventServerId || entity_server_id;
      const expId = payload._expenseServerId;
      url = `${API_BASE_URL}/api/v1/events/${evtId}/expenses/${expId}`;
      method = "DELETE";
      break;
    }
    default:
      return { success: false, error: `Unknown sync type: ${entity_type}:${operation}` };
  }

  const res = await fetch(url, {
    method,
    headers: authHeaders(token),
    body: method !== "DELETE" ? JSON.stringify(payload) : undefined,
  });

  if (res.ok) {
    if (method === "DELETE") {
      return { success: true };
    }
    const data = await res.json();
    return { success: true, serverId: data.id, data };
  }

  if (res.status >= 500) {
    return { success: false, retry: true, error: `Server error ${res.status}` };
  }

  const errorText = await res.text().catch(() => "Unknown error");
  return { success: false, retry: false, error: `${res.status}: ${errorText}` };
}

function updateLocalServerId(entityType, localId, serverId) {
  switch (entityType) {
    case "inventory_item":
      inventoryRepo.updateServerId(localId, serverId);
      break;
    case "sale":
      salesRepo.updateServerId(localId, serverId);
      break;
    case "event":
      eventsRepo.updateServerId(localId, serverId);
      break;
  }
}

async function pullFromServer(token) {
  const headers = { Authorization: `Bearer ${token}` };

  // Pull inventory
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/inventory`, { headers });
    if (res.ok) {
      const items = await res.json();
      for (const item of items) {
        inventoryRepo.upsert({
          id: item.id,
          name: item.name,
          category: item.category,
          production_cost: item.productionCost,
          selling_price: item.sellingPrice,
          stock: item.stock,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        });
      }
    }
  } catch (e) {
    console.warn("Pull inventory failed:", e.message);
  }

  // Pull sales
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/sales`, { headers });
    if (res.ok) {
      const sales = await res.json();
      for (const sale of sales) {
        salesRepo.upsertFromServer(sale);
      }
    }
  } catch (e) {
    console.warn("Pull sales failed:", e.message);
  }

  // Pull events
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/events`, { headers });
    if (res.ok) {
      const events = await res.json();
      for (const event of events) {
        eventsRepo.upsertWithExpenses(event);
      }
    }
  } catch (e) {
    console.warn("Pull events failed:", e.message);
  }

  // Update last sync time
  const db = getDb();
  db.runSync(
    "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('last_sync_at', ?)",
    [new Date().toISOString()]
  );
}

function hydrateState(dispatch) {
  // Load from SQLite and dispatch to app state
  const inventory = inventoryRepo.getAll().map((item) => ({
    id: item.id,
    localId: item.local_id,
    name: item.name,
    category: item.category,
    productionCost: item.production_cost,
    sellingPrice: item.selling_price,
    stock: item.stock,
    imageUri: item.image_uri,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
  dispatch({ type: "SET_INVENTORY", payload: inventory });

  const sales = salesRepo.getAll();
  dispatch({ type: "SET_SALES", payload: sales });

  const events = eventsRepo.getAll();
  dispatch({ type: "SET_EVENTS", payload: events });
}

function isNetworkError(error) {
  return (
    error.message?.includes("Network request failed") ||
    error.message?.includes("fetch") ||
    error.name === "TypeError"
  );
}
