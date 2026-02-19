# UI Components

This guide covers the shared React component library (`@rainestack/ui`) built on **shadcn/ui** with the **base-vega** theme, Tailwind CSS, and Lucide icons.

---

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Available Components](#available-components)
- [Theme System](#theme-system)
- [Component Usage](#component-usage)
- [Providers](#providers)
- [Hooks](#hooks)
- [Styling](#styling)
- [Adding New Components](#adding-new-components)
- [Best Practices](#best-practices)

---

## Overview

The `@rainestack/ui` package provides a comprehensive component library with:

- **50+ UI components** — Pre-built, accessible primitives
- **shadcn/ui base-vega theme** — Modern, professional design
- **Dark mode support** — Automatic theme switching
- **Tailwind CSS 4.1** — Utility-first styling
- **Lucide icons** — Beautiful, consistent iconography
- **TypeScript-first** — Full type safety
- **Accessible** — ARIA attributes and keyboard navigation
- **Composable** — Build complex UIs from simple primitives

---

## Installation

The UI package is already installed as a workspace dependency. Import components using subpath exports:

```typescript
import { Button } from '@rainestack/ui/components/ui/button';
import { Card, CardHeader, CardTitle } from '@rainestack/ui/components/ui/card';
```

**Never import from the barrel export** — always use subpaths for tree-shaking:

```typescript
// ✅ Correct — tree-shakeable subpath import
import { Button } from '@rainestack/ui/components/ui/button';

// ❌ Wrong — imports entire library
import { Button } from '@rainestack/ui';
```

---

## Available Components

### Form Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Button** | Primary action buttons | `@rainestack/ui/components/ui/button` |
| **Input** | Text input fields | `@rainestack/ui/components/ui/input` |
| **Textarea** | Multi-line text input | `@rainestack/ui/components/ui/textarea` |
| **Checkbox** | Boolean selection | `@rainestack/ui/components/ui/checkbox` |
| **Radio Group** | Single selection from options | `@rainestack/ui/components/ui/radio-group` |
| **Select** | Dropdown selection | `@rainestack/ui/components/ui/select` |
| **Switch** | Toggle switch | `@rainestack/ui/components/ui/switch` |
| **Slider** | Numeric range input | `@rainestack/ui/components/ui/slider` |
| **Calendar** | Date picker | `@rainestack/ui/components/ui/calendar` |
| **Combobox** | Searchable select | `@rainestack/ui/components/ui/combobox` |
| **Input OTP** | One-time password input | `@rainestack/ui/components/ui/input-otp` |

### Layout Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Card** | Content container | `@rainestack/ui/components/ui/card` |
| **Separator** | Visual divider | `@rainestack/ui/components/ui/separator` |
| **Tabs** | Tabbed interface | `@rainestack/ui/components/ui/tabs` |
| **Accordion** | Collapsible sections | `@rainestack/ui/components/ui/accordion` |
| **Collapsible** | Expandable content | `@rainestack/ui/components/ui/collapsible` |
| **Resizable** | Resizable panels | `@rainestack/ui/components/ui/resizable` |
| **Scroll Area** | Custom scrollbars | `@rainestack/ui/components/ui/scroll-area` |
| **Sidebar** | Navigation sidebar | `@rainestack/ui/components/ui/sidebar` |

### Navigation Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Breadcrumb** | Navigation breadcrumbs | `@rainestack/ui/components/ui/breadcrumb` |
| **Navigation Menu** | Top navigation | `@rainestack/ui/components/ui/navigation-menu` |
| **Pagination** | Page navigation | `@rainestack/ui/components/ui/pagination` |
| **Menubar** | Menu bar | `@rainestack/ui/components/ui/menubar` |

### Overlay Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Dialog** | Modal dialog | `@rainestack/ui/components/ui/dialog` |
| **Alert Dialog** | Confirmation dialog | `@rainestack/ui/components/ui/alert-dialog` |
| **Sheet** | Slide-in panel | `@rainestack/ui/components/ui/sheet` |
| **Drawer** | Bottom drawer | `@rainestack/ui/components/ui/drawer` |
| **Popover** | Floating content | `@rainestack/ui/components/ui/popover` |
| **Tooltip** | Hover tooltip | `@rainestack/ui/components/ui/tooltip` |
| **Hover Card** | Rich hover content | `@rainestack/ui/components/ui/hover-card` |
| **Dropdown Menu** | Context menu | `@rainestack/ui/components/ui/dropdown-menu` |
| **Context Menu** | Right-click menu | `@rainestack/ui/components/ui/context-menu` |

### Feedback Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Alert** | Inline alerts | `@rainestack/ui/components/ui/alert` |
| **Toast (Sonner)** | Toast notifications | `@rainestack/ui/components/ui/sonner` |
| **Progress** | Progress bar | `@rainestack/ui/components/ui/progress` |
| **Spinner** | Loading spinner | `@rainestack/ui/components/ui/spinner` |
| **Skeleton** | Loading placeholder | `@rainestack/ui/components/ui/skeleton` |

### Display Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Table** | Data tables | `@rainestack/ui/components/ui/table` |
| **Avatar** | User avatar | `@rainestack/ui/components/ui/avatar` |
| **Badge** | Status badge | `@rainestack/ui/components/ui/badge` |
| **Kbd** | Keyboard shortcut | `@rainestack/ui/components/ui/kbd` |
| **Chart** | Charts (Recharts) | `@rainestack/ui/components/ui/chart` |
| **Carousel** | Image carousel | `@rainestack/ui/components/ui/carousel` |
| **Aspect Ratio** | Maintain aspect ratio | `@rainestack/ui/components/ui/aspect-ratio` |

### Block Components

| Component | Description | Import Path |
|-----------|-------------|-------------|
| **Brand Logo** | Logo with theme support | `@rainestack/ui/components/blocks/brand-logo` |
| **Not Found** | 404 page | `@rainestack/ui/components/blocks/not-found` |
| **Theme Picker** | Theme selector | `@rainestack/ui/components/blocks/theme-picker` |

---

## Theme System

### ThemeProvider

Wrap your app with `ThemeProvider` to enable theme switching:

```typescript
import { ThemeProvider } from '@rainestack/ui/providers/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <YourApp />
    </ThemeProvider>
  );
}
```

**Props:**
- `defaultTheme` — `'light'` | `'dark'` | `'system'` (default: `'system'`)
- `storageKey` — LocalStorage key for persistence (default: `'vite-ui-theme'`)

### useTheme Hook

Access and control the theme:

```typescript
import { useTheme } from '@rainestack/ui/providers/theme-provider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  );
}
```

**Returns:**
- `theme` — Current theme: `'light'` | `'dark'` | `'system'`
- `setTheme(theme)` — Update theme
- `resolvedTheme` — Actual theme applied (resolves `'system'` to `'light'` or `'dark'`)

### Theme Picker Component

Use the pre-built theme picker:

```typescript
import { ThemePicker } from '@rainestack/ui/components/blocks/theme-picker';

function Header() {
  return (
    <header>
      <ThemePicker />
    </header>
  );
}
```

---

## Component Usage

### Button

```typescript
import { Button } from '@rainestack/ui/components/ui/button';

function Example() {
  return (
    <>
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button disabled>Disabled</Button>
    </>
  );
}
```

**Variants:** `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`

**Sizes:** `sm`, `default`, `lg`, `icon`

### Card

```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@rainestack/ui/components/ui/card';

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  );
}
```

### Dialog

```typescript
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@rainestack/ui/components/ui/dialog';
import { Button } from '@rainestack/ui/components/ui/button';

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Form with Input

```typescript
import { Input } from '@rainestack/ui/components/ui/input';
import { Label } from '@rainestack/ui/components/ui/label';
import { Button } from '@rainestack/ui/components/ui/button';

function Example() {
  return (
    <form>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
        />
      </div>
      <Button type="submit">Sign In</Button>
    </form>
  );
}
```

### Select

```typescript
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@rainestack/ui/components/ui/select';

function Example() {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
        <SelectItem value="3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Toast Notifications

```typescript
import { Toaster } from '@rainestack/ui/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@rainestack/ui/components/ui/button';

function App() {
  return (
    <>
      <YourApp />
      <Toaster />
    </>
  );
}

function Example() {
  return (
    <>
      <Button onClick={() => toast('Hello World')}>
        Show Toast
      </Button>
      <Button onClick={() => toast.success('Success!')}>
        Success
      </Button>
      <Button onClick={() => toast.error('Error!')}>
        Error
      </Button>
      <Button onClick={() => toast.promise(
        fetch('/api/data'),
        {
          loading: 'Loading...',
          success: 'Data loaded!',
          error: 'Failed to load'
        }
      )}>
        Promise Toast
      </Button>
    </>
  );
}
```

### Table

```typescript
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from '@rainestack/ui/components/ui/table';

function Example() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

---

## Providers

### ThemeProvider

Enables theme switching (light/dark/system):

```typescript
import { ThemeProvider } from '@rainestack/ui/providers/theme-provider';

<ThemeProvider defaultTheme="system" storageKey="ui-theme">
  <App />
</ThemeProvider>
```

### LogoProvider

Provides brand logos for light/dark themes:

```typescript
import { LogoProvider } from '@rainestack/ui/providers/logo-provider';

<LogoProvider
  lightLogo="/logo-light.svg"
  darkLogo="/logo-dark.svg"
>
  <App />
</LogoProvider>
```

**Usage:**

```typescript
import { useLogo } from '@rainestack/ui/providers/logo-provider';

function Logo() {
  const { logo } = useLogo();
  return <img src={logo} alt="Logo" />;
}
```

### Head Provider

Manages document head (title, favicon):

```typescript
import { Head, HeadContent } from '@rainestack/ui/providers/head-provider';

function App() {
  return (
    <Head defaultTitle="My App">
      <HeadContent title="Home" />
      <Routes>...</Routes>
    </Head>
  );
}

function AboutPage() {
  return (
    <>
      <HeadContent title="About" />
      <h1>About</h1>
    </>
  );
}
```

---

## Hooks

### useMobile

Detect mobile viewport:

```typescript
import { useMobile } from '@rainestack/ui/hooks/use-mobile';

function Example() {
  const isMobile = useMobile();
  
  return (
    <div>
      {isMobile ? (
        <MobileNav />
      ) : (
        <DesktopNav />
      )}
    </div>
  );
}
```

**Breakpoint:** `768px` (matches Tailwind's `md` breakpoint)

---

## Styling

### Tailwind CSS

All components use Tailwind CSS utility classes:

```typescript
<Button className="mt-4 w-full">
  Full Width Button
</Button>
```

### Class Name Merging

Use the `cn()` utility for conditional classes:

```typescript
import { cn } from '@rainestack/ui/lib/utils';

function Example({ isActive, className }) {
  return (
    <div className={cn(
      'base-class',
      isActive && 'active-class',
      className
    )}>
      Content
    </div>
  );
}
```

### CSS Variables

Theme colors are defined as CSS variables in `@rainestack/ui/styles/theme.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    /* ... */
  }
  
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    /* ... */
  }
}
```

### Custom Styling

Override component styles with Tailwind classes:

```typescript
<Button className="bg-purple-500 hover:bg-purple-600">
  Purple Button
</Button>
```

---

## Adding New Components

### Using shadcn CLI

The UI package is configured for shadcn/ui. Add new components with:

```bash
cd packages/ui
bunx shadcn@latest add <component-name>
```

**Example:**

```bash
bunx shadcn@latest add command
```

**This will:**
1. Download the component code
2. Place it in `src/components/ui/`
3. Install any required dependencies

### Manual Addition

1. **Create component file** in `src/components/ui/`:

```typescript
// packages/ui/src/components/ui/my-component.tsx
import * as React from 'react';
import { cn } from '@ui/lib/utils';

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'special';
}

export function MyComponent({
  variant = 'default',
  className,
  ...props
}: MyComponentProps) {
  return (
    <div
      className={cn(
        'base-styles',
        variant === 'special' && 'special-styles',
        className
      )}
      {...props}
    />
  );
}
```

2. **Export from package** (optional, prefer subpath imports):

```typescript
// packages/ui/src/index.ts
export * from './components/ui/my-component';
```

3. **Use in apps:**

```typescript
import { MyComponent } from '@rainestack/ui/components/ui/my-component';
```

---

## Best Practices

### 1. Always Use Subpath Imports

```typescript
// ✅ Correct
import { Button } from '@rainestack/ui/components/ui/button';

// ❌ Wrong
import { Button } from '@rainestack/ui';
```

### 2. Compose Components

Build complex UIs from simple primitives:

```typescript
function UserCard({ user }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p>{user.bio}</p>
      </CardContent>
      <CardFooter>
        <Button>Follow</Button>
      </CardFooter>
    </Card>
  );
}
```

### 3. Use Semantic HTML

Components render semantic HTML by default — preserve it:

```typescript
// ✅ Good — uses <button>
<Button onClick={handleClick}>Click me</Button>

// ❌ Bad — renders a div
<Button asChild>
  <div onClick={handleClick}>Click me</div>
</Button>
```

### 4. Handle Loading States

```typescript
function Example() {
  const [loading, setLoading] = useState(false);
  
  return (
    <Button disabled={loading}>
      {loading ? (
        <>
          <Spinner className="mr-2" />
          Loading...
        </>
      ) : (
        'Submit'
      )}
    </Button>
  );
}
```

### 5. Maintain Accessibility

Components are accessible by default — don't break it:

```typescript
// ✅ Good — maintains ARIA
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
  </DialogContent>
</Dialog>

// ❌ Bad — missing required ARIA elements
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <p>Content without title or description</p>
  </DialogContent>
</Dialog>
```

### 6. Use Icons from Lucide

```typescript
import { Home, Settings, User } from 'lucide-react';

<Button>
  <Home className="mr-2 size-4" />
  Home
</Button>
```

### 7. Create Block Components

For reusable composed patterns, create block components:

```typescript
// packages/ui/src/components/blocks/user-card.tsx
export function UserCard({ user }) {
  return (
    <Card>
      {/* ... */}
    </Card>
  );
}
```

---

## Summary

The `@rainestack/ui` package provides:

- ✅ **50+ pre-built components** with shadcn/ui
- ✅ **Full dark mode support** via ThemeProvider
- ✅ **Tailwind CSS styling** with utility classes
- ✅ **Accessible by default** with ARIA attributes
- ✅ **Tree-shakeable** via subpath exports
- ✅ **Type-safe** with full TypeScript support
- ✅ **Composable** — build complex UIs from simple primitives

By leveraging the UI library, you can build beautiful, accessible interfaces quickly without reinventing the wheel.

---

**Next Steps:**
- [Theme Customization](./theming.md) — Customize colors and design tokens
- [Micro-Frontends](./microfrontends.md) — Use UI components across zones
- [Accessibility](./accessibility.md) — ARIA best practices