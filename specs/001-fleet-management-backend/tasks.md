---
description: "Task list for Aivacol Fleet Management Backend"
---

# Tasks: Aivacol Fleet Management Backend

**Input**: Design documents from `specs/001-fleet-management-backend/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**TDD**: Tests are MANDATORY per constitution. Every user story phase: write tests FIRST → confirm RED → implement → confirm GREEN.

**Organization**: Tasks grouped by user story. Each story is independently testable and deliverable.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Maps to user story (US1–US6)
- File paths relative to project root

---

## Phase 1: Setup

**Purpose**: Initialize NestJS project, install all dependencies, configure tooling.

- [ ] T001 Initialize NestJS 10+ project with TypeScript: `nest new . --package-manager npm`
- [ ] T002 Install mandatory dependencies: `@nestjs/typeorm typeorm mssql @nestjs/jwt @nestjs/passport passport passport-jwt @nestjs/cache-manager cache-manager-redis-yet ioredis class-validator class-transformer @nestjs/swagger @nestjs/config bcrypt`
- [ ] T003 [P] Install dev dependencies: `@types/passport-jwt @types/bcrypt @types/supertest supertest jest @nestjs/testing ts-jest`
- [ ] T004 [P] Install bonus dependencies: `@nestjs/microservices amqplib @nestjs/mongoose mongoose`
- [ ] T005 [P] Configure `tsconfig.json`: `strict: true`, `emitDecoratorMetadata: true`, `experimentalDecorators: true`, paths for `src/`
- [ ] T006 [P] Create `.env.example` with all variables from plan.md environment section
- [ ] T007 [P] Configure Jest in `package.json`: moduleNameMapper for `src/` alias, coverage thresholds, test regex
- [ ] T008 [P] Add npm scripts: `start:dev`, `build`, `test`, `test:watch`, `test:cov`, `migration:generate`, `migration:run`

**Checkpoint**: `npm install` completes without errors. `npm run build` produces `dist/`.

---

## Phase 2: Foundational

**Purpose**: Shared infrastructure that ALL user stories depend on. No story work begins until this phase is complete.

**⚠️ CRITICAL**: These tasks block all user story phases.

- [ ] T009 Create `src/database/data-source.ts` — TypeORM DataSource config using `@nestjs/config`, `synchronize: false`, `migrationsRun: true`, glob `dist/database/migrations/*.js`
- [ ] T010 Create `src/app.module.ts` — root module importing `ConfigModule.forRoot({ isGlobal: true })` and `TypeOrmModule.forRootAsync()` from DataSource
- [ ] T011 Create `src/main.ts` — bootstrap with global `ValidationPipe({ whitelist: true, transform: true })`, Swagger setup at `/api/docs`, listen on `PORT` env var
- [ ] T012 [P] Create `src/shared/pagination/pagination.dto.ts` — `PaginationDto` with `@IsOptional() @IsInt() @Min(1) page` and `@IsOptional() @IsInt() @Min(1) @Max(100) limit`, defaults `page=1 limit=20`
- [ ] T013 [P] Create `src/shared/pagination/paginate.helper.ts` — `paginate<T>(items, total, dto): { data: T[], meta: { total, page, limit, totalPages } }`
- [ ] T014 Create `src/shared/cache/cache.module.ts` — `CacheModule.registerAsync()` using `cache-manager-redis-yet`, reads `REDIS_HOST`, `REDIS_PORT`, `CACHE_TTL_SECONDS` from env; export as global
- [ ] T015 [P] Create `src/shared/cache/cache-key.util.ts` — `buildCacheKey(prefix: string, params: Record<string, unknown>): string` — sorts params alphabetically, serializes to `prefix:key1=val1:key2=val2`
- [ ] T016 Create `src/users/users.entity.ts` — TypeORM `@Entity('users')` with all fields from data-model.md (`id`, `nickname`, `name`, `email`, `password`, `created_at`, `updated_at`)
- [ ] T017 Create `src/auth/public.decorator.ts` — `@Public()` custom decorator using `SetMetadata('isPublic', true)`
- [ ] T018 Create `src/auth/jwt-auth.guard.ts` — global `JwtAuthGuard extends AuthGuard('jwt')` that reads `isPublic` metadata to bypass
- [ ] T019 Create `Dockerfile` — multistage: `builder` stage (node:18-alpine, installs all deps, compiles TS) → `production` stage (node:18-alpine, copies `dist/` + `node_modules` prod only, runs as `node` user)
- [ ] T020 Create `docker-compose.yml` — services: `app` (depends_on sqlserver+redis healthy), `sqlserver` (mcr.microsoft.com/mssql/server with healthcheck `sqlcmd SELECT 1`), `redis` (redis:7-alpine with healthcheck `redis-cli ping`); all config from `.env`

**Checkpoint**: `docker-compose up sqlserver redis -d` starts healthy. TypeORM connects without error on `npm run start:dev`.

---

## Phase 3: User Story 1 — JWT Authentication + Seed User (Priority: P1) 🎯 MVP

**Goal**: Any client can authenticate with the seed user `aivacol` and receive a JWT. All unprotected requests get 401.

**Independent Test**: `POST /auth/login` with seed credentials → `{ access_token }`. Any other endpoint without token → 401.

### Tests for US1 ⚠️ Write FIRST — confirm RED before implementing

- [ ] T021 [P] [US1] Write `test/auth/auth.service.spec.ts` — test: `validateUser` returns user on valid creds; returns null on invalid; `login()` returns `{ access_token }`; password comparison uses bcrypt
- [ ] T022 [P] [US1] Write `test/auth/auth.controller.spec.ts` — test: `POST /auth/login` 200 with valid creds; 401 with wrong password; 400 with missing email field; 401 on protected route without token

> Run `npm test` — ALL auth tests MUST FAIL (Red) before proceeding.

### Implementation for US1

- [ ] T023 [US1] Create `src/auth/dto/login.dto.ts` — `LoginDto` with `@IsEmail() email` and `@IsNotEmpty() password`
- [ ] T024 [US1] Create `src/auth/jwt.strategy.ts` — `PassportStrategy(Strategy)` extracting Bearer token, validating with `JWT_SECRET`, returning `{ userId: sub, email }`
- [ ] T025 [US1] Create `src/auth/auth.service.ts` — `validateUser(email, password)` using bcrypt compare; `login(user)` returning `{ access_token: jwt.sign(...) }`
- [ ] T026 [US1] Create `src/auth/auth.controller.ts` — `@Public() @Post('login')` calling `authService.login()`; decorated with `@ApiTags('auth')` and `@ApiOperation`
- [ ] T027 [US1] Create `src/auth/auth.module.ts` — imports `JwtModule.registerAsync()` with `JWT_SECRET` and `JWT_EXPIRATION` from env; registers `JwtStrategy`; provides `JwtAuthGuard` as `APP_GUARD`
- [ ] T028 [US1] Create `src/users/users.service.ts` — `OnModuleInit` seeder that checks if seed user exists before inserting (idempotent); `findByEmail(email)`, `findById(id)`
- [ ] T029 [US1] Create `src/users/users.module.ts` — imports `TypeOrmModule.forFeature([User])`; exports `UsersService`
- [ ] T030 [US1] Wire `AuthModule` importing `UsersModule` and `PassportModule` into `AppModule`
- [ ] T031 [US1] Generate migration `src/database/migrations/CreateUsersTable.ts` — creates `users` table per data-model.md schema
- [ ] T032 [US1] Generate migration `src/database/migrations/SeedAdminUser.ts` — idempotent insert of seed user using env vars

> Run `npm test` — ALL auth tests MUST PASS (Green). Run `docker-compose up -d` and test login manually.

**Checkpoint**: Seed user authenticates, token works on protected endpoints, 401 on missing token.

---

## Phase 4: User Story 2 — Vehicle Models CRUD (Priority: P1)

**Goal**: Authenticated users can create, list (paginated), get, update, and delete vehicle models.

**Independent Test**: Full CRUD cycle on `/models` with valid JWT. 404 on unknown ID. 400 on empty name. 409 on delete with vehicles.

### Tests for US2 ⚠️ Write FIRST — confirm RED before implementing

- [ ] T033 [P] [US2] Write `test/models/models.service.spec.ts` — test: `create()` returns model with metadata; `findAll()` returns `{ data, meta }` with pagination; `findOne()` throws 404 if not found; `update()` updates `updated_at`; `remove()` throws 409 with count message when vehicles exist; `remove()` succeeds when no vehicles
- [ ] T034 [P] [US2] Write `test/models/models.controller.spec.ts` — test: `POST /models` 201; `GET /models` 200 with pagination; `GET /models/:id` 404 on missing; `PATCH /models/:id` 200; `DELETE /models/:id` 409 with descriptive message when vehicles associated

> Run `npm test` — ALL models tests MUST FAIL (Red) before proceeding.

### Implementation for US2

- [ ] T035 [P] [US2] Create `src/models/models.entity.ts` — `@Entity('models')` with `id`, `name`, `brand_id` (nullable), `created_at`, `updated_at`, `created_by` (nullable); `@ManyToOne` relations to Brand and User
- [ ] T036 [P] [US2] Create `src/models/dto/create-model.dto.ts` — `@IsNotEmpty() @IsString() @MaxLength(100) name`; `@IsOptional() @IsInt() @IsPositive() brand_id`
- [ ] T037 [P] [US2] Create `src/models/dto/update-model.dto.ts` — `PartialType(CreateModelDto)`
- [ ] T038 [P] [US2] Create `src/models/dto/list-models.dto.ts` — extends `PaginationDto`
- [ ] T039 [US2] Create `src/models/models.service.ts` — `create()`, `findAll(dto)` with paginate helper, `findOne(id)` with 404, `update(id, dto)` with 404, `remove(id)` with vehicle count check → 409 `"Cannot delete model: N vehicle(s) are still associated with this model."`; `created_by` from JWT user ID
- [ ] T040 [US2] Create `src/models/models.controller.ts` — CRUD endpoints with `@ApiBearerAuth()`, `@ApiTags('models')`, `@ApiOperation` on each route
- [ ] T041 [US2] Create `src/models/models.module.ts` — `TypeOrmModule.forFeature([Model])`; wire into AppModule
- [ ] T042 [US2] Generate migration `src/database/migrations/CreateModelsTable.ts` — creates `models` table; FK to `users` (nullable); FK to `brands` (nullable, added later in US4)

> Run `npm test` — ALL models tests MUST PASS (Green).

**Checkpoint**: Full CRUD on `/models` works. Pagination meta is correct. 409 message includes vehicle count.

---

## Phase 5: User Story 3 — Vehicles CRUD + Redis Cache (Priority: P1)

**Goal**: Register, update, list (paginated + filtered), and delete vehicles. Cache reads in Redis; invalidate on mutations.

**Independent Test**: POST vehicle → GET list (cache miss) → GET list again (cache hit) → PATCH vehicle (cache invalidated) → GET list (fresh data). Filter `?modelId` and `?year` return correct subsets.

### Tests for US3 ⚠️ Write FIRST — confirm RED before implementing

- [ ] T043 [P] [US3] Write `test/vehicles/vehicles.service.spec.ts` — test: `create()` 201 with all fields; `create()` throws 409 on duplicate `license_plate`/`chassis`/`renavam`; `create()` throws 404 on invalid `model_id`; `findAll()` calls cache before DB on second call; `findAll()` invalidates cache on mutation; `update()` invalidates `vehicles:list:*` and `vehicles:detail:{id}`; `remove()` invalidates both cache patterns; filter by `modelId` returns only matching vehicles; filter by `year` returns only matching vehicles; `year` validation rejects out-of-range values
- [ ] T044 [P] [US3] Write `test/vehicles/vehicles.controller.spec.ts` — test: pagination `meta` shape; `?modelId` filter; `?year` filter; 409 on duplicate fields with field name in message; 404 on missing model; 400 on missing required field

> Run `npm test` — ALL vehicles tests MUST FAIL (Red) before proceeding.

### Implementation for US3

- [ ] T045 [P] [US3] Create `src/vehicles/vehicles.entity.ts` — `@Entity('vehicles')` with `id`, `license_plate`, `chassis`, `renavam`, `year`, `model_id`, `created_at`, `updated_at`, `created_by`; `@ManyToOne` to Model and User
- [ ] T046 [P] [US3] Create `src/vehicles/dto/create-vehicle.dto.ts` — all fields with validators: `@IsNotEmpty() @MaxLength(10) license_plate`; `@Length(17,17) chassis`; `@Length(11,11) renavam`; `@IsInt() @Min(1900) @Max(currentYear+1) year`; `@IsInt() @IsPositive() model_id`
- [ ] T047 [P] [US3] Create `src/vehicles/dto/update-vehicle.dto.ts` — `PartialType(CreateVehicleDto)`
- [ ] T048 [P] [US3] Create `src/vehicles/dto/list-vehicles.dto.ts` — extends `PaginationDto`; adds `@IsOptional() @IsInt() @IsPositive() @Type(() => Number) modelId`; `@IsOptional() @IsInt() @Min(1900) @Type(() => Number) year`
- [ ] T049 [US3] Create `src/vehicles/vehicles.service.ts` — `create()` with FK validation + unique constraint catching → 409 with field name; `findAll(dto)` with cache read (`buildCacheKey('vehicles:list', dto)`) → DB fallback on miss; `findOne(id)` with cache key `vehicles:detail:{id}`; `update()` + `remove()` both calling `invalidateVehicleCache(id)` (SCAN+DEL `vehicles:list:*`, DEL `vehicles:detail:{id}`)
- [ ] T050 [US3] Create `src/vehicles/vehicles.controller.ts` — CRUD endpoints with `@ApiBearerAuth()`, `@ApiTags('vehicles')`, `@ApiQuery` for `page`, `limit`, `modelId`, `year`
- [ ] T051 [US3] Create `src/vehicles/vehicles.module.ts` — imports `TypeOrmModule.forFeature([Vehicle])` and `CacheModule`; wire into AppModule
- [ ] T052 [US3] Generate migration `src/database/migrations/CreateVehiclesTable.ts` — creates `vehicles` table; FK to `models`; FK to `users` (nullable); `CREATE INDEX IX_vehicles_model_id`; `CREATE INDEX IX_vehicles_year`

> Run `npm test` — ALL vehicles tests MUST PASS (Green). Verify cache behavior with two sequential GETs.

**Checkpoint**: Vehicle CRUD, Redis cache hit/miss, filter by modelId and year, cache invalidation on mutations all verified.

---

## Phase 6: User Story 4 — Brands CRUD + Model Association (Priority: P2 — Bonus)

**Goal**: Create brands, list them with their associated models, update and delete (409 with count if models exist).

**Independent Test**: Create brand → associate model via PATCH /models/:id → GET /brands/:id shows models array → DELETE /brands/:id → 409 with "Cannot delete brand: N model(s) are still associated."

### Tests for US4 ⚠️ Write FIRST — confirm RED before implementing

- [ ] T053 [P] [US4] Write `test/brands/brands.service.spec.ts` — test: `create()` 201; `findAll()` paginated; `findOne()` includes models array; `update()` 200; `remove()` throws 409 `"Cannot delete brand: N model(s) are still associated with this brand."`; `remove()` succeeds with no models

> Run `npm test` — brands tests MUST FAIL (Red).

### Implementation for US4

- [ ] T054 [P] [US4] Create `src/brands/brands.entity.ts` — `@Entity('brands')` with `id`, `name` (unique), `created_at`, `updated_at`, `created_by`; `@OneToMany` to Model
- [ ] T055 [P] [US4] Create `src/brands/dto/create-brand.dto.ts` — `@IsNotEmpty() @IsString() @MaxLength(100) name`
- [ ] T056 [P] [US4] Create `src/brands/dto/update-brand.dto.ts` — `PartialType(CreateBrandDto)`
- [ ] T057 [US4] Create `src/brands/brands.service.ts` — `create()` with 409 on duplicate name; `findAll(dto)` paginated; `findOne(id)` with eager models; `update()`; `remove()` with model count check → 409 with count in message
- [ ] T058 [US4] Create `src/brands/brands.controller.ts` — CRUD with `@ApiBearerAuth()`, `@ApiTags('brands')`
- [ ] T059 [US4] Create `src/brands/brands.module.ts` — `TypeOrmModule.forFeature([Brand])`; wire into AppModule
- [ ] T060 [US4] Update `src/models/models.entity.ts` — add proper `@ManyToOne(() => Brand, brand => brand.models, { nullable: true, eager: false }) brand` relation with `@JoinColumn({ name: 'brand_id' })`
- [ ] T061 [US4] Generate migration `src/database/migrations/CreateBrandsTable.ts` — creates `brands` table; adds `brand_id` FK column to `models` table

> Run `npm test` — ALL brands tests MUST PASS (Green).

**Checkpoint**: Full brands CRUD. Associate model to brand via PATCH /models/:id?brand_id=N. DELETE with 409 message includes model count.

---

## Phase 7: User Story 5 — Users CRUD (Priority: P2 — Bonus)

**Goal**: Full CRUD for users. Never expose password. email unique. created_by populated on all entities.

**Independent Test**: Create user → login as new user → create vehicle → GET /vehicles/:id shows `created_by` matching new user ID. GET /users never returns `password`.

### Tests for US5 ⚠️ Write FIRST — confirm RED before implementing

- [ ] T062 [P] [US5] Write `test/users/users.service.spec.ts` — test: `create()` hashes password, never returns it; `create()` throws 409 on duplicate email; `findAll()` paginated, no password field in response; `findOne()` 404 on missing; `update()` rehashes password if changed; `remove()` 200

> Run `npm test` — users tests MUST FAIL (Red).

### Implementation for US5

- [ ] T063 [P] [US5] Create `src/users/dto/create-user.dto.ts` — `nickname`, `name`, `@IsEmail() email`, `@MinLength(6) password`
- [ ] T064 [P] [US5] Create `src/users/dto/update-user.dto.ts` — `PartialType(CreateUserDto)` + `@Exclude() password` from response via serializer
- [ ] T065 [US5] Update `src/users/users.service.ts` — add full CRUD: `create()` bcrypt hash + 409 on duplicate email; `findAll(dto)` paginated; `update(id, dto)` with optional password rehash; `remove(id)` with 404
- [ ] T066 [US5] Create `src/users/users.controller.ts` — full CRUD with `@ApiBearerAuth()`, `@ApiTags('users')`, `@UseInterceptors(ClassSerializerInterceptor)` to exclude password
- [ ] T067 [US5] Update `src/users/users.module.ts` — export `UsersController`

> Run `npm test` — ALL users tests MUST PASS (Green).

**Checkpoint**: GET /users never shows password field. created_by on vehicles/models/brands reflects authenticated user.

---

## Phase 8: User Story 6 — RabbitMQ Events + MongoDB Audit (Priority: P3 — Bonus)

**Goal**: Every mutation publishes event to RabbitMQ fleet.events exchange. Consumer persists to MongoDB. Audit failures never block primary operation.

**Independent Test**: Create vehicle → check RabbitMQ management UI (port 15672) for `vehicle.created` event → check MongoDB audit_logs collection for entry with entity/action/payload/userId/timestamp.

### Tests for US6 ⚠️ Write FIRST — confirm RED before implementing

- [ ] T068 [P] [US6] Write `test/shared/event-publisher.service.spec.ts` — test: `publish()` emits to correct exchange with routing key `entity.action`; `publish()` does NOT throw on RabbitMQ connection failure (non-blocking); payload includes userId
- [ ] T069 [P] [US6] Write `test/audit/audit.consumer.spec.ts` — test: handler saves AuditLog to MongoDB with all required fields; `timestamp` auto-set; record is immutable (no update method exposed)

> Run `npm test` — messaging and audit tests MUST FAIL (Red).

### Implementation for US6

- [ ] T070 [US6] Create `src/shared/messaging/event-publisher.service.ts` — wraps `ClientProxy.emit()` in try/catch; method signature: `publish(entity: string, action: string, payload: unknown, userId: number): void` (fire-and-forget, void return)
- [ ] T071 [US6] Create `src/shared/messaging/messaging.module.ts` — `ClientsModule.registerAsync()` with `RmqTransport`, `RABBITMQ_URL` from env; exports `EventPublisherService`
- [ ] T072 [US6] Create `src/audit/audit-log.schema.ts` — Mongoose `@Schema({ collection: 'audit_logs' })` with `entity`, `action`, `payload` (Mixed), `userId`, `timestamp` (default `Date.now`)
- [ ] T073 [US6] Create `src/audit/audit-log.repository.ts` — `create(dto)` only; no update/delete methods (immutability enforced by omission)
- [ ] T074 [US6] Create `src/audit/audit.consumer.ts` — `@EventPattern('vehicle.*')`, `@EventPattern('model.*')`, `@EventPattern('brand.*')` handlers that call `AuditLogRepository.create()`
- [ ] T075 [US6] Create `src/audit/audit.module.ts` — imports `MongooseModule.forFeature([AuditLog])`, `MessagingModule`; registers microservice listeners
- [ ] T076 [US6] Inject `EventPublisherService` into `VehiclesService`, `ModelsService`, `BrandsService` — call `publish()` after each successful create/update/delete
- [ ] T077 [US6] Update `src/app.module.ts` — add `MongooseModule.forRoot(MONGODB_URI)` and import `AuditModule`, `MessagingModule`
- [ ] T078 [US6] Update `docker-compose.yml` — add `rabbitmq` service (management plugin, healthcheck `rabbitmqctl status`) and `mongodb` service (healthcheck `mongosh --eval "db.adminCommand('ping')"`)

> Run `npm test` — ALL messaging and audit tests MUST PASS (Green). Verify non-blocking behavior by temporarily disabling RabbitMQ and confirming vehicle creation still works.

**Checkpoint**: Events visible in RabbitMQ management UI. Audit logs in MongoDB after every mutation. Primary operation unaffected by messaging failure.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Swagger docs, Insomnia collection, seed data, README, final test run.

- [ ] T079 [P] Add `@ApiProperty()` decorators to all DTOs in `src/` for complete Swagger schema generation
- [ ] T080 [P] Add `@ApiOperation()`, `@ApiResponse()`, `@ApiBearerAuth()` to all controllers (auth, models, vehicles, brands, users)
- [ ] T081 [P] Create `insomnia-collection.json` — Insomnia v4 export with folders: Auth, Models, Vehicles, Brands, Users; environment variables `base_url=http://localhost:3000`, `access_token`; Bearer token auto-set after login
- [ ] T082 [P] Create `seed_vehicles.json` — array of 20+ vehicles covering different models, years, and unique identifiers (license plates both old ABC-1234 and Mercosul ABC1D23 formats)
- [ ] T083 Write `test/integration/vehicles.e2e-spec.ts` — Supertest e2e: full flow: login → create model → create vehicle → GET list (cache miss) → GET list (cache hit) → PATCH vehicle (invalidate cache) → GET list (fresh) → DELETE vehicle → 404 on deleted
- [ ] T084 [P] Write `README.md` — sections: Objetivo, Stack, Pré-requisitos, Como Rodar (docker-compose), Como Usar (endpoints), Variáveis de Ambiente, Como Rodar os Testes, Decisões Técnicas, Estrutura do Projeto
- [ ] T085 [P] Update `.env.example` — verify all variables from plan.md are present with example values
- [ ] T086 Run full test suite `npm run test` — ALL tests must pass (unit + integration)
- [ ] T087 Run `npm run test:cov` — review coverage report; ensure business logic (services) and cache behavior are covered
- [ ] T088 Validate `quickstart.md` checklist manually against running docker-compose stack

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 — Auth)**: Depends on Phase 2
- **Phase 4 (US2 — Models)**: Depends on Phase 2 + Phase 3 (needs User entity for created_by + JWT works)
- **Phase 5 (US3 — Vehicles)**: Depends on Phase 4 (Vehicle needs Model FK)
- **Phase 6 (US4 — Brands)**: Depends on Phase 4 (Brand links to Models)
- **Phase 7 (US5 — Users)**: Depends on Phase 3 (extends Users entity + auth)
- **Phase 8 (US6 — Messaging)**: Depends on Phases 5, 6, 7 (injects into all services)
- **Phase 9 (Polish)**: Depends on all phases complete

### TDD Order Within Each Phase

```
1. Write tests → 2. Confirm RED → 3. Implement → 4. Confirm GREEN → 5. Commit
```

Never skip step 2 (confirming RED). A test that passes before implementation is not a real test.

---

## Parallel Opportunities

### Phase 1 — All parallelizable
```
T003 Install dev deps   T005 tsconfig.json   T006 .env.example
T007 Jest config        T008 npm scripts
```

### Phase 2 — Partially parallelizable
```
T012 PaginationDto + T013 paginate helper (same file group, run together)
T014 CacheModule + T015 buildCacheKey util (same file group, run together)
T019 Dockerfile + T020 docker-compose.yml (independent files)
```

### Per User Story — Tests are parallelizable
```
US2: T033 models.service.spec.ts  |  T034 models.controller.spec.ts
US3: T043 vehicles.service.spec.ts  |  T044 vehicles.controller.spec.ts
US4: T053 brands.service.spec.ts  (single file, no parallelism)
US5: T062 users.service.spec.ts  (single file, no parallelism)
US6: T068 event-publisher.spec.ts  |  T069 audit.consumer.spec.ts
```

### Phase 9 — Mostly parallelizable
```
T079 Swagger DTOs  |  T080 Swagger controllers  |  T081 Insomnia collection
T082 seed_vehicles.json  |  T084 README.md  |  T085 .env.example
```

---

## Implementation Strategy

### MVP Scope (Mandatory deliverable — P1 stories only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 — Auth ✅
4. Complete Phase 4: US2 — Models ✅
5. Complete Phase 5: US3 — Vehicles + Cache ✅
6. **STOP & VALIDATE**: Run quickstart.md checklist, all mandatory tests pass
7. Complete Phase 9: Polish (README, Insomnia, seed_vehicles.json, Swagger)
8. **SHIP**: This is a complete, impressive submission

### Full Overkill Scope (All bonuses)
1. All of MVP above
2. Phase 6: US4 — Brands
3. Phase 7: US5 — Users
4. Phase 8: US6 — RabbitMQ + MongoDB
5. Phase 9: Polish (complete with e2e test)

---

## Notes

- `[P]` = different files, no unresolved dependencies — safe to implement simultaneously
- `[USN]` maps each task to its user story for traceability
- **Write tests FIRST** — if a test passes before implementation, it is wrong
- Each phase ends with a `Run tests → GREEN` task — never skip it
- Commit after each phase checkpoint
- Total tasks: **88** (T001–T088)

### Task Count per Story

| Phase | Story | Tasks |
|-------|-------|-------|
| Setup | — | T001–T008 (8 tasks) |
| Foundational | — | T009–T020 (12 tasks) |
| Phase 3 | US1 Auth | T021–T032 (12 tasks) |
| Phase 4 | US2 Models | T033–T042 (10 tasks) |
| Phase 5 | US3 Vehicles | T043–T052 (10 tasks) |
| Phase 6 | US4 Brands | T053–T061 (9 tasks) |
| Phase 7 | US5 Users | T062–T067 (6 tasks) |
| Phase 8 | US6 Messaging | T068–T078 (11 tasks) |
| Phase 9 | Polish | T079–T088 (10 tasks) |
| **Total** | | **88 tasks** |
