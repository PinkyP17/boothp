# Artist Booth Manager — Backend Overview

## Tech Stack

- **Framework:** Spring Boot (Java 17+)
- **Database:** PostgreSQL 17
- **Auth:** JWT (jjwt library) + BCrypt passwords
- **ORM:** Spring Data JPA / Hibernate

## Architecture

```
Controller → Service → Repository → PostgreSQL
     ↑
  JwtAuthFilter (extracts user from Bearer token)
```

Every data table has a `user_id` foreign key. Every service method takes `userId` to scope queries — user A never sees user B's data.

## Development Approach

**Feature-by-feature**: Build BE → Wire to FE → Verify end-to-end → Move to next feature.

| Phase         | Backend                    | Frontend Wiring            | Status   |
| ------------- | -------------------------- | -------------------------- | -------- |
| 1. Auth       | Signup + Login + JWT       | Login/Signup screens → API | COMPLETE |
| 2. Inventory  | CRUD endpoints             | Inventory screen → API     | COMPLETE |
| 3. Restock    | Restock + expense record   | Restock modal → API        | COMPLETE |
| 4. Events     | Events + nested expenses   | Events screen → API        | COMPLETE |
| 5. Sales      | POS sale + stock decrement | POS screen → API           | COMPLETE |
| 6. Dashboard  | Aggregated finance data    | Dashboard + Finance → API  | COMPLETE |
| 7. Validation | Global error handling      | FE error display           | COMPLETE |

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

## Test Account

```
Email:    test2@test.com
Password: 123
Name:     Test User 2
```

```
Email:    cuba@gmail.com
Password: 123456
Name:     Test User 2
```

(Note: `test@test.com` also exists but password may differ — use test2 for testing)

## Running Locally

```bash
# Prerequisites: Java 17+, PostgreSQL 17 running
# DB password: 123
psql -U postgres -c "CREATE DATABASE artistbooth;"
cd backend
./mvnw spring-boot:run
# Server starts on http://localhost:8080
```

## Frontend API Config

- Physical device: uses computer's local IP (currently `192.168.1.9:8080`)
- Android emulator: `10.0.2.2:8080`
- iOS/web: `localhost:8080`
- Config file: `src/config/api.js`

## Key Design Decisions

- **Restock is its own table** (not an event_expense) — restocks aren't tied to events
- **sale_items.name snapshots** the item name at sale time — renames don't corrupt history
- **No event-sale link yet** — can add optional event_id FK on sales later for per-event profit
- **ddl-auto=update** for local dev — switch to Flyway before deployment
- **CORS** currently allows all origins for dev — tighten before production
