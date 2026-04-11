# Events Screen Implementation Plan

## Context
Third screen of the Artist Booth Manager app. Manages events the artist attends — view event timeline, add/edit events, and track per-event expenses (booth fee, travel, food, hotel, etc.). Uses mock data, no backend yet.

## Files to Create (4 new) + Modify (2 existing)

### New Files
| File | Purpose |
|------|---------|
| `src/components/EventTimelineCard.js` | Event card with timeline dot + line on left side, status badge |
| `src/components/EventDetailModal.js` | Modal showing event info + expense list + "Add Expense" button |
| `src/components/EventExpenseModal.js` | Small modal for adding expense (amount + category picker) |
| `src/components/EventModal.js` | Modal for adding/editing an event (name, dates, location) |

### Modified Files
| File | Change |
|------|--------|
| `src/data/mockData.js` | Expand events with endDate, status, expenses + add EXPENSE_CATEGORIES |
| `src/screens/EventsScreen.js` | Replace placeholder with full implementation |

## Mock Data Structure
```js
// Event
{ id, name, date, endDate, location, status: 'upcoming'|'active'|'past', expenses: [] }

// Expense
{ id, category, amount }

// Constants
EXPENSE_CATEGORIES = ['Booth Fee', 'Transportation', 'Food', 'Hotel', 'Supplies', 'Other']
EVENT_STATUSES = ['All', 'Upcoming', 'Active', 'Past']
```

## Timeline Visual
```
  ●─── [ Event Card 1 ]    (green dot = active)
  │
  ●─── [ Event Card 2 ]    (blue dot = upcoming)
  │
  ●─── [ Event Card 3 ]    (gray dot = past)
```
- Left column: circle dot + vertical connecting line
- Right column: card content with status badge, name, dates, location, expense total
- Dot color: green=active, blue=upcoming, gray=past

## Modal Flow
```
Events List → tap card → EventDetailModal (view info + expenses)
                              → "Add Expense" → EventExpenseModal (amount + category)
Events List → tap FAB → EventModal (add new event)
Events List → edit button in detail → EventModal (edit event)
```

## Screen Layout
```
SafeAreaView
  ScrollView
    Header ("Events" + count subtitle)
    SummaryCard row (Total Events + Total Expenses)
    SearchBar
    Status filter pills (All / Upcoming / Active / Past)
    Timeline event cards via .map()
    bottomSpacer
  FAB (+ add event)
  EventModal (add/edit)
  EventDetailModal (view + expenses)
  EventExpenseModal (add expense)
```

## Implementation Order
1. Mock data (EXPENSE_CATEGORIES, EVENT_STATUSES, expanded events)
2. EventTimelineCard
3. EventExpenseModal
4. EventModal (add/edit)
5. EventDetailModal
6. EventsScreen (wire everything)

## Verification
1. Timeline list with colored dots and connecting lines
2. Filter pills work (All/Upcoming/Active/Past)
3. Search filters by event name
4. Add event via FAB
5. Tap event → detail modal with expense list
6. Add/delete expenses in detail modal
7. Summary cards show correct totals
