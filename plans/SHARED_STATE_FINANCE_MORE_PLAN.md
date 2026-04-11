# Shared State + Finance Screen + More Screen Plan

## Context
All screens currently have isolated state — POS sales don't affect dashboard or inventory, expenses aren't aggregated. We need shared state, a Finance screen for transaction history + charts, and a proper More screen with settings/about pages.

---

## Phase 1: Shared State (AppContext)

### Create: `src/context/AppContext.js`

**State shape:**
```js
{ inventory: [...], sales: [], events: [...] }
```

**Reducer actions:**
| Action | Effect |
|--------|--------|
| `ADD_TO_INVENTORY` | Prepend item |
| `UPDATE_INVENTORY_ITEM` | Replace by id |
| `RESTOCK_ITEM` | Increment stock |
| `ADD_SALE` | Prepend sale + decrement inventory stock for each sold item |
| `ADD_EVENT` | Append event |
| `UPDATE_EVENT` | Replace by id |
| `ADD_EVENT_EXPENSE` | Push expense to event |
| `DELETE_EVENT_EXPENSE` | Remove expense from event |

Initial state seeded from mockData.js.

### Screen Migrations
- **DashboardScreen** — derive income/expenses/profit from `state.sales` + `state.events`
- **InventoryScreen** — read/write `state.inventory` via dispatch
- **POSScreen** — read inventory from context, dispatch `ADD_SALE` (cart stays local)
- **EventsScreen** — read/write `state.events` via dispatch

### Modify: `App.js` — wrap with `<AppStateProvider>`

---

## Phase 2: Navigation Restructuring

### Install: `@react-navigation/native-stack`

### Create: `src/navigation/HomeStack.js`
```
HomeStack → DashboardScreen (initial) → FinanceScreen
```

### Create: `src/navigation/MoreStack.js`
```
MoreStack → MoreMenuScreen (initial) → FinanceScreen / SettingsScreen / AboutScreen
```

### Modify: `src/navigation/TabNavigator.js`
- Home tab → HomeStack (instead of DashboardScreen)
- More tab → MoreStack (instead of MoreScreen)

### Modify: `src/components/SummaryCard.js`
- Add optional `onPress` prop → wraps in TouchableOpacity when provided

### Dashboard card navigation:
- Tap Income → `navigate('Finance', { filter: 'Income' })`
- Tap Expenses → `navigate('Finance', { filter: 'Expenses' })`
- Tap Net Profit → `navigate('Finance', { filter: 'All' })`

---

## Phase 3: Finance Screen

### Install: `react-native-chart-kit` + `react-native-svg`

### Create: `src/screens/FinanceScreen.js`
- Reads `route.params?.filter` (default 'All')
- Uses context for sales + events data

**Layout:**
1. Header with back button + "Finance" title
2. FinanceSummary — income, expenses, net profit
3. Filter tabs — All / Income / Expenses (pre-selected from route param)
4. FinanceChart — line chart (income green + expenses red per event)
5. Transaction list — sorted by date, newest first

**Data derivation:**
- Income transactions: from `state.sales` (description = items summary, amount = total)
- Expense transactions: from `state.events` expenses (category, amount, event name)
- Filter controls which type shows

### Components: `src/components/finance/`
| File | Purpose |
|------|---------|
| `FinanceSummary.js` | Three stat boxes: income, expenses, net |
| `FinanceChart.js` | Line chart wrapper (react-native-chart-kit) |
| `TransactionCard.js` | Transaction row: type icon, description, amount, date |
| `FilterTabs.js` | All / Income / Expenses pills |

---

## Phase 4: More Screen

### Create: `src/screens/MoreMenuScreen.js`
Menu items with icon + label + chevron:
- Finance → FinanceScreen
- Settings → SettingsScreen
- About the Developer → AboutScreen

### Create: `src/screens/SettingsScreen.js` (placeholder)
- Grayed-out future items: Theme toggle, Currency, Notifications

### Create: `src/screens/AboutScreen.js` (placeholder)
- About the developer content

### Delete: `src/screens/MoreScreen.js` (replaced by MoreMenuScreen)

---

## TODOs (not building now)
- [ ] **Theme toggle** (light/dark) — future in Settings screen
- [ ] **About the Developer** page content — future
- [ ] **Community tab** — event reviews, posts — future feature
- [ ] **Persistent storage** — AsyncStorage/expo-sqlite so data survives reloads

---

## File Summary

**New files (11):**
- `src/context/AppContext.js`
- `src/navigation/HomeStack.js`
- `src/navigation/MoreStack.js`
- `src/screens/FinanceScreen.js`
- `src/screens/MoreMenuScreen.js`
- `src/screens/SettingsScreen.js`
- `src/screens/AboutScreen.js`
- `src/components/finance/FinanceSummary.js`
- `src/components/finance/FinanceChart.js`
- `src/components/finance/TransactionCard.js`
- `src/components/finance/FilterTabs.js`

**Modified files (8):**
- `App.js` — wrap with AppStateProvider
- `package.json` — add native-stack, chart-kit, svg
- `src/navigation/TabNavigator.js` — use HomeStack + MoreStack
- `src/screens/DashboardScreen.js` — context + tappable cards + navigation
- `src/screens/InventoryScreen.js` — context migration
- `src/screens/POSScreen.js` — context migration
- `src/screens/EventsScreen.js` — context migration
- `src/components/SummaryCard.js` — optional onPress prop

**Deleted:**
- `src/screens/MoreScreen.js` — replaced by MoreMenuScreen

## Implementation Order
1. AppContext.js (foundation)
2. App.js — wrap provider
3. Migrate screens to context: Inventory → Events → POS → Dashboard
4. Install native-stack + chart-kit + svg
5. HomeStack + MoreStack navigators
6. Update TabNavigator
7. SummaryCard onPress prop
8. Dashboard tappable cards + navigation
9. Finance components (FilterTabs, FinanceSummary, FinanceChart, TransactionCard)
10. FinanceScreen
11. MoreMenuScreen + SettingsScreen + AboutScreen
12. MoreStack wiring
13. Cleanup mockData.js

## Verification
1. All screens share data — add item in Inventory, see it in POS grid
2. Complete a POS sale → stock decrements in Inventory, income updates on Dashboard
3. Add event expense → Dashboard expenses card updates
4. Tap Dashboard Income card → Finance opens filtered to Income
5. Finance chart shows income vs expenses per event
6. Transaction list shows all sales + expenses
7. More menu navigates to Finance, Settings, About
8. Back navigation works from all stack screens
