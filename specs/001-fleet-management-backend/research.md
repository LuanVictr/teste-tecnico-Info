# Research: Aivacol Fleet Management Backend

**Feature**: 001-fleet-management-backend
**Date**: 2026-06-05

---

## 1. NestJS 10+ Module Architecture for Domain-Driven Design

**Decision**: One NestJS module per domain — `AuthModule`, `UsersModule`, `BrandsModule`, `ModelsModule`, `VehiclesModule`, `CacheModule (shared)`, `MessagingModule (shared)`, `AuditModule (bonus)`.

**Rationale**: NestJS's module system is purpose-built for encapsulation. Each domain module owns its entity, repository, service, controller, and DTOs. Shared infrastructure (Redis cache, RabbitMQ publisher) lives in `SharedModule` and is imported where needed.

**Alternatives considered**: Feature-sliced architecture (too complex for this scope), single module (violates clean architecture principle in constitution).

---

## 2. TypeORM with SQL Server — Migration Strategy

**Decision**: `synchronize: false` always. Migrations generated via TypeORM CLI (`typeorm migration:generate`). Run automatically on app startup via `migrations: ['dist/database/migrations/*.js']` + `migrationsRun: true` in DataSource config.

**Rationale**: Constitution mandates `synchronize: false`. Migrations provide a reproducible, reviewable history of schema changes. Auto-run on startup means `docker-compose up` works without manual migration steps, satisfying SC-001.

**Alternatives considered**: `synchronize: true` (violates constitution), manual migration run (breaks zero-touch startup requirement).

---

## 3. Redis Cache Strategy for Paginated + Filtered Queries

**Decision**: Cache key pattern: `vehicles:list:{serialized-query-params}` and `vehicles:detail:{id}`. Query params sorted alphabetically before serialization to avoid key mismatches. Cache invalidation: `DEL vehicles:list:*` (pattern delete via SCAN + DEL) on any vehicle mutation; `DEL vehicles:detail:{id}` on update/delete of specific vehicle.

**Rationale**: Pagination and filters (modelId, year) mean the same endpoint can produce different results. Keys must encode all params. Pattern delete (`vehicles:list:*`) is necessary because a mutation invalidates ALL paginated views, not just one page.

**Implementation**: Use `@nestjs/cache-manager` with `cache-manager-redis-yet` adapter. TTL from `CACHE_TTL_SECONDS` env var.

**Alternatives considered**: Cache only full list without filters (breaks filter cache correctness), per-field granular cache (over-engineering for this scope).

---

## 4. JWT Authentication Strategy

**Decision**: Stateless JWT with `@nestjs/jwt` + `@nestjs/passport` using `passport-jwt` strategy. Token payload: `{ sub: userId, email }`. Token expiry: `JWT_EXPIRATION` env var (default `1d`). `JwtAuthGuard` applied globally via `APP_GUARD` provider — all routes protected by default.

**Rationale**: Applying `JwtAuthGuard` globally as `APP_GUARD` is the cleanest NestJS pattern — no per-controller decoration needed, no risk of forgetting to protect a route. Auth module exposes only `POST /auth/login` with `@Public()` decorator to bypass the guard.

**Alternatives considered**: Per-controller guard decoration (error-prone, violates constitution's "all routes protected"), session-based auth (overkill, stateful).

---

## 5. Seed User Strategy

**Decision**: TypeORM seeder runs as part of the `OnModuleInit` lifecycle in `UsersModule`. Checks if seed user exists before inserting. Password from `SEED_USER_PASSWORD` env var, hashed with bcrypt (10 rounds). Username: `aivacol`.

**Rationale**: Seed on init means it runs every startup but is idempotent. No separate seed script to run — satisfies SC-001 (zero manual setup).

**Alternatives considered**: Migration-based seed (harder to parameterize password from env), separate CLI script (requires manual step).

---

## 6. RabbitMQ Integration (Bonus)

**Decision**: Use `@nestjs/microservices` with `RmqTransport` for publishing. Exchange: `fleet.events` (topic type). Routing keys: `{entity}.{action}` (e.g., `vehicle.created`, `model.updated`). Publisher is a shared `EventPublisherService` injected into domain services. Consumer is a separate `AuditModule` with `@EventPattern` handlers.

**Rationale**: NestJS has first-class RabbitMQ support via microservices transport. Topic exchange allows flexible routing. Publisher wraps emit in try/catch to ensure non-blocking behavior (FR-028).

**Alternatives considered**: Direct `amqplib` (more boilerplate), separate microservice process (overkill for this scope — same process consumer is sufficient).

---

## 7. MongoDB Audit (Bonus)

**Decision**: Use `@nestjs/mongoose` with Mongoose ODM. Single `AuditLog` schema with fields: `entity`, `action`, `payload` (Mixed), `userId`, `timestamp`. Collection: `audit_logs`. No indexes needed for this scope beyond `timestamp`.

**Rationale**: Mongoose integrates cleanly with NestJS. Schema is flexible (payload varies per entity). Immutability enforced by never exposing update/delete endpoints for audit logs.

**Alternatives considered**: TypeORM with MongoDB driver (worse Mongoose ecosystem support), raw MongoDB driver (more boilerplate).

---

## 8. Docker Multistage Build Strategy

**Decision**: Two-stage Dockerfile: `builder` (node:18-alpine, installs all deps, compiles TypeScript) → `production` (node:18-alpine, copies only `dist/`, installs only prod deps, runs as non-root user `node`).

**Rationale**: Multistage keeps the production image lean (~150MB vs ~600MB with dev deps). Non-root user follows security best practices. Alpine base minimizes attack surface.

**Alternatives considered**: Single-stage build (bloated image), distroless base (harder SQL Server native module compatibility).

---

## 9. Docker Compose Service Dependencies

**Decision**: App service uses `depends_on` with `condition: service_healthy` for SQL Server and Redis. SQL Server healthcheck: `sqlcmd -S localhost -U sa -P $SA_PASSWORD -Q "SELECT 1"`. Redis healthcheck: `redis-cli ping`. RabbitMQ and MongoDB (bonus) use same pattern.

**Rationale**: SQL Server takes ~30s to initialize. Without health checks, the app crashes on startup trying to connect before DB is ready. Health-check-based depends_on solves this without sleep hacks.

---

## 10. Insomnia Collection Format

**Decision**: Insomnia v4 JSON export (`__export_format: 4`). Organized into folders per module (Auth, Models, Vehicles, Brands, Users). Environment variable `base_url` set to `http://localhost:3000`. Bearer token stored as environment variable `access_token` — set automatically after login request via response hook.

**Rationale**: v4 is the current Insomnia export format compatible with Insomnia 2023+. Environment variables allow single-click reconfiguration for different deployment targets (local, VPS).
