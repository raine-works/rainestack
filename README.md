# RaineStack

A modern, full-stack TypeScript monorepo powered by **Bun**, **Turborepo**, **Prisma**, and **React**. Built for developer productivity with type-safe APIs, real-time database subscriptions, and a micro-frontend architecture.

[![Bun](https://img.shields.io/badge/Bun-1.3.9-black?logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.3-2D3748?logo=prisma)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)

---

## 🚀 Features

- **⚡️ Bun Runtime** — Lightning-fast package management, test runner, and HTTP server
- **📦 Turborepo Monorepo** — Efficient task caching and parallel execution across packages
- **🔒 Type-Safe APIs** — oRPC contract-first approach with automatic OpenAPI generation
- **🗄️ PostgreSQL + Prisma** — Type-safe database client with migrations and real-time LISTEN/NOTIFY
- **🎨 Shadcn/ui + Tailwind** — Beautiful, accessible component library with dark mode support
- **🔐 Full Authentication Stack** — JWT tokens, OTP, OIDC (Google/GitHub), WebAuthn passkeys
- **📝 Audit Trail** — Automatic change tracking and soft deletes with actor attribution
- **🧩 Micro-Frontends** — Independent React apps served from a single backend
- **🌐 Modern Date/Time** — Temporal API polyfill throughout the stack
- **🛠️ Developer Experience** — Biome formatting, strict TypeScript, prototype extensions

---

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) directory and served live at `/docs` when you run the dev server:

- **[Getting Started](./docs/getting-started.md)** — Installation, setup, and first steps
- **[Monorepo Architecture](./docs/monorepo.md)** — Package structure and dependency graph
- **[Database Guide](./docs/database.md)** — Prisma, PostgreSQL, triggers, and audit infrastructure
- **[API Development](./docs/api.md)** — oRPC routes, OpenAPI, and client generation
- **[Micro-Frontends](./docs/microfrontends.md)** — Zone architecture and routing
- **[UI Components](./docs/ui-components.md)** — Shadcn/ui library and theming
- **[Authentication](./docs/authentication.md)** — JWT, OIDC, passkeys, and session management
- **[Error Handling](./docs/error-handling.md)** — tryCatch pattern and Prisma error utilities
- **[Temporal API](./docs/temporal.md)** — Modern date/time handling across the stack

---

## 🏗️ Tech Stack

### Core Technologies

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| **Runtime**    | Bun 1.3.9                                                     |
| **Monorepo**   | Turborepo with Bun workspaces                                 |
| **Language**   | TypeScript 5.9.3 (strict mode)                                |
| **Backend**    | Bun HTTP server, oRPC (contract-first), Pino logging          |
| **Database**   | PostgreSQL 18.1, Prisma 7.3 (with `@prisma/adapter-pg`)      |
| **Frontend**   | React 19.2, Vite 7.3, React Router 7, TanStack Query 5       |
| **UI**         | shadcn/ui (base-vega), Tailwind CSS 4.1, Lucide icons         |
| **Auth**       | JWT (jose), OTP, OIDC (Google/GitHub), WebAuthn passkeys      |
| **Linting**    | Biome 2.3 (formatting + linting)                              |
| **Validation** | Zod 4.1                                                       |
| **Date/Time**  | Temporal API via `temporal-polyfill`                          |

### Monorepo Packages

```
packages/
├── tools/        # Shared utilities (tryCatch, Temporal, prototypes)
├── database/     # Prisma schema, client, actor transactions, listener
├── server/       # Bun HTTP server, oRPC routes, data layer, auth
├── api/          # Client-side oRPC client factory, TanStack Query utils
├── ui/           # Shared React component library (shadcn/ui)
├── web/          # Web shell micro-frontend (Vite + React)
├── docs/         # Docs micro-frontend (Vite + React)
└── tsconfig/     # Shared TypeScript configurations
```

---

## 🎯 Quick Start

### Prerequisites

- **Bun 1.3.9** — [Install Bun](https://bun.sh)
- **Docker** — For local PostgreSQL (or use your own PostgreSQL 18.1+ instance)
- **Git** — For cloning the repository

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rainestack.git
cd rainestack

# Install dependencies
bun install

# Start PostgreSQL (via Docker Compose)
bun run db:start

# Run migrations and apply database triggers
bun run db:dev

# Start all development servers
bun run dev
```

The application will be available at:
- **Web app**: http://localhost:3024
- **Docs**: http://localhost:3024/docs
- **API**: http://localhost:3000/api
- **OpenAPI**: http://localhost:3000/api/openapi.json

---

## 🔧 Development

### Available Scripts

#### Root Workspace

```bash
bun run dev         # Start all packages in development mode
bun run build       # Build all packages for production
bun run lint        # Lint all packages with Biome
bun run typecheck   # Type-check all packages
bun run format      # Format all files with Biome
bun run clean       # Remove all node_modules directories
```

#### Database

```bash
bun run db:start    # Start PostgreSQL via Docker Compose
bun run db:dev      # Run migrations + apply triggers (development)
bun run db:deploy   # Run migrations + apply triggers (production)
```

#### Individual Packages

```bash
cd packages/server
bun run dev         # Start server in development mode
bun run build       # Build server for production

cd packages/web
bun run dev         # Start web zone in development mode
bun run build       # Build web zone for production
```

### Project Structure

```
rainestack/
├── docs/                     # Markdown documentation
│   ├── getting-started.md
│   ├── monorepo.md
│   ├── database.md
│   └── ...
├── docker/                   # Docker configurations
│   ├── Dockerfile.dev        # PostgreSQL + pg_cron custom image
│   └── dev.yaml              # Docker Compose configuration
├── packages/
│   ├── tools/                # @rainestack/tools
│   ├── database/             # @rainestack/database
│   ├── server/               # @rainestack/server
│   ├── api/                  # @rainestack/api
│   ├── ui/                   # @rainestack/ui
│   ├── web/                  # @rainestack/web
│   ├── docs/                 # @rainestack/docs
│   └── tsconfig/             # @rainestack/tsconfig
├── AGENTS.md                 # Project rules for AI agents
├── package.json              # Root workspace with dependency catalog
├── turbo.json                # Turborepo configuration
├── biome.json                # Biome formatter + linter config
└── tsconfig.json             # Root TypeScript configuration
```

---

## 🏛️ Architecture Highlights

### Contract-First API (oRPC)

Every API endpoint is defined with Zod schemas and automatically generates:
- **TypeScript types** for full-stack type safety
- **OpenAPI 3.x specification** for documentation
- **Type-safe client** for frontend consumption

```typescript
// Define once in server
export const getUser = authedProcedure
  .input(z.object({ id: z.string() }))
  .output(UserSchema)
  .handler(async ({ input, context }) => {
    return usersData.findById(context.db, input.id);
  });

// Use with full type safety in frontend
const user = await api.users.getUser({ id: '123' });
//    ^? User (fully typed)
```

### Actor-Tracked Transactions

All database mutations are wrapped in `withActor()` to set the current user context for audit triggers:

```typescript
// Data layer function
export async function updatePost(db: Db, actorId: string | null, id: string, data: UpdateData) {
  return withActor(db, actorId, async (tx) => {
    return tx.post.update({ where: { id }, data });
  });
}

// Automatically tracked in audit.change_log with actor attribution
```

### Real-Time Database Subscriptions

The `DatabaseListener` class provides LISTEN/NOTIFY subscriptions with auto-reconnect:

```typescript
import { listener } from '@rainestack/database';

listener.on('post', (event) => {
  console.log(`Post ${event.operation}:`, event.id);
  // Invalidate caches, notify connected clients, etc.
});
```

### Micro-Frontend Zones

Multiple React apps are served from a single backend with independent routing:

- `/` → Web shell (`@rainestack/web`)
- `/docs` → Documentation (`@rainestack/docs`)

Each zone is built independently and served statically by the Bun server.

---

## 🔐 Authentication

RaineStack provides a complete authentication stack out of the box:

- **JWT Access Tokens** — Short-lived (15 min), signed with HS256
- **Refresh Tokens** — Long-lived (30 days), stored in database with rotation
- **OTP (One-Time Password)** — Email-based passwordless authentication
- **OIDC Providers** — Google and GitHub OAuth integration
- **WebAuthn Passkeys** — Hardware-backed authentication with device attestation

All endpoints requiring authentication use the `authedProcedure` which validates JWTs and injects the user into context.

---

## 🗄️ Database

### Schema

The Prisma schema defines all models with full TypeScript support:

- **Persistent tables**: `User`, `Post`, `Account`, `Passkey`, `OAuthClient`, etc.
  - Receive NOTIFY triggers for real-time awareness
  - Tracked in `audit.change_log` (updates) and `audit.deleted_records` (deletes)
  
- **Ephemeral tables**: `OtpCode`, `RefreshToken`, `PasskeyChallenge`, `OAuthAccessToken`, etc.
  - Short-lived, single-use artefacts with `expiresAt`
  - Auto-purged daily by pg_cron job
  - No audit tracking (would create noise)

### Triggers

All triggers, audit infrastructure, and cron jobs are defined in `packages/database/scripts/triggers.sql`:

- **NOTIFY triggers** — Fire on INSERT/UPDATE/DELETE for persistent tables
- **Audit triggers** — Track column-level changes and soft deletes
- **Purge function** — Cleans expired ephemeral records
- **pg_cron job** — Runs purge daily at 03:00 UTC

---

## 🎨 UI Components

The `@rainestack/ui` package provides 50+ shadcn/ui components styled with the **base-vega** theme:

```typescript
import { Button } from '@rainestack/ui/components/ui/button';
import { Card, CardContent } from '@rainestack/ui/components/ui/card';
import { ThemeProvider, useTheme } from '@rainestack/ui/providers/theme-provider';

// All components support dark mode out of the box
```

**Available components**: button, card, dialog, table, form, input, select, tabs, accordion, alert, avatar, badge, calendar, checkbox, combobox, dropdown, popover, progress, radio, slider, switch, toast, and many more.

---

## 🧪 Error Handling

The `tryCatch` utility from `@rainestack/tools` provides a type-safe, discriminated union approach to error handling:

```typescript
import { tryCatch } from '@rainestack/tools/try-catch';

// Async operations
const { data, error } = await tryCatch(fetchUser(id));
if (error) return handleError(error);
console.log(data.name); // fully typed

// Sync operations
const { data, error } = tryCatch(() => JSON.parse(raw));
if (error) return handleParseError(error);

// Async iterables (streaming)
for await (const { data, error } of tryCatch(stream)) {
  if (error) break;
  process(data);
}
```

---

## 🌐 Temporal API

RaineStack uses the **Temporal API** polyfill for all date/time operations, providing a modern, timezone-aware alternative to the legacy `Date` object:

```typescript
import { toInstant, toDate, toISO } from '@rainestack/tools/temporal';

// Prisma Date → Temporal.Instant
const instant = toInstant(user.createdAt);

// Temporal.Instant → Prisma Date (for writes)
const date = toDate(Temporal.Now.instant());

// Prisma Date → ISO-8601 string (for API responses)
const iso = toISO(post.publishedAt);
```

---

## 📖 Contributing

This project follows strict conventions to maintain code quality and consistency. Before contributing:

1. **Read [AGENTS.md](./AGENTS.md)** — Comprehensive project rules and architecture
2. **Follow the dependency catalog** — All deps must be in root `package.json` catalog
3. **Use the data layer** — All DB operations go in `packages/server/src/data/`
4. **Wrap mutations in `withActor()`** — For audit trail attribution
5. **Check for existing UI components** — Use `@rainestack/ui` before creating new ones
6. **Use `tryCatch` for error handling** — Prefer discriminated unions over try/catch
7. **Run formatters and linters** — `bun run format && bun run lint`

---

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Required
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/dev_db
JWT_SECRET=your-secret-key-min-32-characters-long

# Optional
NODE_ENV=development
LOG_LEVEL=debug
STATIC_DIR=./dist

# OIDC Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# WebAuthn (optional)
RP_ID=localhost
RP_NAME=RaineStack
RP_ORIGIN=http://localhost:3000
```

---

## 🚢 Deployment

### Build for Production

```bash
# Build all packages
bun run build

# Run migrations
bun run db:deploy

# Start server
cd packages/server
bun run dist/index.js
```

### Environment

Set `STATIC_DIR` to the directory containing built frontend assets. The server will discover and serve all micro-frontend zones automatically.

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Built with incredible open-source projects:

- [Bun](https://bun.sh) — Fast all-in-one JavaScript runtime
- [Turborepo](https://turbo.build) — High-performance monorepo build system
- [Prisma](https://prisma.io) — Next-generation ORM
- [oRPC](https://orpc.unnoq.com) — Contract-first RPC framework
- [shadcn/ui](https://ui.shadcn.com) — Beautifully designed component library
- [Temporal API Polyfill](https://github.com/js-temporal/temporal-polyfill) — Modern date/time for JavaScript

---

<div align="center">
  <p>Built with ❤️ by the RaineStack team</p>
  <p>
    <a href="./docs/getting-started.md">Get Started</a> •
    <a href="./docs">Documentation</a> •
    <a href="https://github.com/yourusername/rainestack">GitHub</a>
  </p>
</div>