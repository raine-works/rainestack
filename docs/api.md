# API Development

This guide covers building type-safe APIs in RaineStack using **oRPC** (OpenAPI-compatible RPC framework), contract-first development, automatic client generation, and integration with TanStack Query.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Creating API Endpoints](#creating-api-endpoints)
- [Data Layer](#data-layer)
- [Route Layer](#route-layer)
- [Input Validation](#input-validation)
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [Client Usage](#client-usage)
- [OpenAPI Specification](#openapi-specification)
- [Best Practices](#best-practices)

---

## Overview

RaineStack uses **oRPC** for contract-first API development. Every endpoint is:

- **Type-safe** — Full TypeScript inference from server to client
- **Validated** — Zod schemas for input/output validation
- **Documented** — Automatic OpenAPI 3.x specification generation
- **Testable** — Pure functions with dependency injection

### Benefits

- ✅ **Single source of truth** — Define once, use everywhere
- ✅ **No code generation** — Types flow directly from schemas
- ✅ **Runtime validation** — Inputs validated before reaching handlers
- ✅ **API documentation** — OpenAPI spec generated automatically
- ✅ **Type-safe client** — Frontend gets full autocomplete and type checking

---

## Architecture

### Request Flow

```
Client Request
    ↓
Bun HTTP Server (port 3000)
    ↓
oRPC Router (/api/*)
    ↓
Middleware Stack
    ├─ Database Middleware (inject db, listener)
    ├─ Request Middleware (logging, request ID)
    ├─ Auth Middleware (verify JWT, inject user)
    └─ Actor Middleware (inject actorId, withActor helper)
    ↓
Route Handler
    ├─ Input Validation (Zod)
    ├─ Authorization Check (user permissions)
    └─ Data Layer Function
        ↓
    Database Operation (Prisma)
        ↓
    Response (validated against output schema)
```

### Directory Structure

```
packages/server/src/
├── data/              # Data layer — pure database operations
│   ├── users.ts
│   ├── posts.ts
│   ├── accounts.ts
│   └── ...
├── routes/            # Route layer — oRPC endpoint definitions
│   ├── auth.ts
│   ├── users.ts
│   ├── posts.ts
│   └── index.ts       # Root router
├── lib/
│   ├── orpc.ts        # Base procedures (public, authed)
│   ├── schemas.ts     # Zod schemas
│   ├── middleware.ts  # Middleware functions
│   └── ...
└── index.ts           # Server entry point
```

---

## Creating API Endpoints

### Step 1: Define Data Layer Function

All database operations go in `src/data/`:

```typescript
// packages/server/src/data/posts.ts
import type { PrismaClient as Db } from '@rainestack/database';
import { withActor } from '@rainestack/database/actor';

export interface CreatePostData {
  title: string;
  content: string;
  published?: boolean;
}

export async function create(
  db: Db,
  actorId: string | null,
  data: CreatePostData
) {
  return withActor(db, actorId, async (tx) => {
    return tx.post.create({
      data: {
        title: data.title,
        content: data.content,
        published: data.published ?? false,
        userId: actorId!  // Non-null asserted (checked in route)
      }
    });
  });
}

export async function findById(db: Db, id: string) {
  return db.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });
}

export async function findMany(db: Db, userId?: string) {
  return db.post.findMany({
    where: userId ? { userId } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function update(
  db: Db,
  actorId: string | null,
  id: string,
  data: Partial<CreatePostData>
) {
  return withActor(db, actorId, async (tx) => {
    return tx.post.update({
      where: { id },
      data
    });
  });
}

export async function remove(
  db: Db,
  actorId: string | null,
  id: string
) {
  return withActor(db, actorId, async (tx) => {
    return tx.post.delete({
      where: { id }
    });
  });
}
```

**Key principles:**
- Accept `db` parameter (PrismaClient or transaction client)
- Accept `actorId` for mutations
- Use `withActor()` for all write operations
- Return Prisma types (no transformations)
- Keep functions pure (no side effects)

### Step 2: Define Zod Schemas

All schemas go in `src/lib/schemas.ts`:

```typescript
// packages/server/src/lib/schemas.ts
import { z } from 'zod';

// Output schema (full model)
export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  published: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),  // ISO-8601 string
  updatedAt: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    avatar: z.string().nullable()
  }).optional()
});

// Input schema (create/update)
export const CreatePostInput = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  published: z.boolean().optional()
});

export const UpdatePostInput = CreatePostInput.partial();

// Params schema (path/query parameters)
export const PostIdParams = z.object({
  id: z.string()
});

export const PostListParams = z.object({
  userId: z.string().optional()
});
```

**Naming conventions:**
- `*Schema` — Full model shape (outputs)
- `*Input` — Create/update payloads
- `*Params` — Path/query parameters

### Step 3: Create oRPC Routes

All routes go in `src/routes/`:

```typescript
// packages/server/src/routes/posts.ts
import { authedProcedure, publicProcedure } from '@server/lib/orpc';
import * as postsData from '@server/data/posts';
import {
  PostSchema,
  CreatePostInput,
  UpdatePostInput,
  PostIdParams,
  PostListParams
} from '@server/lib/schemas';
import { ORPCError } from '@orpc/server';
import { recordNotFound, uniqueViolation } from '@rainestack/database/errors';
import { z } from 'zod';

// List posts (public)
export const list = publicProcedure
  .input(PostListParams)
  .output(z.array(PostSchema))
  .handler(async ({ input, context }) => {
    const posts = await postsData.findMany(
      context.db,
      input.userId
    );
    return posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }));
  });

// Get post by ID (public)
export const getById = publicProcedure
  .input(PostIdParams)
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    const post = await postsData.findById(context.db, input.id);
    
    if (!post) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Post not found'
      });
    }
    
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  });

// Create post (authenticated)
export const create = authedProcedure
  .input(CreatePostInput)
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    try {
      const post = await context.withActor(async (tx) => {
        return postsData.create(tx, context.actorId, input);
      });
      
      return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      };
    } catch (error) {
      const violation = uniqueViolation(error);
      if (violation) {
        throw new ORPCError('CONFLICT', {
          message: `Post with slug already exists`
        });
      }
      throw error;
    }
  });

// Update post (authenticated)
export const update = authedProcedure
  .input(PostIdParams.merge(UpdatePostInput))
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    const { id, ...data } = input;
    
    try {
      const post = await context.withActor(async (tx) => {
        // Verify ownership
        const existing = await postsData.findById(tx, id);
        if (!existing) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Post not found'
          });
        }
        
        if (existing.userId !== context.user.id) {
          throw new ORPCError('FORBIDDEN', {
            message: 'You do not have permission to edit this post'
          });
        }
        
        return postsData.update(tx, context.actorId, id, data);
      });
      
      return {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString()
      };
    } catch (error) {
      if (recordNotFound(error)) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Post not found'
        });
      }
      throw error;
    }
  });

// Delete post (authenticated)
export const remove = authedProcedure
  .input(PostIdParams)
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context }) => {
    try {
      await context.withActor(async (tx) => {
        // Verify ownership
        const existing = await postsData.findById(tx, input.id);
        if (!existing) {
          throw new ORPCError('NOT_FOUND', {
            message: 'Post not found'
          });
        }
        
        if (existing.userId !== context.user.id) {
          throw new ORPCError('FORBIDDEN', {
            message: 'You do not have permission to delete this post'
          });
        }
        
        await postsData.remove(tx, context.actorId, input.id);
      });
      
      return { success: true };
    } catch (error) {
      if (recordNotFound(error)) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Post not found'
        });
      }
      throw error;
    }
  });

// Export router
export const postRouter = {
  list,
  getById,
  create,
  update,
  remove
};
```

### Step 4: Register in Root Router

```typescript
// packages/server/src/routes/index.ts
import { publicProcedure } from '@server/lib/orpc';
import { postRouter } from './posts';
import { userRouter } from './users';
import { authRouter } from './auth';

export const router = {
  auth: authRouter,
  posts: postRouter,
  users: userRouter,
  
  // Health check
  healthz: publicProcedure
    .handler(() => ({ status: 'ok' }))
};

export type Router = typeof router;
```

---

## Data Layer

### Principles

1. **Accept `db` parameter** — Makes functions testable and transaction-friendly
2. **Accept `actorId` for mutations** — Required for audit attribution
3. **Use `withActor()` for writes** — Ensures audit trail
4. **Return Prisma types** — No transformations (keep it pure)
5. **No side effects** — No logging, no external API calls

### Example Structure

```typescript
// packages/server/src/data/users.ts
import type { PrismaClient as Db } from '@rainestack/database';
import { withActor } from '@rainestack/database/actor';

// Read operations (no actor needed)
export async function findById(db: Db, id: string) {
  return db.user.findUnique({ where: { id } });
}

export async function findByEmail(db: Db, email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function findMany(db: Db) {
  return db.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

// Write operations (actor required)
export async function create(
  db: Db,
  actorId: string | null,
  data: { email: string; name?: string; avatar?: string }
) {
  return withActor(db, actorId, async (tx) => {
    return tx.user.create({ data });
  });
}

export async function update(
  db: Db,
  actorId: string | null,
  id: string,
  data: { name?: string; avatar?: string }
) {
  return withActor(db, actorId, async (tx) => {
    return tx.user.update({ where: { id }, data });
  });
}

export async function remove(
  db: Db,
  actorId: string | null,
  id: string
) {
  return withActor(db, actorId, async (tx) => {
    return tx.user.delete({ where: { id } });
  });
}
```

---

## Route Layer

### Procedures

**`publicProcedure`** — No authentication required

```typescript
export const list = publicProcedure
  .input(ListParams)
  .output(z.array(ItemSchema))
  .handler(async ({ input, context }) => {
    // context.user is null
    // context.actorId is null
  });
```

**`authedProcedure`** — JWT authentication required

```typescript
export const create = authedProcedure
  .input(CreateInput)
  .output(ItemSchema)
  .handler(async ({ input, context }) => {
    // context.user is User (guaranteed)
    // context.actorId is string (user ID)
  });
```

### Context

The context object provides:

```typescript
interface Context {
  // Database
  db: PrismaClient;
  listener: DatabaseListener;
  
  // Logging
  log: Logger;  // Request-scoped Pino logger
  requestId: string;
  
  // Auth (authedProcedure only)
  user: User;
  jwtPayload: JWTPayload;
  actorId: string;
  
  // Helpers
  withActor: <T>(callback: (tx: PrismaClient) => Promise<T>) => Promise<T>;
  abortable: <T>(signal: AbortSignal, callback: (tx: PrismaClient) => Promise<T>) => Promise<T>;
}
```

---

## Input Validation

### Zod Schemas

All inputs are validated with Zod before reaching handlers:

```typescript
const CreateUserInput = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional()
});

export const create = authedProcedure
  .input(CreateUserInput)
  .handler(async ({ input, context }) => {
    // input is fully validated and typed
    // TypeScript knows: input.email is string
  });
```

### Custom Validation

Add `.refine()` for complex validation:

```typescript
const CreatePostInput = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  publishedAt: z.string().datetime().optional()
}).refine(
  (data) => {
    if (data.publishedAt) {
      return new Date(data.publishedAt) > new Date();
    }
    return true;
  },
  { message: 'Published date must be in the future' }
);
```

---

## Error Handling

### oRPC Error Codes

```typescript
throw new ORPCError('NOT_FOUND', {
  message: 'Resource not found'
});
```

**Available codes:**
- `BAD_REQUEST` — Invalid input (400)
- `UNAUTHORIZED` — Not authenticated (401)
- `FORBIDDEN` — Not authorized (403)
- `NOT_FOUND` — Resource not found (404)
- `CONFLICT` — Resource conflict (409)
- `INTERNAL_SERVER_ERROR` — Server error (500)

### Prisma Error Handling

Use error utilities from `@rainestack/database/errors`:

```typescript
import { uniqueViolation, recordNotFound } from '@rainestack/database/errors';

try {
  return await usersData.create(db, actorId, input);
} catch (error) {
  // Check for unique constraint violation
  const violation = uniqueViolation(error);
  if (violation) {
    throw new ORPCError('CONFLICT', {
      message: `User with email "${input.email}" already exists`
    });
  }
  
  // Check for record not found
  if (recordNotFound(error)) {
    throw new ORPCError('NOT_FOUND', {
      message: 'User not found'
    });
  }
  
  // Re-throw unknown errors
  throw error;
}
```

---

## Authentication

### Middleware

The `authMiddleware` verifies JWT access tokens:

```typescript
// packages/server/src/lib/middleware.ts
export const authMiddleware = async (context: Context) => {
  const authorization = context.request.headers.get('authorization');
  
  if (!authorization?.startsWith('Bearer ')) {
    return null;  // No token
  }
  
  const token = authorization.slice(7);
  
  try {
    const payload = await verifyJWT(token);
    const user = await context.db.user.findUnique({
      where: { id: payload.sub }
    });
    
    if (!user) return null;
    
    return { user, jwtPayload: payload };
  } catch (error) {
    return null;  // Invalid token
  }
};
```

### Procedures

**`publicProcedure`** — Optional auth

```typescript
export const publicProcedure = baseProcedure.use(authMiddleware);

// context.user can be null
```

**`authedProcedure`** — Required auth

```typescript
export const authedProcedure = publicProcedure.use((context) => {
  if (!context.user) {
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Authentication required'
    });
  }
  return context;
});

// context.user is guaranteed non-null
```

---

## Client Usage

### Creating the Client

```typescript
// packages/web/src/lib/api.ts
import { createApiClient } from '@rainestack/api';
import type { Router } from '@rainestack/api/router';

export const api = await createApiClient<Router>(location.origin);
```

### Making Requests

```typescript
// List posts
const posts = await api.posts.list({ userId: '123' });
//    ^? Post[]

// Get post by ID
const post = await api.posts.getById({ id: '456' });
//    ^? Post

// Create post (requires auth)
const newPost = await api.posts.create({
  title: 'Hello World',
  content: 'My first post'
});

// Update post
const updated = await api.posts.update({
  id: '456',
  title: 'Updated Title'
});

// Delete post
const result = await api.posts.remove({ id: '456' });
//    ^? { success: boolean }
```

### TanStack Query Integration

```typescript
import { orpc } from '@web/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';

function PostList() {
  // Query
  const { data: posts, isLoading } = orpc.posts.list.useQuery({
    input: {}
  });
  
  // Mutation
  const createPost = orpc.posts.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      orpc.posts.list.invalidate();
    }
  });
  
  return (
    <div>
      {posts?.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
      
      <button onClick={() => createPost.mutate({
        title: 'New Post',
        content: 'Content'
      })}>
        Create Post
      </button>
    </div>
  );
}
```

---

## OpenAPI Specification

### Accessing the Spec

The OpenAPI 3.x specification is auto-generated and available at:

```
http://localhost:3000/api/openapi.json
```

### Viewing in Scalar

The docs home page links to Scalar for interactive API exploration:

```
https://client.scalar.com/?url=http://localhost:3000/api/openapi.json
```

### Contract Router

The oRPC contract router is available at:

```
http://localhost:3000/api/contract.json
```

This is used by `createApiClient()` to generate the type-safe client.

---

## Best Practices

### 1. Keep Routes Thin

Business logic goes in the data layer, not routes:

```typescript
// ❌ Bad — logic in route
export const create = authedProcedure
  .handler(async ({ input, context }) => {
    const slug = input.title.toLowerCase().replace(/\s+/g, '-');
    const post = await context.db.post.create({
      data: { ...input, slug }
    });
    return post;
  });

// ✅ Good — logic in data layer
export const create = authedProcedure
  .handler(async ({ input, context }) => {
    return postsData.create(context.db, context.actorId, input);
  });
```

### 2. Validate Early

Use Zod schemas to catch invalid inputs before processing:

```typescript
const CreatePostInput = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1)
});

// Invalid inputs are rejected before handler runs
```

### 3. Use Discriminated Unions

For endpoints with multiple response types:

```typescript
const ResultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('success'), data: ItemSchema }),
  z.object({ type: z.literal('error'), error: z.string() })
]);
```

### 4. Document with JSDoc

Add JSDoc comments for better IDE support:

```typescript
/**
 * Create a new post.
 * 
 * @requires Authentication
 * @throws {ORPCError} CONFLICT if slug already exists
 */
export const create = authedProcedure
  .input(CreatePostInput)
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    // ...
  });
```

### 5. Version Your API

For breaking changes, create new routes:

```typescript
export const router = {
  v1: {
    posts: postRouterV1
  },
  v2: {
    posts: postRouterV2
  }
};
```

---

## Summary

The RaineStack API architecture provides:

- ✅ **End-to-end type safety** from server to client
- ✅ **Automatic validation** with Zod schemas
- ✅ **OpenAPI documentation** generated automatically
- ✅ **Clean separation** between routes and data layer
- ✅ **Audit trails** via `withActor()` wrapper
- ✅ **Error handling** with Prisma error utilities

By following these patterns, you can build robust, maintainable, and self-documenting APIs.

---

**Next Steps:**
- [Authentication](./authentication.md) — JWT, OIDC, and passkey flows
- [Error Handling](./error-handling.md) — Advanced error patterns
- [Testing](./testing.md) — Unit and integration tests