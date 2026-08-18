# POS Fix Plan

Follow-up to the POS code review. Issues found, ordered by severity, with the fix approach for each. Not yet implemented — this is the plan to work from once prioritized.

## 1. Sale payload shape mismatch (critical)

**Problem**: `POSScreen.js` `confirmSale` builds `saleData` as `{items, discount: {type, value, amount}, total, paymentMethod}`. `AppContext.js` `createSale` reads `saleData.subtotal`, `saleData.discountType`, `saleData.discountValue`, `saleData.discountAmount` as flat fields — none exist on the object sent, so they're all `undefined`. `salesRepo.insert()` then binds `undefined` for `subtotal` straight into a `db.runSync` call, outside any try/catch, with no try/catch in `confirmSale` either — a real sale can throw silently with no error shown and an unclear partial-write state.

**Fix**: Pick one shape and make it consistent end-to-end (POSScreen → AppContext → salesRepo → backend `SaleRequest`). Recommend flattening: POSScreen computes and sends `subtotal`, `discountType`, `discountValue`, `discountAmount`, `total`, `paymentMethod`, `timestamp`, `items` — matching what `AppContext.createSale`, `salesRepo.insert`, and the backend `SaleRequest`/`SaleItemRequest` DTOs already expect. Wrap the SQLite write + stock decrement in `createSale` in a try/catch so a failure surfaces a real error to the cashier instead of an unhandled rejection, and wrap `confirmSale` in POSScreen the same way.

**Files**: `src/screens/POSScreen.js` (`confirmSale`), `src/context/AppContext.js` (`createSale`).

## 2. No rollback on server rejection (high)

**Problem**: SQLite insert, local stock decrement, and sync-queue enqueue happen *before* the network call in `createSale`. If the server rejects the sale (`res.ok === false`), nothing already committed locally is undone, and `POSScreen.js` just toasts and leaves the cart open — a retry double-decrements stock and creates a duplicate local sale/sync entry.

**Fix**: On `res.ok === false`, roll back the local write in `createSale`: delete the inserted sale row (`sales`/`sale_items` by `localId`), restore the decremented stock, and remove the sync-queue entry, before returning `{success:false}`. Alternatively — simpler and safer for offline-first correctness — don't attempt "immediate sync" as a special path at all; always queue, and let the existing `syncEngine` retry/conflict path be the single source of truth for server rejections (avoids having two different reconciliation code paths). Needs a decision — see open question below.

**Files**: `src/context/AppContext.js` (`createSale`), possibly `src/services/syncEngine.js` if rejection handling moves there.

## 3. No client-side stock sufficiency check (high)

**Problem**: `addToCart` / `POSItemTile` only disable a tile at `stock === 0`. Nothing stops adding more units to the cart than are in stock; `CartModal`'s `+` button has no upper bound either.

**Fix**: In `addToCart` and `CartModal`'s quantity increment, cap the cart quantity for an item at its current `inventory` stock, and show a toast ("Only N in stock") when the cap is hit instead of silently doing nothing or overselling.

**Files**: `src/screens/POSScreen.js` (`addToCart`), `src/components/pos/CartModal.js` (qty +).

## 4. Double-submission risk (medium)

**Problem**: `PaymentModal.handleConfirm` calls `onConfirm(method)` without awaiting; nothing disables the Confirm/Pay button while the async sale call is in flight, and there's no loading state in `POSScreen`.

**Fix**: Add a `submitting` state in `POSScreen`, pass it down to disable the Pay/Confirm buttons in `CartModal` and `PaymentModal` and show a spinner, set it before calling `createSale` and clear it in a `finally`.

**Files**: `src/screens/POSScreen.js`, `src/components/pos/PaymentModal.js`, `src/components/pos/CartModal.js`.

## 5. Discount input validation (medium)

**Problem**: `CartModal.handleDiscountChange` accepts negative values (`parseFloat(value) || 0`) with no clamping, and no upper bound on percent discount.

**Fix**: Clamp discount value to `>= 0`, and for percent type clamp to `<= 100`. Reject/ignore keystrokes that would produce an out-of-range value rather than silently letting the total go negative-then-clamped.

**Files**: `src/components/pos/CartModal.js` (`handleDiscountChange`).

## 6. UX polish (low)

- Confirm (or add undo) before removing a cart line or zeroing a quantity in `CartModal`/`POSScreen`.
- Replace hardcoded `#FFFFFF` / `rgba(0,0,0,0.4)` with theme tokens from `src/constants/theme.js` in `CartBar.js`, `PaymentModal.js`, `CartModal.js`, per project convention.
- Add POS-specific "sale queued, will sync when online" messaging on the success state when the sale wasn't immediately synced, instead of relying solely on the generic `ConnectivityBanner`.

**Files**: `src/components/pos/CartBar.js`, `PaymentModal.js`, `CartModal.js`, `src/screens/POSScreen.js`.

## Open question before implementing #2

Two options for handling server-side sale rejection:
- **(a) Rollback-on-reject**: keep the current immediate-sync-then-fallback-to-queue design, add explicit rollback code for the reject case.
- **(b) Always-queue**: drop the immediate-sync special case in `createSale`, always write local + enqueue, let `syncEngine`'s existing retry loop be the only path that talks to the server for sales. Simpler, one code path, but sale confirmation to the cashier becomes purely optimistic (no immediate "server confirmed" signal) — POS payment confirmation would need to be reframed as "recorded" rather than "confirmed" for the cashier.

Recommend deciding this before touching `createSale`, since it affects the shape of fixes #1 and #2 together.

## Suggested implementation order
1. Fix #1 (payload mismatch) — blocks reliable testing of everything else.
2. Decide the open question above, then fix #2.
3. Fix #3 (stock cap).
4. Fix #4 (double-submit guard).
5. Fix #5 (discount validation).
6. Fix #6 (polish), lowest priority.
