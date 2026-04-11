# Inventory Screen Implementation Plan

## Context
Second screen of the Artist Booth Manager app. Manages the items the artist sells at conventions — view, add, edit, restock with cost tracking. Uses mock data, no backend yet.

## Files to Create (4 new) + Modify (2 existing)

### New Files
| File | Purpose |
|------|---------|
| `src/components/SearchBar.js` | Reusable search input with icon |
| `src/components/CategoryFilter.js` | Horizontal scrollable category pills |
| `src/components/InventoryItemCard.js` | Card for each inventory item |
| `src/components/InventoryItemModal.js` | Modal for Add / Edit / Restock flows |

### Modified Files
| File | Change |
|------|--------|
| `src/data/mockData.js` | Add `CATEGORIES` array + `inventoryItems` array |
| `src/components/SummaryCard.js` | Add optional `format` prop ("currency" vs "number") |

## Mock Data — `inventoryItems`
```js
{ id, name, category, productionCost, sellingPrice, stock }
```
- 5 sample items across Prints, Stickers, Keychains, Badges
- One item with stock: 0 (out of stock example)
- `CATEGORIES`: ['All', 'Prints', 'Stickers', 'Keychains', 'Badges', 'Other']

## Component Breakdown

### SearchBar
- Props: `value`, `onChangeText`, `placeholder`
- Ionicons search icon + TextInput in a rounded card

### CategoryFilter
- Props: `categories`, `selected`, `onSelect`
- Horizontal ScrollView of pill buttons
- Selected = primary bg + white text, unselected = card bg + secondary text

### InventoryItemCard
- Props: `item`, `onPress`, `onRestock`
- Card layout: name + category badge, stock count (red if 0), cost/price row, restock button
- `onPress` → edit modal, `onRestock` → restock modal

### InventoryItemModal (3 modes)
- Props: `visible`, `onClose`, `onSave`, `item`, `mode` ("add" | "edit" | "restock")
- **Add**: empty form — name, category picker, production cost, selling price, initial stock
- **Edit**: pre-populated same form
- **Restock**: quantity to add + total cost for batch + informational note about expense logging

## Screen Layout — InventoryScreen
```
SafeAreaView
  ScrollView
    Header ("Inventory" + "X items" subtitle)
    SummaryCard row (Total Items + Inventory Value) — reuses existing SummaryCard
    SearchBar
    CategoryFilter
    Item cards via .map() (filtered by category + search)
    bottomSpacer
  FAB (absolute bottom-right, "+" icon, primary color)
  InventoryItemModal
```

### State (all useState)
- `items` — initialized from mock data
- `searchQuery`, `selectedCategory` — filtering
- `modalVisible`, `modalMode`, `selectedItem` — modal control

### Filtering
- Category: skip if "All", else match `item.category`
- Search: case-insensitive substring on `item.name`

### Handlers
- `handleAddItem(newItem)` — generate id, prepend to items
- `handleEditItem(updatedItem)` — replace by id
- `handleRestock(itemId, qty, cost)` — add qty to stock (cost received but not persisted yet)

## SummaryCard Change
Add optional `format` prop (default "currency"):
- `"currency"` → `$X,XXX.XX` (current behavior)
- `"number"` → plain number (for "Total Items" count)

## Implementation Order
1. Mock data (`CATEGORIES` + `inventoryItems`)
2. SearchBar + CategoryFilter (parallel)
3. InventoryItemCard
4. InventoryItemModal (add → edit → restock modes)
5. InventoryScreen (wire everything)
6. SummaryCard format prop update

## Key Decisions
- **Modal, not navigation** — no stack navigator needed, keeps it self-contained
- **useState, not context** — single screen consuming data, lifts to context later with backend
- **FAB for add** — `position: absolute`, bottom-right, 56x56 circle
- **Restock cost note** — shows "will be logged as expense" but doesn't persist yet (future feature)

## Verification
1. `npx expo start` → open Inventory tab
2. See summary cards (total items + inventory value)
3. Search filters items by name
4. Category pills filter by category
5. Tap "+" FAB → add modal opens, can fill and save
6. Tap item card → edit modal with pre-filled data
7. Tap restock button → restock modal with qty + cost fields
8. Out-of-stock item shows red stock count
