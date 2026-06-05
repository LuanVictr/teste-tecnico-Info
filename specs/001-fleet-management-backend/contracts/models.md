# Contract: Models

**Base URL**: `/models`
**Guard**: `JwtAuthGuard` (all endpoints require `Authorization: Bearer <token>`)

---

## POST /models

Creates a new vehicle model.

### Request

```http
POST /models
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "name": "Fiat Uno",
  "brand_id": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | yes | non-empty, max 100 chars |
| brand_id | number | no | positive integer, must exist |

### Response 201 Created

```json
{
  "id": 1,
  "name": "Fiat Uno",
  "brand_id": 1,
  "brand": { "id": 1, "name": "Fiat" },
  "created_at": "2026-06-05T12:00:00.000Z",
  "updated_at": "2026-06-05T12:00:00.000Z",
  "created_by": 1
}
```

### Response 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["name should not be empty"],
  "error": "Bad Request"
}
```

### Response 404 Not Found (brand_id does not exist)
```json
{
  "statusCode": 404,
  "message": "Brand with id 99 not found",
  "error": "Not Found"
}
```

---

## GET /models

Returns a paginated list of models.

### Request

```http
GET /models?page=1&limit=20
Authorization: Bearer <token>
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | no | 1 | Page number (min 1) |
| limit | number | no | 20 | Items per page (min 1, max 100) |

### Response 200 OK

```json
{
  "data": [
    {
      "id": 1,
      "name": "Fiat Uno",
      "brand_id": 1,
      "brand": { "id": 1, "name": "Fiat" },
      "created_at": "2026-06-05T12:00:00.000Z",
      "updated_at": "2026-06-05T12:00:00.000Z",
      "created_by": 1
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## GET /models/:id

Returns a single model by ID.

### Response 200 OK — same shape as single object in POST response

### Response 404 Not Found
```json
{ "statusCode": 404, "message": "Model with id 99 not found", "error": "Not Found" }
```

---

## PATCH /models/:id

Partially updates a model.

### Request Body (all fields optional)
```json
{
  "name": "Fiat Uno Mille",
  "brand_id": 1
}
```

### Response 200 OK — updated model object

### Response 404 Not Found — model not found

---

## DELETE /models/:id

Deletes a model. Fails if vehicles are associated.

### Response 200 OK
```json
{ "message": "Model deleted successfully" }
```

### Response 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Cannot delete model: 5 vehicle(s) are still associated with this model.",
  "error": "Conflict"
}
```

### Response 404 Not Found
