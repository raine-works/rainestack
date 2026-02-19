# Micro-Frontend Architecture

This guide explains RaineStack's micro-frontend architecture, how multiple React applications are served from a single backend, zone configuration, routing, and deployment strategies.

---

## Table of Contents

- [Overview](#overview)
- [What Are Micro-Frontends?](#what-are-micro-frontends)
- [Architecture](#architecture)
- [Zone Configuration](#zone-configuration)
- [Routing](#routing)
- [Development Workflow](#development-workflow)
- [Building and Deployment](#building-and-deployment)
- [Adding New Zones](#adding-new-zones)
- [Best Practices](#best-practices)

---

## Overview

RaineStack implements a **micro-frontend architecture** where multiple independent React applications (called **zones**) are served from a single Bun HTTP server. Each zone:

- Has its own **independent codebase** with separate dependencies
- Uses its own **build pipeline** (Vite)
- Maintains its own **routing context** with React Router
- Shares **common libraries** (`@rainestack/ui`, `@rainestack/api`, `@rainestack/tools`)
- Is served as **static assets** from the backend

### Current Zones

| Zone | Base Path | Port (Dev) | Purpose |
|------|-----------|------------|---------|
| **Web** | `/` | 3100 | Main application shell |
| **Docs** | `/docs` | 3101 | Documentation site |

---

## What Are Micro-Frontends?

Micro-frontends extend the concept of microservices to the frontend, enabling:

### Benefits

✅ **Independent Development** — Teams can work on different zones without conflicts

✅ **Technology Flexibility** — Each zone can use different versions of libraries (within reason)

✅ **Incremental Upgrades** — Update one zone without touching others

✅ **Faster Builds** — Build only the zones that changed

✅ **Clear Boundaries** — Each zone has a well-defined responsibility

✅ **Simplified Testing** — Test zones in isolation

### Trade-offs

❌ **Increased Complexity** — More packages to manage

❌ **Code Duplication** — Shared code must be extracted to libraries

❌ **Initial Setup Overhead** — More configuration than a monolithic SPA

❌ **Bundle Size** — Shared dependencies may be loaded multiple times

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────┐
│          Bun HTTP Server (port 3000)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  /api/*           → oRPC API handlers           │
│  /api/openapi.json → OpenAPI specification      │
│  /api/contract.json → oRPC contract router      │
│  /healthz         → Health check                │
│                                                 │
│  /docs, /docs/*   → Docs zone (static)          │
│  /*               → Web zone (static, catch-all) │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Development Architecture

```
┌──────────────────────────────────────────────────┐
│   Turborepo Microfrontend Proxy (port 3024)     │
├──────────────────────────────────────────────────┤
│                                                  │
│  /docs, /docs/*  → http://localhost:3101 (docs)  │
│  /*              → http://localhost:3100 (web)   │
│                                                  │
└──────────────────────────────────────────────────┘
         ↓                            ↓
┌─────────────────┐        ┌─────────────────┐
│  Vite Dev Server│        │  Vite Dev Server│
│  (Web Zone)     │        │  (Docs Zone)    │
│  Port 3100      │        │  Port 3101      │
└─────────────────┘        └─────────────────┘
         ↓                            ↓
     /api/* → http://localhost:3000 (Bun server)
```

**During development:**
1. Each zone runs its own Vite dev server with HMR
2. Turborepo proxy routes requests to the appropriate zone
3. Both zones proxy `/api/*` requests to the Bun server
4. Access the app at `http://localhost:3024`

### Production Architecture

```
┌─────────────────────────────────────────────────┐
│          Bun HTTP Server (port 3000)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Serves static builds from STATIC_DIR:          │
│                                                 │
│  /docs/index.html → docs zone entry point       │
│  /docs/assets/*   → docs zone assets            │
│                                                 │
│  /index.html      → web zone entry point        │
│  /assets/*        → web zone assets             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**In production:**
1. All zones are built to static assets
2. Single Bun server serves all zones
3. No proxy needed — direct static file serving
4. Efficient caching with content-hashed filenames

---

## Zone Configuration

### Turborepo Microfrontend Config

Each zone declares its routing configuration in `microfrontends.json`:

```json
// packages/web/microfrontends.json
{
  "zones": [
    {
      "name": "web",
      "path": "/"
    }
  ]
}
```

```json
// packages/docs/microfrontends.json
{
  "zones": [
    {
      "name": "docs",
      "path": "/docs"
    }
  ]
}
```

**Fields:**
- `name` — Zone identifier (must match package name)
- `path` — Base path where zone is served

### Vite Configuration

Each zone uses Vite with React and proxy configuration:

```typescript
// packages/web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', {}]]
        }
      })
    ],
    server: {
      port: 3100,
      proxy: {
        '/api': {
          target: env.API_URL || 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true
    }
  };
});
```

**Key configuration:**
- `server.port` — Unique port for each zone
- `server.proxy` — Proxy API requests to backend
- `build.outDir` — Output directory for production build

### Package Configuration

```json
// packages/web/package.json
{
  "name": "@rainestack/web",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@rainestack/api": "workspace:*",
    "@rainestack/ui": "workspace:*",
    "@rainestack/tools": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-router": "catalog:"
  }
}
```

---

## Routing

### React Router Configuration

Each zone uses `BrowserRouter` with its base path:

**Web Zone (base: `/`)**

```typescript
// packages/web/src/app.tsx
import { BrowserRouter, Route, Routes } from 'react-router';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="posts/:id" element={<Post />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Docs Zone (base: `/docs`)**

```typescript
// packages/docs/src/app.tsx
import { BrowserRouter, Route, Routes } from 'react-router';

export function App() {
  return (
    <BrowserRouter basename="/docs">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="getting-started" element={<GettingStarted />} />
          <Route path="api" element={<ApiDocs />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Key difference:** The `basename="/docs"` prop ensures all routes are prefixed with `/docs`.

### URL Examples

| Zone | Route Definition | Actual URL |
|------|------------------|------------|
| Web | `/` | `http://localhost:3024/` |
| Web | `/about` | `http://localhost:3024/about` |
| Web | `/posts/:id` | `http://localhost:3024/posts/123` |
| Docs | `/` (with basename) | `http://localhost:3024/docs` |
| Docs | `/getting-started` | `http://localhost:3024/docs/getting-started` |
| Docs | `/api` | `http://localhost:3024/docs/api` |

### Navigation Between Zones

Use regular anchor tags for cross-zone navigation:

```tsx
// In web zone, link to docs
<a href="/docs">View Documentation</a>

// In docs zone, link to web
<a href="/">Back to App</a>
```

**Do NOT use React Router's `<Link>` for cross-zone navigation** — it won't work because each zone has its own router context.

---

## Development Workflow

### Starting All Zones

```bash
# From root — starts all zones + backend
bun run dev
```

**This starts:**
- Bun server (port 3000)
- Web zone dev server (port 3100)
- Docs zone dev server (port 3101)
- Turborepo proxy (port 3024)

### Starting Individual Zones

```bash
# Web zone only
cd packages/web
bun run dev

# Docs zone only
cd packages/docs
bun run dev
```

### Hot Module Replacement (HMR)

Each zone has independent HMR:
- Changes in `web` trigger HMR in web zone only
- Changes in `docs` trigger HMR in docs zone only
- Changes in shared libraries (`ui`, `api`) trigger HMR in all consuming zones

### Accessing Zones

| URL | Description |
|-----|-------------|
| `http://localhost:3024` | Main entry point (proxy) |
| `http://localhost:3024/docs` | Docs zone via proxy |
| `http://localhost:3100` | Web zone direct (bypass proxy) |
| `http://localhost:3101` | Docs zone direct (bypass proxy) |
| `http://localhost:3000` | Backend server direct |

**Tip:** Use the proxy URL (`3024`) for the most realistic development experience.

---

## Building and Deployment

### Building All Zones

```bash
# Build everything
bun run build
```

**Output structure:**
```
packages/
├── web/dist/
│   ├── index.html
│   ├── assets/
│   │   ├── index-abc123.js
│   │   └── index-def456.css
│   └── ...
└── docs/dist/
    ├── index.html
    ├── assets/
    │   ├── index-xyz789.js
    │   └── index-uvw012.css
    └── ...
```

### Copying Builds to Static Directory

```bash
# Create static directory
mkdir -p dist/static

# Copy web zone (root)
cp -r packages/web/dist/* dist/static/

# Copy docs zone (under /docs)
mkdir -p dist/static/docs
cp -r packages/docs/dist/* dist/static/docs/
```

### Server Discovery

The Bun server automatically discovers zones at startup:

```typescript
// packages/server/src/lib/static.ts
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

export function discoverZones(staticDir: string) {
  const zones: Zone[] = [];
  
  // Check for root zone (web)
  if (existsSync(join(staticDir, 'index.html'))) {
    zones.push({ name: 'web', path: '/', dir: staticDir });
  }
  
  // Check for subdirectory zones
  const entries = readdirSync(staticDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const zonePath = join(staticDir, entry.name);
      if (existsSync(join(zonePath, 'index.html'))) {
        zones.push({
          name: entry.name,
          path: `/${entry.name}`,
          dir: zonePath
        });
      }
    }
  }
  
  return zones;
}
```

### Serving Static Files

```typescript
// Serve zone at its base path
app.get(`${zone.path}/*`, async (req) => {
  const filePath = req.path.slice(zone.path.length) || '/index.html';
  const file = Bun.file(join(zone.dir, filePath));
  
  if (await file.exists()) {
    return new Response(file);
  }
  
  // SPA fallback — serve index.html
  return new Response(Bun.file(join(zone.dir, 'index.html')));
});
```

### Environment Variables

```env
# Production
NODE_ENV=production
STATIC_DIR=/app/static

# The server will serve:
# /static/index.html → web zone
# /static/docs/index.html → docs zone
```

---

## Adding New Zones

### Step 1: Create Package

```bash
cd packages
mkdir my-zone
cd my-zone
bun init
```

### Step 2: Install Dependencies

```json
// packages/my-zone/package.json
{
  "name": "@rainestack/my-zone",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@rainestack/api": "workspace:*",
    "@rainestack/ui": "workspace:*",
    "@rainestack/tools": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-router": "catalog:"
  }
}
```

### Step 3: Create Vite Config

```typescript
// packages/my-zone/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3102,  // ← Unique port
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
```

### Step 4: Create Microfrontend Config

```json
// packages/my-zone/microfrontends.json
{
  "zones": [
    {
      "name": "my-zone",
      "path": "/my-zone"
    }
  ]
}
```

### Step 5: Create App Entry Point

```typescript
// packages/my-zone/src/app.tsx
import { BrowserRouter, Route, Routes } from 'react-router';

export function App() {
  return (
    <BrowserRouter basename="/my-zone">
      <Routes>
        <Route index element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```typescript
// packages/my-zone/src/main.tsx
import '@rainestack/tools/prototypes';
import '@rainestack/tools/temporal-polyfill';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Step 6: Update Turborepo Config

```json
// turbo.json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Step 7: Test

```bash
# Start all zones
bun run dev

# Access new zone
open http://localhost:3024/my-zone
```

---

## Best Practices

### 1. Keep Zones Independent

Each zone should be **independently deployable**:

✅ **Good:**
```typescript
// Each zone has its own API client instance
const api = await createApiClient<Router>(location.origin);
```

❌ **Bad:**
```typescript
// Importing from another zone
import { api } from '@rainestack/web';
```

### 2. Share Code via Libraries

Extract shared code to `@rainestack/ui`, `@rainestack/api`, or `@rainestack/tools`:

✅ **Good:**
```typescript
// Extract to @rainestack/ui
import { Button } from '@rainestack/ui/components/ui/button';
```

❌ **Bad:**
```typescript
// Copy-paste between zones
// packages/web/src/components/button.tsx
// packages/docs/src/components/button.tsx (duplicate)
```

### 3. Use Consistent Routing Patterns

Follow REST-like URL patterns:

✅ **Good:**
```
/posts          → List posts
/posts/:id      → View post
/posts/:id/edit → Edit post
```

❌ **Bad:**
```
/postsList
/viewPost?id=123
/editThePost/123
```

### 4. Handle 404s Gracefully

Each zone should have a catch-all route:

```typescript
<Route path="*" element={<NotFound homeHref="/docs" />} />
```

### 5. Optimize Bundle Size

Use lazy loading for large components:

```typescript
import { lazy, Suspense } from 'react';

const Editor = lazy(() => import('./components/editor'));

<Suspense fallback={<Spinner />}>
  <Editor />
</Suspense>
```

### 6. Use Environment Variables Carefully

Never hardcode URLs:

✅ **Good:**
```typescript
const api = await createApiClient<Router>(
  import.meta.env.VITE_API_URL || location.origin
);
```

❌ **Bad:**
```typescript
const api = await createApiClient<Router>('http://localhost:3000');
```

### 7. Test Zones in Isolation

Each zone should be testable independently:

```bash
cd packages/docs
bun test
```

---

## Summary

RaineStack's micro-frontend architecture provides:

- ✅ **Independent development** of multiple frontend applications
- ✅ **Shared infrastructure** (backend, component library, utilities)
- ✅ **Efficient development** with HMR and proxy routing
- ✅ **Simple deployment** — single server serves all zones
- ✅ **Clear boundaries** — each zone has a well-defined purpose

By following the patterns in this guide, you can add new zones, share code effectively, and scale your frontend architecture as your application grows.

---

**Next Steps:**
- [UI Components](./ui-components.md) — Shared component library
- [API Development](./api.md) — Type-safe backend integration
- [Deployment](./deployment.md) — Production deployment strategies