# Inventory/POS Fixes, Custom Categories, and Testing Pipeline

Dated 2026-08-24. Planning-only — nothing in this doc is implemented yet. Written from a full read of the current code for each item below (files/lines cited), so this can be reviewed for accuracy before any code changes start.

Source of the requests: user review of the current build, plus a screenshot of the POS screen showing the in-cart quantity badge clipped at the tile corner.

---

## 0. How this doc is organized

Each item: **Problem** (what's wrong / what's missing) → **Root cause** (file:line, why it happens) → **Proposed fix** → **Files touched**. Grouped by feature area, roughly in the order raised. A phasing/order recommendation and open questions are at the bottom — pick those apart first since they affect scope.

---

## 1. Inventory: "Total Stock" summary card is confusing — replace with per-category stock

**Problem**: `InventoryScreen` shows a `Total Stock` card (sum of every item's stock across all categories) at all times. Mixing Prints + Stickers + Keychains + Badges into one number isn't actionable — user wants to see stock *for the selected category* instead (e.g. tap "Prints" → see total prints in stock).

**Current behavior** (`src/screens/InventoryScreen.js:50, 114-126`): `totalItems` is computed once over the full `items` array regardless of `selectedCategory`, and rendered in a `SummaryCard title="Total Stock"`. `selectedCategory` already exists as state (line 36) and already drives `CategoryFilter`/`filteredItems`, it's just not wired into the summary card.

**Proposed fix**:
- Replace the `totalItems` calc with a stock sum over `filteredItems` (already category-filtered) instead of `items`.
- Change the card title dynamically: `selectedCategory === "All" ? "Total Stock" : `Total ${selectedCategory}``. Keep "Total Stock" as the label when "All" is selected (matches current meaning), switch to per-category phrasing otherwise ("Total Prints", "Total Stickers", etc.) — this satisfies "press Prints → shows total prints" without needing a second component.
- `Inventory Value` card: same treatment for consistency (currently also summed over all `items`, line 51-54) — switch to `filteredItems` too, so both cards reflect the active category filter.
- No new component needed — `SummaryCard` already takes `title`/`amount` as props, this is a data-source change in `InventoryScreen`.

**Files touched**: `src/screens/InventoryScreen.js` only.

---

## 2. Bug: adding new stock doesn't update Finance (RESOLVED — corrected root cause)

**Corrected problem** (per user follow-up): this was never about the Edit modal specifically. The real gap is that **brand-new inventory items** — added via the "Add Item" flow with an initial `Stock Count` and `Production Cost` — never create any expense record for that initial stock investment. Finance today only aggregates three sources (`computeDashboard()`, `AppContext.js:147-262`): sale income, event expenses, and `restocks` rows. A newly-added item's opening stock never becomes a `restocks` row, so its production cost is invisible to Finance forever. Net effect: an event can look profitable in Finance purely because the cost of the stock sold there was never counted as money spent — a real, silent accounting hole, not a display bug.

**Root cause**: `addInventoryItem` (`AppContext.js:283-314`) inserts the new row into `inventory_items` (including its initial `stock` and `production_cost`) and, if images were supplied, calls `itemImagesRepo.replaceImages`. It never calls `restockRepo.insert`. Compare `restockItem` (`AppContext.js:345-368`), which is the *only* code path today that logs a `restocks` row and therefore the only path Finance's `restockExpenses` (`AppContext.js:171`) ever sees.

**Decision (confirmed)**: initial stock added on item creation should be treated the same as a restock, cost-wise — `quantity = stock`, `cost = stock * productionCost` — logged as its own `restocks` row at creation time. This keeps the "money spent producing stock" ledger complete (opening stock + every later restock), without changing the Edit modal's `Stock Count` field, which stays a plain correction field as before (not in scope — confirmed out of scope for this pass).

**Proposed fix**:
- In `addInventoryItem`, after `inventoryRepo.insert` succeeds, if `data.stock > 0`: call `restockRepo.insert(itemId, data.stock, data.stock * data.productionCost)`, mirroring `restockItem`'s pattern. Wrap in its own try/catch (`console.warn` + non-fatal) so a failure to log the expense doesn't roll back an otherwise-successful item creation — consistent with how other secondary writes (`itemImagesRepo.replaceImages`) are handled in the same function today.
- Skip the insert when `stock === 0` (nothing spent yet — matches how `restockItem` is never called with a zero quantity either).
- Separately (still needed, independent bug): `FinanceScreen` only calls `loadDashboard()` in a mount-only `useEffect` (`src/screens/FinanceScreen.js:19-21`, deps `[]`), so a restock or new item added while Finance is already mounted further back in the stack won't show until a fresh mount. `DashboardScreen` already gets this right (`useFocusEffect` from `@react-navigation/native`, confirmed at `DashboardScreen.js:4,39-41`) — bring `FinanceScreen` in line with that existing pattern rather than inventing a new one.

**Files touched**: `src/context/AppContext.js` (`addInventoryItem`), `src/screens/FinanceScreen.js` (`useEffect` → `useFocusEffect`).

---

## 3. POS: cart modal should close when tapping the grey backdrop

**Problem**: `CartModal` only closes via its explicit "Close" button; tapping the dimmed area around the sheet does nothing.

**Root cause**: `src/components/pos/CartModal.js:82-87`. The `Modal`'s `overlay` View (`styles.overlay`, line 275-279) has no press handler — it's just a `View` with `justifyContent: "flex-end"`, and the actual sheet content is a sibling `View` inside it, so there's no backdrop tap target at all.

**Decision (confirmed)**: apply to every bottom-sheet-style modal in the app, not just the cart, for consistency.

**Proposed fix**: add an absolutely-positioned `Pressable` (`StyleSheet.absoluteFillObject`) as the first child inside each modal's overlay container, calling `onClose` on press, rendered *before* the sheet/card content. Because it's positioned absolutely, it's taken out of layout flow entirely (doesn't affect the existing flex-end/centered layout of each overlay) but still sits underneath the sheet in touch hit-testing — RN resolves touches to the topmost view at a given point, so taps landing on the sheet itself still hit the sheet (and its buttons/inputs) while taps on the dimmed area around it fall through to the `Pressable` and close the modal. No `stopPropagation`/`TouchableWithoutFeedback` gymnastics needed. Applies to all seven `Modal` instances in the app: `CartModal`, `PaymentModal`, `InventoryItemModal`, `EventModal` (both its main sheet and its nested currency-search modal), `EventExpenseModal`, `EventDetailModal`.

**Files touched**: `src/components/pos/CartModal.js`, `src/components/pos/PaymentModal.js`, `src/components/inventory/InventoryItemModal.js`, `src/components/event/EventModal.js`, `src/components/event/EventExpenseModal.js`, `src/components/event/EventDetailModal.js`.

---

## 4. POS: in-cart quantity badge is clipped by the tile instead of sitting outside it

**Problem**: the small circular badge showing how many of an item are already in the cart (top-left corner of each POS tile) reads as "inside" the tile/box instead of overlapping its corner — visible in the provided screenshot, where the "2" badges look embedded rather than popping out.

**Root cause**: `src/components/pos/POSItemTile.js`. The badge is correctly positioned to overlap the corner — `qtyBadge` is `position: "absolute", top: -6, left: -6` (line 98-108), which should make it poke outside the tile's edge. But the tile itself has `overflow: "hidden"` (`styles.tile`, line 87) — set so the tile's `borderRadius` clips the tile image cleanly. That same `overflow: hidden` clips the badge's negative offset, cutting off exactly the part that was supposed to hang outside the box. This is a straightforward CSS-clipping bug, not a positioning miscalculation.

**Proposed fix**: move `qtyBadge` outside the clipped element. Concretely, wrap the `TouchableOpacity` tile in an outer, non-clipping `View` (no `overflow: hidden`) sized to the tile, keep `overflow: "hidden"` only on the inner tile content (so the image/border-radius clipping is preserved), and render `qtyBadge` as a sibling of the inner content, absolutely positioned against the outer wrapper. This is the standard RN fix for "badge overlapping a rounded/clipped card."

**Files touched**: `src/components/pos/POSItemTile.js` only.

---

## 5. Inventory: categories are hardcoded — let the user manage their own

**Problem**: `CATEGORIES` (`src/constants/categories.js:1`) is a fixed array (`All, Prints, Stickers, Keychains, Badges, Other`) baked into the app. It's consumed in three places — `InventoryScreen` filter pills, `POSScreen` filter pills, and `InventoryItemModal`'s category picker when adding/editing an item — and there's no UI anywhere to add, rename, or remove a category. Different artists sell different things; this needs to be user-editable, not a code constant.

**Proposed fix** (new, not a bug fix — sized accordingly):
- **New SQLite table** `categories` in `src/services/database.js`, alongside the existing `CREATE TABLE IF NOT EXISTS` block: `id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL`. On first run (table just created and empty), seed it with the current defaults (`Prints, Stickers, Keychains, Badges, Other`) so existing users see no visible change on upgrade — a one-time migration, same spirit as the `local_id` cleanup already done in `plans/15_LOCAL_ONLY_MIGRATION.md`.
- **New `categoryRepo.js`** under `src/services/repositories/`, following the existing repo shape (plain functions, raw SQL, snake_case in/out): `getAll()`, `insert(name)`, `deleteByName(name)` (or `deleteById`), matching `restockRepo.js`'s minimalism.
- **New context actions** in `AppContext.js`: `loadCategories`, `addCategory`, `deleteCategory` — same `{success, message}` contract as every other action (`DESIGN.md`'s "Action contract"). `state.categories` added to `initialState` alongside `inventory`/`sales`/`events`.
- **`CATEGORIES` constant becomes the fallback/seed list only** — `Prints, Stickers, Keychains, Badges, Other` still exported for the one-time seed step, but screens read `state.categories` (plus a synthetic `"All"` entry prepended in the filter UI, since "All" is a UI concept, not a real category) instead of importing the constant directly.
- **UI for managing categories (decision confirmed)**: an inline "+" pill appended to the end of `CategoryFilter`'s pill row on the Inventory screen — tap it → simple text-input prompt → `addCategory`. `CategoryFilter` gets a new optional `onAddPress` prop (only passed from `InventoryScreen`, so `POSScreen`'s and `EventsScreen`'s use of the same component is unaffected). Deleting: long-press a pill → confirm → `deleteCategory`, blocked with an error toast if any inventory item currently uses that category (avoid orphaning items — check `state.inventory.some(i => i.category === name)` before allowing delete).

**Files touched**: `src/services/database.js`, new `src/services/repositories/categoryRepo.js`, `src/context/AppContext.js`, `src/constants/categories.js` (trimmed to just the seed list + `EXPENSE_CATEGORIES`/`EVENT_STATUSES`, which are staying fixed), `src/components/CategoryFilter.js` (optional "+ Add" affordance), `src/screens/InventoryScreen.js`, `src/screens/POSScreen.js`, `src/components/inventory/InventoryItemModal.js`.

---

## 6. POS: "Sale Complete" confirmation should be a toast, not a modal-style box

**Problem**: after a successful sale, `POSScreen` shows a full-screen dimmed overlay with a centered white/card box and checkmark (`showSuccess` state) for 1.5s. User wants this to be a toast instead, consistent with how errors/other feedback already appear.

**Root cause**: `src/screens/POSScreen.js:154-159, 241-248, 288-304`. This is a bespoke `successOverlay`/`successBox` implementation that duplicates what `ToastProvider`/`useToast()` (`src/components/Toast.js`) already does elsewhere in the app — `Toast.js` already has a `success` variant configured (`TOAST_CONFIG.success`, line 10) that's simply unused today (grep shows every current `showToast(...)` call in the codebase passes `"error"`).

**Proposed fix**: delete `showSuccess` state, the `useEffect` timer that clears it, and the `successOverlay`/`successBox` JSX + styles. Replace with a single `showToast("Sale complete!", "success")` call at the same point in `confirmSale` (`POSScreen.js:143`, right where `setShowSuccess(true)` currently sits). `useToast()` is already imported in this file for error handling, so no new wiring needed.

**Files touched**: `src/screens/POSScreen.js` only.

---

## 7. Bug: `DateTimePicker`'s `onChange` prop is deprecated

**Problem**: user flagged a deprecation around the date/time picker's change handler.

**Root cause**: confirmed against the installed package — `node_modules/@react-native-community/datetimepicker` (v9.1.0, per `package.json:13`) explicitly deprecates `onChange` in its type defs and README (`@deprecated Use onValueChange, onDismiss, and onNeutralButtonPress instead`). The only usage site in the codebase is `src/components/event/EventModal.js:76-84, 168-178` (`handleDateChange`, wired to `onChange` at line 172) — used for both the event start-date and end-date pickers.

**Proposed fix**: replace the single `onChange={handleDateChange}` with the two new, purpose-specific handlers:
- `onValueChange={(date) => setForm({ ...form, [showDatePicker]: date })}` — fires only on an actual date selection, replacing the `selectedDate` branch of the old handler.
- `onDismiss={() => setShowDatePicker(null)}` — replaces the old `e.type === "dismissed"` check and the Android-only `setShowDatePicker(null)` call, and now applies correctly cross-platform instead of being Android-gated (`Platform.OS === "android"` check at line 77 can be dropped entirely, since `onDismiss` already fires appropriately per-platform).
- Net effect: `handleDateChange` shrinks to just the value-change case, dismissal is handled by its own callback, and the deprecated prop is gone. Behavior should be equivalent or slightly more correct (iOS dismiss handling was previously a no-op since the old code only special-cased Android).

**Files touched**: `src/components/event/EventModal.js` only.

---

## 8. Bug: modals/screens don't close on Android back button or swipe-back gesture

**Problem**: some "windows" (the screenshot points at a POS-area component) don't respond to the Android hardware back button or an edge swipe-back the way the rest of the app does.

**Root cause**: two different mechanisms are involved, and only one of them is actually broken:
- **Native-stack screens** (`Finance`, `Settings`, `About`, `EventDetail` — see `HomeStack.js`, `MoreStack.js`, `EventsStack.js`) get swipe-back and hardware-back for free from `@react-navigation/native-stack`; nothing in `screenOptions` across any stack sets `gestureEnabled: false`, so these are not the broken ones.
- **The actual gap**: every custom overlay in the app — `CartModal`, `PaymentModal`, `InventoryItemModal`, `EventModal`, `EventExpenseModal`, `EventDetailModal`, and the nested currency-picker inside `EventModal` — is built on React Native's own `Modal` component, and **none of them pass `onRequestClose`** (repo-wide search for `onRequestClose` returns zero matches). On Android, `Modal` relies on `onRequestClose` to know what to do when the hardware back button is pressed while it's visible; without it, RN either warns (`onRequestClose` is required on Android) or lets the back-press fall through to the screen underneath instead of closing the modal — which is exactly "the window doesn't close on back press." This is very plausibly what's shown in the screenshot (POS's cart/payment modals are `Modal`-based).
- Swipe-*back*-to-dismiss (an edge-swipe gesture that closes a sheet) is a different, iOS-native-sheet-style behavior that plain RN `Modal` doesn't provide on either platform out of the box — not a regression, just never built.

**Decision (confirmed)**: `onRequestClose` is enough for this pass. Swipe-to-dismiss gesture support is explicitly deferred — would mean either a `PanResponder`/`react-native-gesture-handler` implementation per sheet or adopting a small modal library, a bigger call given `DESIGN.md`'s "no UI component library" stance, revisit later if it's still wanted.

**Proposed fix**:
- Add `onRequestClose={onClose}` to every `Modal` listed above. This is the correctness fix — small, mechanical, same pattern per file, no logic changes (same category as the deferred style-extraction pass in `plans/15_LOCAL_ONLY_MIGRATION.md`).
- Doing this in the same pass as item 3's backdrop-tap-to-close is natural since both end up wiring the same `onClose` into the same `Modal` elements.

**Files touched**: `src/components/pos/CartModal.js`, `src/components/pos/PaymentModal.js`, `src/components/inventory/InventoryItemModal.js`, `src/components/event/EventModal.js`, `src/components/event/EventExpenseModal.js`, `src/components/event/EventDetailModal.js`.

---

## 9. Heads-up items (not planned in detail yet)

Noted per the user's message, not scoped here — flagged so they aren't lost, to become their own plan doc(s) closer to when they're picked up:
- **Animations** — already tracked at length in `plans/FUTURE_FRONTEND.md` §1 (screen transitions, micro-interactions, `react-native-reanimated`/`react-native-gesture-handler` candidates). Re-scope from that doc when ready rather than re-planning from scratch.
- **Onboarding process** — new; not covered in any existing plan doc. `plans/15_LOCAL_ONLY_MIGRATION.md`'s session close-out note already flagged "asking the user's name, an onboarding animation, then a tutorial" as the suggested next feature after this cleanup pass — this request confirms that's still the direction. Worth its own plan doc once this one lands.

---

## 10. Development process: automated tests + a CI pipeline

**Current state**: `CLAUDE.md` and `DESIGN.md` both explicitly note "no test runner or linter is configured." This is a real gap for a codebase this size (~500-line `AppContext.js`, several repos, real business logic in `computeDashboard()`).

**Proposed scope** (kept intentionally lean — this is a local-only, single-dev mobile app, not a service with deploy risk, so avoid over-building the pipeline):

1. **Test runner**: [`jest-expo`](https://docs.expo.dev/develop/unit-testing/) — the Expo-maintained Jest preset, zero-config for an Expo SDK 56 project (handles the RN/Expo module transforms that vanilla Jest chokes on). Add `jest`, `jest-expo`, `react-test-renderer` as devDependencies; add a `"test": "jest"` script to `package.json`.
2. **What to actually test first** — prioritized by risk × how pure the code already is:
   - `computeDashboard()` (`AppContext.js:147-262`) — pure function today (takes no args, but reads via repo calls; consider extracting the aggregation logic to take `sales`/`events`/`restocks` as parameters so it's testable without a real DB — same shape `jest-expo` + a light SQLite mock could support either way). Highest value: this is the function silently getting the Finance bug in item 2.
   - `appReducer()` (`AppContext.js:19-121`) — already a pure function of `(state, action)`, trivial to unit test with no mocking at all. Good first target to prove the harness works.
   - Repository functions (`inventoryRepo`, `restockRepo`, etc.) — these hit real SQLite via `expo-sqlite`; `expo-sqlite` doesn't run outside a native runtime, so these need either an in-memory SQLite shim or to be exercised through Expo's on-device test runner rather than plain Jest. Lower priority — start with the two pure-logic targets above, revisit DB-layer testing once the harness is proven out.
3. **CI**: a single GitHub Actions workflow (`.github/workflows/test.yml`) that runs `npm install && npm test` on every push and PR. That's the full "pipeline" this project needs right now — there's no backend/deploy step to gate (local-only app, see `CLAUDE.md`), so this is closer to "tests run automatically" than a full build/release CD pipeline. If EAS builds are added later for beta distribution (tracked as stale/future work in `plans/PROJECT_STATUS.md`), a build-on-tag job can be appended to the same workflow then — not needed today.
4. **Linting** (mentioned in `DESIGN.md`'s open questions, not explicitly asked for here but adjacent): `eslint` + `eslint-config-expo` would be the standard pairing and could run in the same CI job as a second step. Flagged as optional/bundle-in-if-you-want in Open Questions §E rather than assumed.

**Proposed order**: Jest + `jest-expo` installed and configured → tests for `appReducer` (proves the harness) → tests for `computeDashboard` (highest business-logic value, directly covers the item 2 bug class so it can't silently regress again) → GitHub Actions workflow wired to run them → revisit repo/DB-layer testing and linting as follow-ups.

**Files touched**: `package.json` (deps + script), new `jest.config.js` (or `jest` key in `package.json`, whichever `jest-expo`'s setup docs recommend), new `__tests__/` files (e.g. `src/context/__tests__/appReducer.test.js`, `src/context/__tests__/computeDashboard.test.js`), new `.github/workflows/test.yml`.

---

## Decisions (resolved 2026-08-24)

- **Item 2** — corrected scope: not an Edit-modal issue. Fix is logging the initial-stock production cost on item creation (`addInventoryItem`) as a `restocks` row, same ledger `restockItem` already writes to. See the rewritten item 2 above.
- **Item 3 / item 8** — tap-outside-to-close and `onRequestClose` both apply to **every** modal in the app (all 7 `Modal` instances), not just the cart. Swipe-to-dismiss gesture support is explicitly **out of scope** for now — `onRequestClose` (Android hardware-back) is enough; revisit gesture support later if still wanted.
- **Item 5** — category management UI is the inline **"+" pill** at the end of the Inventory category filter row (not a More/Settings screen entry).
- **Item 10** — testing/CI is **not being implemented in this pass**. Section 10 stays as reference material only: ideas to reach for (Jest + `jest-expo`, starting with `appReducer`/`computeDashboard`, then a GitHub Actions workflow) so that the next round of feature work can catch regressions like item 2's Finance gap before they ship, rather than after. Revisit when ready to actually wire it up.

## Addendum (2026-08-24, post-implementation)

Two follow-ups found after the first pass landed:

- **Item 5 revised — no seeded defaults.** Originally planned to seed the new `categories` table with the old fixed list (`Prints, Stickers, Keychains, Badges, Other`) so upgrading users saw no visible change. Revised per user feedback: the list starts **empty** — no seeding at all, category management is entirely user-driven from day one. `InventoryItemModal`'s Add/Edit form now shows a hint ("No categories yet — add one with the '+' on the Inventory screen's filter row first") instead of an empty pill row when `categories.length === 0`.
- **Two new POS tile bugs found in review** (screenshot showed the stock-count badge hidden behind the item image, and the in-cart quantity badge clipped at the very top of the grid):
  - `POSItemTile.js`'s `stockBadge` had no `zIndex`, so on items with a photo the `Image` (a later sibling in the same `overflow: hidden` tile) could paint over it. Fixed by giving `stockBadge` the same `zIndex: 1` treatment the qty badge already had.
  - The item-4 fix (moving the qty badge onto an unclipped wrapper so it can poke above the tile's corner) introduced a new clipping source: for the first row of tiles, that badge's `top: -6` offset now pokes above `y: 0` of the grid `ScrollView`'s own content, and a `ScrollView` clips content above its viewport by definition. Fixed with `paddingTop: 10` on `POSScreen.js`'s `grid` style, giving the badge room before the scrollable viewport's edge.

## Implementation order (this pass)

1. Item 6 (toast) and item 4 (badge clipping) — smallest, pure polish.
2. Item 1 (per-category stock).
3. Item 7 (DateTimePicker deprecation fix).
4. Item 3 + item 8 together (backdrop-tap + `onRequestClose`, all 7 modals) — same files, same change shape.
5. Item 2 (Finance stock-cost gap, corrected scope) + the `FinanceScreen` focus-refresh fix.
6. Item 5 (custom categories) — biggest single item (new table/repo/actions/UI), done last since it touches the most files.
7. Item 9 (animations, onboarding) and item 10 (testing/CI) — separate future work, not this pass.
