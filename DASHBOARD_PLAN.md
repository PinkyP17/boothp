# Dashboard Implementation Plan

## Context
First screen of the Artist Booth Manager app. Sets up the project foundation (folder structure, navigation, theme) that all other screens will reuse. All data is mock/hardcoded.

## Dependencies to Install
```
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

## Folder Structure
```
src/
  constants/theme.js        — colors, sizes, shared card styles
  data/mockData.js           — hardcoded dashboard stats + upcoming events
  navigation/TabNavigator.js — bottom tab nav with 5 tabs
  screens/DashboardScreen.js — main dashboard
  screens/InventoryScreen.js — placeholder
  screens/POSScreen.js       — placeholder
  screens/EventsScreen.js    — placeholder
  screens/MoreScreen.js      — placeholder
  components/SummaryCard.js  — reusable income/expense/profit card
  components/EventCard.js    — single upcoming-event row
```

## Files (11 total, 1 modified + 10 new)

### 1. `src/constants/theme.js`
- `COLORS`: background (#F5F5F5), card (#FFF), income (green), expense (red), profit (blue), posButton (orange), text colors
- `SIZES`: padding, cardRadius, font sizes
- Shared `CARD_SHADOW` style for consistent elevation

### 2. `src/data/mockData.js`
- `dashboardStats`: `{ income: 2450.00, expenses: 870.50 }` — net profit derived inline
- `upcomingEvents`: array of `{ id, name, date, location }` (3 sample events)

### 3. `src/components/SummaryCard.js`
- Props: `title`, `amount`, `color`, `fullWidth`
- Two cards side-by-side (Income, Expenses) + full-width Net Profit card below
- Currency formatted with `toFixed(2)` (not `Intl.NumberFormat` — inconsistent on Hermes)

### 4. `src/components/EventCard.js`
- Props: `event` object (`name`, `date`, `location`)
- Card with event name (bold), formatted date, location (secondary text)

### 5. `src/screens/DashboardScreen.js`
- `SafeAreaView` > `ScrollView` layout
- **Header**: "Welcome back!" greeting + today's date
- **Summary cards row**: Income + Expenses side-by-side, Net Profit full-width below
- **Upcoming Events**: section header + `.map()` over events (NOT FlatList inside ScrollView)

### 6. Placeholder Screens
- `InventoryScreen.js`, `POSScreen.js`, `EventsScreen.js`, `MoreScreen.js`
- Each just renders centered text with the screen name

### 7. `src/navigation/TabNavigator.js`
- `createBottomTabNavigator` with 5 tabs: Home, Inventory, POS (center), Events, More
- POS tab gets accent background on its icon (orange circle)
- `headerShown: false` — screens manage their own headers
- Icons from `@expo/vector-icons` (bundled with Expo Go)

### 8. `App.js` (modify existing)
- Wrap `NavigationContainer` > `TabNavigator` + `StatusBar`

## Implementation Order
1. Install nav dependencies
2. Create `theme.js` + `mockData.js` (parallel)
3. Create 4 placeholder screens (parallel)
4. Create `SummaryCard` + `EventCard` components
5. Create `DashboardScreen`
6. Create `TabNavigator`
7. Modify `App.js`
8. Test on Expo Go

## Key Decisions
- **Light theme** — matches app.json config, readable in convention lighting
- **`.map()` not FlatList** for events — avoids nested virtualized list warnings
- **Simple POS button** — colored icon background, not a floating FAB (polish later)
- **`SafeAreaView` from `react-native-safe-area-context`** — handles notches correctly

## Verification
1. `npx expo start` → open in Expo Go
2. Dashboard shows greeting, 3 summary cards, 3 upcoming events
3. All 5 tabs navigate to their screens
4. POS tab has distinct orange accent
5. Scrolling works smoothly on dashboard
