# Contract: Brands (Bonus)

**Base URL**: `/brands`
**Guard**: `JwtAuthGuard` (all endpoints require `Authorization: Bearer <token>`)

---

## POST /brands

```json
// Request
{ "name": "Fiat" }

// Response 201
{ "id": 1, "name": "Fiat", "created_at": "...", "updated_at": "...", "created_by": 1 }
```

### Errors
- `400` — name empty
- `409` — brand name already exists

---

## GET /brands?page=1&limit=20

```json
// Response 200
{
  "data": [{ "id": 1, "name": "Fiat", "created_at": "...", "updated_at": "...", "created_by": 1 }],
  "meta": { "total": 10, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

## GET /brands/:id

```json
// Response 200
{
  "id": 1,
  "name": "Fiat",
  "models": [{ "id": 1, "name": "Fiat Uno" }, { "id": 2, "name": "Fiat Palio" }],
  "created_at": "...",
  "updated_at": "...",
  "created_by": 1
}
```

### Errors
- `404` — brand not found

---

## PATCH /brands/:id

```json
// Request
{ "name": "Fiat (updated)" }

// Response 200 — updated brand object
```

### Errors
- `404` — brand not found
- `409` — name conflict

---

## DELETE /brands/:id

```json
// Response 200
{ "message": "Brand deleted successfully" }
```

### Errors
- `404` — brand not found
- `409 Conflict`
```json
{
  "statusCode": 409,
  "message": "Cannot delete brand: 3 model(s) are still associated with this brand.",
  "error": "Conflict"
}
```
