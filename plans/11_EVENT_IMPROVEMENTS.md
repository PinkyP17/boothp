# Phase 11: Event Status & UX Improvements

## Issues to Fix

### 1. Event status not auto-computed from dates

**Problem:** All events show as "upcoming" because the status is set once at creation time (`status: "upcoming"`) and never updated. There's no logic to transition events to "active" (currently running) or "past" (ended).

**Root cause:** The `status` field is stored statically in the database. The backend and frontend both trust whatever string is saved — neither recalculates it based on today's date.

**Fix — compute status dynamically:**

Two options:

- **Option A (backend):** Add a helper method in `EventService` or a `@PostLoad` hook on the entity that computes status from dates before returning to the client:
  ```
  if today < event.date → "upcoming"
  if today >= event.date AND today <= event.endDate → "active"
  if today > event.endDate → "past"
  ```
  The stored `status` column becomes derived/ignored (or removed entirely).

- **Option B (hybrid):** Backend computes on read, frontend also computes locally for instant feedback without a network call.

**Recommendation:** Option B — backend computes before sending response (single source of truth), and frontend also has a `getEventStatus(event)` utility for local rendering before sync.

**Files to modify:**
- `backend/.../service/EventService.java` — compute status in `getAll()`, `create()`, `update()` responses
- `backend/.../service/DashboardService.java` — use computed status for "upcoming events" filter
- `src/screens/EventDetailScreen.js` — use `getEventStatus()` utility for display
- `src/components/event/EventTimelineCard.js` — same
- New: `src/utils/eventStatus.js` — shared `getEventStatus(event)` function

---

### 2. Edit modal stays open when navigating away

**Problem:** The EventModal in `EventDetailScreen` is opened via local state (`editModalVisible`). When the user presses the bottom tab to go Home and then comes back to Events tab, React Navigation preserves the screen state — the modal remains open.

**Root cause:** Bottom tab navigation doesn't unmount screens. The modal's `visible` state persists.

**Fix:** Close the modal when the screen loses focus. Use `useFocusEffect` or the `blur` event listener to reset modal visibility.

**Files to modify:**
- `src/screens/EventDetailScreen.js` — add blur listener to close modals
- `src/screens/EventsScreen.js` — same for the add event modal (same potential issue)

---

### 3. Sales breakdown needs item details and time

**Problem:** The sales section in EventDetailScreen only shows "X sales · Y items · $total" per date. The user wants to see **what was sold** and **when** (timestamp).

**Fix:** Expand the sales breakdown to show individual transactions with:
- Time of sale (e.g., "2:34 PM")
- Items sold (e.g., "2x Gojo Print, 1x Sticker Pack")
- Sale total

**UI approach:** Each date group becomes expandable, or show all sales flat with time + items.

**Proposed layout:**
```
┌─ May 15 ─────────────────────────┐
│  2:34 PM · 2x Gojo Print, 1x... │
│                          $45.00  │
│──────────────────────────────────│
│  4:12 PM · 1x Keychain           │
│                          $12.00  │
└──────────────────────────────────┘
```

**Files to modify:**
- `src/screens/EventDetailScreen.js` — expand sales section UI, show individual sales with items + timestamp

---

### 4. Highlight currently running events in Events tab

**Problem:** Active events look the same as upcoming/past events in the list. User wants at-a-glance visibility for which event is live.

**Fix:** In `EventTimelineCard`, when status is "active":
- Add a subtle glowing/pulsing border or a colored left border accent
- Or: give the card a light green tint background
- The status badge already shows green for "active" — make the card itself stand out more

**Proposed:** Add a left accent border (3px solid green) to the card when active, plus a slightly tinted background.

**Files to modify:**
- `src/components/event/EventTimelineCard.js` — conditional styling for active events

---

### 5. Dashboard not reflecting event edits

**Problem:** When the user edits an event (name, dates, etc.), the Dashboard still shows stale data because:
1. Dashboard data comes from a separate `GET /api/v1/dashboard` endpoint
2. Dashboard is loaded once on mount (`useEffect [token]`) and never refreshed after
3. Editing an event updates `state.events` but doesn't re-fetch the dashboard

**Root cause:** The dashboard endpoint is a separate data source. After editing an event, only `state.events` is updated — `state.dashboard` still holds the old snapshot.

**Fix — two-part:**

**Part A: Re-fetch dashboard after relevant mutations.**
- After `updateEvent`, `addEvent`, `addEventExpense`, `deleteEventExpense`, `createSale`, `restockItem` — call `loadDashboard(token)` to refresh.
- Could do this in the DashboardScreen by re-fetching on focus (using `useFocusEffect`) instead of only on mount.

**Part B (simpler, recommended): Use `useFocusEffect` on DashboardScreen.**
- Every time the user navigates to the Dashboard tab, re-fetch the dashboard data.
- This ensures it's always fresh without needing to track which mutations affect it.
- Small network cost but guarantees consistency.

**Files to modify:**
- `src/screens/DashboardScreen.js` — replace `useEffect([token])` with `useFocusEffect` that calls `loadDashboard(token)` every time the screen is focused

---

## Implementation Order

1. Create `src/utils/eventStatus.js` — `getEventStatus(event)` utility
2. Update `EventService.java` — compute status on read
3. Update `DashboardService.java` — use computed status
4. Update `EventTimelineCard.js` — use computed status + highlight active events
5. Update `EventDetailScreen.js` — use computed status, close modals on blur, expand sales UI
6. Update `EventsScreen.js` — close modal on blur
7. Update `DashboardScreen.js` — use `useFocusEffect` to refresh on tab focus

---

## Verification

1. Create event with past dates → shows as "Past" (not "Upcoming")
2. Create event spanning today → shows as "Active" with highlighted card
3. Create future event → shows as "Upcoming"
4. Open event detail → tap Edit → press Home tab → return to Events → modal is closed
5. Make a sale during active event → event detail shows item names + time of sale
6. Edit event name → go to Dashboard → see updated name in upcoming events
