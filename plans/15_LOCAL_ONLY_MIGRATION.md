# Local-Only Migration + Codebase Cleanup Plan

Dated 2026-08-19. Scope: three changes discussed — drop the backend, extract styles from JS, document the data model for the friend building a separate Medusa backend. CLAUDE.md persona update already applied.

---

## 1. Local-only mode: archive and disconnect the backend

**Decision**: drop auth entirely — single local user, no login screen, no JWT/token handling.

### What gets removed from the app
- `src/screens/LoginScreen.js`, `src/screens/SignUpScreen.js` — deleted, app opens straight to `TabNavigator`.
- `src/context/AuthContext.js` — deleted (token storage via expo-secure-store, login/signup/logout calls).
- `src/context/ConnectivityContext.js` and `src/services/connectivityService.js` — deleted; nothing to reconnect to, so online/offline detection and `triggerSync`/`registerSyncFunction` have no purpose.
- `src/components/ConnectivityBanner.js` — deleted (no backend to be disconnected from).
- `src/services/syncEngine.js` — deleted (`syncAll`, `pushPendingChanges`, `pullFromServer`, all `fetch` calls to `API_BASE_URL`).
- `src/config/api.js` — deleted.
- Every `fetch(...API_BASE_URL...)` call inside `src/context/AppContext.js` (currently ~17 occurrences across `loadInventory`, `createSale`, event/expense actions, dashboard load, etc.) — removed. Each action becomes: read/write SQLite directly, dispatch to state. No "try immediate fetch, else queue" branching.
- `sync_queue` table and `src/services/repositories/syncQueueRepo.js` — removed; nothing queues since there's nowhere to push to.
- Server-id reconciliation (`updateServerId` in each repo, `local_id`/server `id` dual-key handling in `sales`/`sale_items`/etc.) — simplifies to just a single local primary key per table, no more "local until synced" distinction.
- `EXPO_PUBLIC_API_URL` / `.env` — no longer read.

### What stays / changes shape
- SQLite (`src/services/database.js` + repositories) becomes the **only** persistence layer — already local-first, this is a simplification (removing the sync/server-id half of each repo), not a rewrite.
- `AppContext.js` actions shrink to: SQLite write → dispatch. This is the biggest single file (~1000+ lines) and will drop substantially once the fetch/sync branches are gone.
- `backend/` folder: moved to an `archive/backend/` (or similar) at the repo root, or left in place but clearly marked dead in a top-level note — needs a decision (see open question below). Render/Supabase deployment should be shut down or left to idle separately; not something I can do from here (external dashboards) — flag as a manual step for you.

### Open question
Where should `backend/` physically go — keep it in the repo under an `archive/` folder (so history/context isn't lost, easy to resurrect), or remove it from this repo entirely since "other people" will own backend work separately (possibly in its own repo)? Affects whether this is a `git mv` or a deletion + note in `Issues.md`/`FUTURE_PLANS.md` pointing at wherever it lives now.

---

## 2. Extract styles out of component files (deferred, optional)

**Status**: not a correctness/best-practices requirement (co-locating `StyleSheet.create` in the component file is RN's standard pattern, not an anti-pattern) — deprioritized until #1 is done and the app is running local-only. Revisit later only if the bigger files' readability actually becomes a problem.


RN has no CSS — this means moving each `StyleSheet.create({...})` block into a sibling file, not literal stylesheet separation. Convention:

```
src/components/pos/POSItemTile.js         — component + logic, imports styles
src/components/pos/POSItemTile.styles.js  — const styles = StyleSheet.create({...}); export default styles;
```

31 files currently have inline `StyleSheet.create` blocks (all of `src/screens/*.js` and most of `src/components/**/*.js`). This is mechanical and low-risk — same pattern repeated per file, no logic changes. Will do as a batch pass once the local-only removal (#1) has landed, so styles aren't being extracted from files that are about to be deleted (`LoginScreen`, `SignUpScreen`, `ConnectivityBanner`).

---

## 3. Data model documentation for the Medusa backend

No new framework needed — Medusa's own modules (Product, ProductVariant, InventoryItem, StockLocation, SalesChannel, Order, Customer) are the eventual contract, and Medusa publishes its own Admin API/OpenAPI reference once your friend's instance exists. What's useful now:

- A data dictionary doc (`plans/DATA_MODEL.md`) listing this app's current local entities — `InventoryItem`, `Sale`/`SaleItem`, `Event`/`EventExpense` — with field names, types, and relationships, written in Medusa-adjacent vocabulary where there's a natural mapping (e.g. note that `InventoryItem` roughly corresponds to a Medusa `Product` + single `ProductVariant`, since this app doesn't have variants/options today).
- This is documentation, not code — doesn't block or depend on #1/#2, can be done anytime.

---

## Suggested order
1. Confirm the `backend/` archive-location open question above.
2. Remove backend/auth/sync (#1) — biggest structural change, touches `AppContext.js` most.
3. Write `plans/DATA_MODEL.md` (#3) — cheap, independent, good to do once #1 settles the final local schema.
4. Extract styles (#2) — mechanical batch pass last, once file set is stable.
