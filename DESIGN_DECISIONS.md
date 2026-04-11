# Artist Booth Manager — App-Wide Design Decisions

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
