# Database Guide

This guide covers everything you need to know about the database layer in RaineStack: Prisma schema, PostgreSQL configuration, actor-tracked transactions, LISTEN/NOTIFY subscriptions, audit infrastructure, and scheduled cleanup jobs.

---

## Table of Contents

- [Overview](#overview)
- [PostgreSQL Setup](#postgresql-setup)
- [Prisma Schema](#prisma-schema)
- [Database Client](#database-client)
- [Actor-Tracked Transactions](#actor-tracked-transactions)
- [Real-Time Subscriptions](#real-time-subscriptions)
- [Audit Infrastructure](#audit-infrastructure)
- [Ephemeral Records](#ephemeral-records)
- [Migrations](#migrations)
- [Best Practices](#best-practices)

---

## Overview

RaineStack uses **PostgreSQL 18.1** with **Prisma 7.3** as the ORM. The database layer is packaged as `@rainestack/database` and provides:

- **Type-safe database client** — Generated Prisma client with full TypeScript support
- **Actor-tracked transactions** — Automatic audit attribution via `withActor()`
- **Real-time subscriptions** — LISTEN/NOTIFY for cross-instance change awareness
- **Audit trail** — Automatic change logging and soft deletes
- **Scheduled cleanup** — pg_cron job for expired ephemeral records

---

## PostgreSQL Setup

### Local Development

The project includes a custom PostgreSQL image with the `pg_cron` extension:

```bash
# Start PostgreSQL via Docker Compose
bun run db:start
```

**Configuration:**
- **Image:** Custom build (postgres:18.1 + pg_cron from source)
- **Port:** 5432
- **Database:** `dev_db`
- **User:** `dev_user`
- **Password:** `dev_password`
- **Timezone:** UTC

**Connection string:**
```
postgresql://dev_user:dev_password@localhost:5432/dev_db
```

### Why pg_cron?

The standard `postgres:18.1` image doesn't include `pg_cron`. The custom Dockerfile (`docker/Dockerfile.dev`) extends the official image and compiles pg_cron from source, enabling scheduled tasks directly in the database:

- **Daily cleanup** of expired ephemeral records (tokens, OTP codes, challenges)
- **No external scheduler required** — cron jobs run inside PostgreSQL
- **Transactional guarantees** — cleanup runs in a database transaction

### Production Setup

For production, ensure your PostgreSQL instance:
1. Runs PostgreSQL 18.1 or later
2. Has the `pg_cron` extension installed (optional but recommended)
3. Sets `shared_preload_libraries = 'pg_cron'` in `postgresql.conf`
4. Uses UTC timezone

---

## Prisma Schema

### Location

```
packages/database/prisma/schema.prisma
```

### Schema Structure

The schema defines two types of tables: **persistent** and **ephemeral**.

#### Persistent Tables

Long-lived domain entities that represent core application data:

| Table | Description |
|-------|-------------|
| `User` | User accounts with email, name, and avatar |
| `Post` | User-generated posts (example domain model) |
| `Account` | Linked OIDC accounts (Google, GitHub) |
| `Passkey` | WebAuthn passkeys for hardware-backed auth |
| `OAuthClient` | Registered OAuth 2.0 clients |
| `OAuthScope` | Available OAuth permission scopes |
| `OAuthConsent` | User consent records for OAuth clients |

**Characteristics:**
- ✅ Receive NOTIFY triggers (real-time change awareness)
- ✅ Tracked in audit tables (`audit.change_log`, `audit.deleted_records`)
- ❌ Do NOT have `expiresAt` column
- ❌ Do NOT get auto-purged

#### Ephemeral Tables

Short-lived, single-use artefacts with automatic expiration:

| Table | Description | Lifetime |
|-------|-------------|----------|
| `OtpCode` | One-time password codes for email auth | 10 minutes |
| `RefreshToken` | JWT refresh tokens | 30 days |
| `PasskeyChallenge` | WebAuthn authentication challenges | 5 minutes |
| `OAuthAuthorizationCode` | OAuth authorization codes | 10 minutes |
| `OAuthAccessToken` | OAuth access tokens | 1 hour |
| `OAuthRefreshToken` | OAuth refresh tokens | 30 days |

**Characteristics:**
- ✅ Have `expiresAt DateTime` column
- ✅ Auto-purged daily by pg_cron job
- ❌ Do NOT receive NOTIFY triggers (would create noise)
- ❌ Do NOT get tracked in audit tables (would bloat audit log)

### Example Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts         Post[]
  accounts      Account[]
  passkeys      Passkey[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime  // ← Ephemeral indicator
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])  // ← Required for efficient purge
  @@map("refresh_tokens")
}
```

---

## Database Client

### Singleton Client

The database package exports a singleton Prisma client:

```typescript
import { db } from '@rainestack/database';

const user = await db.user.findUnique({ where: { id: '123' } });
```

### Connection Architecture

The client uses `@prisma/adapter-pg` with a `pg.Pool` for efficient connection pooling:

```typescript
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@database/generated/prisma/client';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,  // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const adapter = new PrismaPg(pool);
export const db = new PrismaClient({ adapter });
```

**Benefits:**
- Efficient connection reuse
- Automatic connection recovery
- Better performance under load
- Compatible with PostgreSQL connection limits

### Multiple Connection Types

| Consumer | Connection Type | Purpose |
|----------|----------------|---------|
| Prisma Client | `pg.Pool` (pooled) | Application queries |
| DatabaseListener | `pg.Client` (dedicated) | Long-lived LISTEN connection |
| Prisma CLI | Direct | Migrations and introspection |
| Trigger Setup | `pg.Client` (one-shot) | Apply SQL triggers |

---

## Actor-Tracked Transactions

### Overview

Every database mutation must be wrapped in `withActor()` to set the current user context for audit triggers. This enables **automatic audit attribution** — every change knows who made it.

### The `withActor` Function

```typescript
import { withActor } from '@rainestack/database/actor';

// Set actor and run transaction
const post = await withActor(db, userId, async (tx) => {
  return tx.post.create({
    data: {
      title: 'Hello World',
      content: 'My first post'
    }
  });
});
```

**What it does:**
1. Starts an interactive transaction
2. Executes `SET LOCAL app.current_user_id = '<userId>'`
3. Runs your transaction callback
4. PostgreSQL triggers can access the user ID via `current_setting('app.current_user_id')`
5. Changes are logged to `audit.change_log` with actor attribution

### Usage in Data Layer

Data layer functions should accept `db` and `actorId` as parameters:

```typescript
// packages/server/src/data/posts.ts
import type { PrismaClient as Db } from '@rainestack/database';
import { withActor } from '@rainestack/database/actor';

export async function create(
  db: Db,
  actorId: string | null,
  data: CreatePostData
) {
  return withActor(db, actorId, async (tx) => {
    return tx.post.create({ data });
  });
}

export async function update(
  db: Db,
  actorId: string | null,
  id: string,
  data: UpdatePostData
) {
  return withActor(db, actorId, async (tx) => {
    return tx.post.update({ where: { id }, data });
  });
}
```

### Usage in Route Handlers

Route handlers use the pre-bound `context.withActor` helper:

```typescript
// packages/server/src/routes/posts.ts
export const createPost = authedProcedure
  .input(CreatePostInput)
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    // context.withActor is pre-bound with actorId from JWT
    return context.withActor(async (tx) => {
      return postsData.create(tx, input);
    });
  });
```

### Nesting withActor

`withActor` is **nestable** — if `db` is already a transaction client, it passes through without creating a new transaction:

```typescript
// Works correctly even when nested
await withActor(db, userId, async (tx1) => {
  await postsData.create(tx1, data1);  // ← Calls withActor internally
  await postsData.create(tx1, data2);  // ← Uses same transaction
});
```

### Anonymous Actors

If `actorId` is `null`, the session user (database connection user) is recorded as the actor:

```typescript
// For system-initiated changes or unauthenticated operations
await withActor(db, null, async (tx) => {
  return tx.post.create({ data });
});
```

---

## Real-Time Subscriptions

### DatabaseListener Class

The `DatabaseListener` provides LISTEN/NOTIFY subscriptions with automatic reconnection:

```typescript
import { listener } from '@rainestack/database';

// Subscribe to table changes
listener.on('post', (event) => {
  console.log('Post changed:', event);
  // { table: 'post', operation: 'INSERT', id: 'clx...', data: {...} }
});

listener.on('user', (event) => {
  console.log('User changed:', event);
});

// Start listening
await listener.connect();
```

### Event Structure

```typescript
interface NotifyEvent {
  table: string;        // Table name (e.g., 'post')
  operation: string;    // 'INSERT' | 'UPDATE' | 'DELETE'
  id: string;           // Record ID
  data: Record<string, unknown>;  // Changed record
}
```

### Use Cases

**1. Cache Invalidation**

```typescript
listener.on('post', (event) => {
  if (event.operation === 'UPDATE' || event.operation === 'DELETE') {
    cache.invalidate(`post:${event.id}`);
  }
});
```

**2. WebSocket Broadcasting**

```typescript
listener.on('post', (event) => {
  wsServer.broadcast({
    type: 'post:changed',
    id: event.id,
    operation: event.operation
  });
});
```

**3. Search Index Updates**

```typescript
listener.on('post', async (event) => {
  if (event.operation === 'DELETE') {
    await searchIndex.delete(event.id);
  } else {
    await searchIndex.upsert(event.id, event.data);
  }
});
```

### Auto-Reconnect

The listener automatically reconnects on connection loss with exponential backoff:

```typescript
listener.on('error', (error) => {
  console.error('Listener error:', error);
  // Automatically reconnects with backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
});

listener.on('reconnect', (attempt) => {
  console.log(`Reconnected after ${attempt} attempts`);
});
```

### Which Tables Emit Notifications?

Only **persistent tables** emit NOTIFY events:
- `users`
- `posts`
- `accounts`
- `passkeys`
- `oauth_clients`
- `oauth_scopes`
- `oauth_consents`

**Ephemeral tables do NOT emit notifications** to avoid noise.

---

## Audit Infrastructure

### Overview

The audit system automatically tracks:
1. **Column-level changes** — What changed, when, and by whom
2. **Soft deletes** — Full record snapshot before deletion

### Audit Schema

```sql
-- Change log for UPDATE operations
CREATE TABLE audit.change_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_values JSONB,
  new_values JSONB
);

-- Deleted records for DELETE operations
CREATE TABLE audit.deleted_records (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  deleted_by TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_data JSONB NOT NULL
);
```

### How It Works

**1. UPDATE Operations**

The `track_row_changes()` trigger compares old and new row values:

```sql
-- Only changed columns are logged
UPDATE users SET name = 'Alice' WHERE id = '123';

-- Logged to audit.change_log:
{
  "table_name": "users",
  "record_id": "123",
  "operation": "UPDATE",
  "changed_by": "user_clx...",  -- From SET LOCAL app.current_user_id
  "changed_at": "2024-01-15T10:30:00Z",
  "old_values": { "name": "Bob" },
  "new_values": { "name": "Alice" }
}
```

**2. DELETE Operations**

The `trash_deleted_row()` trigger snapshots the entire row:

```sql
DELETE FROM posts WHERE id = '456';

-- Logged to audit.deleted_records:
{
  "table_name": "posts",
  "record_id": "456",
  "deleted_by": "user_clx...",
  "deleted_at": "2024-01-15T10:35:00Z",
  "record_data": {
    "id": "456",
    "title": "My Post",
    "content": "...",
    "userId": "123",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-10T00:00:00Z"
  }
}
```

### Querying Audit Data

**View all changes for a record:**

```sql
SELECT * FROM audit.change_log
WHERE table_name = 'users' AND record_id = '123'
ORDER BY changed_at DESC;
```

**View all changes by a user:**

```sql
SELECT * FROM audit.change_log
WHERE changed_by = 'user_clx...'
ORDER BY changed_at DESC;
```

**Restore a deleted record:**

```sql
-- Get the record data
SELECT record_data FROM audit.deleted_records
WHERE table_name = 'posts' AND record_id = '456';

-- Manually restore (application logic)
INSERT INTO posts (id, title, content, ...)
VALUES (...);  -- Extract from record_data JSONB
```

### Actor Resolution

The `resolve_actor()` function determines who made the change:

1. **Check `app.current_user_id`** — Set by `withActor()`
2. **Fallback to `session_user`** — Database connection user
3. **Return as TEXT** — Stored in `changed_by` / `deleted_by`

```sql
CREATE OR REPLACE FUNCTION resolve_actor()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    RETURN current_setting('app.current_user_id', true);
  EXCEPTION WHEN OTHERS THEN
    RETURN session_user;
  END;
END;
$$;
```

---

## Ephemeral Records

### Purpose

Ephemeral records are **short-lived, single-use artefacts** that expire automatically:

- OTP codes for email authentication
- Refresh tokens for JWT renewal
- WebAuthn challenges for passkey auth
- OAuth authorization codes and tokens

### Identifying Ephemeral Tables

All ephemeral tables have:
1. An `expiresAt DateTime` column
2. An index on `expiresAt` for efficient cleanup
3. **No** NOTIFY triggers
4. **No** audit triggers

### Purge Function

The `purge_expired_ephemeral_records()` function deletes expired rows from all ephemeral tables:

```sql
CREATE OR REPLACE FUNCTION purge_expired_ephemeral_records()
RETURNS TABLE(table_name TEXT, rows_deleted BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- OTP codes
  DELETE FROM otp_codes WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'otp_codes'::TEXT, deleted_count;

  -- Refresh tokens
  DELETE FROM refresh_tokens WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'refresh_tokens'::TEXT, deleted_count;

  -- Passkey challenges
  DELETE FROM passkey_challenges WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'passkey_challenges'::TEXT, deleted_count;

  -- OAuth codes
  DELETE FROM oauth_authorization_codes WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'oauth_authorization_codes'::TEXT, deleted_count;

  -- OAuth access tokens
  DELETE FROM oauth_access_tokens WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'oauth_access_tokens'::TEXT, deleted_count;

  -- OAuth refresh tokens
  DELETE FROM oauth_refresh_tokens WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN QUERY SELECT 'oauth_refresh_tokens'::TEXT, deleted_count;
END;
$$;
```

### Scheduled Cleanup (pg_cron)

A daily cron job runs the purge function at 03:00 UTC:

```sql
-- Register cron job (applied by scripts/apply-triggers.ts)
SELECT cron.schedule(
  'purge-expired-ephemeral-records',
  '0 3 * * *',  -- Every day at 03:00 UTC
  $$SELECT purge_expired_ephemeral_records()$$
);
```

**Result:** Expired tokens, codes, and challenges are automatically removed daily.

### Manual Purge

You can manually trigger the purge function:

```sql
SELECT * FROM purge_expired_ephemeral_records();
```

**Output:**
```
table_name                    | rows_deleted
------------------------------|-------------
otp_codes                     | 42
refresh_tokens                | 15
passkey_challenges            | 8
oauth_authorization_codes     | 3
oauth_access_tokens           | 127
oauth_refresh_tokens          | 9
```

### Adding New Ephemeral Tables

When adding a new ephemeral table:

1. Add `expiresAt DateTime` column to Prisma schema
2. Add index on `expiresAt`
3. Update `purge_expired_ephemeral_records()` in `scripts/triggers.sql`
4. Run `bun run db:dev` to apply changes

**Example:**

```prisma
model NewEphemeralThing {
  id        String   @id @default(cuid())
  data      String
  expiresAt DateTime  // ← Required
  createdAt DateTime @default(now())

  @@index([expiresAt])  // ← Required for efficient purge
  @@map("new_ephemeral_things")
}
```

```sql
-- Add to purge function
DELETE FROM new_ephemeral_things WHERE expires_at < now();
GET DIAGNOSTICS deleted_count = ROW_COUNT;
RETURN QUERY SELECT 'new_ephemeral_things'::TEXT, deleted_count;
```

---

## Migrations

### Creating a Migration

When you modify the Prisma schema:

```bash
cd packages/database
bunx --bun prisma migrate dev --name add_user_bio
```

**This command:**
1. Generates a migration SQL file in `prisma/migrations/`
2. Applies the migration to your development database
3. Regenerates the Prisma client

### Applying Migrations in Production

```bash
bun run db:deploy
```

**This command:**
1. Applies all pending migrations
2. Regenerates the Prisma client
3. Applies database triggers and cron jobs

### Migration Files

```
packages/database/prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240102000000_add_user_bio/
│   └── migration.sql
└── migration_lock.toml
```

### Resetting the Database

**⚠️ Warning: This deletes all data!**

```bash
cd packages/database
bunx --bun prisma migrate reset
```

**This command:**
1. Drops the database
2. Recreates the database
3. Applies all migrations
4. Runs seed script (if configured)

---

## Best Practices

### 1. Always Use withActor for Mutations

```typescript
// ✅ Correct — audit attribution
await withActor(db, userId, async (tx) => {
  return tx.post.create({ data });
});

// ❌ Wrong — no audit trail
await db.post.create({ data });
```

### 2. Define Database Operations in Data Layer

```typescript
// ✅ Correct — data layer function
// packages/server/src/data/posts.ts
export async function findById(db: Db, id: string) {
  return db.post.findUnique({ where: { id } });
}

// ❌ Wrong — Prisma in route handler
// packages/server/src/routes/posts.ts
const post = await context.db.post.findUnique({ where: { id } });
```

### 3. Index Frequently Queried Columns

```prisma
model User {
  email String @unique  // ← Automatically indexed

  @@index([createdAt])  // ← Add index for sorting/filtering
}
```

### 4. Use Cascading Deletes

```prisma
model Post {
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**When user is deleted, all their posts are automatically deleted.**

### 5. Validate Dates at Application Layer

```typescript
import { toDate } from '@rainestack/tools/temporal';

// Convert Temporal.Instant to Date for Prisma
const expiresAt = toDate(
  Temporal.Now.instant().add({ minutes: 10 })
);

await db.otpCode.create({
  data: { code: '123456', expiresAt }
});
```

### 6. Use Transactions for Multi-Step Operations

```typescript
await withActor(db, userId, async (tx) => {
  const user = await tx.user.create({ data: userData });
  const account = await tx.account.create({
    data: { userId: user.id, provider: 'google', ... }
  });
  return { user, account };
});
```

### 7. Handle Prisma Errors Gracefully

```typescript
import { uniqueViolation, recordNotFound } from '@rainestack/database/errors';

try {
  return await postsData.create(db, actorId, data);
} catch (error) {
  const violation = uniqueViolation(error);
  if (violation) {
    throw new ORPCError('CONFLICT', {
      message: `Post with slug "${data.slug}" already exists`
    });
  }
  throw error;
}
```

---

## Summary

The RaineStack database layer provides:

- ✅ **Type-safe operations** with Prisma
- ✅ **Automatic audit trails** with actor attribution
- ✅ **Real-time change awareness** via LISTEN/NOTIFY
- ✅ **Efficient connection pooling** with pg.Pool
- ✅ **Scheduled cleanup** with pg_cron
- ✅ **Clear data lifecycle** (persistent vs. ephemeral)

By following the patterns and best practices in this guide, you can build robust, auditable, and maintainable database-driven applications.

---

**Next Steps:**
- [API Development](./api.md) — Build type-safe oRPC endpoints
- [Error Handling](./error-handling.md) — Handle Prisma errors gracefully
- [Temporal API](./temporal.md) — Work with dates and times