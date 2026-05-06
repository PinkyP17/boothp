# Phase 10: Event Details Page & Personal Notes

## Context
Currently, tapping an event opens a bottom-sheet modal (`EventDetailModal`) that shows basic info and expenses. The user wants:
1. A **full-screen Event Details page** with a proper breakdown (expenses, sales tied to the event, P&L summary)
2. A **Personal Notes** section — free-text notes and post-event review (e.g., "sold out of stickers by noon", "booth placement was bad")

---

## Navigation Changes

The Events tab currently renders `EventsScreen` directly (no nested stack). We need to wrap it in a stack navigator so we can push to a detail screen.

### New: `src/navigation/EventsStack.js`

```
EventsStack (native stack, headerShown: false)
  ├── EventsList  → EventsScreen (existing)
  └── EventDetail → EventDetailScreen (new)
```

### Modified: `TabNavigator.js`

- Replace `EventsScreen` import with `EventsStack`
- Update the Events tab to use `EventsStack` component

---

## Backend Changes

### Entity: `Event`
- Add `notes` field (TEXT, nullable) — free-form personal notes

### DTO Updates
- Add `notes` to event request/response DTOs

### Endpoint
- No new endpoints needed — existing `PUT /api/v1/events/:id` handles updating notes
- Optionally: `GET /api/v1/events/:id/summary` — returns aggregated sales + expenses for that event (or compute client-side)

### Migration
- Add `notes TEXT` column to `events` table

---

## New Files (2)

### 1. `src/screens/EventDetailScreen.js`

Full-screen detail view, receives `event` via route params (or event ID + fetches from context).

**Sections:**

| Section | Content |
|---------|---------|
| Header | Event name, status badge, date range, location |
| Financial Summary | Cards showing: Total Sales, Total Expenses, Net Profit/Loss |
| Expenses Breakdown | List of expenses by category (same as current modal, but roomier) |
| Sales Breakdown | List of sales made during this event's date range (if event is active/past) |
| Personal Notes | Editable text area for post-event reflections |

**Actions:**
- Edit event (navigates back or opens EventModal)
- Add expense (opens EventExpenseModal)
- Delete expense
- Save notes (auto-save on blur, or explicit save button)

### 2. `src/navigation/EventsStack.js`

Simple native stack wrapping EventsList and EventDetail.

---

## Modified Files (5)

### 3. `src/screens/EventsScreen.js`
- Accept `navigation` prop
- On event card press: `navigation.navigate("EventDetail", { eventId: event.id })` instead of opening `EventDetailModal`
- Remove `EventDetailModal` usage (replaced by full screen)

### 4. `src/navigation/TabNavigator.js`
- Import `EventsStack` instead of `EventsScreen`
- Use `EventsStack` as the Events tab component

### 5. `src/context/AppContext.js`
- Add `updateEventNotes` action (or reuse `updateEvent` with notes field)
- When loading events, include `notes` field from API response

### 6. `src/components/event/EventModal.js`
- No major changes, but ensure it works when launched from EventDetailScreen (pass navigation callback)

### 7. Backend: `Event.java` / DTOs
- Add `notes` String field
- Update request/response DTOs

---

## Data Flow

### Sales ↔ Events Association
Currently sales don't have an `eventId` field. Two approaches:

**Option A (simple, no backend change):** Filter sales by date range — sales made between event start and end date are considered "event sales". Works well since the user is typically selling at one event at a time.

**Option B (proper, requires backend change):** Add `eventId` to Sale entity. When creating a sale during an active event, automatically tag it with that event's ID. More accurate but more work.

**Recommendation:** Start with Option A for now. Add Option B later if the user attends overlapping events.

### Notes Flow
```
User types notes → onBlur/save button → updateEvent(token, eventId, { notes }) → API PUT → dispatch UPDATE_EVENT
```

---

## UI Design

### Event Detail Screen Layout
```
┌─────────────────────────────────┐
│ ← Back            [Edit] [···]  │  ← Header with back nav
├─────────────────────────────────┤
│  🟢 Anime Expo 2026             │
│  May 15 — May 18, 2026          │
│  Los Angeles Convention Center   │
├─────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐       │
│  │ Sales   │ │Expenses │       │
│  │ $1,240  │ │ $580    │       │
│  └─────────┘ └─────────┘       │
│  ┌─────────────────────┐       │
│  │  Net: +$660          │       │
│  └─────────────────────┘       │
├─────────────────────────────────┤
│  Expenses                       │
│  ┌─ Booth Fee ──── $500.00 ─┐  │
│  ├─ Travel ─────── $50.00 ──┤  │
│  └─ Food ────────── $30.00 ──┘  │
│  [+ Add Expense]                │
├─────────────────────────────────┤
│  Sales (3 transactions)         │
│  ┌─ May 15 ─ 5 items ─ $320 ┐  │
│  ├─ May 16 ─ 8 items ─ $520 ┤  │
│  └─ May 17 ─ 6 items ─ $400 ┘  │
├─────────────────────────────────┤
│  Notes & Review                 │
│  ┌──────────────────────────┐  │
│  │ Stickers sold out by noon │  │
│  │ on day 1. Bring 2x next  │  │
│  │ time. Booth L12 had good │  │
│  │ foot traffic.             │  │
│  └──────────────────────────┘  │
│  [Save Notes]                   │
└─────────────────────────────────┘
```

---

## Implementation Order

1. Backend: Add `notes` field to Event entity + DTOs + migration
2. Create `src/navigation/EventsStack.js`
3. Update `TabNavigator.js` to use EventsStack
4. Create `src/screens/EventDetailScreen.js` (header + financial summary + expenses)
5. Update `EventsScreen.js` — navigate to detail screen instead of opening modal
6. Add sales breakdown section (filter by date range)
7. Add personal notes section with save functionality
8. Update `AppContext.js` if needed for notes

---

## Edge Cases

- **No sales during event dates**: Show "No sales recorded" with a friendly message
- **Overlapping events**: Date-based sales attribution shows sales under both events (acceptable for now, mention to user)
- **Long notes**: ScrollView handles overflow; no character limit
- **Unsaved notes**: If user navigates away with unsaved changes, either auto-save or show a discard confirmation
- **Past events without notes**: Show placeholder "Add your post-event review here..."

---

## Verification

1. Open Events tab → tap an event → navigates to full-screen detail page
2. Financial summary shows correct totals (sales from date range + expenses)
3. Can add/delete expenses from detail page
4. Can type and save personal notes
5. Notes persist after navigating away and coming back
6. Back button returns to events list
7. Edit button opens EventModal, changes reflect on return
