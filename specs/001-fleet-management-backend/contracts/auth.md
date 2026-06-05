# Contract: Authentication

**Base URL**: `/auth`
**Guard**: All endpoints in this module are `@Public()` (bypass JwtAuthGuard)

---

## POST /auth/login

Authenticates a user and returns a signed JWT.

### Request

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "aivacol@aivacol.com",
  "password": "secret123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | yes | valid email format |
| password | string | yes | non-empty |

### Response 200 OK

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### Response 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password should not be empty"],
  "error": "Bad Request"
}
```
