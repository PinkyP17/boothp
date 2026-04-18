# Artist Booth Manager — Backend Overview

## Tech Stack
- **Framework:** Spring Boot (Java 17+)
- **Database:** PostgreSQL
- **Auth:** JWT (jjwt library) + BCrypt passwords
- **ORM:** Spring Data JPA / Hibernate

## Architecture
```
Controller → Service → Repository → PostgreSQL
     ↑
  JwtAuthFilter (extracts user from Bearer token)
```

Every data table has a `user_id` foreign key. Every service method takes `userId` to scope queries — user A never sees user B's data.

## Database Schema (7 tables)
```
users
inventory_items  (FK → users)
restock_records  (FK → users, inventory_items)
events           (FK → users)
event_expenses   (FK → events, CASCADE delete)
sales            (FK → users)
sale_items       (FK → sales CASCADE, inventory_items)
```

## API Endpoints (12 total)
```
POST   /api/v1/auth/signup              ← public
POST   /api/v1/auth/login               ← public

GET    /api/v1/inventory                 ← all below require JWT
POST   /api/v1/inventory
PUT    /api/v1/inventory/{id}
POST   /api/v1/inventory/{id}/restock

GET    /api/v1/events
POST   /api/v1/events
PUT    /api/v1/events/{id}

POST   /api/v1/events/{eventId}/expenses
DELETE /api/v1/events/{eventId}/expenses/{expenseId}

GET    /api/v1/sales
POST   /api/v1/sales

GET    /api/v1/dashboard
```

## Financial Data Flow
```
POS Sales         → Income
Event Expenses    → Expenses
Restock Records   → Expenses
                    ↓
          Dashboard aggregates all three
```

## Transactional Operations
1. **Sale creation** — persists sale + decrements inventory stock (atomic)
2. **Restock** — increments stock + creates expense record (atomic)

## Implementation Phases
1. `01_PROJECT_SETUP.md`   — Spring Boot skeleton + JWT auth
2. `02_INVENTORY_API.md`   — Inventory CRUD
3. `03_RESTOCK_API.md`     — Restock with expense tracking
4. `04_EVENTS_API.md`      — Events + nested expenses
5. `05_SALES_API.md`       — POS sales + stock decrement
6. `06_DASHBOARD_API.md`   — Aggregated dashboard/finance data
7. `07_VALIDATION_AND_ERRORS.md` — Input validation + error handling

## Running Locally
```bash
# Prerequisites: Java 17+, PostgreSQL running
createdb artistbooth
cd backend
./mvnw spring-boot:run
# Server starts on http://localhost:8080
```

## Key Design Decisions
- **Restock is its own table** (not an event_expense) — restocks aren't tied to events
- **sale_items.name snapshots** the item name at sale time — renames don't corrupt history
- **No event-sale link yet** — can add optional event_id FK on sales later for per-event profit
- **ddl-auto=update** for local dev — switch to Flyway before deployment
