# Future Frontend Enhancements

These are planned features to implement after all backend phases are wired up.

---

## 1. Animations

### Screen Transitions
- Smooth slide/fade transitions between screens using React Navigation's built-in animation options
- Shared element transitions for items (e.g., tapping an inventory card expands into edit modal)

### Micro-interactions
- Button press feedback (scale/bounce)
- Card entrance animations (staggered fade-in on lists)
- Toast/success notifications with slide-in + auto-dismiss
- Loading skeleton screens instead of spinners
- Pull-to-refresh bounce animation

### Libraries to Consider
- `react-native-reanimated` — performant animations on the UI thread
- `react-native-gesture-handler` — swipe-to-delete, drag-to-reorder
- Built-in `LayoutAnimation` for simple list add/remove animations

---

## 2. Charts & Graphs

### Finance Screen
- **Revenue over time** — line chart showing daily/weekly/monthly income
- **Expense breakdown** — pie/donut chart (booth fees vs transport vs food vs restocks)
- **Profit trend** — bar chart comparing income vs expenses per event or per month
- **Per-event ROI** — bar chart showing profit/loss per convention

### Dashboard
- Mini sparkline charts on summary cards (income trend, expense trend)
- Top-selling items bar chart

### Libraries to Consider
- `react-native-chart-kit` — simple and lightweight
- `victory-native` — more customizable
- `react-native-gifted-charts` — good for bar/pie charts with animations

---

## 3. Traceability

### Sales History
- Tap any sale in Finance → see full receipt (items, quantities, prices, discount, payment method)
- Filter sales by date range, payment method, or specific item

### Inventory History
- Per-item timeline: when it was created, restocked (with cost), sold (with quantity)
- Stock level graph over time per item

### Event Profitability
- Per-event P&L: total sales during event vs event expenses
- Requires adding optional `event_id` FK to sales table (noted in backend plans)
- Compare profitability across events

### Audit Trail
- Track who changed what and when (useful if multi-user is added later)
- Restock history per item with dates and costs

---

## 4. Payment Confirmation via Push Notifications

### The Idea
When a customer pays via QR code (e.g., TNG eWallet, DuitNow), the seller currently has no automatic way to verify payment in-app. This feature would let the app detect incoming payment notifications and auto-confirm the transaction.

### How It Could Work

```
Customer scans QR → Pays via TNG/DuitNow
         ↓
Seller's phone receives push notification from TNG/bank app
         ↓
Our app reads the notification (with user permission)
         ↓
Parses the amount from the notification text
         ↓
Matches it to the pending sale in POS
         ↓
Auto-confirms payment received ✓
```

### Implementation Approach (Basic)

1. **Notification Listener** — use `react-native-notification-listener` or similar to access incoming notifications (requires Android notification access permission)
2. **Notification Parser** — extract amount and sender from notification text patterns:
   - TNG: "You have received RM XX.XX from..."
   - DuitNow: "RM XX.XX has been credited..."
3. **Matching Logic** — compare parsed amount to the current pending sale total
4. **Confirmation UI** — show a green checkmark + "Payment confirmed" when matched

### Considerations
- **Android only** for now — iOS doesn't allow reading other apps' notifications
- **Privacy** — clearly communicate to the user what notifications the app reads
- **Fallback** — always allow manual "Payment Received" confirmation (current flow)
- **Accuracy** — amount matching may have edge cases (partial payments, tips, rounding)
- **Permissions** — the app needs Android's `NotificationListenerService` permission, which users must explicitly grant in system settings

### Complexity: Medium-High
This is feasible but requires careful handling of permissions and notification parsing. Start with a prototype that just logs incoming notifications, then build the parser and matching logic incrementally.

---

## Priority Order
1. Charts & Graphs (most user value, moderate effort)
2. Traceability (important for business insights)
3. Animations (polish, can be added incrementally)
4. Payment Confirmation (complex, prototype first)
