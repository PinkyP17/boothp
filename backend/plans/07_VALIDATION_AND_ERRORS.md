# Phase 7: Validation + Error Handling

---

## DTO Validation Annotations

Add `@Valid` to all controller method parameters that accept request bodies.

### Validation Rules by DTO

| DTO | Field | Annotation |
|-----|-------|------------|
| SignupRequest | email | `@NotBlank @Email` |
| SignupRequest | password | `@NotBlank @Size(min = 6)` |
| LoginRequest | email | `@NotBlank @Email` |
| LoginRequest | password | `@NotBlank` |
| InventoryItemRequest | name | `@NotBlank` |
| InventoryItemRequest | category | `@NotBlank` |
| InventoryItemRequest | productionCost | `@NotNull @DecimalMin("0")` |
| InventoryItemRequest | sellingPrice | `@NotNull @DecimalMin("0")` |
| InventoryItemRequest | stock | `@NotNull @Min(0)` |
| RestockRequest | quantity | `@NotNull @Min(1)` |
| RestockRequest | cost | `@NotNull @DecimalMin("0")` |
| EventRequest | name | `@NotBlank` |
| EventRequest | date | `@NotNull` |
| EventRequest | endDate | `@NotNull` |
| EventRequest | status | `@NotBlank` |
| EventExpenseRequest | category | `@NotBlank` |
| EventExpenseRequest | amount | `@NotNull @DecimalMin("0")` |
| SaleRequest | items | `@NotEmpty @Valid` |
| SaleRequest | total | `@NotNull` |
| SaleRequest | paymentMethod | `@NotBlank` |
| SaleItemRequest | itemId | `@NotNull` |
| SaleItemRequest | name | `@NotBlank` |
| SaleItemRequest | quantity | `@NotNull @Min(1)` |
| SaleItemRequest | unitPrice | `@NotNull` |
| SaleItemRequest | originalPrice | `@NotNull` |

---

## Global Exception Handler

Create `@RestControllerAdvice` class: `GlobalExceptionHandler`

### Exceptions to Handle

| Exception | HTTP Status | When |
|-----------|-------------|------|
| `MethodArgumentNotValidException` | 400 | Validation fails on `@Valid` DTOs |
| `ResourceNotFoundException` (custom) | 404 | Item/event/expense not found or doesn't belong to user |
| `DuplicateEmailException` (custom) | 409 | Signup with existing email |
| `BadCredentialsException` | 401 | Wrong password on login |
| `AccessDeniedException` | 403 | Missing/invalid JWT |
| `Exception` (fallback) | 500 | Unexpected errors |

### Error Response Format
```json
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "name": "must not be blank",
    "stock": "must be greater than or equal to 0"
  },
  "timestamp": "2026-04-18T10:30:00"
}
```

For non-validation errors (single message):
```json
{
  "status": 404,
  "message": "Inventory item not found",
  "timestamp": "2026-04-18T10:30:00"
}
```

### Custom Exceptions

```java
// ResourceNotFoundException (extends RuntimeException)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

// DuplicateEmailException (extends RuntimeException)
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String message) {
        super(message);
    }
}
```

---

## JSON Response Cleanup

- Add `@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})` on entities if lazy loading causes serialization issues
- Use `@JsonIgnore` on `User.password` so it's never returned in responses
- Use `@JsonProperty` where field names need to differ between Java and JSON (e.g., camelCase consistency)
- Consider returning DTOs from controllers instead of raw entities for cleaner responses

---

## CORS Verification

Make sure `CorsConfig` allows:
- Origins: `http://localhost:8081`, `http://localhost:19006`, `http://localhost:19000`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Authorization, Content-Type
- Allow credentials: true

Test from Expo dev server — make a fetch call and confirm no CORS errors in the console.

---

## Verification
```bash
TOKEN="<jwt-from-login>"

# Test validation — missing required field
curl -X POST http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"Prints"}'
# → 400 with errors: { "name": "must not be blank", ... }

# Test 404 — non-existent item
curl -X PUT http://localhost:8080/api/v1/inventory/9999 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","category":"Prints","productionCost":1,"sellingPrice":5,"stock":10}'
# → 404 "Inventory item not found"

# Test duplicate email
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Duplicate"}'
# → 409 "Email already in use"

# Test expired/invalid token
curl http://localhost:8080/api/v1/inventory \
  -H "Authorization: Bearer invalid.token.here"
# → 403 Forbidden
```
