# Design Principles

Living document — first draft. Captures how this codebase is meant to be structured and the reasoning behind it, so decisions don't have to be re-argued each session. Expect this to be revised as we talk through it more.

## Architecture shape

Local-only, single-device app (see `plans/15_LOCAL_ONLY_MIGRATION.md` for why the backend was dropped). Layers, top to bottom:

```
Screens (src/screens/)          — layout, navigation, local UI state (modals, form fields)
  ↓ calls actions from
Context (src/context/AppContext.js) — app state (useReducer) + actions that read/write SQLite
  ↓ calls
Repositories (src/services/repositories/) — one file per entity, plain functions, raw SQL
  ↓ read/write
SQLite (src/services/database.js)
```

Rule: screens never touch SQLite or repositories directly — they only call context actions. Repositories never know about React — they're plain functions taking/returning plain objects (snake_case row shape in, mapped camelCase shape out via the context layer). This keeps the persistence layer swappable (e.g. if a sync layer against Medusa gets added later, it slots in beside the repositories without screens changing).

## What "OOP / best practices" means in this codebase

This is a functional React codebase — components are functions, repositories are modules of exported functions, not classes. That's intentional and idiomatic for React/RN, not a shortcut. When `CLAUDE.md` says "keep OOP in mind," read it as: **strong separation of concerns and single-responsibility modules**, not literal class hierarchies. Each repository file owns exactly one entity's persistence; each context action owns exactly one state transition; screens own exactly presentation + local UI state. If a change requires touching persistence logic from inside a screen, or reducer logic from inside a repository, that's the signal something's misplaced.

## Action contract

Every context action in `AppContext.js` follows one shape:
- Mutations (`add*`, `update*`, `delete*`, `create*`, `restock*`) return `{ success: boolean, message?: string }`.
- Loads (`load*`) return the same `{ success, message }` shape, in addition to dispatching state — callers that don't care about the result (most `useEffect` calls) can ignore the return value, but callers that need to surface an error (e.g. a failed delete) always can.
- Nothing throws across this boundary — repository errors are caught inside the action and turned into `{ success: false, message }`. Screens should always be able to trust that calling a context action won't crash the render tree.
- All actions are currently synchronous (SQLite via `expo-sqlite`'s sync API, no network). Don't add `async`/`await` back at call sites unless an action actually becomes asynchronous again — misleading async style was already found and removed once (see `plans/15_LOCAL_ONLY_MIGRATION.md`).

## Naming

- Screens: `XScreen.js`. Navigators: `XStack.js` / `XNavigator.js`. Repositories: `xRepo.js`, one per entity, matching the SQLite table it owns.
- Components live under `src/components/`, feature-specific ones grouped into a subfolder matching the screen they belong to (`pos/`, `event/`, `inventory/`, `finance/`); genuinely shared components (`SearchBar`, `SummaryCard`, `CategoryFilter`, `Toast`) stay at the root of `components/`.
- A file's name should describe what it currently contains, not its history. Known violation: `src/data/mockData.js` still holds ~70 lines of unused mock arrays (`inventoryItems`, `events`) alongside the three constants (`CATEGORIES`, `EVENT_STATUSES`, `EXPENSE_CATEGORIES`) that are actually imported — the name is misleading and the dead arrays should go. Not fixed yet, listed here so it doesn't get lost.

## Styling

`StyleSheet.create({...})` stays co-located in the component file — this is React Native's standard pattern, not an anti-pattern (see the conversation this doc follows from). Only split into a sibling `Component.styles.js` if a specific file's length is genuinely hurting readability; it's not a default.

Always use `src/constants/theme.js` tokens (`COLORS`/`SIZES`/`CARD_SHADOW`) or `useTheme()` for colors and sizing. Don't hardcode hex values in component styles except for one-off cases already established in the codebase (e.g. payment-method accent colors) — if a hardcoded color starts repeating across files, promote it to a theme token instead.

## Open questions (not decided yet — for the next design conversation)

- **`AppContext.js` is a single ~500-line provider** covering inventory, sales, events, and dashboard. Worth splitting into separate contexts/hooks per domain once it grows further, but not done yet — a real architectural change, not a mechanical cleanup.
- **No tests, no linter** configured for the project (noted in `CLAUDE.md`). Not addressed as part of any pass so far.
- **Data model naming vs. Medusa**: once the friend's Medusa backend exists, decide how much this app's local entity naming should mirror Medusa's vocabulary (Product/Variant/Inventory/Order) versus staying as-is. Tracked in `plans/15_LOCAL_ONLY_MIGRATION.md` item #3.

## Data-layer cleanup, found 2026-08-19, done 2026-08-19

A review of `database.js`, `src/services/repositories/`, and `AppContext.js` found leftovers from the pre-local-only design. All fixed in one pass, verified by a real Metro bundle (`npx expo export --platform android`, 1130 modules, 0 errors) after the change:

- **Dropped the `local_id` dual-key scheme.** `inventory_items`, `sales`, `events`, `event_expenses` now key on `id` alone (SQLite's own autoincrement, read back via `lastInsertRowId` right after insert). This also removed the `id OR local_id` join branches and the `local_id ?? localId` fallback chains throughout the repos and `AppContext.js`. `inventoryRepo.deleteByLocalId`/`eventsRepo.deleteByLocalId` (dead code) removed with it.
- **Added foreign keys with `ON DELETE CASCADE`** (`PRAGMA foreign_keys = ON` in `database.js`) for `event_expenses.event_id`, `item_images.item_id`, `restocks.item_id`, `sale_items.sale_id`. Deleting an event/item/sale now cleans up its children automatically — this also fixed the orphaned `restocks` rows left behind when an inventory item was deleted. `sale_items.item_id` deliberately has **no** FK constraint, so sale history survives an inventory item being deleted later.
- **Split `upsert()` into `insert()`/`update()`** in `inventoryRepo` and `eventsRepo` — needed because `INSERT OR REPLACE` (the old upsert mechanism) is a delete+insert under the hood, which would have triggered the new `ON DELETE CASCADE` and wiped an item's images/restocks on every edit.
- **Added `getById`** to `inventoryRepo`; `createSale` and `restockItem` now use it instead of `getAll().find(...)` full-table scans.
- **Wrapped multi-statement writes in `db.withTransactionSync()`**: `salesRepo.insert` (sale + sale_items), `itemImagesRepo.replaceImages` (delete + reinsert).
- **Collapsed the duplicated stock-decrement logic**: `createSale` now computes the new stock values once and passes them to the `ADD_SALE` reducer via `stockUpdates`, instead of the reducer independently recomputing the same thing from `sale.items`.


**Design principal - keep it something simple but functional, I was thinking of a few things, nothing design, 1984 pilot manual https://youtu.be/uJblcC4lKYw?si=g0rz7VTnJnVUD0XM, idk maybe we can make a few themes around something like this but this is the plan for the future