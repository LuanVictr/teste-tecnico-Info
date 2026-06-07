# Data Model: Aivacol Fleet Management Backend

**Feature**: 001-fleet-management-backend
**Database**: SQL Server
**ORM**: TypeORM (`synchronize: false` — all changes via migrations)

---

## Entity Relationship Overview

```
users (bonus)
  │
  ├── created models (1:N via created_by)
  ├── created vehicles (1:N via created_by)
  └── created brands (1:N via created_by)

brands (bonus)
  └── has models (1:N via brand_id)

models
  └── has vehicles (1:N via model_id)

vehicles
  └── cached in Redis (GET /vehicles, GET /vehicles/:id)

audit_logs (MongoDB — bonus)
  └── records every mutation event
```

---

## SQL Server Tables

### `users` (bonus — but referenced by created_by in all entities)

```sql
CREATE TABLE users (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  nickname    NVARCHAR(50)  NOT NULL,
  name        NVARCHAR(150) NOT NULL,
  email       NVARCHAR(255) NOT NULL UNIQUE,
  password    NVARCHAR(255) NOT NULL,   -- bcrypt hash
  created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  deleted_at  DATETIME2     NULL
);
```

**Notes:**
- `email` is unique across all users
- `password` stores bcrypt hash (never plaintext)
- `password` is never returned in any API response
- Seed user: `aivacol` — inserted on first startup via seeder

---

### `brands` (bonus)

```sql
CREATE TABLE brands (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(100) NOT NULL UNIQUE,
  created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  created_by  INT           NULL REFERENCES users(id),
  deleted_at  DATETIME2     NULL
);
```

**Notes:**
- `name` is unique across brands
- `created_by` is nullable to support pre-users-module operation
- Cannot be deleted if models are associated (409 with count in message)

---

### `models`

```sql
CREATE TABLE models (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(100) NOT NULL,
  brand_id    INT           NULL REFERENCES brands(id),
  created_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
  created_by  INT           NULL REFERENCES users(id),
  deleted_at  DATETIME2     NULL
);
```

**Notes:**
- `brand_id` is nullable (bonus field; present even in non-bonus mode, just null)
- `name` does not need to be globally unique (e.g., "Uno" exists for Fiat — disambiguated by brand)
- Cannot be deleted if vehicles are associated (409 with count in message)

---

### `vehicles`

```sql
CREATE TABLE vehicles (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  license_plate NVARCHAR(10)  NOT NULL UNIQUE,
  chassis       NVARCHAR(17)  NOT NULL UNIQUE,
  renavam       NVARCHAR(11)  NOT NULL UNIQUE,
  year          SMALLINT      NOT NULL,
  model_id      INT           NOT NULL REFERENCES models(id),
  created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
  created_by    INT           NULL REFERENCES users(id),
  deleted_at    DATETIME2     NULL
);

CREATE INDEX IX_vehicles_model_id ON vehicles(model_id);
CREATE INDEX IX_vehicles_year     ON vehicles(year);
```

**Notes:**
- `license_plate`: max 10 chars covers both old (ABC-1234) and Mercosul (ABC1D23) formats
- `chassis`: standard 17-char VIN
- `renavam`: 11-digit Brazilian vehicle registration number
- `year` range: 1900 to current year + 1 (validated in DTO)
- Index on `model_id` and `year` supports the filter query params

---

## MongoDB Collection (Bonus)

### `audit_logs`

```javascript
{
  _id:       ObjectId,
  entity:    String,    // "vehicle" | "model" | "brand" | "user"
  action:    String,    // "created" | "updated" | "deleted"
  payload:   Mixed,     // snapshot of the affected record
  userId:    Number,    // FK to SQL Server users.id (denormalized)
  timestamp: Date       // auto-set on insert
}
```

**Notes:**
- Immutable — no update or delete operations on this collection
- `payload` is a JSON snapshot of the full entity state after the operation
- `userId` is nullable (for operations before users module)

---

## Redis Cache Keys

| Key Pattern | Type | Content | Invalidated by |
|-------------|------|---------|----------------|
| `vehicles:list:{params-hash}` | String (JSON) | Paginated list response | Any vehicle mutation |
| `vehicles:detail:{id}` | String (JSON) | Single vehicle response | Update or delete of that vehicle |

**Params hash**: URL query string serialized alphabetically — e.g., `limit=20&modelId=3&page=1&year=2022`.

---

## TypeORM Entity Definitions (TypeScript shape)

### User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 50 })   nickname: string;
  @Column({ length: 150 })  name: string;
  @Column({ unique: true })  email: string;
  @Column()                  password: string;       // bcrypt hash
  @CreateDateColumn()        created_at: Date;
  @UpdateDateColumn()        updated_at: Date;
  @DeleteDateColumn()        deleted_at: Date;
}
```

### Brand Entity (bonus)
```typescript
@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()              id: number;
  @Column({ length: 100, unique: true }) name: string;
  @CreateDateColumn()                    created_at: Date;
  @UpdateDateColumn()                    updated_at: Date;
  @Column({ nullable: true })            created_by: number;
  @ManyToOne(() => User, { nullable: true })  creator: User;
  @OneToMany(() => Model, m => m.brand)       models: Model[];
  @DeleteDateColumn()                    deleted_at: Date;
}
```

### Model Entity
```typescript
@Entity('models')
export class Model {
  @PrimaryGeneratedColumn()  id: number;
  @Column({ length: 100 })   name: string;
  @Column({ nullable: true }) brand_id: number;
  @ManyToOne(() => Brand, { nullable: true }) brand: Brand;
  @CreateDateColumn()        created_at: Date;
  @UpdateDateColumn()        updated_at: Date;
  @Column({ nullable: true }) created_by: number;
  @ManyToOne(() => User, { nullable: true }) creator: User;
  @OneToMany(() => Vehicle, v => v.model) vehicles: Vehicle[];
  @DeleteDateColumn()        deleted_at: Date;
}
```

### Vehicle Entity
```typescript
@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()                  id: number;
  @Column({ length: 10, unique: true })      license_plate: string;
  @Column({ length: 17, unique: true })      chassis: string;
  @Column({ length: 11, unique: true })      renavam: string;
  @Column('smallint')                        year: number;
  @Column()                                  model_id: number;
  @ManyToOne(() => Model, { eager: false })  model: Model;
  @CreateDateColumn()                        created_at: Date;
  @UpdateDateColumn()                        updated_at: Date;
  @Column({ nullable: true })                created_by: number;
  @ManyToOne(() => User, { nullable: true }) creator: User;
  @DeleteDateColumn()                        deleted_at: Date;
}
```

### AuditLog Schema (Mongoose — bonus)
```typescript
@Schema({ collection: 'audit_logs', timestamps: false })
export class AuditLog {
  @Prop({ required: true }) entity: string;
  @Prop({ required: true }) action: string;
  @Prop({ type: Object })   payload: Record<string, unknown>;
  @Prop()                   userId: number;
  @Prop({ default: () => new Date() }) timestamp: Date;
}
```

---

## Validation Rules (DTO level)

| Field | Rule |
|-------|------|
| `year` | `@Min(1900)` `@Max(currentYear + 1)` `@IsInt()` |
| `license_plate` | `@IsNotEmpty()` `@MaxLength(10)` |
| `chassis` | `@IsNotEmpty()` `@Length(17, 17)` |
| `renavam` | `@IsNotEmpty()` `@Length(11, 11)` |
| `model_id` | `@IsInt()` `@IsPositive()` |
| `email` | `@IsEmail()` |
| `password` | `@MinLength(6)` |
| `name` / `nickname` | `@IsNotEmpty()` `@IsString()` |
| `page` | `@IsOptional()` `@IsInt()` `@Min(1)` default `1` |
| `limit` | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(100)` default `20` |
| `modelId` (filter) | `@IsOptional()` `@IsInt()` `@IsPositive()` |
| `year` (filter) | `@IsOptional()` `@IsInt()` `@Min(1900)` |
