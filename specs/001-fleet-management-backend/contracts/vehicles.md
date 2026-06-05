# Contract: Vehicles

**Base URL**: `/vehicles`
**Guard**: `JwtAuthGuard` (all endpoints require `Authorization: Bearer <token>`)
**Cache**: `GET /vehicles` and `GET /vehicles/:id` are Redis-cached. Cache key includes all query params. Mutations invalidate cache.

---

## POST /vehicles

Registers a new vehicle.

### Request

```http
POST /vehicles
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "license_plate": "ABC1D23",
  "chassis": "9BWZZZ377VT004251",
  "renavam": "12345678901",
  "year": 2022,
  "model_id": 1
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| license_plate | string | yes | non-empty, max 10 chars, unique |
| chassis | string | yes | exactly 17 chars, unique |
| renavam | string | yes | exactly 11 chars, unique |
| year | number | yes | integer, 1900 ≤ year ≤ currentYear+1 |
| model_id | number | yes | positive integer, must exist |

### Response 201 Created

```json
{
  "id": 1,
  "license_plate": "ABC1D23",
  "chassis": "9BWZZZ377VT004251",
  "renavam": "12345678901",
  "year": 2022,
  "model_id": 1,
  "model": {
    "id": 1,
    "name": "Fiat Uno",
    "brand_id": 1
  },
  "created_at": "2026-06-05T12:00:00.000Z",
  "updated_at": "2026-06-05T12:00:00.000Z",
  "created_by": 1
}
```

### Response 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["chassis must be exactly 17 characters", "year must not be less than 1900"],
  "error": "Bad Request"
}
```

### Response 404 Not Found (model_id does not exist)
```json
{
  "statusCode": 404,
  "message": "Model with id 99 not found",
  "error": "Not Found"
}
```

### Response 409 Conflict (duplicate unique field)
```json
{
  "statusCode": 409,
  "message": "Vehicle with license_plate 'ABC1D23' already exists",
  "error": "Conflict"
}
```

---

## GET /vehicles

Returns a paginated, optionally filtered list of vehicles. Results are Redis-cached.

### Request

```http
GET /vehicles?page=1&limit=20&modelId=1&year=2022
Authorization: Bearer <token>
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | no | 1 | Page number (min 1) |
| limit | number | no | 20 | Items per page (min 1, max 100) |
| modelId | number | no | — | Filter by model ID |
| year | number | no | — | Filter by year |

### Response 200 OK

```json
{
  "data": [
    {
      "id": 1,
      "license_plate": "ABC1D23",
      "chassis": "9BWZZZ377VT004251",
      "renavam": "12345678901",
      "year": 2022,
      "model_id": 1,
      "model": { "id": 1, "name": "Fiat Uno", "brand_id": 1 },
      "created_at": "2026-06-05T12:00:00.000Z",
      "updated_at": "2026-06-05T12:00:00.000Z",
      "created_by": 1
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## GET /vehicles/:id

Returns a single vehicle by ID. Result is Redis-cached at key `vehicles:detail:{id}`.

### Response 200 OK — same shape as single object in POST response

### Response 404 Not Found
```json
{ "statusCode": 404, "message": "Vehicle with id 99 not found", "error": "Not Found" }
```

---

## PATCH /vehicles/:id

Partially updates a vehicle. Invalidates all `vehicles:list:*` cache keys and `vehicles:detail:{id}`.

### Request Body (all fields optional)
```json
{
  "license_plate": "XYZ9W87",
  "year": 2023,
  "model_id": 2
}
```

### Response 200 OK — updated vehicle object

### Response 404 Not Found

### Response 409 Conflict (duplicate unique field on update)

---

## DELETE /vehicles/:id

Deletes a vehicle. Invalidates all `vehicles:list:*` and `vehicles:detail:{id}` cache.

### Response 200 OK
```json
{ "message": "Vehicle deleted successfully" }
```

### Response 404 Not Found
