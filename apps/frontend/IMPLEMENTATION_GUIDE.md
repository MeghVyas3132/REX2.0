# REX Design System Implementation Guide

Complete walkthrough for using the REX 2.0 design system in your application.

---

## Setup Checklist

### 1. Root Layout Configuration

**File:** `apps/frontend/src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { TourProvider } from '@/components/tour';
import { TourSpotlight } from '@/components/tour';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'REX Studio',
  description: 'Enterprise workflow automation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fontshare CDN for Cabinet Grotesk */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/css?f[]=cabinet-grotesk@500,700&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <TourProvider>
          <TourSpotlight />
          {children}
        </TourProvider>
      </body>
    </html>
  );
}
```

### 2. Dark Mode Provider (Optional)

For theme toggle support:

**File:** `apps/frontend/src/components/providers/theme-provider.tsx`

```tsx
'use client';

import React, { useState, useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('theme');
    if (saved) {
      setIsDark(saved === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <>
      {children}
      <style>{`
        :root {
          color-scheme: ${isDark ? 'dark' : 'light'};
        }
      `}</style>
    </>
  );
}
```

Wrap `<TourProvider>` in `<ThemeProvider>` in layout.

### 3. Verify Fonts are Loading

Check DevTools → Network tab for:
- `Geist` and `Geist_Mono` from `next/font`
- `cabinet-grotesk` from Fontshare CDN

If fonts don't load, fallbacks are system fonts (acceptable but not ideal).

---

## Common Patterns

### Building a Simple Form

```tsx
'use client';

import { useState } from 'react';
import { Button, Input, TextArea, Select } from '@/components/ui';
import { useToast } from '@/components/ui';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

export function WorkflowForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const { success, error } = useToast();

  const handleSubmit = async () => {
    if (!name.trim()) {
      error('Workflow name is required');
      return;
    }

    try {
      // API call
      await fetch('/api/workflows', {
        method: 'POST',
        body: JSON.stringify({ name, description, category }),
      });

      success('Workflow created', { body: name });
      setName('');
      setDescription('');
      setCategory('');
    } catch (err) {
      error('Failed to create workflow');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2>Create Workflow</h2>
      </CardHeader>

      <CardBody>
        <Input
          placeholder="Workflow name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextArea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category</option>
          <option value="data">Data Processing</option>
          <option value="notification">Notification</option>
          <option value="integration">Integration</option>
        </Select>
      </CardBody>

      <CardFooter>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>
          Create Workflow
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Building a Data Table with Status

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Table } from '@/components/ui';
import { StatusBadge } from '@/components/ui';

interface Workflow {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'failed';
  runs: number;
  lastRun: string;
}

export function WorkflowsTable() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    // Fetch workflows
    fetch('/api/workflows').then((r) => r.json()).then(setWorkflows);
  }, []);

  return (
    <Table<Workflow>
      columns={[
        { key: 'name', label: 'Workflow' },
        {
          key: 'status',
          label: 'Status',
          render: (status) => <StatusBadge status={status} />,
        },
        {
          key: 'runs',
          label: 'Runs',
          align: 'right',
          render: (runs) => runs.toLocaleString(),
        },
        {
          key: 'lastRun',
          label: 'Last Run',
          render: (lastRun) => new Date(lastRun).toLocaleDateString(),
        },
      ]}
      data={workflows}
      onRowClick={(row) => {
        window.location.href = `/workflows/${row.id}`;
      }}
    />
  );
}
```

### Modal with Confirmation

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Modal } from '@/components/ui';
import { useToast } from '@/components/ui';

export function DeleteWorkflowButton({ workflowId }: { workflowId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, { method: 'DELETE' });
      success('Workflow deleted');
      setIsOpen(false);
    } catch (err) {
      error('Failed to delete workflow');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Workflow?"
        size="small"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
              loading={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Workflow'}
            </Button>
          </>
        }
      >
        This action cannot be undone. All workflow history will be lost.
      </Modal>
    </>
  );
}
```

### Using the Layout System

```tsx
'use client';

import { Layout, Sidebar, SidebarSection, SidebarItem, Topbar, TopbarLeft, TopbarRight } from '@/components/layout';
import { Button } from '@/components/ui';
import Link from 'next/link';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { icon: '⚙️', label: 'Studio', href: '/studio' },
    { icon: '📊', label: 'Templates', href: '/templates' },
    { icon: '📈', label: 'Analytics', href: '/analytics' },
    { icon: '⚡', label: 'Integrations', href: '/integrations' },
  ];

  return (
    <Layout>
      <Sidebar>
        <SidebarSection title="Main">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              icon={item.icon}
              active={true} // Check current route
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </SidebarItem>
          ))}
        </SidebarSection>
        <SidebarSection title="Admin" collapsible>
          <SidebarItem icon="👥">Users</SidebarItem>
          <SidebarItem icon="🔐">Security</SidebarItem>
        </SidebarSection>
      </Sidebar>

      <Topbar>
        <TopbarLeft>Studio</TopbarLeft>
        <TopbarRight>
          <Button variant="ghost" size="compact">
            Help
          </Button>
          <Button variant="primary" size="compact">
            Publish
          </Button>
        </TopbarRight>
      </Topbar>

      <main style={{ padding: 'var(--space-6)' }}>
        {children}
      </main>
    </Layout>
  );
}
```

### Tour / Onboarding

```tsx
'use client';

import { useTour, type TourStep } from '@/components/tour';
import { Button } from '@/components/ui';
import { useEffect } from 'react';

export function StudioTour() {
  const { start, state } = useTour();

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to REX Studio',
      description: 'Build powerful workflows without code.',
      selector: '.studio-header',
      placement: 'bottom',
    },
    {
      id: 'canvas',
      title: 'Canvas Area',
      description: 'Drag nodes here to build your workflow.',
      selector: '.canvas-container',
      placement: 'right',
    },
    {
      id: 'node-palette',
      title: 'Node Palette',
      description: 'Browse available node types.',
      selector: '.node-palette',
      placement: 'right',
    },
    {
      id: 'execute',
      title: 'Execute Workflow',
      description: 'Test your workflow here.',
      selector: '.execute-button',
      placement: 'left',
    },
  ];

  const handleStartTour = () => {
    start(tourSteps);
  };

  useEffect(() => {
    // Auto-start on first visit
    const hasSeenTour = localStorage.getItem('studio-tour-seen');
    if (!hasSeenTour) {
      handleStartTour();
      localStorage.setItem('studio-tour-seen', 'true');
    }
  }, []);

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
      <Button
        variant="ghost"
        size="compact"
        onClick={handleStartTour}
        disabled={state.isActive}
      >
        🎯 Tour
      </Button>
    </div>
  );
}
```

---

## Styling & CSS Classes

### Using Utility Classes

Helper classes from `src/styles/utilities.css`:

```tsx
// Spacing
<div className="gap-4 p-6">...</div>

// Flex & Grid
<div className="flex items-center justify-between gap-2">...</div>
<div className="grid grid-cols-3 gap-4">...</div>

// Text
<p className="text-sm text-secondary">Subtitle</p>
<h1 className="text-2xl font-bold text-primary">Heading</h1>

// Opacity
<div className="opacity-50">Faded</div>
```

### Creating Custom Component Styles

Always use `var()` for colors:

```css
/* ✅ CORRECT */
.custom-component {
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

/* ❌ WRONG */
.custom-component {
  background-color: #ffffff;  /* Hardcoded! */
  color: #0a0e27;
  border: 1px solid #e1e8ed;
}
```

### Animation Example

```css
.fade-and-slide {
  animation: fade-in var(--duration-base) var(--ease-smooth),
            slide-in var(--duration-base) var(--ease-smooth);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}
```

---

## Performance Tips

### 1. Component Splitting

Don't render all components in one file:

```tsx
// ✅ Good
<StudioLayout>
  <CanvasArea />      {/* Code-split */}
  <NodePalette />     {/* Code-split */}
  <InspectorPanel />  {/* Code-split */}
</StudioLayout>

// ❌ Bad
<StudioLayout>
  {/* Huge file with everything */}
</StudioLayout>
```

### 2. Modal/Overlay Performance

Use state to control rendering:

```tsx
// ✅ Good - Modal only renders when open
const [isOpen, setIsOpen] = useState(false);
{isOpen && <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />}

// ❌ Bad - Always in DOM
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

### 3. Table Data Virtualization

For large lists, use virtualization:

```tsx
import { FixedSizeList } from 'react-window';

// Large workflow list
<FixedSizeList height={600} itemCount={workflows.length} itemSize={50}>
  {({ index, style }) => (
    <div style={style} key={workflows[index].id}>
      {/*Row content*/}
    </div>
  )}
</FixedSizeList>
```

---

## Testing Components

### Unit Test Example

```tsx
// __tests__/button.test.ts
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('button--primary');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
```

### Visual Regression Testing

Use tools like Percy or Chromatic:

```tsx
// In CI/CD, run visual tests to catch design regressions
npx percy exec -- npm run test
```

---

## Accessibility Checklist

Before shipping components:

- [ ] All interactive elements are keyboard accessible (Tab, Enter, Esc)
- [ ] Buttons have `aria-label` if icon-only
- [ ] Forms have `<label>` matching input `id`
- [ ] Modals have `role="dialog"` and focus trap
- [ ] Color contrast ≥4.5:1 for text (use WCAG checker)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Tables use semantic `<table>`, `<thead>`, `<tbody>`
- [ ] Focus ring is visible (never `outline: none`)
- [ ] Touch targets are ≥44×44px on mobile

---

## Next Steps

1. **Integrate into pages** — Use patterns above in your pages
2. **Create page-specific components** — Extend UI library with domain logic
3. **Build the canvas** — Workflow editor with CanvasNode components
4. **Launch tour** — Onboard users with TourProvider
5. **Monitor in production** — Track performance and accessibility metrics

---

## Troubleshooting

### Fonts not loading
- Check Fontshare CDN is reachable
- Verify `next/font` imports in layout
- Check DevTools → Network tab
- Fallback to system fonts (Segoe UI, -apple-system)

### Dark mode not toggling
- Ensure `className="dark"` is on `<html>` element
- Use ThemeProvider pattern above
- Check localStorage key name matches

### Spotlight not appearing in tour
- Verify element selector matches CSS selector syntax
- Check element is in viewport (tour will scroll to it)
- Inspect SVG in DevTools for correct mask

### Performance issues
- Profile with React DevTools Profiler
- Use Code splitting for heavy pages
- Virtualize long lists (react-window)
- Lazy-load images and modals

---

## Resources

- [CSS Variables Reference](file:///src/styles/tokens.css)
- [Component API Docs](file:///src/COMPONENT_REFERENCE.md)
- [Tour System Guide](file:///src/components/tour/TOUR.md)
- [Design System Philosophy](file:///KT.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)

---

**Last Updated:** March 2026  
**For questions:** Review component source files or check TypeScript interfaces
