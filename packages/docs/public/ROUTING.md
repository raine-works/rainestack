# Documentation Routing Reference

This document explains how routing works in the RaineStack documentation site to avoid confusion with the `basename="/docs"` configuration.

---

## Key Concept: BrowserRouter Basename

The docs app uses `<BrowserRouter basename="/docs">` which means:

- **All routes are automatically prefixed with `/docs`**
- **Links inside the app should NOT include `/docs`**
- **External links TO the docs should include `/docs`**

---

## URL Mapping

### From Outside (Web Shell, Browser)

When navigating FROM outside the docs zone, use full paths:

```tsx
// ✅ Correct - External links include /docs
<a href="/docs">Documentation Home</a>
<a href="/docs/getting-started">Getting Started</a>
<a href="/docs/api">API Guide</a>
```

### Inside Docs Zone (Internal Navigation)

When navigating INSIDE the docs zone, use relative paths:

```tsx
// ✅ Correct - Internal links exclude /docs (basename handles it)
<Link to="/">Home</Link>
<Link to="/getting-started">Getting Started</Link>
<Link to="/api">API Guide</Link>

// ❌ Wrong - This will navigate to /docs/docs/getting-started
<Link to="/docs/getting-started">Getting Started</Link>
```

---

## Route Configuration

### App Routes (packages/docs/src/app.tsx)

```tsx
<BrowserRouter basename="/docs">
  <Routes>
    <Route index element={<Home />} />                    {/* → /docs */}
    <Route path="getting-started" element={...} />        {/* → /docs/getting-started */}
    <Route path="api" element={...} />                     {/* → /docs/api */}
  </Routes>
</BrowserRouter>
```

**Path definitions use relative paths (no leading `/docs`).**

### Navigation Structure (packages/docs/src/components/docs-layout.tsx)

```tsx
const navigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/', icon: Home },              // → /docs
      { title: 'Installation', href: '/getting-started', icon: Package } // → /docs/getting-started
    ]
  }
];
```

**Hrefs use relative paths from the basename.**

---

## Vite Configuration

```typescript
// packages/docs/vite.config.ts
export default defineConfig({
  base: '/docs',  // All static assets served from /docs
  // ...
});
```

This means:
- `public/getting-started.md` → Accessible at `/docs/getting-started.md`
- `src/main.tsx` → Compiled to `/docs/assets/main-[hash].js`
- `index.html` → Served at `/docs/index.html`

---

## Markdown Fetching

When fetching markdown files from the public directory:

```tsx
// ✅ Correct - Fetch from /docs/${slug}.md
const response = await fetch(`/docs/${slug}.md`);

// With basename="/docs" and base="/docs":
// - Route: /docs/getting-started
// - Fetch: /docs/getting-started.md
// - File: public/getting-started.md
```

---

## Common Mistakes

### ❌ Double /docs in Links

```tsx
// WRONG - Creates /docs/docs/getting-started
<Link to="/docs/getting-started">Guide</Link>

// CORRECT
<Link to="/getting-started">Guide</Link>
```

### ❌ Missing /docs in External References

```tsx
// WRONG - From web shell
<a href="/getting-started">Docs</a>  // → /getting-started (404)

// CORRECT - From web shell
<a href="/docs/getting-started">Docs</a>  // → /docs/getting-started ✓
```

### ❌ Absolute Paths in Navigation

```tsx
// WRONG - Hrefs with full path
{ title: 'Home', href: '/docs', icon: Home }

// CORRECT - Hrefs relative to basename
{ title: 'Home', href: '/', icon: Home }
```

---

## Testing Checklist

When adding new routes:

- [ ] Route defined in `app.tsx` without `/docs` prefix
- [ ] Navigation link in `docs-layout.tsx` without `/docs` prefix
- [ ] Home page link without `/docs` prefix
- [ ] Markdown file copied to `public/` directory
- [ ] Can navigate from home page to new page
- [ ] Can navigate from sidebar to new page
- [ ] Can access directly via URL: `http://localhost:3024/docs/your-page`
- [ ] Breadcrumbs show correctly
- [ ] Active state highlights in sidebar

---

## Development URLs

| Access Point | URL | Notes |
|--------------|-----|-------|
| **Via Proxy (Recommended)** | `http://localhost:3024/docs` | Routes through Turborepo proxy |
| **Direct Dev Server** | `http://localhost:3101/docs` | Direct to Vite (for debugging) |
| **Production** | `http://localhost:3000/docs` | Served by Bun static handler |

All internal navigation works the same regardless of entry point.

---

## Debugging Tips

### Check Current Path

```tsx
import { useLocation } from 'react-router';

function DebugLocation() {
  const location = useLocation();
  console.log('pathname:', location.pathname);  // Without basename
  // On /docs/getting-started → pathname: "/getting-started"
}
```

### Check Active Link

```tsx
const location = useLocation();
const isActive = location.pathname === '/getting-started';
// On /docs/getting-started → isActive: true
```

### Verify Markdown Fetch

```tsx
// Should fetch: /docs/getting-started.md
const url = `/docs/${slug}.md`;
console.log('Fetching:', url);
const response = await fetch(url);
console.log('Status:', response.status);  // Should be 200
```

---

## Summary

**Simple Rule:** 
- External links (from outside docs) → Use `/docs/path`
- Internal links (inside docs with `<Link>`) → Use `/path`
- Basename handles the `/docs` prefix automatically

This is the React Router way and keeps the code clean and portable.