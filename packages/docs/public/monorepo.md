# Monorepo Architecture

RaineStack is built as a **Turborepo monorepo** with **Bun workspaces**, enabling efficient dependency management, task caching, and parallel execution across multiple packages. This guide explains the monorepo structure, package responsibilities, dependency graph, and development workflows.

---

## Table of Contents

- [Overview](#overview)
- [Why Turborepo?](#why-turborepo)
- [Package Structure](#package-structure)
- [Dependency Graph](#dependency-graph)
- [Package Details](#package-details)
- [Workspace Configuration](#workspace-configuration)
- [Dependency Management](#dependency-management)
- [Task Pipeline](#task-pipeline)
- [Build System](#build-system)
- [Best Practices](#best-practices)

---

## Overview

The RaineStack monorepo consists of **8 packages** organized under a single repository:

```
rainestack/
├── packages/
│   ├── tools/        # @rainestack/tools
│   ├── database/     # @rainestack/database
│   ├── server/       # @rainestack/server
│   ├── api/          # @rainestack/api
│   ├── ui/           # @rainestack/ui
│   ├── web/          # @rainestack/web
│   ├── docs/         # @rainestack/docs
│   └── tsconfig/     # @rainestack/tsconfig
├── package.json      # Root workspace configuration
├── turbo.json        # Turborepo task pipeline
└── bun.lock          # Lockfile for exact dependency versions
```

### Package Categories

| Category | Packages | Purpose |
|----------|----------|---------|
| **Shared Libraries** | `tools`, `database`, `ui`, `tsconfig` | Reusable utilities, database client, UI components, TypeScript configs |
| **Backend** | `server` | Bun HTTP server, oRPC routes, data layer, authentication |
| **Frontend** | `web`, `docs` | Micro-frontend applications (React + Vite) |
| **Client SDK** | `api` | Type-safe oRPC client factory for frontend consumption |

---

## Why Turborepo?

Turborepo provides several key advantages for monorepo development:

### 1. **Task Caching**

Turborepo caches the output of tasks (build, lint, test) based on input hashes. If nothing changed, the cached result is restored instantly.

```bash
# First run: builds everything
bun run build

# Second run: restores from cache (instant)
bun run build
```

### 2. **Parallel Execution**

Tasks are executed in parallel across packages when there are no dependencies between them, dramatically speeding up builds and tests.

### 3. **Dependency-Aware Scheduling**

Turborepo understands the dependency graph and ensures tasks run in the correct order (e.g., `database` builds before `server`).

### 4. **Remote Caching**

Cache can be shared across team members and CI/CD pipelines (not configured by default).

### 5. **Incremental Builds**

Only rebuilds packages that have changed and packages that depend on them.

---

## Package Structure

### Standard Package Layout

Each package follows a consistent structure:

```
packages/my-package/
├── src/
│   └── index.ts       # Main entry point
├── dist/              # Build output (gitignored)
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # Package documentation
```

### Frontend Package Layout

Frontend packages (`web`, `docs`) use Vite:

```
packages/web/
├── src/
│   ├── main.tsx       # Entry point
│   ├── app.tsx        # Root router
│   ├── routes/        # Page components
│   ├── components/    # Local components
│   ├── lib/           # Utilities (API client, etc.)
│   └── styles/        # Global CSS
├── public/            # Static assets
├── dist/              # Build output
├── index.html         # HTML template
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Dependency Graph

The monorepo has a carefully designed dependency graph to avoid circular dependencies and maintain clear separation of concerns:

```
tsconfig ─────────────────────────────────────────────────────┐
                                                              │
tools ────────────────────────────────────────┐               │
  │                                           │               │
database ──────────┐                          │               │
  │                │                          │               │
server ────────────┤                          │               │
  │ (type-only)    │                          │               │
api ───────────────┤                          │               │
  │                │                          │               │
ui ────────────────┤                          │               │
  │                │                          │               │
web ───────────────┘                          │               │
docs ─────────────────────────────────────────┘───────────────┘
```

### Dependency Rules

| Package | Depends On | Dependency Type |
|---------|-----------|-----------------|
| `tsconfig` | — | (standalone) |
| `tools` | — | (standalone) |
| `database` | `tools` | Runtime |
| `server` | `database`, `tools` | Runtime |
| `api` | `tools`, `server` | Runtime, Type-only (server) |
| `ui` | `tools` | Runtime |
| `web` | `api`, `ui`, `tools` | Runtime |
| `docs` | `api`, `ui`, `tools` | Runtime |

**Key Points:**
- `api` has a **type-only dependency** on `server` (imports `Router` type only)
- `web` and `docs` never import from `server` directly (only via `api`)
- `tools` and `tsconfig` have no dependencies (can be used anywhere)

---

## Package Details

### `@rainestack/tools`

**Purpose:** Framework-agnostic utilities used across the entire stack.

**Exports:**
- `@rainestack/tools/try-catch` — `tryCatch()` error-handling primitive
- `@rainestack/tools/temporal` — Prisma ↔ Temporal conversion utilities
- `@rainestack/tools/temporal-polyfill` — Temporal API polyfill (side-effect import)
- `@rainestack/tools/prototypes` — Prototype extensions for Array, Set, Map, etc. (side-effect import)

**No dependencies** — Pure TypeScript utilities.

---

### `@rainestack/database`

**Purpose:** Database schema, Prisma client, actor-tracked transactions, and real-time listener.

**Exports:**
- Singleton `db` client (PrismaClient)
- `withActor()`, `abortable()` transaction wrappers
- `DatabaseListener` class for LISTEN/NOTIFY
- Error utilities (`isPrismaError`, `uniqueViolation`, `recordNotFound`)
- All generated Prisma types

**Key Files:**
- `prisma/schema.prisma` — Database schema
- `src/index.ts` — Singleton client
- `src/actor.ts` — Actor-tracked transactions
- `src/listener.ts` — Real-time subscriptions
- `scripts/triggers.sql` — SQL triggers and cron jobs

---

### `@rainestack/server`

**Purpose:** Bun HTTP server exposing oRPC API, serving static micro-frontends, and handling authentication.

**Architecture:**
- **Entry point:** `src/index.ts`
- **Data layer:** `src/data/` — Pure database operations
- **Route layer:** `src/routes/` — oRPC endpoint definitions
- **Library:** `src/lib/` — Middleware, auth, logging, env validation

**Key Responsibilities:**
- Serve oRPC API at `/api/*`
- Serve OpenAPI spec at `/api/openapi.json`
- Serve oRPC contract at `/api/contract.json`
- Serve static micro-frontend builds at `/*`
- Handle JWT authentication and token refresh
- Provide health check at `/healthz`

---

### `@rainestack/api`

**Purpose:** Client-side oRPC client factory with TanStack Query integration.

**Exports:**
- `createApiClient<Router>()` — Factory for type-safe API client
- `QueryProvider` — React provider with shared defaults
- `createTanstackQueryUtils` — Re-export from `@orpc/tanstack-query`

**Features:**
- Automatic JWT authorization header
- Transparent token refresh on 401
- 15-second request timeout
- Contract router caching in `sessionStorage`

---

### `@rainestack/ui`

**Purpose:** Shared React component library built on shadcn/ui (base-vega style).

**Exports (subpath):**
- `@rainestack/ui/components/ui/*` — 50+ UI primitives
- `@rainestack/ui/components/blocks/*` — Composed block components
- `@rainestack/ui/providers/*` — Context providers (theme, logo, head)
- `@rainestack/ui/hooks/*` — Shared hooks
- `@rainestack/ui/lib/*` — Utilities (`cn()` class-name merging)

**Available Components:**
button, card, dialog, table, form, input, select, tabs, accordion, alert, avatar, badge, breadcrumb, calendar, checkbox, combobox, command, context-menu, drawer, dropdown-menu, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, textarea, toggle, tooltip, and more.

---

### `@rainestack/web`

**Purpose:** Web shell micro-frontend — the main application served at `/`.

**Key Features:**
- React 19.2 with React Router 7
- Vite dev server with HMR
- TanStack Query for data fetching
- Theme provider for dark/light mode
- API client singleton

**Entry Point Initialization:**
1. Import `@rainestack/tools/prototypes`
2. Import `@rainestack/tools/temporal-polyfill`
3. Import global CSS
4. Mount React root with providers

---

### `@rainestack/docs`

**Purpose:** Documentation micro-frontend served at `/docs`.

**Structure:** Mirrors `@rainestack/web` but uses `<BrowserRouter basename="/docs">`.

**Routes:**
- `/docs` — Documentation home
- `/docs/*` — Dynamic documentation pages

---

### `@rainestack/tsconfig`

**Purpose:** Shared TypeScript configurations.

**Configurations:**
- `base.json` — For backend packages (tools, database, server)
- `react-library.json` — For React libraries (ui)
- `react-app.json` — For React applications (web, docs)

**All configs enable strict mode:**
```jsonc
{
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

---

## Workspace Configuration

### Root `package.json`

The root `package.json` defines:
1. **Workspaces** — List of package directories
2. **Dependency Catalog** — Central registry of all dependencies with exact versions
3. **Root Scripts** — Commands that operate on all packages

```jsonc
{
  "name": "rainestack",
  "private": true,
  "workspaces": {
    "packages": [
      "packages/*"
    ],
    "catalog": {
      "react": "19.2.0",
      "zod": "4.1.0",
      // ... all dependencies with exact versions
    }
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  }
}
```

---

## Dependency Management

### Catalog System

**All dependencies MUST be defined in the root `package.json` catalog with exact versions.**

#### Adding a New Dependency

1. **Add to catalog** in root `package.json`:
```jsonc
{
  "workspaces": {
    "catalog": {
      "some-package": "3.2.1"  // ← Exact version, no ^ or ~
    }
  }
}
```

2. **Reference in package** `package.json`:
```jsonc
{
  "dependencies": {
    "some-package": "catalog:"  // ← References catalog
  }
}
```

3. **Install:**
```bash
bun install
```

### Version Management Rules

- ✅ **Always use exact versions** (e.g., `"3.2.1"`)
- ❌ **Never use ranges** (e.g., `"^3.2.1"`, `"~3.2.1"`)
- ✅ **Workspace packages use `workspace:*`**
- ✅ **Update catalog to upgrade a dependency** (single source of truth)

### Workspace Dependencies

```jsonc
{
  "dependencies": {
    "@rainestack/tools": "workspace:*",
    "@rainestack/database": "workspace:*"
  }
}
```

---

## Task Pipeline

### Turborepo Configuration (`turbo.json`)

```jsonc
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "cache": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": true
    }
  },
  "globalEnv": ["DATABASE_URL", "NODE_ENV", "LOG_LEVEL"]
}
```

### Task Definitions

| Task | Cache | Persistent | Depends On | Description |
|------|-------|------------|------------|-------------|
| `dev` | No | Yes | — | Start development server (never cached, runs forever) |
| `build` | Yes | No | `^build` | Build package after dependencies build |
| `lint` | Yes | No | — | Lint with Biome (cacheable) |
| `typecheck` | Yes | No | `^build` | Type-check after dependencies build |
| `format` | No | No | — | Format code with Biome |

**`^build` notation:** The `^` means "run this task in dependencies first".

---

## Build System

### Backend Build (Bun)

Backend packages (`tools`, `database`, `server`) are built with Bun's native bundler:

```json
{
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target bun"
  }
}
```

**Output:** Single JavaScript file in `dist/` optimized for Bun runtime.

### Frontend Build (Vite)

Frontend packages (`web`, `docs`, `ui`) are built with Vite:

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

**Output:** Optimized static assets in `dist/` ready for CDN deployment.

### Build Order

Turborepo automatically builds in dependency order:

```
1. tsconfig (no build needed)
2. tools (standalone)
3. database (depends on tools)
4. server (depends on database, tools)
5. api (depends on server types, tools)
6. ui (depends on tools)
7. web, docs (depend on api, ui, tools) — built in parallel
```

---

## Best Practices

### 1. **Keep Dependencies Acyclic**

Never create circular dependencies between packages. Use the dependency graph as reference.

❌ **Bad:**
```
web → server → web  // Circular dependency!
```

✅ **Good:**
```
web → api → server (type-only)
```

### 2. **Use Workspace Protocol**

Always use `workspace:*` for internal dependencies:

```jsonc
{
  "dependencies": {
    "@rainestack/tools": "workspace:*"  // ✅ Correct
  }
}
```

### 3. **Define All External Deps in Catalog**

Never define external dependencies directly in package `package.json`:

❌ **Bad:**
```jsonc
// packages/server/package.json
{
  "dependencies": {
    "express": "4.18.0"  // ❌ Not in catalog
  }
}
```

✅ **Good:**
```jsonc
// Root package.json
{
  "workspaces": {
    "catalog": {
      "express": "4.18.0"
    }
  }
}

// packages/server/package.json
{
  "dependencies": {
    "express": "catalog:"  // ✅ References catalog
  }
}
```

### 4. **Use Path Aliases**

Each package defines its own path aliases in `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@server/*": ["./src/*"]
    }
  }
}
```

**Cross-package imports use package names:**
```typescript
// ✅ Correct
import { tryCatch } from '@rainestack/tools/try-catch';

// ❌ Wrong
import { tryCatch } from '../../../tools/src/try-catch';
```

### 5. **Run Tasks from Root**

Use Turborepo to run tasks across all packages:

```bash
# ✅ Run task in all packages
bun run build

# ✅ Run task in specific package
bun run build --filter=@rainestack/server

# ✅ Run task in package and its dependencies
bun run build --filter=@rainestack/server...
```

### 6. **Leverage Task Caching**

Tasks with deterministic outputs (build, lint, test) should be cacheable:

```jsonc
{
  "pipeline": {
    "build": {
      "cache": true,
      "outputs": ["dist/**"]
    }
  }
}
```

**Non-deterministic tasks** (dev servers) should not be cached:
```jsonc
{
  "dev": {
    "cache": false,
    "persistent": true
  }
}
```

### 7. **Document Package Responsibilities**

Every package should have a clear, single responsibility. Update `AGENTS.md` when adding new packages.

### 8. **Type-Only Dependencies**

When a frontend package needs types from the backend, use type-only imports:

```typescript
// api/src/client.ts
import type { Router } from '@rainestack/server/routes';
//     ^^^^ Type-only import — doesn't bundle server code
```

---

## Common Commands

### Development

```bash
# Start all packages in dev mode
bun run dev

# Start specific package
cd packages/server && bun run dev

# Start with filter
bun run dev --filter=@rainestack/web
```

### Building

```bash
# Build all packages
bun run build

# Build specific package and its dependencies
bun run build --filter=@rainestack/server...

# Build without cache
bun run build --force
```

### Cleaning

```bash
# Remove all node_modules
bun run clean

# Remove Turborepo cache
rm -rf .turbo

# Remove all build outputs
rm -rf packages/*/dist
```

### Adding Packages

```bash
# Install to specific package
bun add some-package --cwd packages/server

# But remember to add to catalog first!
```

---

## Troubleshooting

### Cache Issues

If you encounter stale build outputs:

```bash
# Clear Turborepo cache
rm -rf .turbo

# Clear package build outputs
rm -rf packages/*/dist

# Rebuild
bun run build
```

### Dependency Resolution Issues

If dependencies aren't resolving correctly:

```bash
# Remove all node_modules and lockfile
bun run clean
rm bun.lock

# Reinstall
bun install
```

### Type Errors After Adding Dependency

Regenerate types and rebuild:

```bash
cd packages/database
bunx --bun prisma generate

cd ../..
bun run typecheck
```

---

## Summary

The RaineStack monorepo architecture provides:

- ✅ **Efficient builds** with Turborepo task caching
- ✅ **Type safety** across the entire stack
- ✅ **Clear separation of concerns** with well-defined package boundaries
- ✅ **Centralized dependency management** via the catalog system
- ✅ **Fast feedback loops** with parallel task execution
- ✅ **Incremental builds** that only rebuild what changed

By following the dependency graph and best practices outlined in this guide, you can confidently add new features, refactor code, and scale the monorepo without introducing coupling or circular dependencies.

---

**Next Steps:**
- [Database Guide](./database.md) — Learn about Prisma, triggers, and audit infrastructure
- [API Development](./api.md) — Build type-safe oRPC endpoints
- [Build & Deployment](./deployment.md) — Production build and deployment strategies