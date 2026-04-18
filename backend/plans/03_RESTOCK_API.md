# Phase 3: Restock

Restocking an item does two things in one transaction:
1. Increments the item's stock count
2. Creates a `restock_records` row (so the cost appears as an expense in Finance)

---

## Database Table — `restock_records`

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | NOT NULL, FK -> users(id) |
| item_id | BIGINT | NOT NULL, FK -> inventory_items(id) |
| quantity | INTEGER | NOT NULL |
| cost | DECIMAL(10,2) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

---

## Entity — RestockRecord

```java
@Entity @Table(name = "restock_records")
public class RestockRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal cost;

    private LocalDateTime createdAt;
}
```

## Repository

```java
public interface RestockRecordRepository extends JpaRepository<RestockRecord, Long> {
    List<RestockRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
}
```

## DTO — RestockRequest

```java
{
    @NotNull @Min(1) Integer quantity,
    @NotNull @Min(0) BigDecimal cost
}
```

## Service Addition — `InventoryService.restock()`

```java
@Transactional
public InventoryItem restock(Long userId, Long itemId, RestockRequest req) {
    // 1. Find item by id + userId, throw 404 if not found
    // 2. Increment stock: item.stock += req.quantity
    // 3. Update updatedAt
    // 4. Save item
    // 5. Create RestockRecord { user, item, quantity, cost, createdAt=now }
    // 6. Save restock record
    // 7. Return updated item
}
```

## Controller Addition — `InventoryController`

| Method | Path | Body | Response |
|--------|------|------|---------|
| POST | `/{id}/restock` | `{quantity, cost}` | updated item (200) |

---

## Verification
```bash
TOKEN="<jwt-from-login>"

# Restock item (id=1, add 20 units at $50 cost)
curl -X POST http://localhost:8080/api/v1/inventory/1/restock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":20,"cost":50.00}'
# → item should now have stock increased by 20

# Verify stock updated
curl http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN"
# → item 1 stock should be original + 20

# Restock record will be verified in Phase 6 (Dashboard)
# when it shows up as an expense
```
