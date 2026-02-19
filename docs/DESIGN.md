# Documentation Design Guide

This document explains the design principles and improvements made to the RaineStack documentation to achieve a professional, modern appearance similar to industry-leading documentation sites.

---

## What Makes Great Documentation Design?

### 1. **Clear Information Hierarchy**

Professional documentation uses visual hierarchy to guide readers:

- **Large, bold headings** that are easy to scan
- **Consistent spacing** between sections
- **Typography scale** that creates clear visual distinction
- **Breadcrumbs** for navigation context

### 2. **Sidebar Navigation**

Essential for large documentation sites:

- **Persistent sidebar** showing all documentation sections
- **Active state indicators** showing current page
- **Grouped sections** with clear categories
- **Icons** for visual recognition
- **Mobile-responsive** with hamburger menu

### 3. **Professional Typography**

Typography is the foundation of readable documentation:

```css
/* Headings */
- H1: 36-48px, bold, tracking-tight
- H2: 24-30px, semibold, border-bottom
- H3: 20-24px, semibold
- H4: 18px, semibold

/* Body Text */
- Paragraph: 16px, line-height 1.75
- Muted foreground color for better readability
- Maximum width: 65-75 characters per line
```

### 4. **Code Block Styling**

Code is central to technical docs:

- **Elevated appearance** with subtle shadows and borders
- **Syntax highlighting** for better readability
- **Inline code** with distinct background and border
- **Copy button** for easy copying (future enhancement)
- **Language tags** showing the code language

### 5. **Content Width & Spacing**

Optimal reading experience:

- **Main content**: Max width 700-800px (3xl)
- **Generous padding**: 24-32px vertical, 16-24px horizontal
- **Breathing room**: Large margins between sections
- **White space**: Not afraid of empty space

### 6. **Color System**

Professional color usage:

- **Primary color**: Links, active states, icons
- **Muted foreground**: Body text (60% opacity)
- **Foreground**: Headings, emphasis
- **Borders**: Subtle dividers (10-15% opacity)
- **Background variations**: Cards, code blocks, table headers

### 7. **Interactive Elements**

Enhance engagement:

- **Hover states**: Elevation, color changes
- **Active indicators**: Current page highlighting
- **Smooth transitions**: 150-200ms ease
- **Focus states**: Keyboard navigation support

---

## RaineStack Documentation Architecture

### Component Structure

```
DocsLayout
├── Header (Sticky)
│   ├── Logo & Title
│   ├── Mobile Menu (Sheet)
│   └── Action Buttons
├── Sidebar (Fixed)
│   ├── Scroll Area
│   └── Navigation Links
│       ├── Section Headers
│       └── Page Links (with icons)
├── Main Content Area
│   ├── Breadcrumbs
│   └── Markdown Content
│       └── Prose Styling
└── Footer
```

### Layout Specifications

| Element | Width | Behavior |
|---------|-------|----------|
| **Sidebar** | 256px | Fixed on desktop, Sheet on mobile |
| **Content** | Max 768px | Centered with padding |
| **Right Sidebar** | 256px | Table of contents (future) |
| **Total Max Width** | 1536px | Container with padding |

### Responsive Breakpoints

```typescript
// Tailwind breakpoints used
sm: 640px   // Mobile landscape
md: 768px   // Tablet (sidebar appears)
lg: 1024px  // Desktop
xl: 1280px  // Large desktop (right sidebar)
```

---

## Typography System

### Font Stack

```css
/* Base */
font-family: ui-sans-serif, system-ui, sans-serif;

/* Code */
font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.25rem (36px) | 700 | 1.2 |
| H2 | 1.5rem (24px) | 600 | 1.3 |
| H3 | 1.25rem (20px) | 600 | 1.4 |
| H4 | 1.125rem (18px) | 600 | 1.4 |
| Body | 1rem (16px) | 400 | 1.75 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| Code | 0.875rem (14px) | 400 | 1.5 |

---

## Color Palette

### Light Mode

```css
--background: 0 0% 100%;           /* Pure white */
--foreground: 240 10% 3.9%;        /* Almost black */
--muted: 240 4.8% 95.9%;           /* Light gray */
--muted-foreground: 240 3.8% 46.1%; /* Medium gray */
--primary: 240 5.9% 10%;           /* Dark blue-gray */
--border: 240 5.9% 90%;            /* Light border */
```

### Dark Mode

```css
--background: 240 10% 3.9%;        /* Dark blue-gray */
--foreground: 0 0% 98%;            /* Off-white */
--muted: 240 3.7% 15.9%;           /* Dark gray */
--muted-foreground: 240 5% 64.9%;  /* Light gray */
--primary: 0 0% 98%;               /* White */
--border: 240 3.7% 15.9%;          /* Dark border */
```

---

## Prose Styling Details

### Markdown Elements

```css
/* Headings */
.prose h1 { @apply text-4xl font-bold tracking-tight mb-6 mt-2; }
.prose h2 { @apply text-2xl font-semibold mt-12 mb-4 border-b pb-3; }
.prose h3 { @apply text-xl font-semibold mt-8 mb-3; }

/* Links */
.prose a {
  @apply text-primary font-medium no-underline transition-colors;
  @apply hover:underline hover:text-primary/80;
}

/* Code Blocks */
.prose pre {
  @apply bg-muted border rounded-lg p-4 overflow-x-auto my-6;
  @apply shadow-sm ring-1 ring-border/50;
}

/* Inline Code */
.prose code {
  @apply rounded bg-muted px-1.5 py-0.5 text-sm font-mono;
  @apply text-foreground border border-border/50;
  @apply before:content-none after:content-none;
}

/* Tables */
.prose table {
  @apply my-8 w-full border-collapse rounded-lg overflow-hidden;
  @apply shadow-sm border border-border;
}

.prose th {
  @apply bg-muted px-4 py-3 text-left text-sm font-semibold;
}

.prose td {
  @apply border border-border px-4 py-3 text-sm;
}

/* Blockquotes */
.prose blockquote {
  @apply border-l-4 border-primary pl-6 py-1 italic;
  @apply text-muted-foreground my-6 bg-muted/30 rounded-r;
}

/* Lists */
.prose ul, .prose ol {
  @apply my-6 pl-6 space-y-2;
}

.prose li {
  @apply text-muted-foreground;
}

.prose li::marker {
  @apply text-primary;
}
```

---

## Best Practices

### DO ✅

- Use consistent spacing (multiples of 4px)
- Provide clear visual hierarchy
- Use semantic HTML elements
- Support keyboard navigation
- Include skip-to-content links
- Test on mobile devices
- Use relative units (rem, em)
- Provide dark mode support
- Cache navigation state
- Lazy load large content

### DON'T ❌

- Use fixed pixel widths for text containers
- Rely on color alone for information
- Create navigation without active states
- Ignore mobile experience
- Use tiny font sizes (<14px for body)
- Forget focus indicators
- Overcrowd with information
- Use poor contrast ratios
- Ignore loading states
- Mix conflicting design patterns

---

## Performance Considerations

### Code Splitting

```typescript
// Lazy load heavy markdown renderer
const MarkdownContent = lazy(() => import('./markdown-content'));

// Dynamic imports for routes
const DocPage = lazy(() => import('./routes/doc-page'));
```

### Asset Optimization

- **Images**: Use WebP with fallbacks
- **Fonts**: Subset and preload
- **CSS**: Critical CSS inline, defer rest
- **JS**: Split vendors from app code

### Caching Strategy

```
Static assets (fonts, images): 1 year
CSS/JS bundles: 1 year (content-hashed)
Markdown content: 1 hour (revalidate)
API responses: No-cache
```

---

## Accessibility (WCAG 2.1 Level AA)

### Keyboard Navigation

- Tab through all interactive elements
- Skip to main content link
- Focus visible on all elements
- Logical tab order

### Screen Reader Support

```html
<!-- Semantic landmarks -->
<header role="banner">
<nav role="navigation" aria-label="Main">
<main role="main" aria-label="Content">
<aside role="complementary" aria-label="Table of contents">

<!-- ARIA labels -->
<button aria-label="Open mobile menu">
<a aria-current="page" href="/docs">
```

### Color Contrast

- Body text: Minimum 4.5:1
- Large text (18px+): Minimum 3:1
- UI components: Minimum 3:1
- Test with tools like axe DevTools

---

## Inspiration & References

Professional documentation that influenced this design:

1. **Vercel** - Clean, minimalist, excellent typography
2. **Stripe** - Beautiful API docs, great code examples
3. **Next.js** - Sidebar navigation, clear hierarchy
4. **Tailwind CSS** - Search, version selector, prose styling
5. **React** - Beta docs redesign, interactive examples
6. **Docusaurus** - Robust feature set, good defaults

---

## Future Enhancements

### Phase 1 (Near-term)
- [ ] Search functionality (Algolia or Flexsearch)
- [ ] Table of contents (right sidebar)
- [ ] Copy button for code blocks
- [ ] Syntax highlighting with Shiki
- [ ] Edit on GitHub links

### Phase 2 (Medium-term)
- [ ] Version selector
- [ ] API playground (interactive)
- [ ] Dark/light/system theme picker
- [ ] Analytics integration
- [ ] Feedback widgets

### Phase 3 (Long-term)
- [ ] i18n (internationalization)
- [ ] PDF export
- [ ] Offline support (PWA)
- [ ] Video tutorials
- [ ] Community contributions

---

## Maintenance

### Updating Styles

1. **Tailwind Config**: Modify `tailwind.config.ts` for theme changes
2. **Prose Classes**: Update `markdown-content.tsx` for content styling
3. **Layout**: Modify `docs-layout.tsx` for structural changes

### Adding New Pages

1. Create markdown file in `/docs`
2. Add route in `app.tsx`
3. Add navigation item in `docs-layout.tsx`
4. Update home page grid if featured

### Testing Checklist

- [ ] Mobile responsiveness (320px - 1920px)
- [ ] Dark mode appearance
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Load time (<3s on 3G)
- [ ] Cross-browser (Chrome, Firefox, Safari, Edge)

---

## Conclusion

Great documentation design is about **clarity**, **accessibility**, and **usability**. By following these principles and using consistent patterns, RaineStack documentation provides a professional experience that helps developers learn and build confidently.

The key is not to reinvent the wheel—study what works in industry-leading documentation and adapt those patterns to your stack's unique needs.