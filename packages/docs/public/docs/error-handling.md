# Error Handling

This guide covers error handling patterns in RaineStack, including the `tryCatch` utility, Prisma error handling, oRPC errors, and best practices for robust error management.

---

## Table of Contents

- [Overview](#overview)
- [The tryCatch Utility](#the-trycatch-utility)
- [Prisma Error Handling](#prisma-error-handling)
- [oRPC Errors](#orpc-errors)
- [Frontend Error Handling](#frontend-error-handling)
- [Logging Errors](#logging-errors)
- [Best Practices](#best-practices)

---

## Overview

RaineStack uses a **discriminated union** approach to error handling via the `tryCatch` utility from `@rainestack/tools`. This pattern provides:

- ✅ **Type safety** — Errors are part of the type system
- ✅ **No try/catch blocks** — Cleaner, more functional code
- ✅ **Explicit error handling** — Forces you to handle errors
- ✅ **Composable** — Works with sync, async, and streaming operations

---

## The tryCatch Utility

### Basic Usage

The `tryCatch` function wraps operations and returns a discriminated union:

```typescript
import { tryCatch } from '@rainestack/tools/try-catch';

// Async operations
const { data, error } = await tryCatch(fetchUser('123'));

if (error) {
  console.error('Failed to fetch user:', error);
  return null;
}

// data is fully typed as User
console.log(data.name);
```

### Type Signature

```typescript
type Result<T, E = Error> =
  | { data: T; error: null }
  | { data: null; error: E };

function tryCatch<T, E = Error>(
  operation: Promise<T> | (() => T)
): Promise<Result<T, E>> | Result<T, E>;
```

### Synchronous Operations

```typescript
const { data, error } = tryCatch(() => JSON.parse(rawJson));

if (error) {
  return handleParseError(error);
}

console.log(data.message);
```

### Async Operations

```typescript
const { data: user, error } = await tryCatch(
  db.user.findUnique({ where: { id: '123' } })
);

if (error) {
  log.error({ error }, 'Database query failed');
  throw new ORPCError('INTERNAL_SERVER_ERROR');
}

return user;
```

### Async Iterables (Streaming)

```typescript
for await (const { data, error } of tryCatch(stream)) {
  if (error) {
    log.error({ error }, 'Stream error');
    break;
  }
  
  processChunk(data);
}
```

### Custom Error Types

```typescript
class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

const { data, error } = await tryCatch<User, ApiError>(
  fetchUserFromApi(id)
);

if (error) {
  console.log(error.status); // Fully typed as ApiError
}
```

### Multiple Operations

```typescript
async function createPost(input: CreatePostInput) {
  // Validate input
  const { data: validated, error: validationError } = tryCatch(() =>
    CreatePostInput.parse(input)
  );
  
  if (validationError) {
    throw new ORPCError('BAD_REQUEST', { message: validationError.message });
  }
  
  // Create post
  const { data: post, error: dbError } = await tryCatch(
    db.post.create({ data: validated })
  );
  
  if (dbError) {
    throw new ORPCError('INTERNAL_SERVER_ERROR');
  }
  
  return post;
}
```

---

## Prisma Error Handling

### Error Utilities

The `@rainestack/database/errors` package provides type-safe Prisma error extractors:

```typescript
import {
  isPrismaError,
  uniqueViolation,
  recordNotFound
} from '@rainestack/database/errors';
```

### Unique Constraint Violations

Prisma error code: `P2002`

```typescript
import { uniqueViolation } from '@rainestack/database/errors';

try {
  return await usersData.create(db, actorId, {
    email: 'user@example.com',
    name: 'John Doe'
  });
} catch (error) {
  const violation = uniqueViolation(error);
  
  if (violation) {
    // violation.target is the field(s) that caused the constraint violation
    throw new ORPCError('CONFLICT', {
      message: `User with email "${input.email}" already exists`
    });
  }
  
  throw error; // Re-throw unknown errors
}
```

### Record Not Found

Prisma error code: `P2025`

```typescript
import { recordNotFound } from '@rainestack/database/errors';

try {
  return await postsData.update(db, actorId, id, data);
} catch (error) {
  if (recordNotFound(error)) {
    throw new ORPCError('NOT_FOUND', {
      message: 'Post not found'
    });
  }
  
  throw error;
}
```

### Checking If Error is From Prisma

```typescript
import { isPrismaError } from '@rainestack/database/errors';

try {
  await db.user.delete({ where: { id } });
} catch (error) {
  if (isPrismaError(error)) {
    log.error({ code: error.code }, 'Prisma error');
  } else {
    log.error({ error }, 'Unknown error');
  }
}
```

### Common Prisma Error Codes

| Code | Description | Handling Strategy |
|------|-------------|-------------------|
| `P2002` | Unique constraint violation | Return 409 CONFLICT |
| `P2025` | Record not found | Return 404 NOT_FOUND |
| `P2003` | Foreign key constraint failed | Return 400 BAD_REQUEST |
| `P2014` | Invalid relation | Return 400 BAD_REQUEST |
| `P2034` | Transaction conflict | Retry or return 409 CONFLICT |

---

## oRPC Errors

### Error Codes

oRPC provides standard HTTP error codes:

```typescript
import { ORPCError } from '@orpc/server';

throw new ORPCError('NOT_FOUND', {
  message: 'Resource not found'
});
```

**Available codes:**

| Code | HTTP Status | Use Case |
|------|-------------|----------|
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Route Error Handling

```typescript
export const updatePost = authedProcedure
  .input(UpdatePostInput)
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    try {
      const post = await postsData.findById(context.db, input.id);
      
      if (!post) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Post not found'
        });
      }
      
      if (post.userId !== context.user.id) {
        throw new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to edit this post'
        });
      }
      
      return await context.withActor(async (tx) => {
        return postsData.update(tx, context.actorId, input.id, input);
      });
    } catch (error) {
      // Handle Prisma errors
      const violation = uniqueViolation(error);
      if (violation) {
        throw new ORPCError('CONFLICT', {
          message: 'Post with this slug already exists'
        });
      }
      
      if (recordNotFound(error)) {
        throw new ORPCError('NOT_FOUND', {
          message: 'Post not found'
        });
      }
      
      // Log and re-throw unknown errors
      context.log.error({ error }, 'Unexpected error in updatePost');
      throw error;
    }
  });
```

### Input Validation Errors

Zod validation errors are automatically converted to `BAD_REQUEST`:

```typescript
export const create = authedProcedure
  .input(CreatePostInput) // ← Zod schema
  .handler(async ({ input, context }) => {
    // If input is invalid, oRPC automatically throws:
    // ORPCError('BAD_REQUEST', { message: 'Validation error', issues: [...] })
  });
```

---

## Frontend Error Handling

### API Client Errors

```typescript
import { api } from '@web/lib/api';
import { toast } from 'sonner';

async function handleCreatePost(data: CreatePostInput) {
  const { data: post, error } = await tryCatch(
    api.posts.create(data)
  );
  
  if (error) {
    if (error.code === 'UNAUTHORIZED') {
      toast.error('Please sign in to create a post');
      return;
    }
    
    if (error.code === 'CONFLICT') {
      toast.error('A post with this slug already exists');
      return;
    }
    
    toast.error('Failed to create post');
    return;
  }
  
  toast.success('Post created successfully!');
  return post;
}
```

### TanStack Query Error Handling

```typescript
import { orpc } from '@web/lib/api';
import { toast } from 'sonner';

function PostList() {
  const { data: posts, error, isLoading } = orpc.posts.list.useQuery({
    input: {}
  });
  
  // Handle error in UI
  if (error) {
    return (
      <div className="text-destructive">
        Failed to load posts: {error.message}
      </div>
    );
  }
  
  if (isLoading) {
    return <Spinner />;
  }
  
  return (
    <div>
      {posts?.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

### Mutation Error Handling

```typescript
function CreatePostForm() {
  const createPost = orpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success('Post created!');
      orpc.posts.list.invalidate();
    },
    onError: (error) => {
      if (error.code === 'CONFLICT') {
        toast.error('Post with this slug already exists');
      } else if (error.code === 'UNAUTHORIZED') {
        toast.error('Please sign in to create posts');
      } else {
        toast.error('Failed to create post');
      }
    }
  });
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createPost.mutate({ title: 'My Post', content: '...' });
    }}>
      {/* form fields */}
      <Button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </Button>
    </form>
  );
}
```

### Global Error Boundary

```typescript
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };
  
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

---

## Logging Errors

### Server-Side Logging

```typescript
import { log } from '@server/lib/logger';

export const handler = authedProcedure
  .handler(async ({ context }) => {
    try {
      return await someOperation();
    } catch (error) {
      // Log with structured data
      context.log.error(
        {
          error,
          userId: context.user.id,
          requestId: context.requestId
        },
        'Operation failed'
      );
      
      throw new ORPCError('INTERNAL_SERVER_ERROR');
    }
  });
```

### Error Severity Levels

```typescript
// Fatal — application cannot continue
log.fatal({ error }, 'Database connection lost');

// Error — operation failed
log.error({ error, userId }, 'Failed to create post');

// Warn — recoverable issue
log.warn({ input }, 'Invalid input, using defaults');

// Info — normal operation
log.info({ userId }, 'User logged in');

// Debug — detailed information (dev only)
log.debug({ query }, 'Database query executed');
```

### Structured Error Context

```typescript
log.error({
  error,
  context: {
    userId: context.user.id,
    postId: input.id,
    operation: 'updatePost',
    timestamp: new Date().toISOString()
  }
}, 'Failed to update post');
```

---

## Best Practices

### 1. Use tryCatch for Expected Errors

```typescript
// ✅ Good — explicit error handling
const { data, error } = await tryCatch(fetchUser(id));
if (error) {
  return handleError(error);
}

// ❌ Bad — silent failure
const user = await fetchUser(id).catch(() => null);
```

### 2. Don't Catch and Ignore

```typescript
// ✅ Good — handle or log
const { data, error } = await tryCatch(operation());
if (error) {
  log.error({ error }, 'Operation failed');
  throw new ORPCError('INTERNAL_SERVER_ERROR');
}

// ❌ Bad — swallows error
try {
  await operation();
} catch (error) {
  // Nothing...
}
```

### 3. Provide Meaningful Error Messages

```typescript
// ✅ Good — specific message
throw new ORPCError('NOT_FOUND', {
  message: `Post with ID "${input.id}" not found`
});

// ❌ Bad — generic message
throw new ORPCError('NOT_FOUND', {
  message: 'Not found'
});
```

### 4. Don't Leak Internal Details

```typescript
// ✅ Good — safe message
throw new ORPCError('INTERNAL_SERVER_ERROR', {
  message: 'Failed to create post'
});

// ❌ Bad — leaks implementation
throw new ORPCError('INTERNAL_SERVER_ERROR', {
  message: `Database error: ${prismaError.message}`
});
```

### 5. Log Before Throwing

```typescript
// ✅ Good — log for debugging
try {
  await operation();
} catch (error) {
  context.log.error({ error, input }, 'Operation failed');
  throw new ORPCError('INTERNAL_SERVER_ERROR');
}

// ❌ Bad — no log
try {
  await operation();
} catch (error) {
  throw new ORPCError('INTERNAL_SERVER_ERROR');
}
```

### 6. Handle Errors at the Right Level

```typescript
// ✅ Good — data layer returns results, route handles errors
export async function create(db: Db, data: CreateData) {
  return db.post.create({ data });
}

export const create = authedProcedure
  .handler(async ({ input, context }) => {
    try {
      return await postsData.create(context.db, input);
    } catch (error) {
      const violation = uniqueViolation(error);
      if (violation) {
        throw new ORPCError('CONFLICT', { message: 'Duplicate post' });
      }
      throw error;
    }
  });

// ❌ Bad — data layer catches and throws oRPC error
export async function create(db: Db, data: CreateData) {
  try {
    return db.post.create({ data });
  } catch (error) {
    throw new ORPCError('CONFLICT'); // Couples data layer to oRPC
  }
}
```

### 7. Use Error Boundaries in React

Wrap your app in an error boundary to catch rendering errors:

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Summary

RaineStack's error handling strategy provides:

- ✅ **Type-safe error handling** with `tryCatch`
- ✅ **Discriminated unions** for explicit error checking
- ✅ **Prisma error utilities** for database errors
- ✅ **Standardized oRPC errors** with HTTP codes
- ✅ **Structured logging** with Pino
- ✅ **Frontend error boundaries** for React errors

By following these patterns, you can build robust applications that handle errors gracefully and provide meaningful feedback to users.

---

**Next Steps:**
- [API Development](./api.md) — Error handling in routes
- [Database Guide](./database.md) — Prisma error patterns
- [Logging](./logging.md) — Advanced logging techniques