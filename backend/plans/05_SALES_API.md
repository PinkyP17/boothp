# Phase 5: POS / Sales

Sale creation is **transactional** — it persists the sale record AND decrements inventory stock for each sold item in one operation.

---

## Database Tables

### `sales`

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | NOT NULL, FK -> users(id) |
| subtotal | DECIMAL(10,2) | NOT NULL |
| discount_type | VARCHAR(20) | nullable (percent or fixed) |
| discount_value | DECIMAL(10,2) | DEFAULT 0 |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 (the calculated $ amount) |
| total | DECIMAL(10,2) | NOT NULL |
| payment_method | VARCHAR(10) | NOT NULL (cash or qr) |
| timestamp | TIMESTAMP | NOT NULL |

### `sale_items`

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| sale_id | BIGINT | NOT NULL, FK -> sales(id) ON DELETE CASCADE |
| item_id | BIGINT | NOT NULL, FK -> inventory_items(id) |
| name | VARCHAR(255) | NOT NULL (snapshot of item name at sale time) |
| quantity | INTEGER | NOT NULL |
| unit_price | DECIMAL(10,2) | NOT NULL (price actually charged) |
| original_price | DECIMAL(10,2) | NOT NULL (item's sellingPrice at sale time) |

**Why snapshot `name`?** If the inventory item is renamed later, historical sale records stay accurate.

---

## Entities

### Sale
```java
@Entity @Table(name = "sales")
public class Sale {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private BigDecimal subtotal;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal discountAmount;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();
}
```

### SaleItem
```java
@Entity @Table(name = "sale_items")
public class SaleItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal originalPrice;
}
```

## Repositories

```java
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByUserIdOrderByTimestampDesc(Long userId);
}

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    // Not strictly needed — sale items are managed through Sale's cascade
    // But useful if you ever need to query sale items directly
}
```

## DTOs

```java
// SaleRequest
{
    @NotEmpty List<SaleItemRequest> items,
    DiscountDto discount,  // nullable
    @NotNull BigDecimal total,
    @NotBlank String paymentMethod
}

// SaleItemRequest
{
    @NotNull Long itemId,
    @NotBlank String name,
    @NotNull @Min(1) Integer quantity,
    @NotNull BigDecimal unitPrice,
    @NotNull BigDecimal originalPrice
}

// DiscountDto (nested in SaleRequest)
{
    String type,      // "percent" or "fixed"
    BigDecimal value,
    BigDecimal amount  // calculated discount in $
}
```

## Service — SaleService

### `create(Long userId, SaleRequest req)`
```
@Transactional:
1. Validate every itemId exists and belongs to the user
2. Create Sale entity with discount + total + paymentMethod + timestamp=now
3. For each SaleItemRequest:
   a. Create SaleItem (name, quantity, unitPrice, originalPrice)
   b. Find the InventoryItem
   c. Decrement stock: item.stock = Math.max(0, item.stock - soldQty)
   d. Save inventory item
4. Save sale (cascades to save all sale items)
5. Return saved sale
```

### `getAll(Long userId)`
- Returns all sales with items, ordered by timestamp desc

## Controller — `/api/v1/sales`

| Method | Path | Body | Response |
|--------|------|------|---------|
| GET | `/` | — | `[{id, items: [...], discountType, discountValue, discountAmount, total, paymentMethod, timestamp}]` |
| POST | `/` | `SaleRequest` | created sale (201) |

---

## Verification
```bash
TOKEN="<jwt-from-login>"

# First, check current stock of item 1
curl http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN"
# Note the stock value

# Create a sale (selling 2 of item 1)
curl -X POST http://localhost:8080/api/v1/sales \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"itemId":1,"name":"Gojo Print A4","quantity":2,"unitPrice":15.00,"originalPrice":15.00}
    ],
    "discount": {"type":"percent","value":10,"amount":3.00},
    "total": 27.00,
    "paymentMethod": "cash"
  }'

# Verify stock decremented
curl http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN"
# → item 1 stock should be original - 2

# List sales
curl http://localhost:8080/api/v1/sales \
  -H "Authorization: Bearer $TOKEN"
# → should show the sale with nested items
```
