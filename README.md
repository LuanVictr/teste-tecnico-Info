# Aivacol Fleet Management — Backend

API REST para gerenciamento de frota de veículos, construída como teste técnico para a Aivacol.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 18+ |
| Framework | NestJS 11 |
| ORM | TypeORM (migrations only, `synchronize: false`) |
| Banco relacional | SQL Server 2022 |
| Cache | Redis 7 + cache-manager |
| Mensageria | RabbitMQ 3 (bônus) |
| Auditoria | MongoDB 7 + Mongoose (bônus) |
| Autenticação | JWT (`@nestjs/jwt`) |
| Documentação | Swagger (`@nestjs/swagger`) em `/api/docs` |
| Testes | Jest (TDD) |
| Container | Docker + Docker Compose (multistage) |

---

## Pré-requisitos

- Docker >= 24 e Docker Compose V2
- `make` (pré-instalado em Linux/macOS; no Windows use WSL ou Git Bash)

---

## Início rápido — um único comando

```bash
git clone <repo-url> && cd teste-tecnico-Info && make start
```

O `make start` faz automaticamente:
1. Cria o `.env` a partir do `.env.example` (se ainda não existir)
2. Faz build da imagem e sobe todos os 5 serviços
3. Aguarda healthchecks (SQL Server pode levar ~60 s na primeira vez)
4. Imprime as URLs de acesso

Na inicialização, a aplicação:
- Executa as 7 migrations TypeORM
- Cria o usuário `aivacol@aivacol.com` (idempotente)
- Cria as marcas Volkswagen, Fiat e Chevrolet com seus modelos Gol, Uno e Onix (idempotente) — necessários para o `seed_vehicles.json`

```
  Swagger UI : http://localhost:3000/api/docs
  RabbitMQ   : http://localhost:15672  (guest / guest)
```

### Outros comandos

```bash
make stop     # para os containers
make restart  # para e sobe novamente
make logs     # tail nos logs da app
make test     # roda os testes unitários (requer Node.js 18+)
make clean    # para e remove volumes (apaga dados)
```

---

## Desenvolvimento local

```bash
# Instale as dependências
npm install

# Suba apenas a infraestrutura (DB, Redis, RabbitMQ, MongoDB)
docker compose up -d sqlserver redis rabbitmq mongodb

# Configure o .env apontando para localhost
cp .env.example .env
# DB_HOST=localhost, REDIS_HOST=localhost etc.

# Inicie em modo watch
npm run start:dev
```

### Comandos úteis

```bash
npm run start:dev       # watch mode
npm run build           # compilar para dist/
npm run test            # testes unitários
npm run test:cov        # cobertura
npm run lint            # ESLint
```

---

## Variáveis de ambiente

Todas as variáveis estão documentadas em `.env.example`.

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PORT` | Porta HTTP da aplicação | `3000` |
| `JWT_SECRET` | Segredo de assinatura JWT | string aleatória longa |
| `JWT_EXPIRATION` | TTL do token | `1d` |
| `DB_HOST` | Host do SQL Server | `localhost` |
| `DB_PORT` | Porta do SQL Server | `1433` |
| `DB_USERNAME` | Usuário do banco | `sa` |
| `DB_PASSWORD` | Senha do banco | — |
| `DB_DATABASE` | Nome do banco | `fleet_management` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `REDIS_PASSWORD` | Senha do Redis | — |
| `CACHE_TTL_SECONDS` | TTL do cache de veículos | `60` |
| `SEED_USER_EMAIL` | E-mail do usuário seed | `aivacol@aivacol.com` |
| `SEED_USER_PASSWORD` | Senha do usuário seed | — |
| `RABBITMQ_URL` | URL de conexão RabbitMQ | `amqp://guest:guest@localhost:5672` |
| `MONGODB_URI` | URI do MongoDB | `mongodb://localhost:27017/fleet_audit` |

---

## Autenticação

Todas as rotas exigem `Authorization: Bearer <token>`, exceto `POST /auth/login`.

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aivacol@aivacol.com","password":"aivacol@123"}'
```

Resposta:
```json
{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Use o token em todas as requisições seguintes:
```bash
-H "Authorization: Bearer <access_token>"
```

---

## Endpoints

A documentação interativa completa está em **`/api/docs`** (Swagger UI).

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login — retorna JWT |

### Brands (marcas)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/brands` | Criar marca |
| GET | `/brands` | Listar (paginado) |
| GET | `/brands/:id` | Buscar por ID (inclui modelos) |
| PATCH | `/brands/:id` | Atualizar |
| DELETE | `/brands/:id` | Remover (soft delete) |

### Models (modelos de veículo)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/models` | Criar modelo |
| GET | `/models` | Listar (paginado) |
| GET | `/models/:id` | Buscar por ID |
| PATCH | `/models/:id` | Atualizar |
| DELETE | `/models/:id` | Remover (soft delete) |

### Vehicles (veículos)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/vehicles` | Registrar veículo |
| GET | `/vehicles` | Listar (paginado, com filtros + cache Redis) |
| GET | `/vehicles/:id` | Buscar por ID (cache Redis) |
| PATCH | `/vehicles/:id` | Atualizar (invalida cache) |
| DELETE | `/vehicles/:id` | Remover (soft delete, invalida cache) |

**Filtros disponíveis em `GET /vehicles`**: `page`, `limit`, `modelId`, `year`

### Users (usuários)
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/users` | Criar usuário |
| GET | `/users` | Listar (paginado) |
| GET | `/users/:id` | Buscar por ID |
| PATCH | `/users/:id` | Atualizar |
| DELETE | `/users/:id` | Remover (soft delete) |

---

## Cache Redis

- Aplicado em `GET /vehicles` e `GET /vehicles/:id`
- TTL configurável via `CACHE_TTL_SECONDS`
- Invalidado automaticamente em `POST`, `PATCH` e `DELETE /vehicles`
- Chaves: `vehicles:list:*` e `vehicles:detail:{id}`

---

## Mensageria e Auditoria (bônus)

Cada mutação nos recursos publica um evento no RabbitMQ:

- **Exchange**: `fleet.events` (topic)
- **Routing key**: `{entity}.{action}` — ex: `vehicle.created`, `model.updated`
- **Payload**: `{ entity, action, payload, userId, timestamp }`

O `AuditConsumer` consome a fila `audit_queue` (bound com wildcard `#`) e persiste cada evento no MongoDB, coleção `audit_logs`.

> A falha no RabbitMQ **não bloqueia** as operações principais — o publish é fire-and-forget.

**RabbitMQ Management UI**: `http://localhost:15672` (user: `guest`, pass: `guest`)

---

## Seed de veículos

O arquivo `seed_vehicles.json` contém 22 veículos de exemplo (placas nos formatos antigo e Mercosul).

Os modelos com IDs 1 (Gol), 2 (Uno) e 3 (Onix) são criados automaticamente na inicialização, então o seed funciona diretamente após o login:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aivacol@aivacol.com","password":"aivacol@123"}' \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

jq -c '.[]' seed_vehicles.json | while read vehicle; do
  curl -s -X POST http://localhost:3000/vehicles \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$vehicle"
done
```

---

## Testes

```bash
# Todos os testes unitários
npm run test

# Com cobertura
npm run test:cov

# Modo watch
npm run test:watch
```

Cobertura de: serviços, validações de negócio, guards JWT, publisher de eventos, consumer de auditoria.

---

## Insomnia

Importe `insomnia.json` na raiz do projeto no Insomnia para ter todos os endpoints pré-configurados com variáveis de ambiente.

---

## Arquitetura

```
Client ──HTTP :3000──► NestJS App
                         ├── JwtAuthGuard (global, APP_GUARD)
                         ├── ValidationPipe (global)
                         ├── AuthModule       → POST /auth/login
                         ├── UsersModule      → CRUD /users
                         ├── BrandsModule     → CRUD /brands
                         ├── ModelsModule     → CRUD /models
                         ├── VehiclesModule   → CRUD /vehicles + Redis cache
                         ├── MessagingModule  → EventPublisherService (amqplib)
                         └── AuditModule      → AuditConsumer + MongoDB
                       │
              ┌────────┼──────────────────────────────┐
              │        │                              │
           SQL Server  Redis                     RabbitMQ ──► MongoDB
           (TypeORM)  (cache-manager)            fleet.events   audit_logs
```

O diagrama completo do sistema está em `docs/system-design.excalidraw` (importar em excalidraw.com).

---

## Deploy em VPS (Hostinger)

```bash
# Na VPS, após clonar o repositório:
cp .env.example .env
# Configure senhas seguras no .env

docker compose up -d --build
```

Recomendações para produção:
- Use `NODE_ENV=production`
- Configure `JWT_SECRET` com string aleatória de 64+ caracteres
- Use senhas fortes para SQL Server, Redis e RabbitMQ
- Configure um reverse proxy (nginx/Caddy) na frente da porta 3000
