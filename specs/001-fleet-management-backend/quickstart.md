# Quickstart Validation Guide: Aivacol Fleet Management Backend

**Purpose**: Validate the feature works end-to-end after implementation.
**Time**: ~10 minutes from `git clone` to first vehicle registered.

---

## Prerequisites

- Docker + Docker Compose installed
- Port availability: `3000` (API), `1433` (SQL Server), `6379` (Redis)
- (Bonus) Ports `5672`/`15672` (RabbitMQ), `27017` (MongoDB)

---

## 1. Setup

```bash
git clone <repo-url>
cd <repo>
cp .env.example .env
# Edit .env to set JWT_SECRET and SEED_USER_PASSWORD (or use defaults)
docker-compose up --build -d
```

Expected: All containers start and reach healthy state within ~60 seconds.

```bash
docker-compose ps
# All services should show "healthy" or "running"
```

---

## 2. Verify API is Running

```bash
curl http://localhost:3000/api/docs
# Should return HTML (Swagger UI)
```

---

## 3. Authenticate (US1)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aivacol@aivacol.com","password":"<SEED_USER_PASSWORD>"}'

# Expected: { "access_token": "eyJ..." }
```

Save the token:
```bash
TOKEN="eyJ..."
```

Verify invalid credentials return 401:
```bash
curl -X POST http://localhost:3000/auth/login \
  -d '{"email":"wrong@wrong.com","password":"wrong"}' \
  -H "Content-Type: application/json"
# Expected: 401
```

---

## 4. Create and Manage Models (US2)

```bash
# Create model
curl -X POST http://localhost:3000/models \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fiat Uno"}'
# Expected: 201 { id: 1, name: "Fiat Uno", ... }

# List models
curl http://localhost:3000/models \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 { data: [...], meta: { total: 1, ... } }

# Get model by id
curl http://localhost:3000/models/1 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 { id: 1, name: "Fiat Uno", ... }

# Update model
curl -X PATCH http://localhost:3000/models/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fiat Uno Mille"}'
# Expected: 200 with updated name

# Attempt delete without removing vehicles first (after step 5)
# Expected: 409 with message about associated vehicles
```

---

## 5. Register Vehicles + Redis Cache (US3)

```bash
# Register vehicle
curl -X POST http://localhost:3000/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"license_plate":"ABC1D23","chassis":"9BWZZZ377VT004251","renavam":"12345678901","year":2022,"model_id":1}'
# Expected: 201

# First GET — cache MISS (DB query)
curl "http://localhost:3000/vehicles?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with data

# Second GET — cache HIT (no DB query, same response)
curl "http://localhost:3000/vehicles?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Update vehicle (invalidates cache)
curl -X PATCH http://localhost:3000/vehicles/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":2023}'
# Expected: 200

# GET after update — cache MISS again, returns updated year
curl "http://localhost:3000/vehicles?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
# Expected: vehicle shows year: 2023

# Filter by modelId
curl "http://localhost:3000/vehicles?modelId=1" \
  -H "Authorization: Bearer $TOKEN"
# Expected: only vehicles of model 1

# Duplicate license plate — expect 409
curl -X POST http://localhost:3000/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"license_plate":"ABC1D23","chassis":"DIFFERENT12345678","renavam":"98765432109","year":2021,"model_id":1}'
# Expected: 409 Conflict
```

---

## 6. Brands (US4 — Bonus)

```bash
# Create brand
curl -X POST http://localhost:3000/brands \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fiat"}'
# Expected: 201

# Associate model to brand
curl -X PATCH http://localhost:3000/models/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"brand_id":1}'
# Expected: 200

# Get brand with models
curl http://localhost:3000/brands/1 \
  -H "Authorization: Bearer $TOKEN"
# Expected: brand with models array

# Try to delete brand with associated models
curl -X DELETE http://localhost:3000/brands/1 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 409 "Cannot delete brand: 1 model(s) are still associated with this brand."
```

---

## 7. Run Tests

```bash
docker-compose exec app npm run test
# All tests pass

docker-compose exec app npm run test:cov
# Coverage report generated
```

---

## 8. Swagger UI

Open `http://localhost:3000/api/docs` in a browser.

Verify:
- All endpoints are listed with request/response schemas
- "Authorize" button available — enter `Bearer <token>`
- Endpoints respond correctly from Swagger UI

---

## 9. Insomnia Collection

1. Open Insomnia
2. Import `insomnia-collection.json` from repo root
3. Set environment variable `access_token` after login
4. Execute all requests — verify expected responses

---

## 10. Seed Data (Optional)

```bash
# Load seed_vehicles.json via the API
cat seed_vehicles.json | jq -c '.[]' | while read vehicle; do
  curl -X POST http://localhost:3000/vehicles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$vehicle"
done
```

---

## Validation Checklist

- [ ] `docker-compose up` completes without errors
- [ ] Swagger UI accessible at `/api/docs`
- [ ] Seed user `aivacol` authenticates and returns JWT
- [ ] Protected routes return 401 without token
- [ ] Models CRUD works (create, list, get, update, delete)
- [ ] Vehicles CRUD works with all unique field constraints
- [ ] Redis cache hit on second `GET /vehicles` call
- [ ] Cache invalidated after mutation
- [ ] Filters `?modelId` and `?year` work correctly
- [ ] Pagination `meta` is correct (total, page, limit, totalPages)
- [ ] 409 errors have descriptive messages (brand/model deletion)
- [ ] All Jest tests pass
- [ ] (Bonus) Brands CRUD + association works
- [ ] (Bonus) RabbitMQ events visible in management UI (port 15672)
- [ ] (Bonus) MongoDB audit logs created per mutation
