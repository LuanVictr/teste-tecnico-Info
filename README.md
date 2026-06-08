# Aivacol Fleet Management — Backend

API REST para gerenciamento de frota de veículos, construída como teste técnico para a Aivacol.

> **Credenciais de acesso (API + Frontend)**
>
> | Campo | Valor |
> |-------|-------|
> | E-mail | `aivacol@aivacol.com` |
> | Senha | `aivacol@123` |

---

## Índice

- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [O que acontece na inicialização](#o-que-acontece-na-inicialização)
- [Autenticação](#autenticação)
- [Endpoints](#endpoints)
- [Testando com Insomnia](#testando-com-insomnia)
- [Importar veículos de exemplo](#importar-veículos-de-exemplo)
- [Cache Redis](#cache-redis)
- [Mensageria e Auditoria](#mensageria-e-auditoria-bônus)
- [Rodando os testes](#rodando-os-testes)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Arquitetura](#arquitetura)
- [Deploy em VPS](#deploy-em-vps)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 18+ |
| Framework | NestJS 11 |
| ORM | TypeORM — migrations only (`synchronize: false`) |
| Banco relacional | SQL Server 2022 |
| Cache | Redis 7 + cache-manager |
| Mensageria | RabbitMQ 3 (bônus) |
| Auditoria | MongoDB 7 + Mongoose (bônus) |
| Autenticação | JWT (`@nestjs/jwt`) — todas as rotas protegidas |
| Documentação | Swagger em `/api/docs` |
| Testes | Jest (TDD) — 93 testes, 12 suites |
| Container | Docker + Docker Compose multistage |

---

## Pré-requisitos

### Docker _(obrigatório)_

Você precisa do **Docker** e do **Docker Compose V2** instalados.

| SO | Instalação |
|----|-----------|
| **Windows** | [Docker Desktop para Windows](https://docs.docker.com/desktop/install/windows-install/) — já inclui o Docker Compose |
| **macOS** | [Docker Desktop para Mac](https://docs.docker.com/desktop/install/mac-install/) — já inclui o Docker Compose |
| **Ubuntu / Debian** | [Guia oficial Linux](https://docs.docker.com/engine/install/ubuntu/) — instale também o [plugin Compose](https://docs.docker.com/compose/install/linux/) |

Verifique a instalação:

```bash
docker --version        # Docker version 24.x.x ou superior
docker compose version  # Docker Compose version v2.x.x ou superior
```

> **Windows sem WSL:** use o [Git Bash](https://git-scm.com/downloads) ou o terminal do Docker Desktop para rodar os comandos abaixo.

---

## Como rodar

Clone o repositório e entre na pasta:

```bash
git clone <repo-url>
cd teste-tecnico-Info
```

Escolha qualquer uma das três formas abaixo — todas são equivalentes e sobem API + Frontend juntos:

```bash
# Opção 1 — npm (qualquer SO com Node.js)
npm start

# Opção 2 — Make (Linux / macOS)
make start

# Opção 3 — shell script (Linux / macOS / Git Bash / WSL)
chmod +x start.sh
./start.sh
```

O `npm start` cria o `.env` automaticamente se ainda não existir, faz o build do Docker e sobe todos os serviços.

As três opções:

1. Criam o `.env` automaticamente a partir do `.env.example` (se ainda não existir)
2. Fazem o build das imagens Docker e sobem os 6 serviços (API, Frontend, SQL Server, Redis, RabbitMQ, MongoDB)
3. Imprimem as URLs quando tudo estiver pronto

> **Sobre o `.env.example`:** ele contém credenciais reais de demonstração (senhas, JWT secret, etc.) propositalmente commitadas no repositório. Isso é **intencional para este teste técnico** — o objetivo é que qualquer avaliador rode o projeto com zero configuração manual. Em um projeto de produção, o `.env.example` conteria apenas placeholders (`DB_PASSWORD=your-password-here`) e o `.env` real nunca seria versionado.

> **Primeira execução:** o SQL Server precisa de ~60 segundos para inicializar. A aplicação só sobe após o healthcheck do banco passar — você verá as URLs quando estiver tudo pronto.

```
  Swagger UI : http://localhost:3000/api/docs
  RabbitMQ   : http://localhost:15672  (guest / guest)
```

### Outros comandos Docker

| Comando | Descrição |
|---------|-----------|
| `npm stop` / `make stop` | Para os containers |
| `make restart` | Para e sobe novamente |
| `make logs` | Tail nos logs da aplicação |
| `make clean` | Para e **remove os volumes** (apaga os dados) |

---

### Desenvolvimento local (sem Docker)

Se preferir rodar API e frontend diretamente na sua máquina (você precisará ter SQL Server, Redis, RabbitMQ e MongoDB disponíveis e o `.env` configurado com os hosts corretos):

```bash
# Terminal 1 — API NestJS em watch mode (hot reload + logs em tempo real)
npm run api

# Terminal 2 — Frontend Vite em dev mode (HMR + logs)
npm run front
```

| Serviço | URL local |
|---------|-----------|
| API (NestJS) | http://localhost:3000 |
| Frontend (Vite) | http://localhost:3001 |
| Swagger | http://localhost:3000/api/docs |

> Para dev local, o Vite já inclui um proxy que redireciona `/api-proxy/*` → `http://localhost:3000`.

---

## O que acontece na inicialização

Ao subir pela primeira vez, a aplicação automaticamente:

1. **Executa as 7 migrations** TypeORM — cria todas as tabelas no SQL Server
2. **Cria o usuário seed** `aivacol@aivacol.com` (idempotente)
3. **Cria marcas e modelos iniciais** (idempotente):
   - Volkswagen → Gol (id 1)
   - Fiat → Uno (id 2)
   - Chevrolet → Onix (id 3)

Os modelos com IDs 1, 2, 3 são necessários para importar o `seed_vehicles.json`.

---

## Autenticação

Todas as rotas exigem `Authorization: Bearer <token>`, **exceto** `POST /auth/login`.

**Credenciais do usuário seed:**

| Campo | Valor |
|-------|-------|
| Email | `aivacol@aivacol.com` |
| Senha | `aivacol@123` |

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"aivacol@aivacol.com","password":"aivacol@123"}'
```

```json
{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Use o token em todas as requisições:

```bash
curl http://localhost:3000/vehicles \
  -H "Authorization: Bearer <access_token>"
```

---

## Frontend (bônus visual)

O painel frontend sobe automaticamente com o `make start` / `./start.sh`, servido pelo nginx na porta **8080**.

```
http://localhost:8080
```

**Credenciais de acesso:**
| Campo | Valor |
|-------|-------|
| E-mail | `aivacol@aivacol.com` |
| Senha | `aivacol@123` |

**Funcionalidades do painel:**
- Login real via `POST /auth/login` — JWT armazenado no browser
- Dashboard com KPIs animados (dados reais da API), gráfico de frota por modelo e status do sistema
- CRUD completo de Veículos, Modelos e Marcas (modais com validação, paginação real)
- Tabela de Usuários e listagem de todos os Endpoints da API
- Toasts de feedback para todas as operações

> O frontend é construído com **React + Vite** e consome a API em `http://localhost:3000`. Todos os dados são reais — sem mock.

---

## Endpoints

A documentação interativa completa (com exemplos e schemas) está no **Swagger UI**: `http://localhost:3000/api/docs`

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/login` | Login — retorna JWT |

### Brands
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/brands` | Criar marca |
| `GET` | `/brands` | Listar (paginado) |
| `GET` | `/brands/:id` | Buscar por ID — inclui modelos associados |
| `PATCH` | `/brands/:id` | Atualizar |
| `DELETE` | `/brands/:id` | Remover — 409 se houver modelos vinculados |

### Models
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/models` | Criar modelo — 404 se brand_id inexistente, 409 se nome duplicado na mesma marca |
| `GET` | `/models` | Listar (paginado) |
| `GET` | `/models/:id` | Buscar por ID |
| `PATCH` | `/models/:id` | Atualizar |
| `DELETE` | `/models/:id` | Remover — 409 se houver veículos vinculados |

### Vehicles
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/vehicles` | Registrar veículo |
| `GET` | `/vehicles` | Listar paginado — **cacheado no Redis** |
| `GET` | `/vehicles/:id` | Buscar por ID — **cacheado no Redis** |
| `PATCH` | `/vehicles/:id` | Atualizar — invalida cache |
| `DELETE` | `/vehicles/:id` | Remover — invalida cache |

Filtros disponíveis em `GET /vehicles`: `page`, `limit`, `modelId`, `year`

### Users
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/users` | Criar usuário — 409 se email duplicado |
| `GET` | `/users` | Listar (paginado) |
| `GET` | `/users/:id` | Buscar por ID |
| `PATCH` | `/users/:id` | Atualizar |
| `DELETE` | `/users/:id` | Remover (soft delete) |

---

## Testando com Insomnia

A collection com **30 requests** prontos está no arquivo `insomnia.json` na raiz do projeto.

### Como importar

1. Abra o [Insomnia](https://insomnia.rest/download)
2. Clique em **File → Import** (ou arraste o arquivo para a janela)
3. Selecione o arquivo `insomnia.json`
4. Selecione o ambiente **Local** (`http://localhost:3000`)

### Como usar

1. Abra a pasta **Autenticação** e execute o request **Login**
2. O `access_token` é salvo automaticamente na variável de ambiente `token`
3. Todos os demais requests já enviam o header `Authorization: Bearer {{token}}` automaticamente — não é preciso copiar o token manualmente

### O que está incluído

| Pasta | Requests |
|-------|----------|
| Autenticação | Login (credenciais válidas e inválidas) |
| Veículos | Listar, filtrar por modelId/year, buscar por ID, criar, atualizar, deletar |
| Modelos | CRUD completo + exemplos de erro (brand_id inválido, nome duplicado) |
| Marcas | CRUD completo + exemplo de conflito ao deletar com modelos vinculados |
| Usuários | CRUD completo |

---

## Importar veículos de exemplo

O arquivo `seed_vehicles.json` contém 22 veículos com placas nos formatos antigo (`ABC-1234`) e Mercosul (`ABC1D23`).

Com `jq` e `curl` instalados, importe tudo de uma vez:

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

## Cache Redis

- Ativo em `GET /vehicles` e `GET /vehicles/:id`
- TTL configurável via `CACHE_TTL_SECONDS` no `.env` (padrão: 60 s)
- Invalidado automaticamente em `POST`, `PATCH` e `DELETE /vehicles`
- Chaves: `vehicles:list:<filtros>` e `vehicles:detail:<id>`

Inspecionar cache ao vivo:

```bash
docker exec aivacol-fleet-redis \
  redis-cli -a YourStrong@Passw0rd KEYS "vehicles:*"
```

---

## Mensageria e Auditoria (bônus)

Cada mutação (`created`, `updated`, `deleted`) publica um evento no RabbitMQ:

- **Exchange**: `fleet.events` — tipo `topic`
- **Routing key**: `{entity}.{action}` — ex: `vehicle.created`, `model.updated`
- **Payload**: `{ entity, action, payload, userId, timestamp }`

O `AuditConsumer` consome a fila `audit_queue` (wildcard `#`) e persiste em `audit_logs` no MongoDB.

> Falha no RabbitMQ **não bloqueia** as operações — publish é fire-and-forget.

**RabbitMQ Management UI**: `http://localhost:15672` — `guest` / `guest`

Verificar logs de auditoria no MongoDB:

```bash
docker exec aivacol-fleet-mongodb \
  mongosh fleet_audit --eval 'db.audit_logs.find().limit(5).pretty()'
```

---

## Rodando os testes

Requer Node.js 18+ instalado localmente.

```bash
npm install
npm run test        # 93 testes unitários
npm run test:cov    # com relatório de cobertura
```

Cobertura: auth, users, brands, models, vehicles, cache, pagination, EventPublisherService, AuditConsumer.

---

## Variáveis de ambiente

O `.env.example` já contém **todos os valores preenchidos** (incluindo senhas e secrets) para rodar localmente sem nenhuma configuração adicional. O script copia esse arquivo automaticamente para `.env` na primeira execução.

> ⚠️ **Nota de segurança:** credenciais no `.env.example` são **intencionais neste teste técnico** para que qualquer avaliador rode o projeto com um único comando. Em um projeto real, o `.env.example` teria apenas placeholders e o `.env` nunca seria commitado.

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta HTTP | `3000` |
| `JWT_SECRET` | Segredo de assinatura JWT | — |
| `JWT_EXPIRATION` | TTL do token | `1d` |
| `DB_HOST` | Host do SQL Server | `localhost` |
| `DB_PORT` | Porta do SQL Server | `1433` |
| `DB_USERNAME` | Usuário do banco | `sa` |
| `DB_PASSWORD` | Senha do banco | — |
| `DB_DATABASE` | Nome do banco | `fleet_management` |
| `REDIS_HOST` | Host do Redis | `localhost` |
| `REDIS_PORT` | Porta do Redis | `6379` |
| `REDIS_PASSWORD` | Senha do Redis | — |
| `CACHE_TTL_SECONDS` | TTL do cache de veículos (segundos) | `60` |
| `SEED_USER_EMAIL` | E-mail do usuário seed | `aivacol@aivacol.com` |
| `SEED_USER_PASSWORD` | Senha do usuário seed | — |
| `RABBITMQ_URL` | URL de conexão RabbitMQ | `amqp://guest:guest@...` |
| `MONGODB_URI` | URI do MongoDB | `mongodb://...` |

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

O diagrama completo está em `docs/system-design.excalidraw` — importe em [excalidraw.com](https://excalidraw.com).

---

## Deploy em VPS

```bash
git clone <repo-url>
cd teste-tecnico-Info
cp .env.example .env

# Edite .env com senhas seguras antes de continuar
nano .env

docker compose up -d --build
```

Recomendações para produção:

- `JWT_SECRET` com no mínimo 64 caracteres aleatórios
- Senhas únicas e fortes para SQL Server, Redis e RabbitMQ
- Reverse proxy nginx ou Caddy na frente da porta 3000
- `NODE_ENV=production` no `.env`
