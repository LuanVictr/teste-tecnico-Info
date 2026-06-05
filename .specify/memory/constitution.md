<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
Added principles: TDD-First, SDD Workflow, Clean Architecture, Security-First, Redis Cache Contract, Observability & Auditoria, Docker-First
Added sections: Stack Constraints, Development Workflow
Removed sections: N/A (template placeholders replaced)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ compatible as-is
  - .specify/templates/spec-template.md ✅ compatible as-is
  - .specify/templates/tasks-template.md ✅ compatible as-is
Follow-up TODOs: none
-->

# Aivacol Fleet Management — Constitution

## Core Principles

### I. TDD-First (NON-NEGOTIABLE)

TDD is mandatory throughout the entire project. Tests MUST be written before implementation.
The Red-Green-Refactor cycle is strictly enforced:
- Write a failing test that describes the intended behavior
- Show the failing test output before writing any implementation code
- Implement only enough code to make the test pass
- Refactor while keeping tests green
- No code is committed unless all tests pass
- Tests MUST actually fail when behavior is wrong — no vacuous passes

### II. Spec-Driven Development (SDD) Workflow

Every feature follows the sequence: `specify → clarify → plan → tasks → implement`.
No implementation begins without an approved spec and plan.
Each user story MUST be independently testable and deliverable as an MVP increment.
Specs are living documents — update them when requirements change, never let code drift from spec.

### III. Clean Architecture & Modular Design

The codebase follows NestJS domain-driven module structure:
- One module per domain (`auth`, `vehicles`, `models`, `brands`, `users`)
- DTOs with `class-validator` decorators on all public endpoints
- Services encapsulate all business logic — controllers are thin
- Repositories abstract all database access via TypeORM
- Cross-cutting concerns (cache, logging, guards) live in `shared/`
- `synchronize: false` ALWAYS — database changes only via TypeORM migrations

### IV. Security-First

All API routes MUST be protected with JWT authentication (`JwtAuthGuard`).
No exceptions unless explicitly specified in the spec.
- Passwords hashed with bcrypt (min 10 rounds)
- JWT secrets loaded from environment — never hardcoded
- Input validation via `class-validator` at every boundary
- Default seed user: `aivacol` (credentials defined in `.env.example`)

### V. Redis Cache Contract

Cache is mandatory for vehicle query operations:
- `GET /vehicles` and `GET /vehicles/:id` MUST read from cache first
- Cache TTL configurable via `CACHE_TTL_SECONDS` environment variable
- Cache MUST be invalidated on every create, update, or delete of a vehicle
- Cache keys follow the pattern `vehicles:list` and `vehicles:{id}`
- Tests MUST verify cache hit/miss behavior explicitly

### VI. Observability & Auditoria (Bonus)

When the MongoDB audit bonus is implemented:
- Every service interaction (create, update, delete, read) MUST produce an audit event
- Audit events are published via RabbitMQ to a dedicated audit consumer
- Audit records stored in MongoDB with: `entity`, `action`, `payload`, `userId`, `timestamp`
- Audit failures MUST NOT block the primary operation (fire-and-forget with error logging)

### VII. Docker-First Infrastructure

Every service runs in Docker. The `docker-compose.yml` at the project root is the single source
of truth for the full stack:
- SQL Server, Redis, RabbitMQ (bonus), MongoDB (bonus), and the NestJS app itself
- All services use health checks
- The app service depends on SQL Server and Redis being healthy before starting
- Multistage Dockerfile: `builder` stage (compile) → `production` stage (runtime only)
- Environment variables loaded from `.env` — `.env.example` MUST be kept up-to-date

## Stack Constraints (decisions closed — do not reopen)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | NestJS | 10+ (preferred) |
| ORM | TypeORM | latest |
| Database | SQL Server | latest (Docker) |
| Auth | JWT (`@nestjs/jwt`) | — |
| Cache | Redis (mandatory) | — |
| Messaging | RabbitMQ (bonus) | — |
| Audit DB | MongoDB (bonus) | — |
| Tests | Jest | — |
| Container | Docker + Docker Compose | — |

## Development Workflow

1. **Spec**: `/speckit-specify` — define user stories and acceptance criteria
2. **Clarify**: `/speckit-clarify` — resolve ambiguities before planning
3. **Plan**: `/speckit-plan` — architecture, data model, API contracts
4. **Tasks**: `/speckit-tasks` — dependency-ordered task list
5. **Implement**: `/speckit-implement` — TDD cycle per task
6. **Analyze**: `/speckit-analyze` — cross-artifact consistency check before PR

Commits follow semantic convention: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
All commits require passing tests.

## Governance

This constitution supersedes all other conventions for this project.
Amendments require updating this file, incrementing the version, and
documenting the rationale in the Sync Impact Report comment at the top.
All implementation decisions that conflict with this document MUST be raised
and resolved before code is written, not after.

The spec (`spec.md`) and plan (`plan.md`) for each feature must explicitly
reference the principles they satisfy.

**Version**: 1.0.0 | **Ratified**: 2026-06-05 | **Last Amended**: 2026-06-05
