# Artist Booth Manager — App-Wide Design Decisions

## Design Style

### Principles
- **Lightweight** — minimal dependencies, fast load, no heavy UI libraries
- **Simple & readable** — clean layouts, clear typography, generous spacing
- **Themeable** — support light/dark themes via centralized color constants

### Styling Rules
- Plain `StyleSheet` only — no UI libraries (NativeBase, Tamagui, etc.)
- All colors come from `src/constants/theme.js` (`COLORS` object) — never hardcode colors in components
- All sizing from `SIZES` object — consistent padding, border radius, font sizes
- Card-based layouts with `CARD_SHADOW` for elevation
- Icons from `@expo/vector-icons` (bundled with Expo Go)

### Theming
- Theme colors centralized in `COLORS` — swap this object to switch themes
- Future: add a theme toggle in the More/Settings screen
- Light theme is the default (matches app.json `userInterfaceStyle: "light"`)
- When dark theme is added: replace `COLORS` values, keep the same keys

### Typography
- Title: 24px, bold (700)
- Subtitle: 18px, semi-bold (600)
- Body: 16px, regular
- Caption: 13px, uppercase labels with letter spacing

### Component Organization
- **Shared/public components** stay in `src/components/` root (SearchBar, CategoryFilter, SummaryCard, etc.)
- **Screen-specific components** go in subfolders: `src/components/event/`, `src/components/inventory/`, `src/components/pos/`
- Rule: if a component is only used by one screen's feature, it goes in that screen's subfolder

```
src/components/
  SearchBar.js            ← shared
  CategoryFilter.js       ← shared
  SummaryCard.js           ← shared
  event/
    EventTimelineCard.js
    EventDetailModal.js
    EventExpenseModal.js
    EventModal.js
  inventory/
    InventoryItemCard.js
    InventoryItemModal.js
  pos/
    ...
```

---

## Expense & Income Flow

### Income
- Income comes from **POS sales only**
- POS screen handles selling items to customers at the booth
- Each sale records: items sold, quantities, price, payment method (cash/QR), timestamp

### Expenses — Two Sources

#### 1. Event Expenses (managed in Events screen)
- Tied to a specific event
- Categories: booth fee, transportation, food, hotel, supplies, other
- Entered manually when planning/attending an event
- Examples: "Anime Expo booth fee $500", "Hotel 3 nights $450", "Gas $60"

#### 2. Restock Expenses (triggered from Inventory)
- When restocking an item (increasing stock count), user enters the cost
- Logged automatically as a "Production/Restock" expense
- Optionally linked to an event (restocking *for* a specific event)
- Example: "Restock 50 prints → cost $75"

### Dashboard Aggregation
- **Income card** = sum of all POS sales
- **Expenses card** = sum of event expenses + restock expenses
- **Net Profit** = income - expenses
- Future: per-event profit breakdown (event sales - event expenses - event restock costs)

---

## Screen Responsibilities

| Screen | Handles |
|--------|---------|
| **Dashboard** | Displays aggregated income, expenses, net profit, upcoming events |
| **Inventory** | Item management, stock counts, restocking with cost tracking |
| **POS** | Selling items, checkout, payment method, generates income |
| **Events** | Event details, event-specific expenses, event schedule |
| **More** | Settings, profile, future features |

---

## Data Flow
```
Inventory (restock cost) ──→ Expenses
Events (booth/travel/food) ──→ Expenses
POS (sales) ──→ Income
                                    ↓
                              Dashboard
                         (income - expenses = profit)
```
