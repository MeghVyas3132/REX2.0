# REX 2.0 Component Library Reference

Complete documentation for all UI components and patterns in the REX design system.

**Last Updated:** March 2026  
**Version:** 1.0.0  
**Technology:** React 19, TypeScript, CSS Variables (no frameworks)

---

## Table of Contents

1. [Layout Components](#layout-components)
2. [Form Components](#form-components)
3. [Data Display](#data-display)
4. [Feedback & Status](#feedback--status)
5. [Overlays](#overlays)
6. [Motion & Animation](#motion--animation)
7. [Design Tokens](#design-tokens)
8. [Accessibility](#accessibility)
9. [Dark Mode](#dark-mode)
10. [Best Practices](#best-practices)

---

## Layout Components

### Layout System

Main grid structure for application pages. Desktop: 240px sidebar, 52px topbar. Mobile: 56px collapsed sidebar.

**Import:**
```tsx
import { Layout, Sidebar, SidebarSection, SidebarItem, Topbar, TopbarLeft, TopbarRight } from '@/components/layout';
```

**Usage:**
```tsx
<Layout>
  <Sidebar>
    <SidebarSection title="Workflows">
      <SidebarItem icon="⚙️" active>Studio</SidebarItem>
      <SidebarItem icon="📊">Templates</SidebarItem>
    </SidebarSection>
  </Sidebar>
  
  <Topbar>
    <TopbarLeft>REX Studio</TopbarLeft>
    <TopbarRight>
      <Button variant="ghost">Help</Button>
    </TopbarRight>
  </Topbar>

  <main>{/* Page content */}</main>
</Layout>
```

**Responsive Breakpoints:**
- **Mobile** (<640px): Single column, sidebar hidden
- **Tablet** (640-1024px): Sidebar collapses to 56px on scroll
- **Desktop** (>1024px): Full 240px sidebar visible

### Card

Container component with optional header, body, and footer. Base for modal content, panels, and sections.

**Import:**
```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';
```

**Props:**
```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <h3>Workflow Details</h3>
  </CardHeader>
  <CardBody>
    {/* Content */}
  </CardBody>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

**Styling:** Border, subtle shadow, light background with dark mode support.

---

## Form Components

### Button

Primary interaction element. 4 variants, 2 sizes, supports loading state.

**Import:**
```tsx
import { Button } from '@/components/ui';
```

**Props:**
```tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'default' | 'compact';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}
```

**Variants:**
- **primary** — Blue background, white text (action/confirm)
- **secondary** — Outlined blue, white text (alternative action)
- **ghost** — No background, blue text (tertiary action)
- **danger** — Red background, white text (destructive)

**Usage:**
```tsx
<Button variant="primary" onClick={handleSubmit}>Save Workflow</Button>
<Button variant="secondary" size="compact">Settings</Button>
<Button variant="danger" disabled>Delete</Button>
```

**States:**
- **Hover**: Darkened background
- **Focus**: Blue outline ring
- **Disabled**: 50% opacity
- **Loading**: Spinner icon, no click

### Input

Text input field with error state and optional label.

**Import:**
```tsx
import { Input } from '@/components/ui';
```

**Props:**
```tsx
interface InputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  type?: string;
  className?: string;
}
```

**Usage:**
```tsx
<Input 
  placeholder="Workflow name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

<Input 
  error="Name is required"
  value={name}
/>

<Input 
  success
  value="Workflow saved"
/>
```

**States:**
- **Default**: Light background, subtle border
- **Focus**: Blue border ring
- **Error**: Red left border, error text below
- **Success**: Green left border
- **Disabled**: Muted colors, no interaction

### TextArea

Multi-line text input with same error/success states as Input.

**Usage:**
```tsx
<TextArea 
  placeholder="Workflow description"
  rows={4}
  error={errors.description}
/>
```

### Select

Dropdown form control with options list.

**Usage:**
```tsx
<Select 
  value={selected}
  onChange={(value) => setSelected(value)}
>
  <option value="">Choose type...</option>
  <option value="api">API Request</option>
  <option value="condition">Condition</option>
</Select>
```

---

## Data Display

### Table

Typed data table with columns, hover states, and sorting.

**Import:**
```tsx
import { Table } from '@/components/ui';
```

**Props:**
```tsx
interface TableProps<T> {
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: any, row: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
  }>;
  data: T[];
  rowKey?: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}
```

**Usage:**
```tsx
const workflows = [
  { id: 1, name: 'Email Parser', status: 'active', runs: 234 },
  { id: 2, name: 'Data Sync', status: 'paused', runs: 89 },
];

<Table
  columns={[
    { key: 'name', label: 'Workflow Name' },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => <StatusBadge status={status} /> 
    },
    { 
      key: 'runs', 
      label: 'Runs',
      align: 'right',
      render: (runs) => `${runs} total` 
    },
  ]}
  data={workflows}
  onRowClick={(row) => navigate(`/workflow/${row.id}`)}
/>
```

### Canvas Node

Fixed 220px component representing workflow node on canvas. Category-based icon colors.

**Import:**
```tsx
import { CanvasNode } from '@/components/ui';
```

**Categories:**
- **trigger** — Webhook, timer, manual
- **action** — HTTP, send email, database
- **logic** — Condition, loop, switch
- **transform** — Format, map, aggregate
- **integration** — Third-party services
- **output** — Send, store, webhook
- **advanced** — Custom code, AI

**Usage:**
```tsx
<CanvasNode
  id="node-1"
  category="action"
  title="Send Email"
  description="notification@example.com"
  rexScore={{ r: 85, e: 72, x: 88 }}
  selected={true}
  onSelect={handleSelect}
/>
```

---

## Feedback & Status

### Status Badge

Colored badge with traffic-light indicator. Green (running/success), Amber (pending), Red (error/failed).

**Import:**
```tsx
import { StatusBadge, StatusDot } from '@/components/ui';
```

**Props:**
```tsx
type StatusType = 'success' | 'pending' | 'error' | 'default';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  animated?: boolean;
}
```

**Usage:**
```tsx
<StatusBadge status="success" label="Running" animated />
<StatusBadge status="error" />
<StatusDot status="pending" />
```

### REX Badge

Certification score display with R/E/X breakdown and tooltip.

**Import:**
```tsx
import { RexBadge } from '@/components/ui';
```

**Props:**
```tsx
interface RexBadgeProps {
  score: RexScore;
  size?: 'small' | 'medium';
  showTooltip?: boolean;
}

interface RexScore {
  r: number; // Reliability 0-100
  e: number; // Efficiency 0-100
  x: number; // Experience 0-100
}
```

**Usage:**
```tsx
<RexBadge 
  score={{ r: 85, e: 72, x: 88 }}
  showTooltip
/>
```

**Color Scale:**
- **≥70**: Green (excellent)
- **40-69**: Amber (good)
- **<40**: Red (needs improvement)

### Toast Notifications

Context-based notification system for success, error, info messages.

**Import:**
```tsx
import { TourProvider, useToast } from '@/components/ui';
```

**Setup in layout:**
```tsx
<TourProvider>
  <TourSpotlight />
  {children}
</TourProvider>
```

**Usage:**
```tsx
const { success, error, info, warning } = useToast();

// Auto-dismiss (default 4s)
success('Workflow saved', { body: 'All changes persisted' });

// Persistent (user closes manually)
error('Connection failed', { duration: 0 });

// Custom duration
warning('This action is immutable', { duration: 6000 });
```

---

## Overlays

### Modal / Dialog

Centered overlay with focus trap and keyboard close (ESC).

**Import:**
```tsx
import { Modal } from '@/components/ui';
```

**Props:**
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeButton?: boolean;
}
```

**Usage:**
```tsx
const [open, setOpen] = useState(false);

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Confirm Delete"
  size="small"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete Workflow</Button>
    </>
  }
>
  This action cannot be undone. Are you sure?
</Modal>
```

### Tour / Spotlight

Guided walkthrough with animated spotlight overlay and keyboard navigation.

**Import:**
```tsx
import { TourProvider, useTour, TourSpotlight } from '@/components/tour';
```

**Setup in root layout:**
```tsx
<TourProvider>
  <TourSpotlight />
  {children}
</TourProvider>
```

**Usage:**
```tsx
const { start } = useTour();

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Learn the basics',
    selector: '.hero-section',
    placement: 'bottom',
  },
];

<button onClick={() => start(tourSteps)}>Start Tour</button>
```

---

## Motion & Animation

### Easing Curves

5 predefined easing functions for smooth, natural motion:

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);        /* Standard */
--ease-smooth-in: cubic-bezier(0.4, 0, 1, 1);       /* Entrance */
--ease-smooth-out: cubic-bezier(0, 0, 0.2, 1);      /* Exit */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful */
--ease-linear: linear;                              /* Constant */
```

### Durations

5 duration levels following motion budget:

```css
--duration-instant: 80ms;   /* Micro-interactions */
--duration-fast: 150ms;     /* UI responses */
--duration-base: 300ms;     /* Standard transitions */
--duration-slow: 400ms;     /* Entrance/exit */
--duration-slowest: 500ms;  /* Complex sequences */
```

### Keyframe Animations

Pre-defined animations (defined in tokens.css):

- `fade-in / fade-out` — Opacity change
- `scale-in / scale-out` — Size + opacity
- `slide-in` — Position translation
- `pulse-glow` — Continuous pulsing
- `spin` — Rotation

---

## Design Tokens

### Color System

**Neutrals** (90% of UI):
```css
--color-bg-base: #ffffff;           /* Main background */
--color-bg-surface: #fafbfc;        /* Cards, modals */
--color-bg-subtle: #f6f8fa;         /* Hover states */
--color-bg-muted: #eaeef2;          /* Disabled, secondary */
```

**Text Hierarchy**:
```css
--color-text-primary: #0a0e27;      /* Headings, primary text */
--color-text-secondary: #57606a;    /* Secondary text */
--color-text-tertiary: #8b949e;     /* Labels, hints */
--color-text-disabled: #d0d7de;     /* Disabled text */
--color-text-inverse: #ffffff;      /* On dark backgrounds */
```

**Status Colors** (3-color system only):
```css
--color-green-500: #22c55e;         /* Success, running */
--color-amber-500: #f59e0b;         /* Pending, warning */
--color-red-500: #ef4444;           /* Error, failed */
```

**Blue** (action only):
```css
--color-blue-500: #3b82f6;          /* Links, buttons, selected state */
--color-blue-600: #2563eb;          /* Hover state */
```

### Spacing Scale

8px base unit:
```css
--space-1: 4px;    --space-7: 28px;    --space-13: 52px;    --space-19: 76px;
--space-2: 8px;    --space-8: 32px;    --space-14: 56px;    --space-20: 80px;
--space-3: 12px;   --space-9: 36px;    --space-15: 60px;    --space-21: 84px;
--space-4: 16px;   --space-10: 40px;   --space-16: 64px;    --space-22: 88px;
--space-5: 20px;   --space-11: 44px;   --space-17: 68px;    --space-23: 92px;
--space-6: 24px;   --space-12: 48px;   --space-18: 72px;    --space-24: 96px;
```

### Border Radius

```css
--radius-sm: 4px;      /* Buttons, inputs */
--radius-md: 8px;      /* Cards, popovers */
--radius-lg: 12px;     /* Modals, larger panels */
--radius-xl: 16px;     /* Prominent containers */
--radius-2xl: 20px;    /* Largest containers */
--radius-full: 9999px; /* Pills, circular elements */
```

### Shadows

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

---

## Accessibility

### Focus Management

All interactive elements have blue focus ring:
```css
&:focus-visible {
  outline: 1.5px solid var(--color-blue-500);
  outline-offset: 2px;
}
```

### Reduced Motion

All animations respect user preference:
```css
@media (prefers-reduced-motion: reduce) {
  animation: none;
  transition: none;
}
```

### ARIA Attributes

- Buttons: `aria-label` for icon buttons
- Modals: `role="dialog"`, `aria-modal="true"`
- Tables: Semantic `<table>`, `<thead>`, `<tbody>`
- Forms: `<label>` matching input `id`

### Color Contrast

- Text on backgrounds: ≥4.5:1 (WCAG AA)
- UI components: ≥3:1 (WCAG AA)
- All combinations tested in light and dark mode

### Touch Targets

Minimum 44x44px for mobile:
```css
/* Buttons */
padding: 8px 16px;      /* min-height: 36px */

/* Interactive elements */
width: 32px; height: 32px;  /* with 6px padding = 44px */
```

---

## Dark Mode

All components automatically support dark mode via `.dark` class:

```tsx
// In root layout or Provider
<html className="dark">
  {children}
</html>
```

**Automatic Token Overrides:**
```css
.dark {
  --color-bg-base: #0a0e27;
  --color-bg-surface: #161b22;
  --color-text-primary: #ffffff;
  /* ... all tokens have dark variants */
}
```

Components need **zero** dark-mode-specific CSS — all colors reference tokens.

---

## Best Practices

### 1. Color Discipline

✅ **DO:**
- Use only blue (#3b82f6) for action, links, selected state
- Use only green/amber/red for status (3-color system)
- Reference tokens: `var(--color-blue-500)`

❌ **DON'T:**
- Hardcode hex colors
- Use multiple shades of blue for status
- Use purple, orange, or other colors

### 2. Typography

✅ **DO:**
- Cabinet Grotesk: Display text (h1, h2, h3)
- Geist: Body text, UI labels
- Geist Mono: Code, technical content

❌ **DON'T:**
- Mix fonts within same hierarchy level
- Use custom fonts outside of Geist/Cabinet Grotesk

### 3. Motion

✅ **DO:**
- Keep animations ≤500ms
- Use predefined easing curves
- Respect `prefers-reduced-motion`

❌ **DON'T:**
- Animate without easing (abrupt transitions)
- Use animations >500ms (feels slow)
- Ignore reduced-motion preference

### 4. Spacing

✅ **DO:**
- Use space scale (--space-1 to --space-24)
- Consistent gap between elements
- Align to 8px grid

❌ **DON'T:**
- Use arbitrary pixel values
- Mix margins and gaps
- Overlap spacing units

### 5. Component Composition

✅ **DO:**
```tsx
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>
```

❌ **DON'T:**
```tsx
<Card>
  <div className="header">Title</div>
  <div className="content">Content</div>
</Card>
```

### 6. Form Validation

✅ **DO:**
```tsx
<Input error={errors.email} />
<Input success />
```

❌ **DON'T:**
```tsx
<Input style={{ borderColor: 'red' }} />
<Input className="invalid" />
```

---

## Component File Structure

```
src/components/
├── ui/
│   ├── button.css / button.tsx
│   ├── input.css / form.tsx
│   ├── status-badge.css / status-badge.tsx
│   ├── rex-badge.css / rex-badge.tsx
│   ├── card.css / card.tsx
│   ├── canvas-node.css / canvas-node.tsx
│   ├── modal.css / modal.tsx
│   ├── toast.css / toast.tsx
│   ├── table.css / table.tsx
│   └── index.ts (barrel export)
├── layout/
│   ├── layout.css / layout.tsx
│   └── index.ts
└── tour/
    ├── types.ts
    ├── tour-context.tsx
    ├── tour-spotlight.css / tour-spotlight.tsx
    ├── index.ts
    └── TOUR.md

src/styles/
├── tokens.css (design tokens)
├── globals.css (base typography, resets)
└── utilities.css (helper classes)
```

---

## Import Patterns

```tsx
// From UI barrel
import { Button, Input, Card, Table } from '@/components/ui';

// From layout
import { Layout, Sidebar, Topbar } from '@/components/layout';

// From tour
import { TourProvider, useTour, TourSpotlight } from '@/components/tour';

// Individual imports (if needed)
import { Button } from '@/components/ui/button';
```

---

## Version History

- **1.0.0** (March 2026) — Initial release
  - 9 core UI components
  - 2 layout components
  - Tour system with spotlight
  - 100+ design tokens
  - Dark mode support
  - Full TypeScript types

---

## Contributing

When adding new components:

1. Create `.css` and `.tsx` files in appropriate folder
2. Use CSS variables for all colors
3. Export types from component file
4. Add to barrel export (`index.ts`)
5. Document in this guide
6. Test light/dark modes
7. Verify accessibility (focus, reduced-motion, ARIA)
8. Ensure <500ms motion budget

---

**Questions?** Check individual component READMEs or review source files in `src/components/`.
