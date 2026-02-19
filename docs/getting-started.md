# Getting Started

Welcome to **RaineStack**! This guide will walk you through setting up your local development environment, understanding the project structure, and running your first development server.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Bun 1.3.9** — [Install Bun](https://bun.sh)
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

- **Docker** — [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Required for running the local PostgreSQL database
  - Alternatively, you can use your own PostgreSQL 18.1+ instance

- **Git** — For cloning the repository
  ```bash
  git --version
  ```

### Optional

- **Visual Studio Code** — Recommended IDE with excellent TypeScript support
- **PostgreSQL Client** — For inspecting the database (e.g., TablePlus, pgAdmin, psql)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rainestack.git
cd rainestack
```

### 2. Install Dependencies

RaineStack uses **Bun workspaces** with a dependency catalog. All dependencies are pinned to exact versions in the root `package.json`:

```bash
bun install
```

This command installs dependencies for all packages in the monorepo.

---

## Database Setup

### Start PostgreSQL with Docker

The project includes a custom PostgreSQL image with the `pg_cron` extension for scheduled task execution (daily cleanup of expired tokens, challenges, etc.):

```bash
bun run db:start
```

This command:
1. Builds a custom PostgreSQL 18.1 image with `pg_cron` (if not already built)
2. Starts the container via Docker Compose
3. Creates a database named `dev_db` with user `dev_user`

**Connection details:**
- Host: `localhost`
- Port: `5432`
- Database: `dev_db`
- User: `dev_user`
- Password: `dev_password`

**Connection string:**
```
postgresql://dev_user:dev_password@localhost:5432/dev_db
```

### Run Migrations and Triggers

Apply the Prisma schema and set up database triggers:

```bash
bun run db:dev
```

This command:
1. Runs all pending Prisma migrations
2. Generates the Prisma client
3. Applies SQL triggers for NOTIFY, audit tracking, and cron jobs

**What gets installed:**
- **NOTIFY triggers** — Real-time change notifications for persistent tables
- **Audit triggers** — Automatic change logging and soft deletes
- **Purge function** — Removes expired ephemeral records (OTP codes, tokens, etc.)
- **pg_cron job** — Schedules daily cleanup at 03:00 UTC

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Required
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/dev_db
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Optional - Development defaults
NODE_ENV=development
LOG_LEVEL=debug

# Optional - OIDC Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Optional - WebAuthn Configuration
RP_ID=localhost
RP_NAME=RaineStack
RP_ORIGIN=http://localhost:3000
```

**Important:** The `JWT_SECRET` must be at least 32 characters long. Generate a secure random string:

```bash
# Using openssl
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Bun
bun -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Start Development Servers

### Start All Services

Run all packages in development mode with a single command:

```bash
bun run dev
```

This starts:
- **Server** (`@rainestack/server`) — Bun HTTP server on port `3000`
- **Web** (`@rainestack/web`) — Vite dev server on port `3100`
- **Docs** (`@rainestack/docs`) — Vite dev server on port `3101`
- **Microfrontend Proxy** — Turborepo proxy on port `3024`

### Access the Application

Once all servers are running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3024 | Main application (web shell) |
| **Docs** | http://localhost:3024/docs | Documentation site |
| **API** | http://localhost:3000/api | oRPC API endpoints |
| **OpenAPI Spec** | http://localhost:3000/api/openapi.json | Auto-generated OpenAPI 3.x specification |
| **oRPC Contract** | http://localhost:3000/api/contract.json | oRPC contract router for client factory |
| **Health Check** | http://localhost:3000/healthz | Server liveness probe |

**Tip:** The microfrontend proxy (port `3024`) is the main entry point during development. It routes:
- `/docs`, `/docs/*` → Docs zone (port `3101`)
- Everything else → Web zone (port `3100`)

Both zones proxy `/api/*` requests to the backend server (port `3000`).

---

## Development Workflow

### Project Structure Overview

```
rainestack/
├── packages/
│   ├── tools/        # Shared utilities (tryCatch, Temporal, prototypes)
│   ├── database/     # Prisma schema, client, actor transactions
│   ├── server/       # Bun HTTP server, oRPC routes, data layer
│   ├── api/          # Client-side oRPC client factory
│   ├── ui/           # Shared React component library (shadcn/ui)
│   ├── web/          # Web shell micro-frontend
│   ├── docs/         # Docs micro-frontend
│   └── tsconfig/     # Shared TypeScript configurations
├── docker/           # Docker configurations
├── docs/             # Markdown documentation (this file!)
└── ...
```

### Common Tasks

#### Add a New Dependency

**Always add dependencies to the root `package.json` catalog:**

```jsonc
// package.json (root)
{
  "workspaces": {
    "catalog": {
      "some-package": "3.2.1"  // ← Add here with exact version
    }
  }
}
```

Then reference it in your package:

```jsonc
// packages/server/package.json
{
  "dependencies": {
    "some-package": "catalog:"  // ← Reference from catalog
  }
}
```

Run `bun install` to install the new dependency.

#### Create a Database Migration

When you modify the Prisma schema:

```bash
cd packages/database
bunx --bun prisma migrate dev --name your_migration_name
```

This creates a new migration file and applies it to your database.

#### Add a New API Route

1. **Define the data layer function** in `packages/server/src/data/`:

```typescript
// packages/server/src/data/posts.ts
export async function findById(db: Db, id: string) {
  return db.post.findUnique({ where: { id } });
}
```

2. **Create the oRPC route** in `packages/server/src/routes/`:

```typescript
// packages/server/src/routes/posts.ts
import { authedProcedure } from '@server/lib/orpc';
import * as postsData from '@server/data/posts';

export const getById = authedProcedure
  .input(z.object({ id: z.string() }))
  .output(PostSchema)
  .handler(async ({ input, context }) => {
    return postsData.findById(context.db, input.id);
  });
```

3. **Use it in the frontend** with full type safety:

```typescript
// packages/web/src/routes/post.tsx
import { api } from '@web/lib/api';

const post = await api.posts.getById({ id: '123' });
//    ^? Post (fully typed)
```

#### Run Tests

```bash
bun test
```

#### Format Code

```bash
bun run format
```

#### Lint Code

```bash
bun run lint
```

#### Type Check

```bash
bun run typecheck
```

---

## Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server at localhost:5432`

**Solution:** Ensure PostgreSQL is running:
```bash
docker ps  # Check if container is running
bun run db:start  # Restart database
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:** Kill the process using the port:
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Stale Prisma Client

**Error:** `PrismaClient is unable to run in this browser environment`

**Solution:** Regenerate the Prisma client:
```bash
cd packages/database
bunx --bun prisma generate
```

### Docker Volume Issues

**Error:** Database fails to start after image changes

**Solution:** Remove the volume and recreate:
```bash
docker compose -f ./docker/dev.yaml down -v
bun run db:start
bun run db:dev
```

### TypeScript Errors After Pulling Changes

**Solution:** Reinstall dependencies and regenerate Prisma client:
```bash
bun install
cd packages/database
bunx --bun prisma generate
bun run typecheck
```

---

## Next Steps

Now that you have the development environment running, explore these topics:

- **[Monorepo Architecture](./monorepo.md)** — Understand package structure and dependencies
- **[Database Guide](./database.md)** — Learn about Prisma, triggers, and audit infrastructure
- **[API Development](./api.md)** — Build type-safe oRPC endpoints
- **[UI Components](./ui-components.md)** — Use and extend the shadcn/ui component library
- **[Authentication](./authentication.md)** — Implement JWT, OIDC, and passkey flows

---

## Useful Commands Reference

```bash
# Development
bun run dev                 # Start all packages
bun run build               # Build all packages
bun run lint                # Lint all packages
bun run typecheck           # Type-check all packages
bun run format              # Format all files
bun run clean               # Remove all node_modules

# Database
bun run db:start            # Start PostgreSQL
bun run db:dev              # Run migrations + triggers (dev)
bun run db:deploy           # Run migrations + triggers (prod)

# Individual Packages
cd packages/server && bun run dev
cd packages/web && bun run dev
cd packages/docs && bun run dev
cd packages/database && bunx --bun prisma studio
```

---

Welcome to RaineStack! 🚀 If you have questions or run into issues, check the [documentation](./README.md) or open an issue on GitHub.