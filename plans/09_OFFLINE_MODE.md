# Phase 9: Offline/Online Mode with Auto-Sync

## Context
Internet at conventions is unreliable. The app currently fetches all data from the backend on mount and requires connectivity for every operation. This makes it unusable when the network drops mid-convention. We need a local-first architecture: all data persisted in SQLite, all writes work offline, and changes sync to the backend automatically when connectivity returns.

---

## Dependencies to Install

```bash
npx expo install expo-sqlite @react-native-community/netinfo expo-secure-store
```

- `expo-sqlite` — local structured storage (Expo SDK 54 synchronous API)
- `@react-native-community/netinfo` — detect connectivity changes
- `expo-secure-store` — persist JWT token securely (replaces in-memory-only token)

## app.json Plugin Config

Add to `plugins` array:
```json
"expo-sqlite",
"expo-secure-store"
```

---

## SQLite Database Schema

Database file: `artistbooth.db`

```sql
-- Mirror of backend inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
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
);

-- Mirror of backend sales
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY,
  local_id TEXT UNIQUE,
  subtotal REAL NOT NULL,
  discount_type TEXT,
  discount_value REAL,
  discount_amount REAL,
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY,
  local_id TEXT UNIQUE,
  sale_id INTEGER,
  sale_local_id TEXT,
  item_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  original_price REAL NOT NULL
);

-- Mirror of backend events
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  local_id TEXT UNIQUE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_expenses (
  id INTEGER PRIMARY KEY,
  local_id TEXT UNIQUE,
  event_id INTEGER,
  event_local_id TEXT,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL
);

-- Sync queue: every local mutation is recorded here
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  entity_local_id TEXT,
  entity_server_id INTEGER,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT
);

-- Metadata for tracking sync state
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Key Design Decisions
- `local_id` (UUID) used for items created offline before they get a server `id`
- `sync_queue` records every write operation for later replay against the backend
- `image_uri` column in `inventory_items` replaces the interim `imageMapping.js` from Phase 8

---

## New Files (9)

### 1. `src/services/database.js`
- `initDatabase()` — opens `artistbooth.db`, runs all CREATE TABLE statements
- Exports the `db` instance for use by repositories
- Uses `expo-sqlite`'s `openDatabaseSync()` API

### 2. `src/services/repositories/inventoryRepo.js`
| Function | Purpose |
|----------|---------|
| `getAll()` | SELECT all items |
| `upsert(item)` | INSERT OR REPLACE (preserves image_uri on server pulls) |
| `upsertBatch(items)` | Bulk upsert for sync pull |
| `getByLocalId(localId)` | Find by local_id |
| `updateServerId(localId, serverId)` | After sync, map local_id → server id |

### 3. `src/services/repositories/salesRepo.js`
| Function | Purpose |
|----------|---------|
| `getAll()` | SELECT sales JOIN sale_items |
| `insert(sale)` | Insert sale + sale_items |
| `updateServerId(localId, serverId)` | After sync |

### 4. `src/services/repositories/eventsRepo.js`
| Function | Purpose |
|----------|---------|
| `getAll()` | SELECT events with expenses |
| `upsert(event)` | INSERT OR REPLACE event |
| `insertExpense(expense)` | Insert expense |
| `deleteExpense(expenseId)` | Delete expense |

### 5. `src/services/repositories/syncQueueRepo.js`
| Function | Purpose |
|----------|---------|
| `enqueue(entityType, op, localId, serverId, payload)` | Add pending operation |
| `getPending()` | SELECT pending, ordered by created_at ASC |
| `markCompleted(id)` | Update status |
| `markFailed(id, errorMessage)` | Update status + error |
| `incrementRetry(id)` | Increment retry_count |
| `clearCompleted()` | Delete completed entries |
| `resetSyncing()` | Reset "syncing" → "pending" (crash recovery) |

### 6. `src/services/syncEngine.js`
Core sync logic:

| Function | Purpose |
|----------|---------|
| `syncAll(token)` | Orchestrates push → pull → hydrate |
| `pushPendingChanges(token)` | Replay sync queue against backend API |
| `pullFromServer(token)` | Fetch all GET endpoints, upsert into SQLite |

### 7. `src/services/connectivityService.js`
- `subscribeToConnectivity(callback)` — listens for connectivity changes
- `isOnline()` — one-shot check
- `useConnectivity()` hook that returns `{ isOnline }`

### 8. `src/context/ConnectivityContext.js`
- React context provider wrapping the app
- Provides `isOnline` and `isSyncing` state
- On transition offline → online: triggers `syncEngine.syncAll()`
- On app launch while online: triggers sync

### 9. `src/components/ConnectivityBanner.js`
- Yellow/orange bar: "Offline Mode" when `isOnline === false`
- Blue bar: "Syncing..." when sync is in progress
- Green flash: "Synced!" briefly after successful sync
- Disappears when online and idle

---

## Modified Files (6)

### 10. `src/context/AuthContext.js`
- Import `expo-secure-store`
- On `LOGIN_SUCCESS` / `SIGNUP_SUCCESS`: persist token + user to SecureStore
- On `LOGOUT`: delete from SecureStore
- Add `isRestoring: true` flag to initial state
- Add `restoreToken()` via `useEffect` on mount: read from SecureStore, dispatch LOGIN_SUCCESS if found, set `isRestoring: false`
- App shows loading screen while `isRestoring` is true

### 11. `src/context/AppContext.js` — Major Refactor

All action functions change from **API-first** to **SQLite-first**:

**Read operations (load*):**
1. Read from SQLite immediately → dispatch to state (instant UI)
2. If online, fetch from API → upsert into SQLite → re-dispatch (background refresh)

**Write operations (add*, update*, create*, restock*, delete*):**
1. Generate `local_id` (UUID) if creating
2. Write to SQLite
3. Enqueue sync operation in sync_queue
4. Dispatch to state (instant UI update)
5. If online, attempt immediate sync

Example — `addInventoryItem`:
```js
async addInventoryItem(token, itemData) {
  const localId = generateUUID();
  const item = { ...itemData, local_id: localId, created_at: new Date().toISOString() };

  // 1. Write locally
  inventoryRepo.upsert(item);

  // 2. Enqueue for sync
  syncQueueRepo.enqueue('inventory_item', 'CREATE', localId, null, JSON.stringify(itemData));

  // 3. Update UI
  dispatch({ type: "ADD_TO_INVENTORY", payload: item });

  // 4. Try immediate sync if online
  if (isOnline()) {
    syncEngine.pushPendingChanges(token);
  }

  return { success: true };
}
```

### 12. `App.js`
- Call `initDatabase()` before rendering (use loading state)
- Provider hierarchy: `AuthProvider > ConnectivityProvider > AppStateProvider > RootNavigator`

### 13-15. Screen files (minor)
- `src/screens/InventoryScreen.js` — add `<ConnectivityBanner />` at top
- `src/screens/POSScreen.js` — add `<ConnectivityBanner />` at top
- `src/screens/EventsScreen.js` — add `<ConnectivityBanner />` at top

---

## Sync Algorithm

### Push Phase (local → server)

```
for each entry in sync_queue WHERE status = 'pending' ORDER BY created_at ASC:
  1. Set status = 'syncing'
  2. Map entity_type + operation → API endpoint:
     inventory_item + CREATE  → POST /api/v1/inventory
     inventory_item + UPDATE  → PUT  /api/v1/inventory/{serverId}
     restock + CREATE         → POST /api/v1/inventory/{itemServerId}/restock
     sale + CREATE            → POST /api/v1/sales
     event + CREATE           → POST /api/v1/events
     event + UPDATE           → PUT  /api/v1/events/{serverId}
     event_expense + CREATE   → POST /api/v1/events/{eventServerId}/expenses
     event_expense + DELETE   → DELETE /api/v1/events/{eventServerId}/expenses/{expenseServerId}
  3. On success:
     - Mark status = 'completed'
     - If CREATE: update local entity's id with server-returned id
     - Update any FK references (e.g., sale_items pointing to locally-created items)
  4. On failure:
     - Network error: stop queue (still offline), revert to 'pending'
     - 409/404: mark 'failed', skip (data may be deleted on server)
     - 400/422: mark 'failed' with error, continue to next
     - 5xx: retry up to 3 times, then mark 'failed'
```

### Pull Phase (server → local)

```
1. GET /api/v1/inventory → upsert all into inventory_items
   - Preserve image_uri for existing rows
   - Don't overwrite rows with local_id but no server id (pending creates)
2. GET /api/v1/sales → upsert into sales + sale_items
3. GET /api/v1/events → upsert into events + event_expenses
4. GET /api/v1/dashboard → dispatch directly (computed data)
5. Update sync_metadata: last_sync_at = now
6. Load all from SQLite → dispatch SET_* actions to AppContext
```

### Conflict Resolution

| Scenario | Strategy |
|----------|----------|
| Server data vs local cached data | Server wins (pull overwrites local, except image_uri and pending creates) |
| Offline writes | Queued and replayed in order during push |
| Stock after offline sale | Sale syncs → server decrements stock → pull brings correct stock |
| Offline item create + offline sale of that item | Queue processes in order: CREATE item first (gets server id), then CREATE sale (maps local_id → server id) |

---

## Edge Cases

| Case | Handling |
|------|----------|
| First login | Requires internet (to get JWT). After that, token is in SecureStore. |
| Token expires while offline | Sync fails with 401. Show "Please log in to sync" prompt. |
| App crashes mid-sync | On next launch, `resetSyncing()` reverts "syncing" → "pending". |
| Long offline period (100+ sales) | Show progress: "Syncing 47/182 operations..." |
| Two devices same account | Last-sync-wins. Acceptable for single-booth use. |
| Dashboard offline | Show cached data from last sync, or compute locally from SQLite. |

---

## Integration with Phase 8 (Images)

Once this phase is implemented:
- Delete `src/services/imageMapping.js` (interim file)
- The `image_uri` column in `inventory_items` SQLite table is the permanent home
- During pull phase, preserve local `image_uri` when upserting server data:

```js
// In inventoryRepo.upsert():
const existing = db.getFirstSync('SELECT image_uri FROM inventory_items WHERE id = ?', [item.id]);
const imageUri = existing?.image_uri || null;
// INSERT OR REPLACE with preserved imageUri
```

---

## Implementation Order

### Sub-phase 1: Foundation
1. Install dependencies + update `app.json`
2. Create `src/services/database.js` — init SQLite + create tables
3. Create `src/services/connectivityService.js` + `src/context/ConnectivityContext.js`
4. Modify `src/context/AuthContext.js` — SecureStore token persistence + restore
5. Modify `App.js` — add ConnectivityProvider, call `initDatabase()`

### Sub-phase 2: Read Path (local persistence)
6. Create all repository files (inventoryRepo, salesRepo, eventsRepo, syncQueueRepo)
7. Modify `AppContext.js` load functions — read from SQLite first, then fetch + upsert

### Sub-phase 3: Write Path (offline writes)
8. Modify `AppContext.js` write functions — write to SQLite + enqueue sync
9. Create `src/services/syncEngine.js` — push + pull logic

### Sub-phase 4: Auto-Sync + UI
10. Wire `ConnectivityContext` to trigger `syncAll()` on online transition + app launch
11. Create `src/components/ConnectivityBanner.js`
12. Add banner to InventoryScreen, POSScreen, EventsScreen

### Sub-phase 5: Polish
13. Sync progress indicator
14. Crash recovery (reset syncing entries)
15. Retry logic for transient errors
16. Test: offline sale → close app → reopen with internet → verify sync + correct stock

---

## Verification

1. **Offline inventory**: Turn off wifi → add inventory item → close app → reopen → item persists
2. **Offline sale**: Turn off wifi → complete POS sale → stock decrements locally
3. **Auto-sync**: Turn wifi back on → app syncs automatically → check backend has the sale
4. **Stock correctness**: After sync, backend stock matches local stock
5. **Token persistence**: Close app → reopen → still logged in (no re-login needed)
6. **Connectivity banner**: Toggle wifi → "Offline Mode" appears/disappears
7. **Crash recovery**: Kill app during sync → reopen → pending ops resume
8. **Long offline**: Make 20+ sales offline → sync all at once → progress shows → all sales on backend
