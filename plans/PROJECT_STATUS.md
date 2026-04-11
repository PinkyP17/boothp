# Artist Booth Manager — Project Status

## Completed Screens

### 1. Dashboard ✅
- Welcome greeting + summary cards (income, expenses, net profit)
- Upcoming events list
- Bottom tab navigation (5 tabs)

### 2. Inventory ✅
- Item list with search + category filter
- Summary cards (total stock, inventory value)
- Add / Edit / Restock items via modals
- Restock with cost tracking (expense note, not persisted yet)
- FAB for adding items
- Out-of-stock visual indicator

### 3. Events ✅
- Timeline view with colored status dots (green=active, blue=upcoming, gray=past)
- Status filter pills (All / Upcoming / Active / Past)
- Search events by name
- Event detail modal with expense list
- Add/delete per-event expenses (Booth Fee, Transportation, Food, Hotel, Supplies, Other)
- Add/edit events via modal
- Summary cards (total events, total expenses)

### 4. POS ✅
- 2-column item grid with category filter
- Tap-to-add cart with quantity badges
- Cart bar (sticky bottom) with item count + total
- Cart modal: quantity +/-, inline price override, % or $ discount
- Payment modal: Cash / QR selection + confirm
- Sale success toast (auto-dismiss)
- Sales counter ("X sales today")

## Remaining

### 5. More (placeholder)
- Currently just shows "More" text
- Planned: settings, profile, theme toggle

## Current Architecture
```
src/
  components/
    SearchBar.js, CategoryFilter.js, SummaryCard.js, EventCard.js  (shared)
    event/       (4 components)
    inventory/   (2 components)
    pos/         (4 components)
  constants/theme.js
  data/mockData.js
  navigation/TabNavigator.js
  screens/    (5 screens)
```

## Tech Debt / Future Work
- All data is mock/hardcoded — needs Spring Boot backend connection
- No shared state between screens (each screen has its own useState)
- POS sales don't decrement inventory stock yet
- Dashboard stats are hardcoded, not derived from POS sales/event expenses
- Date inputs are plain text (need date picker)
- No dark theme yet (colors ready in theme.js, just needs toggle)
- No persistent storage (sales/inventory reset on app reload)
- Community tab (future feature)
