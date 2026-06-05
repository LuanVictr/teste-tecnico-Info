# Contract: Users (Bonus)

**Base URL**: `/users`
**Guard**: `JwtAuthGuard` (all endpoints require `Authorization: Bearer <token>`)
**Note**: `password` is NEVER returned in any response.

---

## POST /users

```json
// Request
{ "nickname": "admin", "name": "Admin User", "email": "admin@fleet.com", "password": "secret123" }

// Response 201
{ "id": 2, "nickname": "admin", "name": "Admin User", "email": "admin@fleet.com", "created_at": "...", "updated_at": "..." }
```

### Errors
- `400` — validation (email format, password min length 6, name empty)
- `409` — email already exists

---

## GET /users?page=1&limit=20

```json
// Response 200
{
  "data": [{ "id": 1, "nickname": "aivacol", "name": "Aivacol Admin", "email": "aivacol@aivacol.com", "created_at": "...", "updated_at": "..." }],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

## GET /users/:id

```json
// Response 200
{ "id": 1, "nickname": "aivacol", "name": "Aivacol Admin", "email": "aivacol@aivacol.com", "created_at": "...", "updated_at": "..." }
```

### Errors
- `404` — user not found

---

## PATCH /users/:id

```json
// Request (all fields optional)
{ "nickname": "newname", "name": "New Name" }

// Response 200 — updated user object (no password)
```

---

## DELETE /users/:id

```json
// Response 200
{ "message": "User deleted successfully" }
```

### Errors
- `404` — user not found
