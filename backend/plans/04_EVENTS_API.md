# Phase 4: Events + Expenses

## Workflow
1. Build the backend (entities, repos, service, controllers for events + expenses)
2. Wire the frontend Events screen, EventModal, and EventExpenseModal to call API
3. Test end-to-end on device
4. Move to Phase 5

---

## Database Tables

### `events`

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | NOT NULL, FK -> users(id) |
| name | VARCHAR(255) | NOT NULL |
| date | DATE | NOT NULL |
| end_date | DATE | NOT NULL |
| location | VARCHAR(255) | |
| status | VARCHAR(20) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Valid statuses: `upcoming`, `active`, `past`

### `event_expenses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| event_id | BIGINT | NOT NULL, FK -> events(id) ON DELETE CASCADE |
| category | VARCHAR(50) | NOT NULL |
| amount | DECIMAL(10,2) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Valid expense categories: `Booth Fee`, `Transportation`, `Food`, `Hotel`, `Supplies`, `Other`

---

## Entities

### Event
```java
@Entity @Table(name = "events")
public class Event {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalDate endDate;

    private String location;

    @Column(nullable = false)
    private String status;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EventExpense> expenses = new ArrayList<>();

    private LocalDateTime createdAt;
}
```

### EventExpense
```java
@Entity @Table(name = "event_expenses")
public class EventExpense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private BigDecimal amount;

    private LocalDateTime createdAt;
}
```

## Repositories

```java
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByUserIdOrderByDateDesc(Long userId);
    Optional<Event> findByIdAndUserId(Long id, Long userId);
}

public interface EventExpenseRepository extends JpaRepository<EventExpense, Long> {
    Optional<EventExpense> findByIdAndEventId(Long id, Long eventId);
}
```

## DTOs

```java
// EventRequest
{
    @NotBlank String name,
    @NotNull LocalDate date,
    @NotNull LocalDate endDate,
    String location,
    @NotBlank String status
}

// EventExpenseRequest
{
    @NotBlank String category,
    @NotNull @Min(0) BigDecimal amount
}
```

## Service — EventService

- `getAll(Long userId)` — returns events with expenses eagerly loaded, ordered by date desc
- `create(Long userId, EventRequest req)` — creates event with empty expenses list
- `update(Long userId, Long eventId, EventRequest req)` — finds by id + userId, updates fields
- `addExpense(Long userId, Long eventId, EventExpenseRequest req)` — verifies event belongs to user, creates expense
- `deleteExpense(Long userId, Long eventId, Long expenseId)` — verifies event belongs to user, finds expense by id + eventId, deletes

## Controllers

### EventController — `/api/v1/events`

| Method | Path | Body | Response |
|--------|------|------|---------|
| GET | `/` | — | `[{id, name, date, endDate, location, status, expenses: [...]}]` |
| POST | `/` | `EventRequest` | created event (201) |
| PUT | `/{id}` | `EventRequest` | updated event (200) |

### EventExpenseController — `/api/v1/events/{eventId}/expenses`

| Method | Path | Body | Response |
|--------|------|------|---------|
| POST | `/` | `{category, amount}` | created expense (201) |
| DELETE | `/{expenseId}` | — | 204 No Content |

---

## Verification
```bash
TOKEN="<jwt-from-login>"

# Create event
curl -X POST http://localhost:8080/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Anime Expo 2026","date":"2026-07-02","endDate":"2026-07-05","location":"Los Angeles Convention Center","status":"upcoming"}'

# List events
curl http://localhost:8080/api/v1/events \
  -H "Authorization: Bearer $TOKEN"

# Add expense to event (id=1)
curl -X POST http://localhost:8080/api/v1/events/1/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"Booth Fee","amount":500.00}'

# List events again — expense should be nested
curl http://localhost:8080/api/v1/events \
  -H "Authorization: Bearer $TOKEN"

# Delete expense (eventId=1, expenseId=1)
curl -X DELETE http://localhost:8080/api/v1/events/1/expenses/1 \
  -H "Authorization: Bearer $TOKEN"
# → 204 No Content
```
