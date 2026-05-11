# Phase 12: Per-Event Currency

## Context
The app manages an artist's booth at conventions across different countries (Malaysia, Singapore, Indonesia, US). Each event needs its own currency since conventions happen in different countries. Currently all amounts are hardcoded with `$`.

No currency conversion needed — just correct labeling per event.

---

## Backend Changes (4 files)

### 1. `backend/.../entity/Event.java`
- Add `private String currency;` with `@Column(length = 3)`
- Default to `"MYR"` in Java
- Add getter/setter
- Hibernate ddl-auto=update will auto-add the column

### 2. `backend/.../dto/EventRequest.java`
- Add `private String currency;` (optional, no @NotBlank)

### 3. `backend/.../dto/EventSummaryDto.java`
- Add `private String currency;` to builder fields

### 4. `backend/.../service/EventService.java`
- `create()`: `event.setCurrency(req.getCurrency() != null ? req.getCurrency() : "MYR");`
- `update()`: `event.setCurrency(req.getCurrency() != null ? req.getCurrency() : event.getCurrency());`

### 5. `backend/.../service/DashboardService.java`
- Include `.currency(e.getCurrency())` in the EventSummaryDto builder

---

## Frontend — New Files (2)

### 6. `src/constants/currencies.js`

```js
QUICK_PICK_CURRENCIES = [
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "USD", symbol: "$",  name: "US Dollar" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
]

ALL_CURRENCIES = [
  ...QUICK_PICK_CURRENCIES,
  { code: "JPY", symbol: "¥",  name: "Japanese Yen" },
  { code: "KRW", symbol: "₩",  name: "South Korean Won" },
  { code: "THB", symbol: "฿",  name: "Thai Baht" },
  { code: "PHP", symbol: "₱",  name: "Philippine Peso" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "EUR", symbol: "€",  name: "Euro" },
  { code: "GBP", symbol: "£",  name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee" },
  { code: "VND", symbol: "₫",  name: "Vietnamese Dong" },
  { code: "BND", symbol: "B$", name: "Brunei Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
]

DEFAULT_CURRENCY = "MYR"

getCurrencySymbol(code) → looks up symbol, falls back to "code " if not found
```

### 7. `src/utils/formatCurrency.js`

```js
formatCurrency(amount, currencyCode) → "RM 45.00" or "$ 45.00"
```

---

## Frontend — Modified Files (5)

### 8. `src/components/event/EventModal.js`
- Add `currency: "MYR"` to `emptyForm`
- In edit mode: populate from `event.currency || "MYR"`
- New UI section after "Location", before "Booth Fee":
  - Label: "Currency"
  - 4 pill buttons for quick picks (MYR, SGD, USD, IDR)
  - "More..." button → opens searchable sub-modal with FlatList of ALL_CURRENCIES
  - Each row: `code — name (symbol)`, tap to select + close
- Include `currency: form.currency` in handleSave data

### 9. `src/screens/EventDetailScreen.js`
- Import `formatCurrency`
- Derive `eventCurrency = event.currency || "MYR"`
- Replace 4 hardcoded `$` displays:
  - Net profit: `formatCurrency(Math.abs(netProfit), eventCurrency)` with +/- prefix
  - Expense amounts: `formatCurrency(expense.amount, eventCurrency)`
  - Sale amounts: `formatCurrency(sale.total, eventCurrency)`
  - Day totals: `formatCurrency(group.totalAmount, eventCurrency)`
- Pass `currencyCode={eventCurrency}` to SummaryCards
- Include `currency: event.currency` in handleSaveNotes payload

### 10. `src/components/SummaryCard.js`
- Add optional `currencyCode` prop
- When `currencyCode` provided + `format="currency"`: use `formatCurrency(amount, currencyCode)`
- Otherwise: keep existing `$${amount.toFixed(2)}` (Dashboard/Finance unaffected)

### 11. `src/components/event/EventTimelineCard.js`
- Import `formatCurrency`
- Replace `$${totalExpenses.toFixed(2)}` with `formatCurrency(totalExpenses, event.currency || "MYR")`

### 12. `src/components/event/EventDetailModal.js`
- Import `formatCurrency`
- Replace `$${totalExpenses.toFixed(2)}` (line 95) with `formatCurrency(totalExpenses, event.currency || "MYR")`
- Replace `$${expense.amount.toFixed(2)}` (line 116) with `formatCurrency(expense.amount, event.currency || "MYR")`

---

## NOT Changed (intentionally)
- **DashboardScreen** — keeps `$`, aggregates across events
- **FinanceScreen / FinanceSummary / TransactionCard** — keeps `$`, aggregate view
- **POS / Inventory screens** — not event-scoped, keep `$`

---

## Implementation Order

1. Create `src/constants/currencies.js`
2. Create `src/utils/formatCurrency.js`
3. Backend: Event.java + EventRequest.java + EventSummaryDto.java
4. Backend: EventService.java + DashboardService.java
5. Frontend: EventModal.js (currency picker UI)
6. Frontend: EventDetailScreen.js (currency-aware formatting)
7. Frontend: SummaryCard.js (optional currencyCode prop)
8. Frontend: EventTimelineCard.js + EventDetailModal.js

---

## Edge Cases
- **Existing events without currency**: frontend falls back to `"MYR"`. Optionally run SQL: `UPDATE events SET currency = 'MYR' WHERE currency IS NULL;`
- **Nested modal**: The "More currencies" picker is a Modal inside EventModal. React Native supports this, but test on both platforms.
- **IDR large amounts**: Indonesian Rupiah has no decimals typically — for now keep `.toFixed(2)` consistent, refine later if needed.

---

## Verification

1. Create event with MYR → detail screen shows `RM` prefix
2. Edit event, change to SGD → amounts update to `S$`
3. Use "More" to pick JPY → correctly shows `¥`
4. Dashboard still shows `$` (unaffected)
5. Existing events without currency default to `RM`
