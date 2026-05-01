# Phase 2B: Wire Inventory Screen to Backend API

## Goal
Replace mock data with real API calls. The inventory screen should load from the backend, and add/edit should persist to the database.

**Note:** Restock wiring is Phase 3 — we skip it here.

---

## Current Flow (mock data)
```
InventoryScreen → useAppState() → state.inventory (loaded from mockData.js)
  Add item   → dispatch ADD_TO_INVENTORY → reducer pushes to local array
  Edit item  → dispatch UPDATE_INVENTORY_ITEM → reducer replaces in local array
```

## Target Flow (API)
```
InventoryScreen → useAppState() → state.inventory (loaded from API on mount)
  Add item   → async action → POST /api/v1/inventory → dispatch on success
  Edit item  → async action → PUT /api/v1/inventory/{id} → dispatch on success
  Load items → async action → GET /api/v1/inventory → dispatch SET_INVENTORY
```

---

## Files to Change

| File | What changes |
|------|-------------|
| `src/context/AppContext.js` | Add async inventory actions, add SET_INVENTORY reducer case, remove mock data for inventory |
| `src/screens/InventoryScreen.js` | Call loadInventory on mount, use async actions instead of raw dispatch |

No changes needed to `InventoryItemCard.js` or `InventoryItemModal.js` — they're presentational.

---

## Step 1: Add `SET_INVENTORY` action to AppContext reducer

Add a new case in `appReducer`:

```
case "SET_INVENTORY":
  → replace state.inventory with action.payload
```

This is used when we fetch all items from the API.

---

## Step 2: Add async inventory actions in AppContext

The pattern already exists in `AuthContext.js` — async functions that call `fetch()`, then dispatch on success. Follow that same pattern.

You need access to the JWT token. Two options:
- **Option A:** Pass `token` as a parameter to each action (simplest)
- **Option B:** Import/access AuthContext from AppContext (creates coupling)

Recommend **Option A** — the screen already has access to both contexts.

### Actions to create (expose via the context value):

**`loadInventory(token)`**
1. `fetch GET /api/v1/inventory` with `Authorization: Bearer ${token}` header
2. Parse response JSON
3. Dispatch `{ type: "SET_INVENTORY", payload: data }`

**`addInventoryItem(token, itemData)`**
1. `fetch POST /api/v1/inventory` with token header + JSON body
2. Body: `{ name, category, productionCost, sellingPrice, stock }`
3. Parse response (the created item with server-generated `id`)
4. Dispatch `{ type: "ADD_TO_INVENTORY", payload: data }`

**`updateInventoryItem(token, itemId, itemData)`**
1. `fetch PUT /api/v1/inventory/${itemId}` with token header + JSON body
2. Parse response (the updated item)
3. Dispatch `{ type: "UPDATE_INVENTORY_ITEM", payload: data }`

### Important details
- Use `API_BASE_URL` from `src/config/api.js` (same as AuthContext does)
- The backend returns `id` as a number (Long), not a string — the frontend currently uses string IDs from mock data. This should be fine since JavaScript handles both, but be aware.
- Handle errors with try/catch — for now, a `console.error` is enough. We'll add proper error handling in Phase 7.

---

## Step 3: Update InventoryScreen to use async actions

### On mount — load inventory from API

```
useEffect(() => {
  loadInventory(token);
}, []);
```

Get `token` from `useAuth()`. Get `loadInventory` from `useAppState()`.

### On save (add/edit) — call async action instead of raw dispatch

Currently the screen does:
```javascript
if (mode === 'add') {
  dispatch({ type: 'ADD_TO_INVENTORY', payload: itemData });
} else {
  dispatch({ type: 'UPDATE_INVENTORY_ITEM', payload: itemData });
}
```

Change to:
```javascript
if (mode === 'add') {
  await addInventoryItem(token, itemData);
} else {
  await updateInventoryItem(token, item.id, itemData);
}
```

The async action handles the dispatch internally after the API succeeds.

---

## Step 4: Remove mock inventory data from initial state

In `AppContext.js`, change:
```
inventory: [...inventoryItems]
```
to:
```
inventory: []
```

Keep the `inventoryItems` import only if other parts of the code still use it (sales/events mock data may reference it). Otherwise remove it.

**Don't touch events or sales mock data** — those aren't wired yet.

---

## Step 5: Test end-to-end

1. Start the backend (`./mvnw spring-boot:run`)
2. Start the frontend (`npx expo start`)
3. Login with `test2@test.com` / `123`
4. Inventory screen should load empty (or with items from curl testing)
5. Add a new item → should appear in the list
6. Edit that item → changes should persist
7. Close and reopen the app → data should still be there (loaded from DB)

---

## Data Shape: Frontend vs Backend

| Field | Mock (frontend) | API (backend) |
|-------|-----------------|---------------|
| id | `"1"` (string) | `1` (number) |
| name | same | same |
| category | same | same |
| productionCost | `2.50` (number) | `2.50` (number) |
| sellingPrice | `15.00` (number) | `15.00` (number) |
| stock | `45` (number) | `45` (number) |
| createdAt | not present | `"2026-05-01T21:54:51"` |
| updatedAt | not present | `"2026-05-01T21:55:00"` |

The main difference is `id` type. The frontend components use `item.id` for keys and comparisons — should work with both types since `===` between numbers works fine. Just don't mix string and number IDs in the same list.

---

## What NOT to change yet
- **Restock flow** — that's Phase 3 (separate endpoint `POST /inventory/{id}/restock`)
- **Sales stock decrement** — that's Phase 5
- **Error handling UI** — that's Phase 7
- **InventoryItemModal.js** — no changes needed, it just returns form data
- **InventoryItemCard.js** — no changes needed, it just displays data
