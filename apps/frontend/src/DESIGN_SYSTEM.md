# REX 2.0 Frontend Design System Implementation

> **Philosophy:** Walking into a Bloomberg Terminal that has been redesigned by a Swiss design studio. Quiet authority. Nothing shouts. Everything communicates.

## Quick Start

### Core Design Tokens
All design decisions flow from **one source of truth**: `src/styles/tokens.css`

```css
/* Typography */
--font-display: 'Cabinet Grotesk'    /* Headings, 400–800 weight */
--font-body:    'Geist'              /* UI, copy, labels */
--font-mono:    'Geist Mono'         /* Code, IDs, timestamps */

/* Colours — Light mode (baseline) */
--color-bg-base:      #fafafa        /* Page background */
--color-bg-surface:   #ffffff        /* Cards, panels, surfaces */
--color-bg-subtle:    #f4f4f5        /* Hover, subtle backgrounds */
--color-text-primary: #09090b        /* Headlines, primary text */

/* Status — Only three colours allowed */
--color-green-500:   #22c55e         /* Success, running, certified */
--color-amber-500:   #f59e0b         /* Pending, partial, warning */
--color-red-500:     #ef4444         /* Error, failed, attention */

/* Action colour */
--color-blue-500:    #3b82f6         /* ONLY for buttons, links, selected states */
```

**Dark mode:** Apply `.dark` class to `<html>` or any ancestor. All tokens automatically update via CSS custom properties.

---

## Component Library

### Button Component
**File:** `src/components/ui/button.tsx`

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Save workflow</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Learn more</Button>
<Button variant="danger">Delete</Button>
<Button size="compact" variant="primary">Quick action</Button>
<Button isLoading={saving}>Saving...</Button>
<Button isBlock>Full width button</Button>
```

**Variants:**
- `primary` — Blue background, white text. Use for primary actions only.
- `secondary` — Subtle background, primary text. Use for non-primary actions.
- `ghost` — Transparent, secondary text. Use for low-priority actions.
- `danger` — Red background, red text. Destructive actions.

**Sizes:**
- `default` — 38px height (standard)
- `compact` — 34px height (inline, tight spaces)

---

### Status Badge
**File:** `src/components/ui/status-badge.tsx`

```tsx
import { StatusBadge, StatusDot } from '@/components/ui';

/* Badges with labels */
<StatusBadge variant="success">Running</StatusBadge>
<StatusBadge variant="warning">Pending</StatusBadge>
<StatusBadge variant="error">Failed</StatusBadge>

/* Inline status dots */
<StatusDot variant="success" />
<StatusDot variant="warning" />
<StatusDot variant="error" />
```

**Important:** Only use green, amber, and red. Never blue for status indication (blue is reserved for action/selection).

---

### REX Badge (Canvas Node Certification)
**File:** `src/components/ui/rex-badge.tsx`

```tsx
import { RexBadge } from '@/components/ui';

<RexBadge 
  score={{ responsible: 85, ethical: 72, explainable: 91 }}
  gaps={["Missing consent gate"]}
/>
```

The badge shows:
- **REX ✓** (green) if total score ≥ 70
- **REX ~** (amber) if score 40–69
- **REX ✗** (red) if score < 40, with subtle pulse animation

Hover shows tooltip with R/E/X breakdown and gaps.

---

### Form Elements
**File:** `src/components/ui/form.tsx`

```tsx
import { Input, TextArea, Select } from '@/components/ui';

<Input 
  label="API Key"
  type="password"
  placeholder="Enter your key"
  error={error}
/>

<TextArea 
  label="Description"
  placeholder="Tell us more..."
/>

<Select 
  label="Category"
  options={[
    { value: 'ai', label: 'AI/LLM' },
    { value: 'data', label: 'Data' }
  ]}
/>
```

All form fields inherit the design system. Focus ring is blue, error states are red.

---

### Card Component
**File:** `src/components/ui/card.tsx`

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card>
  <CardHeader title="Workflow settings" />
  <CardBody>
    {/* content */}
  </CardBody>
  <CardFooter>
    <Button variant="secondary">Close</Button>
  </CardFooter>
</Card>
```

Cards use borders (not drop shadows) for containment. Hover on interactive cards shows subtle elevation (border-strong + shadow-md).

---

### Canvas Node
**File:** `src/components/ui/canvas-node.tsx`

```tsx
import { CanvasNode } from '@/components/ui';

<CanvasNode
  id="webhook-1"
  name="Webhook Trigger"
  category="trigger"
  icon={<WebhookIcon />}
  config="POST /api/webhook"
  status="running"
  rexScore={{ responsible: 90, ethical: 85, explainable: 92 }}
  isSelected={selected}
  onRexBadgeClick={openRexWizard}
/>
```

**Categories** (icon colors):
- `ai-llm` → Blue
- `data` → Slate
- `trigger` → Green
- `logic` → Amber
- `communication` → Violet
- `compliance` → Emerald
- `business` → Indigo

---

### Layout Components
**File:** `src/components/layout/layout.tsx`

```tsx
import { Layout, Sidebar, SidebarSection, SidebarItem, Topbar, TopbarLeft, TopbarRight } from '@/components/layout/layout';

<Layout
  sidebar={
    <Sidebar>
      <SidebarSection label="Workflows">
        <SidebarItem icon={<Icon />} active>My Workflows</SidebarItem>
        <SidebarItem icon={<Icon />}>Templates</SidebarItem>
      </SidebarSection>
    </Sidebar>
  }
  topbar={
    <Topbar>
      <TopbarLeft>{/* breadcrumb & title */}</TopbarLeft>
      <TopbarRight>{/* actions, theme toggle */}</TopbarRight>
    </Topbar>
  }
>
  {/* main content */}
</Layout>
```

The Layout component provides the grid structure: 240px sidebar (collapses to 56px on tablet), 52px topbar, full-viewport content area.

---

## Motion & Animation

**Rules:**
1. **Instant** (≤ 120ms) — button press, toggle, state change
2. **Fast** (150–220ms) — tab switch, panel open, hover effects
3. **Slow** (300–500ms) — page entry, major transitions
4. **Never longer than 500ms**

**Easing:**
- **Entering viewport** → `ease-out-expo` (decelerate, feels snappy)
- **Leaving viewport** → `ease-in` (accelerate out, clean)
- **Interactions** → `ease-smooth` (cubic-bezier(0.4, 0, 0.2, 1))

**Keyframes available in tokens.css:**
- `fade-in` — opacity 0 → 1
- `fade-up` — translateY(12px) + opacity
- `fade-down` — translateY(-8px) + opacity
- `scale-in` — scale(0.96) + opacity
- `node-enter` — scale(0.90) + translateY(6px)
- `status-pulse` — opacity + scale animation
- `rex-attention` — subtle glow pulse

**Accessibility:** All animations wrap in `@media (prefers-reduced-motion: reduce)`. Animation is disabled automatically for users with this preference.

---

## Colours — Reference

### Never do this:
```css
/* ❌ Inline hex values */
background: #3b82f6;

/* ❌ Multiple shades of blue for status */
color: #0066ff;    /* old state */
color: #33ccff;    /* new state */

/* ❌ Gradients for decoration */
background: linear-gradient(135deg, #3b82f6 0%, #purple 100%);

/* ❌ Blue as a status indicator */
<StatusBadge variant="info">In progress</StatusBadge>
```

### Do this:
```css
/* ✅ Use CSS variables */
background: var(--color-blue-500);

/* ✅ Single source of truth for status colours */
--color-green-500:   #22c55e;
--color-amber-500:   #f59e0b;
--color-red-500:     #ef4444;

/* ✅ Use glows for emphasis, not decorative gradients */
box-shadow: var(--glow-blue);

/* ✅ Blue only for action */
<Button variant="primary">Click me</Button>
```

---

## Dark Mode

Apply the `.dark` class to `<html>` or parent container. All CSS variables automatically switch:

```tsx
'use client';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark', !isDark);
    setIsDark(!isDark);
  };

  return <button onClick={toggleTheme}>Toggle theme</button>;
}
```

Test both modes:
- Light mode: `var(--color-bg-base) = #fafafa`
- Dark mode: `var(--color-bg-base) = #080808`

---

## Responsive Design

| Breakpoint        | Key Changes                              |
|-------------------|------------------------------------------|
| **Desktop** (1024+) | Full layout: 240px sidebar + content     |
| **Tablet** (768–1024) | Collapsed sidebar (56px) + icons only  |
| **Mobile** (<640px) | Sidebar hidden, full-width content     |

The layout grid handles responsive automatically via media queries in `layout.css`.

---

## Implementation Checklist

Before shipping any component:

- [ ] Uses CSS tokens (`var(--color-*)`), not hardcoded hex values
- [ ] Fonts loaded via `next/font` or Fontshare (never fallback fonts only)
- [ ] Respects `prefers-reduced-motion` — no animation for users with this preference
- [ ] Dark mode tested (`.dark` class applied)
- [ ] Focus states are blue outline (1.5px) with 2px offset
- [ ] Selection styling matches the design system
- [ ] All motion is ≤ 500ms, uses approved easing curves
- [ ] No drop shadows on cards (border-based containment only)
- [ ] Status indicators are green/amber/red only (never blue)

---

## References

- **Linear.app** — Benchmark for keyboard-native UI
- **Vercel dashboard** — Typography-led, generous spacing
- **Stripe** — Making complexity feel approachable
- **Raycast** — Micro-interactions that reward attention

---

## Questions?

The design system is living documentation. Update `tokens.css` first, then implement components. Never hardcode values — everything should trace back to a token.

**One rule:** If you can remove it and the design still works, remove it.
