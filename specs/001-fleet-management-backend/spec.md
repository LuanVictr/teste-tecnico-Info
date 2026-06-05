# Feature Specification: Aivacol Fleet Management Backend

**Feature Branch**: `001-fleet-management-backend`

**Created**: 2026-06-05

**Status**: Clarified

**Input**: Backend for Aivacol Fleet Management (Gestão de Frota) technical test — full CRUD for vehicle models, vehicles with Redis cache, JWT auth, Swagger docs, Docker Compose deploy, and bonus features (brands, users, RabbitMQ messaging, MongoDB audit).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authenticate and Receive JWT Token (Priority: P1)

A fleet operator needs to authenticate with the system to access any resource. They provide credentials and receive a JWT token used in all subsequent requests. The system ships with a default seed user (`aivacol`) so evaluators can test immediately without manual setup.

**Why this priority**: Authentication is the gateway to every other feature. Without it, nothing else is accessible. Seed user ensures zero-friction evaluation.

**Independent Test**: Call `POST /auth/login` with seed credentials → receive `access_token` → use it in `Authorization: Bearer` header on any protected route → get 200 instead of 401.

**Acceptance Scenarios**:

1. **Given** the seed user `aivacol` exists in the database, **When** `POST /auth/login` is called with valid credentials, **Then** a `200 OK` response returns `{ access_token: "<jwt>" }` with a signed JWT.
2. **Given** any protected endpoint, **When** the request includes a valid `Authorization: Bearer <token>` header, **Then** the endpoint responds normally (not 401/403).
3. **Given** any protected endpoint, **When** the request has no token or an invalid/expired token, **Then** the response is `401 Unauthorized`.
4. **Given** a login attempt, **When** credentials are incorrect, **Then** the response is `401 Unauthorized` with a descriptive error message.

---

### User Story 2 — Manage Vehicle Models (Priority: P1)

An authenticated fleet administrator can create, list, update, and delete vehicle models (e.g., "Fiat Uno", "Toyota Corolla"). Models are the foundation for registering vehicles.

**Why this priority**: Vehicles cannot exist without a model. This is the first CRUD entity and must be complete before vehicle management.

**Independent Test**: Create a model via `POST /models` → list it via `GET /models` → update via `PATCH /models/:id` → delete via `DELETE /models/:id`. All operations return appropriate HTTP status codes and the data reflects changes.

**Acceptance Scenarios**:

1. **Given** a valid JWT, **When** `POST /models` is called with `{ name: "Fiat Uno" }`, **Then** a new model is created, returned with `id`, `name`, `created_at`, `updated_at`, and the response status is `201 Created`.
2. **Given** existing models, **When** `GET /models` is called with a valid JWT, **Then** all models are returned as an array with their full metadata.
3. **Given** an existing model, **When** `PATCH /models/:id` is called with updated `name`, **Then** the model is updated and `updated_at` reflects the change.
4. **Given** an existing model, **When** `DELETE /models/:id` is called, **Then** the model is removed and the response is `200 OK` or `204 No Content`.
5. **Given** a `POST /models` request, **When** `name` is missing or empty, **Then** the response is `400 Bad Request` with validation error details.
6. **Given** a `GET /models/:id` or `PATCH/DELETE /models/:id`, **When** the ID does not exist, **Then** the response is `404 Not Found`.

---

### User Story 3 — Manage Vehicles with Redis Cache (Priority: P1)

An authenticated fleet administrator can register, update, list, and remove vehicles. Each vehicle is linked to a model and carries unique identifiers (license plate, chassis, renavam). Vehicle list and detail queries are cached in Redis to reduce database load; cache is invalidated automatically on any mutation.

**Why this priority**: Core feature of the fleet management system. Redis cache requirement makes this the most technically complex mandatory story.

**Independent Test**: Register a vehicle → query it (cache miss, stored) → query again (cache hit, same data) → update it (cache invalidated) → query again (cache miss, updated data). Verify using application logs or response headers.

**Acceptance Scenarios**:

1. **Given** a valid JWT and an existing model, **When** `POST /vehicles` is called with valid `license_plate`, `chassis`, `renavam`, `year`, `model_id`, **Then** the vehicle is created with `201 Created` and all fields including metadata.
2. **Given** a `POST /vehicles`, **When** a `license_plate`, `chassis`, or `renavam` already exists, **Then** the response is `409 Conflict`.
3. **Given** existing vehicles, **When** `GET /vehicles` is called, **Then** the response comes from Redis cache on the second call with identical query params (cache hit).
3a. **Given** existing vehicles, **When** `GET /vehicles?modelId=<id>` is called, **Then** only vehicles of that model are returned (paginated).
3b. **Given** existing vehicles, **When** `GET /vehicles?year=2022` is called, **Then** only vehicles from that year are returned (paginated).
4. **Given** a cached vehicle list, **When** any vehicle is created, updated, or deleted, **Then** the cache is invalidated and the next `GET /vehicles` fetches fresh data from the database.
5. **Given** an existing vehicle, **When** `PATCH /vehicles/:id` is called with updated fields, **Then** the vehicle is updated, `updated_at` changes, and related cache entries are invalidated.
6. **Given** an existing vehicle, **When** `DELETE /vehicles/:id`, **Then** vehicle is removed and cache is cleared.
7. **Given** the `CACHE_TTL_SECONDS` environment variable, **When** set to a value (e.g., `60`), **Then** cache entries expire after that many seconds.
8. **Given** `GET /vehicles/:id` with a non-existent ID, **Then** the response is `404 Not Found`.
9. **Given** `POST /vehicles`, **When** any required field is missing, **Then** the response is `400 Bad Request`.

---

### User Story 4 — Manage Brands and Associate Models (Priority: P2 — Bonus)

An authenticated administrator can create and manage vehicle brands (e.g., "Fiat", "Toyota") and associate models to a brand. This enriches the data model and demonstrates domain completeness.

**Why this priority**: Bonus feature. Adds relational depth and demonstrates understanding of the full domain model.

**Independent Test**: Create a brand → create a model → associate model to brand → list models by brand → verify relationship in response.

**Acceptance Scenarios**:

1. **Given** a valid JWT, **When** `POST /brands` is called with `{ name: "Fiat" }`, **Then** brand is created with `201 Created`.
2. **Given** an existing brand and model, **When** `PATCH /models/:id` is called with `brand_id`, **Then** the model is associated with the brand.
3. **Given** `GET /brands/:id`, **When** the brand has associated models, **Then** the response includes the models list.
4. **Given** `DELETE /brands/:id` with associated models, **When** the brand has one or more models linked to it, **Then** the response is `409 Conflict` with a message explicitly stating that the brand cannot be deleted because it has associated models (e.g., `"Cannot delete brand: 3 model(s) are still associated with this brand."`). Client must reassociate or delete models before retrying.
5. CRUD operations for brands follow the same validation patterns as models.

---

### User Story 5 — User Management (Priority: P2 — Bonus)

An authenticated administrator can create and manage system users. Users are linked to all entities via `created_by` for auditability.

**Why this priority**: Bonus feature. Enables full traceability of who created each record, satisfying the `created_by` metadata requirement across all entities.

**Independent Test**: Create a user → log in as that user → create a vehicle → verify `created_by` on the vehicle matches the new user's ID.

**Acceptance Scenarios**:

1. **Given** a `POST /users` with `nickname`, `name`, `email`, `password`, **Then** user is created with hashed password, `201 Created`.
2. **Given** an existing user email, **When** `POST /users` is called with the same email, **Then** `409 Conflict`.
3. **Given** an authenticated user creates a vehicle, **When** `GET /vehicles/:id`, **Then** `created_by` matches the authenticated user's ID.
4. **Given** `GET /users`, **When** called with valid JWT, **Then** returns user list without `password_hash`.

---

### User Story 6 — RabbitMQ Event Publishing & MongoDB Audit Log (Priority: P3 — Bonus)

Every mutation (create, update, delete) on any entity (vehicles, models, brands) publishes an event to RabbitMQ. A consumer processes these events and stores them in MongoDB as an immutable audit trail.

**Why this priority**: Bonus feature demonstrating event-driven architecture and distributed system patterns.

**Independent Test**: Create a vehicle → inspect RabbitMQ queue for `vehicle.created` event → check MongoDB audit collection for corresponding entry with `entity`, `action`, `payload`, `userId`, `timestamp`.

**Acceptance Scenarios**:

1. **Given** a vehicle is created, **When** the operation completes, **Then** a `vehicle.created` event is published to the `fleet.events` exchange in RabbitMQ.
2. **Given** a RabbitMQ consumer is running, **When** an event is received, **Then** an audit record is stored in MongoDB with `entity`, `action`, `payload`, `userId`, `timestamp`.
3. **Given** RabbitMQ is unavailable, **When** a mutation occurs, **Then** the primary operation succeeds (audit failure is non-blocking).
4. **Given** an audit record, **When** stored in MongoDB, **Then** it is immutable (no update/delete on audit collection).

---

### Edge Cases

- What happens when a vehicle references a non-existent `model_id`? → `400 Bad Request` with message indicating the model was not found.
- What happens when `CACHE_TTL_SECONDS` is not set? → Default TTL of 60 seconds is applied.
- What happens when Redis is unavailable? → System falls back to direct database reads (cache miss) with error logged; operation succeeds.
- What happens when `DELETE /models/:id` is called on a model that has vehicles? → `409 Conflict` — cannot delete a model with associated vehicles.
- What happens when year is out of plausible range (e.g., 1800 or 2100)? → `400 Bad Request` with validation error.
- What happens when JWT expires mid-session? → `401 Unauthorized`, client must re-authenticate.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**
- **FR-001**: System MUST provide a `POST /auth/login` endpoint accepting `email` and `password`.
- **FR-002**: System MUST return a signed JWT `access_token` on successful authentication.
- **FR-003**: System MUST reject requests to all protected endpoints without a valid JWT with `401 Unauthorized`.
- **FR-003a**: Authorization is flat — any valid JWT holder has full access to all endpoints. No role-based access control (RBAC) is required.
- **FR-004**: System MUST seed a default user with username `aivacol` on first startup.
- **FR-005**: System MUST hash all passwords using bcrypt before persistence.

**Models**
- **FR-006**: System MUST provide full CRUD for vehicle models (`POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id`).
- **FR-007**: System MUST validate that `name` is a non-empty string on model creation/update.
- **FR-008**: System MUST record `created_at`, `updated_at`, and `created_by` on every model.
- **FR-009**: System MUST return `404 Not Found` for operations on non-existent model IDs.
- **FR-010**: System MUST prevent deletion of models that have associated vehicles (`409 Conflict`).

**Vehicles**
- **FR-011**: System MUST provide full CRUD for vehicles (`POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id`).
- **FR-012**: System MUST enforce uniqueness of `license_plate`, `chassis`, and `renavam` fields.
- **FR-013**: System MUST validate that `year` is a plausible integer (1900–current year + 1).
- **FR-014**: System MUST validate that `model_id` references an existing model on create/update.
- **FR-015**: System MUST record `created_at`, `updated_at`, and `created_by` on every vehicle.
- **FR-016**: System MUST cache `GET /vehicles` and `GET /vehicles/:id` results in Redis.
- **FR-017**: Cache TTL MUST be configurable via `CACHE_TTL_SECONDS` environment variable with a default of 60 seconds.
- **FR-018**: System MUST invalidate vehicle cache entries on any create, update, or delete operation.
- **FR-018a**: `GET /vehicles` MUST support offset/limit pagination via `?page=<n>&limit=<n>` query parameters; defaults are `page=1` and `limit=20`. Additionally, MUST support optional filters `?modelId=<id>` and `?year=<n>`. Cache keys MUST include all active params (e.g., `vehicles:list:page=1:limit=20:modelId=X:year=Y`; absent params are omitted from key).
- **FR-018b**: `GET /models` and `GET /brands` MUST also support offset/limit pagination with the same `page`/`limit` convention and same defaults.

**Brands (Bonus)**
- **FR-019**: System MUST provide full CRUD for brands.
- **FR-020**: System MUST support associating one or more models to a brand.
- **FR-021**: System MUST prevent deletion of brands that have associated models (`409 Conflict`) with an error message that explicitly states the number of associated models (e.g., `"Cannot delete brand: N model(s) are still associated with this brand."`). The client must reassociate or delete the models before retrying the deletion.

**Users (Bonus)**
- **FR-022**: System MUST provide full CRUD for users.
- **FR-023**: System MUST enforce uniqueness of `email` across users.
- **FR-024**: System MUST never return `password_hash` in any user response.

**Messaging & Audit (Bonus)**
- **FR-025**: System MUST publish events to RabbitMQ `fleet.events` exchange on every create, update, and delete across all entities.
- **FR-026**: System MUST have a consumer that persists audit events to MongoDB.
- **FR-027**: Audit event MUST contain: `entity`, `action`, `payload`, `userId`, `timestamp`.
- **FR-028**: Audit failures MUST NOT block the primary operation.

**Infrastructure**
- **FR-029**: System MUST expose Swagger UI at `/api/docs` documenting all endpoints.
- **FR-030**: Repository MUST include an Insomnia collection file with all endpoints pre-configured.
- **FR-031**: Repository MUST include a `seed_vehicles.json` file with sample vehicle data.
- **FR-032**: System MUST be fully containerized via Docker Compose (app + SQL Server + Redis + optional RabbitMQ + MongoDB).
- **FR-033**: Dockerfile MUST use multistage build (builder → production).
- **FR-034**: Repository MUST include a `README.md` with setup, run, and usage instructions.

### Key Entities

- **User**: System actor. Has `nickname`, `name`, `email`, `password_hash`. Referenced as `created_by` in all other entities. Seed user: `aivacol`.
- **Brand** (bonus): Vehicle manufacturer (e.g., "Fiat", "Toyota"). Has `name`, metadata. One brand → many models.
- **Model**: Vehicle model (e.g., "Fiat Uno"). Has `name`, optional `brand_id`, metadata. One model → many vehicles.
- **Vehicle**: Registered fleet unit. Has `license_plate` (unique), `chassis` (unique), `renavam` (unique), `year`, `model_id` (FK), metadata. Queries are Redis-cached.
- **AuditLog** (bonus, MongoDB): Immutable record of every mutation. Has `entity`, `action`, `payload`, `userId`, `timestamp`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All mandatory endpoints are accessible after `docker-compose up` with zero manual database setup (migrations + seed run automatically on startup).
- **SC-002**: A new evaluator can authenticate, create a model, register a vehicle, and list vehicles within 5 minutes of cloning the repository.
- **SC-003**: Vehicle list queries return cached results on repeat calls with the same `page`/`limit` parameters within the configured TTL window, with no additional database round-trip.
- **SC-004**: Cache is invalidated within the same request cycle as any vehicle mutation — subsequent reads reflect the updated state.
- **SC-005**: All Jest test suites pass with zero failures covering: authentication rules, model business rules, vehicle validation, cache behavior, and at minimum one integration scenario per entity.
- **SC-006**: The Swagger UI at `/api/docs` documents every endpoint with request/response schemas and authentication requirement.
- **SC-007**: The Insomnia collection, when imported, allows a user to execute all endpoints without manual URL or header configuration (only credentials/token need to be set).
- **SC-008**: The system rejects malformed or incomplete requests with descriptive `400 Bad Request` responses, never crashing or returning `500`.
- **SC-009** (bonus): Every entity mutation produces a verifiable audit record in MongoDB within the same transaction window.

---

## Assumptions

- `created_by` defaults to the authenticated user's ID extracted from the JWT payload on every write operation.
- When `created_by` is required but no `users` table exists yet (pre-bonus implementation), the field accepts any integer/UUID and is populated from the JWT subject claim.
- The seed user `aivacol` is created via a TypeORM migration or database seeder that runs automatically on startup; its password is defined in the `.env` file via `SEED_USER_PASSWORD`.
- `license_plate` format follows Brazilian standard (e.g., ABC-1234 or ABC1D23 Mercosul) but format validation is done as a non-empty string (strict regex validation is a bonus).
- The `year` field accepts integers in the range 1900 to current year + 1.
- Soft-delete is NOT required for this test; hard delete is acceptable.
- The Insomnia collection is a v4 JSON export compatible with Insomnia 2023+.
- Redis connection failure is non-fatal for read operations (graceful degradation to DB); connection failure on startup is fatal.
- SQL Server is the sole relational database; no alternative DBMS support needed.
- The Docker Compose file targets VPS deployment on Hostinger; ports exposed are `3000` (API), `1433` (SQL Server), `6379` (Redis), `5672`/`15672` (RabbitMQ bonus), `27017` (MongoDB bonus).
- The application API listens on port `3000` inside the container (configurable via `PORT` env var).

---

## Clarifications

### Session 2026-06-05

- Q: Should list endpoints (GET /vehicles, GET /models, GET /brands) support pagination? → A: Offset/limit pagination with `?page=1&limit=20` defaults. Cache keys include pagination params.
- Q: Should there be multiple authorization levels (roles) for authenticated users? → A: Single level — any valid JWT has full access to all endpoints. No RBAC required.
- Q: What happens when DELETE /brands/:id is called with associated models? → A: 409 Conflict with a descriptive message stating the count of associated models (e.g., "Cannot delete brand: N model(s) are still associated with this brand.").
- Q: Should GET /vehicles support query filters beyond pagination? → A: Optional filters ?modelId and ?year; cache key includes all active params.
