# Phase 13: Final Polish & Remaining Requirements

Before the app can be considered complete, these items need to be addressed. Organized by priority.

---

## Priority 1: Critical (Offline mode doesn't fully work without these)

### 1.1 Wire Up Auto-Sync
- `runSync` is exposed in AppContext but never connected to ConnectivityContext's `registerSyncFunction`
- When connectivity returns (offline → online), the sync engine never actually fires
- **Fix:** In AppStateProvider or App.js, call `registerSyncFunction` with a callback that invokes `runSync`

### 1.2 Dashboard Offline Support
- `loadDashboard` only works via API — home screen is blank without internet
- **Fix:** Compute dashboard data locally from SQLite (aggregate sales + event expenses) when offline
- Online: still fetch from API, but fall back to local computation if request fails

---

## Priority 2: UX Quality (Users will notice these immediately)

### 2.1 Error Feedback
- All API calls `console.warn` errors but show nothing to the user
- **Fix:** Add a simple toast/snackbar component for "Failed to save", "Sync failed", "Network error" etc.
- Could use `react-native-toast-message` or a lightweight custom component

### 2.2 Loading States
- No spinners or skeletons during API fetches — users see empty screens briefly on first load
- **Fix:** Add `isLoading` flags to reducer state, show ActivityIndicator or skeleton screens while loading

### 2.3 Pull-to-Refresh
- None of the list screens (Inventory, Events, POS) support pull-to-refresh
- **Fix:** Wrap ScrollViews with `RefreshControl` — straightforward implementation

### 2.4 Sync on App Foreground
- Currently only syncs on offline → online transition
- **Fix:** Add `AppState` listener (react-native) to trigger sync when app returns from background

---

## Priority 3: Cleanup & Consistency

### 3.1 SettingsScreen Currency
- Still shows hardcoded "USD ($)" — misleading since events now have per-event currency
- **Options:**
  - Remove the currency row entirely (currency is per-event now)
  - OR make it a "default currency" preference that pre-fills when creating new events

### 3.2 Delete Support in Offline Flow
- No delete functionality for inventory items or events in the sync queue
- The sync queue handles create/update but not deletes
- **Fix:** Add `DELETE` operation support to syncQueueRepo and syncEngine

### 3.3 Update PROJECT_STATUS.md
- Severely outdated — doesn't reflect Phases 8, 9, 11, 12 being done
- Should document: backend integration, offline mode, per-event currency, item images, event improvements

### 3.4 TransactionDto.java
- Listed as modified in git status — verify this is intentional and not a stale/accidental change

---

## Priority 4: Nice-to-Have Enhancements

### 4.1 Dark Theme
- Colors are centralized in `theme.js`, just needs a toggle mechanism
- SettingsScreen already has a placeholder toggle for it
- **Approach:** Create a ThemeContext, swap COLORS object based on mode, persist preference

### 4.2 Finance Charts
- Detailed in `FUTURE_FRONTEND.md`
- Revenue over time, expense breakdown pie chart, per-event ROI
- Libraries: `react-native-chart-kit`, `victory-native`, or `react-native-gifted-charts`

### 4.3 Data Export
- CSV or PDF export of sales, inventory, or event summaries
- Useful for tax records, accounting, or sharing with event organizers
- Libraries: `expo-file-system` + `expo-sharing` for file export

### 4.4 Multi-Image Support
- Currently one image per inventory item
- Artists often want gallery views showing multiple angles/variants
- Would require a junction table (item_images) and a swipeable image carousel

### 4.5 Notifications / Alerts
- SettingsScreen has a placeholder for notifications
- Low stock alerts, event reminders (day before), sync failure alerts
- Libraries: `expo-notifications` for local push notifications

---

## Implementation Order

```
Phase 13a: Wire auto-sync + dashboard offline     (1.1, 1.2)
Phase 13b: Error toasts + loading states           (2.1, 2.2)
Phase 13c: Pull-to-refresh + foreground sync       (2.3, 2.4)
Phase 13d: Cleanup & settings                      (3.1, 3.2, 3.3, 3.4)
Phase 13e: Dark theme                              (4.1)
Phase 13f: Charts                                  (4.2)
Phase 13g: Export + extras                         (4.3, 4.4, 4.5)
```

Phases 13a and 13b are required for a usable app. Everything after is enhancement.
