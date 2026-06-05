<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at:
specs/001-fleet-management-backend/plan.md
<!-- SPECKIT END -->

# CLAUDE.md — Aivacol Fleet Management Backend

> Este arquivo é a **spec viva** do projeto. Leia antes de qualquer sessão de código.
> Atualize a seção "Estado Atual" sempre que concluir algo.
> Método: Spec-Driven Development + TDD (Red-Green-Refactor) — nenhuma implementação
> começa sem spec e plano aprovados.

---

## 1. O Problema

A Aivacol precisa de um backend robusto para o módulo de Gestão de Frota, capaz de:
- Gerenciar modelos de veículos (`models`)
- Gerenciar veículos (`vehicles`) com placa, chassi, renavam, ano e modelo associado
- Autenticar todos os acessos via JWT
- Cachear consultas de veículos com Redis (invalidação automática em mutações)
- (Bônus) Gerenciar marcas (`brands`) e associá-las a modelos
- (Bônus) Gerenciar usuários (`users`) com relacionamento a entidades
- (Bônus) Publicar eventos de auditoria via RabbitMQ → MongoDB
- Toda a infra containerizada e pronta para deploy em VPS (Hostinger)

---

## 2. Stack Técnica (decisões fechadas — não reabrir)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Runtime | Node.js | 18+ |
| Framework | NestJS | 10+ (preferencial) |
| ORM | TypeORM | latest |
| Banco relacional | SQL Server | latest (Docker) |
| Autenticação | JWT (`@nestjs/jwt`) | — |
| Cache | Redis | obrigatório |
| Mensageria | RabbitMQ | bônus |
| Auditoria | MongoDB | bônus |
| Testes | Jest | — |
| Container | Docker + Docker Compose | multistage |
| Documentação API | Swagger (`@nestjs/swagger`) | — |
| HTTP Client Test | Insomnia (collection exportada) | — |

### Convenções de código
- Módulos NestJS por domínio: `auth`, `vehicles`, `models`, `brands`, `users`, `shared`
- DTOs com `class-validator` em todos os endpoints públicos
- **Nunca `synchronize: true`** — sempre TypeORM migrations
- Commits semânticos: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- Variáveis de ambiente via `@nestjs/config` — nunca hardcoded
- Senhas via bcrypt (mínimo 10 rounds)
- Testes Jest: cobertura de regras de negócio, serviços, validações e integrações

---

## 3. Modelagem de Dados

### Tabela `models` (obrigatória)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid/int | PK |
| name | varchar | Nome do modelo |
| created_at | datetime | Data de criação |
| updated_at | datetime | Data de atualização |
| created_by | int/uuid | FK → users (bônus) |

### Tabela `vehicles` (obrigatória)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid/int | PK |
| license_plate | varchar | Placa (unique) |
| chassis | varchar | Chassi (unique) |
| renavam | varchar | Renavam (unique) |
| year | int | Ano |
| model_id | int/uuid | FK → models |
| created_at | datetime | Criado em |
| updated_at | datetime | Atualizado em |
| created_by | int/uuid | FK → users (bônus) |

### Tabela `brands` (bônus)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid/int | PK |
| name | varchar | Nome da marca |
| created_at | datetime | — |
| updated_at | datetime | — |
| created_by | int/uuid | FK → users |

### Tabela `users` (bônus)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid/int | PK |
| nickname | varchar | Nome curto |
| name | varchar | Nome completo |
| email | varchar | Email (unique) |
| password_hash | varchar | Bcrypt hash |

> `brands` tem relacionamento com `models` (1 brand → N models).
> `created_by` em todas as tabelas referencia `users`.

---

## 4. Requisitos Funcionais

### Obrigatórios
- **Auth**: login com JWT, seed user `aivacol`, todas as rotas protegidas
- **Models**: CRUD completo (criar, atualizar, listar, remover)
- **Vehicles**: registrar, atualizar, listar/consultar, remover
  - Cache Redis obrigatório nas consultas
  - Invalidação de cache em mutações

### Bônus
- **Brands**: CRUD + associar models a uma brand
- **Users**: CRUD (usado como `created_by` nos demais recursos)
- **RabbitMQ**: publicar evento a cada mutação nos serviços
- **MongoDB**: consumir eventos e persistir log de auditoria
- **Docker**: Dockerfile multistage + Docker Compose completo

---

## 5. Segurança

- JWT obrigatório em todas as rotas
- Usuário padrão seed: `aivacol` (senha definida em `.env.example`)
- `created_at`, `updated_at`, `created_by` obrigatórios em todas as entidades
- Validação de entrada com `class-validator` + `ValidationPipe` global

---

## 6. Cache Redis

- Aplicado em `GET /vehicles` e `GET /vehicles/:id`
- TTL configurável via `CACHE_TTL_SECONDS` no `.env`
- Invalidação automática em `POST`, `PATCH`, `DELETE` de vehicles
- Chaves: `vehicles:list`, `vehicles:{id}`

---

## 7. Mensageria + Auditoria (Bônus)

- RabbitMQ: exchange `fleet.events`, routing key por entidade+ação
- Eventos: `vehicle.created`, `vehicle.updated`, `vehicle.deleted`, etc.
- Consumer: persiste no MongoDB — campos: `entity`, `action`, `payload`, `userId`, `timestamp`
- Falha no publish não bloqueia a operação principal

---

## 8. Docker Compose

```yaml
# Serviços obrigatórios
- app (NestJS — multistage build)
- sqlserver
- redis

# Serviços bônus
- rabbitmq
- mongodb
```

Todos com healthcheck. App depende de sqlserver e redis saudáveis.

---

## 9. Entrega

- Repositório GitHub público
- `seed_vehicles.json` incluído no repositório
- `README.md` detalhado (objetivo, como rodar, como usar)
- Collection Insomnia exportada com todos os endpoints
- Swagger em `/api/docs`
- Scripts de execução claros
- Testes obrigatórios presentes e passando

---

## 10. SDD Workflow

```
/speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks → /speckit-implement
```

Cada etapa é aprovada antes de avançar. Nenhuma implementação sem spec aprovada.

---

## 11. TDD — Método

1. Escrever o teste ANTES da implementação — mostrar ao usuário e aguardar confirmação
2. Executar: confirmar que o teste FALHA (Red)
3. Implementar o mínimo para passar (Green)
4. Refatorar mantendo testes verdes (Refactor)
5. Só commitar com todos os testes passando

---

## 12. Estado Atual do Projeto

**Fase:** Planejamento inicial (SDD)
**Data:** 2026-06-05
**Testes:** 0 (projeto não iniciado)

### Próximos passos
1. `/speckit-specify` — criar spec completa com user stories
2. `/speckit-clarify` — resolver ambiguidades
3. `/speckit-plan` — arquitetura, data model, contratos de API
4. `/speckit-tasks` — lista de tarefas ordenadas por dependência
5. Implementação TDD por fase

---

## 13. Regras para o Claude neste projeto

1. **Nunca `synchronize: true`** — sempre TypeORM migrations
2. **TDD obrigatório**: escrever teste → mostrar falha → implementar → refatorar
3. **Nunca hardcodar** segredos — sempre `.env` via `@nestjs/config`
4. **Cache Redis** obrigatório nas consultas de vehicles
5. **Swagger** documentar todos os endpoints
6. **Insomnia collection** atualizar a cada novo endpoint
7. **Ao concluir item**, atualizar seção 12 (Estado Atual)
8. **Perguntar antes** de contradizer este documento
9. **Small releases** — commits coesos e funcionais, nunca trabalho pela metade
10. **Falha de auditoria** não bloqueia operação principal
11. **Constitution** em `.specify/memory/constitution.md` é lei — consultar antes de decidir arquitetura
