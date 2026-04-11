# POS Screen + Component Reorganization Plan

## Part 1: Component Reorganization

Move screen-specific components into subfolders. Shared components stay at root.

### Current → New Structure
```
src/components/
  SearchBar.js              ← stays (shared)
  CategoryFilter.js         ← stays (shared)
  SummaryCard.js             ← stays (shared)
  EventCard.js               ← stays (shared, used by Dashboard)
  event/
    EventTimelineCard.js     ← move from components/
    EventDetailModal.js      ← move from components/
    EventExpenseModal.js     ← move from components/
    EventModal.js            ← move from components/
  inventory/
    InventoryItemCard.js     ← move from components/
    InventoryItemModal.js    ← move from components/
  pos/
    POSItemTile.js           ← new
    CartBar.js               ← new
    CartModal.js             ← new
    PaymentModal.js          ← new
```

### Import Updates After Move
- `src/screens/EventsScreen.js` — update 4 imports to `../components/event/...`
- `src/screens/InventoryScreen.js` — update 2 imports to `../components/inventory/...`

---

## Part 2: POS Screen

### Flow
```
Category tabs → Item grid → Tap to add to cart
                                ↓
                        CartBar (sticky bottom)
                        ├─ Tap bar → CartModal (edit cart)
                        └─ Tap Pay → PaymentModal (Cash/QR → Confirm)
                                        ↓
                                  Sale recorded, cart cleared, success toast
```

### Components (in `src/components/pos/`)

**POSItemTile** — grid tile, 2 columns, item name + price, qty badge, grayed if stock=0

**CartBar** — sticky bottom, "X items | $XX.XX | [Pay]", appears when cart non-empty

**CartModal** — cart items with qty +/-, inline price edit, % or $ discount, subtotal/total

**PaymentModal** — Cash / QR big buttons, sale summary, Confirm Sale

### Cart State
```js
cart: [{ itemId, name, quantity, unitPrice, originalPrice }]
discount: { type: 'percent' | 'flat', value: 0 }
```

### Price Flexibility
- **Individual override**: tap price in CartModal → inline TextInput, original shown struck-through
- **Total discount**: toggle % / $ flat, enter value, applied to subtotal

### Implementation Order
1. Reorganize components (move files + fix imports)
2. POSItemTile
3. POSScreen scaffold (header + grid)
4. Cart state + addToCart
5. CartBar
6. CartModal (qty, price, discount)
7. PaymentModal (Cash/QR + confirm)
8. Sale flow (confirm, toast, clear)

### Verification
1. All screens work after reorg
2. POS grid + category filter works
3. Add to cart, qty badge updates
4. CartBar shows correct totals
5. Price override + discount in CartModal
6. Cash/QR payment + sale confirmation
7. Cart clears + success toast after sale
