# Phase 2: Inventory CRUD

## Workflow
1. Build the backend (entity, repo, service, controller)
2. Wire the frontend Inventory screen to call these endpoints instead of mock data
3. Test end-to-end on device
4. Move to Phase 3

## Database Table — `inventory_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | NOT NULL, FK -> users(id) |
| name | VARCHAR(255) | NOT NULL |
| category | VARCHAR(50) | NOT NULL |
| production_cost | DECIMAL(10,2) | NOT NULL, DEFAULT 0 |
| selling_price | DECIMAL(10,2) | NOT NULL, DEFAULT 0 |
| stock | INTEGER | NOT NULL, DEFAULT 0 |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

Valid categories: `Prints`, `Stickers`, `Keychains`, `Badges`, `Other`

---

## Entity — InventoryItem

```java
@Entity @Table(name = "inventory_items")
public class InventoryItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private BigDecimal productionCost;

    @Column(nullable = false)
    private BigDecimal sellingPrice;

    @Column(nullable = false)
    private Integer stock;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

## Repository

```java
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<InventoryItem> findByIdAndUserId(Long id, Long userId);
}
```

## DTO — InventoryItemRequest

```java
{
    @NotBlank String name,
    @NotBlank String category,
    @NotNull BigDecimal productionCost,
    @NotNull BigDecimal sellingPrice,
    @NotNull @Min(0) Integer stock
}
```

## Service — InventoryService

- `getAll(Long userId)` — returns all items for user, ordered by created_at desc
- `create(Long userId, InventoryItemRequest req)` — creates new item, sets createdAt + updatedAt to now
- `update(Long userId, Long itemId, InventoryItemRequest req)` — finds by id + userId, throws 404 if not found, updates fields + updatedAt

## Controller — `/api/v1/inventory`

| Method | Path | Body | Response |
|--------|------|------|---------|
| GET | `/` | — | `[{id, name, category, productionCost, sellingPrice, stock, createdAt, updatedAt}]` |
| POST | `/` | `InventoryItemRequest` | created item (201) |
| PUT | `/{id}` | `InventoryItemRequest` | updated item (200) |

All endpoints require auth. User is extracted from `@AuthenticationPrincipal`.

---

## Verification
```bash
TOKEN="<jwt-from-login>"

# Create item
curl -X POST http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Gojo Print A4","category":"Prints","productionCost":2.50,"sellingPrice":15.00,"stock":45}'

# List items
curl http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN"

# Update item
curl -X PUT http://localhost:8080/api/v1/inventory/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Gojo Print A4 (Updated)","category":"Prints","productionCost":3.00,"sellingPrice":18.00,"stock":40}'
```
