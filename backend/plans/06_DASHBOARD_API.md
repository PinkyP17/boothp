# Phase 6: Dashboard / Finance

The dashboard endpoint aggregates all financial data into a single response. This is the endpoint the Dashboard screen and Finance screen will call.

---

## How Data Flows

```
POS Sales (sale.total)                    → Income
Event Expenses (event_expense.amount)     → Expenses
Restock Records (restock_record.cost)     → Expenses
                                            ↓
                          Income - Expenses = Net Profit
```

All three sources are merged into a unified transaction list for the Finance screen.

---

## DTOs

### DashboardResponse
```java
{
    BigDecimal income,           // sum of all sale totals
    BigDecimal eventExpenses,    // sum of all event expense amounts
    BigDecimal restockExpenses,  // sum of all restock costs
    BigDecimal totalExpenses,    // eventExpenses + restockExpenses
    BigDecimal netProfit,        // income - totalExpenses
    List<TransactionDto> transactions,
    List<EventSummaryDto> upcomingEvents
}
```

### TransactionDto
```java
{
    Long id,
    String type,          // "income", "event_expense", "restock"
    String description,   // sale: "2x Gojo Print, 1x Sticker Pack"
                          // event expense: "Booth Fee - Anime Expo"
                          // restock: "Restock Gojo Print A4 (x20)"
    BigDecimal amount,
    LocalDateTime date,
    String eventName      // nullable — only for event expenses
}
```

### EventSummaryDto
```java
{
    Long id,
    String name,
    LocalDate date,
    LocalDate endDate,
    String location,
    String status,
    BigDecimal totalExpenses  // sum of this event's expenses
}
```

---

## Service — DashboardService

### `getDashboard(Long userId)`

```
1. Fetch all sales for user
   → income = SUM(sale.total)
   → Build income transactions:
     description = comma-joined "Qx ItemName" from sale items
     amount = sale.total
     date = sale.timestamp

2. Fetch all events for user (with expenses)
   → eventExpenses = SUM(all event_expense.amount)
   → Build expense transactions (one per event expense):
     description = "category - eventName"
     amount = expense.amount
     date = expense.createdAt

3. Fetch all restock records for user
   → restockExpenses = SUM(restock.cost)
   → Build restock transactions:
     description = "Restock itemName (xQuantity)"
     amount = restock.cost
     date = restock.createdAt

4. Merge all transactions, sort by date descending

5. Filter upcoming events (status != 'past')
   → include total expenses per event

6. Return DashboardResponse
```

## Controller — `/api/v1/dashboard`

| Method | Path | Response |
|--------|------|---------|
| GET | `/` | `DashboardResponse` |

---

## Example Response

```json
{
  "income": 2450.00,
  "eventExpenses": 870.50,
  "restockExpenses": 125.00,
  "totalExpenses": 995.50,
  "netProfit": 1454.50,
  "transactions": [
    {
      "id": 5,
      "type": "income",
      "description": "2x Gojo Print A4, 1x Naruto Sticker Pack",
      "amount": 35.00,
      "date": "2026-04-18T14:30:00",
      "eventName": null
    },
    {
      "id": 3,
      "type": "event_expense",
      "description": "Booth Fee - Anime Expo 2026",
      "amount": 500.00,
      "date": "2026-04-17T10:00:00",
      "eventName": "Anime Expo 2026"
    },
    {
      "id": 1,
      "type": "restock",
      "description": "Restock Gojo Print A4 (x20)",
      "amount": 50.00,
      "date": "2026-04-16T09:15:00",
      "eventName": null
    }
  ],
  "upcomingEvents": [
    {
      "id": 1,
      "name": "Anime Expo 2026",
      "date": "2026-07-02",
      "endDate": "2026-07-05",
      "location": "Los Angeles Convention Center",
      "status": "upcoming",
      "totalExpenses": 1070.00
    }
  ]
}
```

---

## Verification
```bash
TOKEN="<jwt-from-login>"

# Prerequisites: have some sales, events with expenses, and restock records
# created from previous phases

# Get dashboard
curl http://localhost:8080/api/v1/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Verify:
# 1. income = sum of all your sale totals
# 2. eventExpenses = sum of all event expense amounts
# 3. restockExpenses = sum of all restock costs
# 4. totalExpenses = eventExpenses + restockExpenses
# 5. netProfit = income - totalExpenses
# 6. transactions are sorted by date (newest first)
# 7. upcomingEvents excludes past events
# 8. Each upcoming event has correct totalExpenses
```
