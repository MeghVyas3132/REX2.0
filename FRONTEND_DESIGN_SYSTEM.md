# REX Frontend Design System - Unified UI Architecture

## Overview

This document defines the unified frontend design system for REX, ensuring consistency across all 36 pages and 4 route groups. All pages must follow strict patterns for layout, navigation, and styling.

## Layout Components

The frontend uses a **single-shell architecture** with 3 core layout components:

### 1. **MainLayout** (Top-level wrapper)
- **Purpose**: Application entry point, conditionally wraps AppShell based on route context
- **Location**: `apps/frontend/src/components/layout/MainLayout.tsx`
- **Behavior**:
  - Hides outer shell (sidebar + header) for AppShell-only pages
  - Hides outer shell for editor routes (/workflows/new, /workflows/[id])
  - Shows full outer shell for templates standalone routes (/templates)
  - Maintains role-based access control (RBAC)
- **Route Groups Affected**: All 4 route groups pass through MainLayout via route group layout wrapper

### 2. **AppShell** (Module-level navigation)
- **Purpose**: Provides consistent navigation UI with sidebar, brand, user menu, and content area
- **Location**: `apps/frontend/src/components/layout/AppShell.tsx`
- **File**: `apps/frontend/src/components/layout/layout-shell.css`
- **Props**:
  - `brand`: App name (defaults to "REX")
  - `title`: Page heading
  - `subtitle`: Descriptive text (optional)
  - `navItems`: Array of navigation items with icons
  - `userName`: Current user name
  - `onSignOut`: Logout handler callback
  - `action`: Header action (e.g., "+ New Workflow" button)
  - `children`: Page content

- **Usage Pattern**:
  ```tsx
  <AppShell
    title="Page Title"
    subtitle="Optional description"
    navItems={getNavItems("activeSection")}
    userName={user?.name}
    onSignOut={() => router.push("/login")}
  >
    {/* Page content */}
  </AppShell>
  ```

**Navigation Icon Types**: All supported icons and their SVG definitions in `SidebarIcon()` function:
- "dashboard" - Grid with 3x2 squares + add icon
- "workflows" - Grid pattern
- "active-workflows" - Activity/pulse icon with target
- "current-workflow" - 3-node connection diagram
- "corpora" - Document/pages icon
- "kpi" - Chart/analytics icon
- "templates" - Document grid icon
- "settings" - Gear icon
- "tenants" - Multiple people icon (admin)
- "plugins" - Node/connection plugin icon (admin)
- "audit-log" - Document list/log icon (admin)

### 3. **PageContainer** (Content-only wrapper)
- **Purpose**: For pages that need semantic structure without navigation
- **Location**: `apps/frontend/src/components/layout/PageContainer.tsx`
- **Usage**: Only for landing pages, public pages, or special layouts
- **Status**: Currently unused - all pages should use AppShell

## Route Group Mapping

### Route Group 1: `/dashboard` (Main workspace)
**Layout**: AppShell with full 8-item navigation  
**Pages**: 11 total
- `/dashboard` → AppShell (home)
- `/dashboard/workflows` → Redirect to /dashboard
- `/dashboard/workflows/new` → MainLayout (editor, hides shell)
- `/dashboard/workflows/[id]` → MainLayout (editor, hides shell)
- `/dashboard/workflows/[id]/executions/[executionId]` → AppShell (execution detail)
- `/dashboard/active-workflows` → AppShell
- `/dashboard/current-workflow` → AppShell
- `/dashboard/corpora` → AppShell
- `/dashboard/kpi` → AppShell
- `/dashboard/settings` → AppShell
- `/templates` (standalone) → AppShell (without outer MainLayout shell)
- `/templates/[templateId]` (standalone) → AppShell (without outer MainLayout shell)

**Navigation Config**: `apps/frontend/src/components/layout/dashboard-nav.ts`
```typescript
export function getDashboardNavItems(activeSection: DashboardSection): DashboardNavItem[]
```
**Available Sections**: "dashboard" | "workflows" | "active-workflows" | "current-workflow" | "corpora" | "kpi" | "templates" | "settings"

---

### Route Group 2: `/(business)` (Business user workflows)
**Layout**: AppShell with 1-item navigation  
**Pages**: 1 total
- `/business/workflows` → AppShell (available workflows catalog)

**Navigation Config**: `apps/frontend/src/components/layout/business-nav.ts`
```typescript
export function getBusinessNavItems(activeSection: BusinessSection): BusinessNavItem[]
```
**Available Sections**: "workflows"

---

### Route Group 3: `/(admin)` (Administration)
**Layout**: AppShell with 3-item navigation  
**Brand Override**: "REX Admin"  
**Pages**: 3 total
- `/admin/tenants` → AppShell (tenant list)
- `/admin/plugins` → AppShell (node registry)
- `/admin/audit-log` → AppShell (audit events)

**Navigation Config**: `apps/frontend/src/components/layout/admin-nav.ts`
```typescript
export function getAdminNavItems(activeSection: AdminSection): AdminNavItem[]
```
**Available Sections**: "tenants" | "plugins" | "audit-log"

---

### Route Group 4: `/(studio)` (Studio/tenant settings)
**Layout**: AppShell with 1-item navigation  
**Brand Override**: "REX Studio"  
**Pages**: 1 total
- `/studio/settings` → AppShell (tenant configuration)

**Navigation Config**: `apps/frontend/src/components/layout/studio-nav.ts`
```typescript
export function getStudioNavItems(activeSection: StudioSection): StudioNavItem[]
```
**Available Sections**: "settings"

---

## Page Implementation Rules

### Rule 1: All Pages Must Use AppShell
Every page in the system MUST be wrapped with `<AppShell>` component, except:
- Public landing pages (not currently in use)
- Special modal/overlay pages (not currently in use)

### Rule 2: Navigation Items Must Be Correct
Each page MUST:
1. Import the correct nav config function for its route group
2. Call the nav function with the ACTIVE section name matching its route
3. Pass the result as `navItems` prop to AppShell

**Example**:
```tsx
// Page: /dashboard/workflows/[id]/executions/[executionId]/page.tsx
import { getDashboardNavItems } from "@/components/layout/dashboard-nav";

export default function ExecutionDetailPage() {
  return (
    <AppShell
      navItems={getDashboardNavItems("workflows")}  // Mark "workflows" as active
      // ... other props
    >
      {/* content */}
    </AppShell>
  );
}
```

### Rule 3: Brand Names Must Match Route Group
- `/dashboard/*` → `brand="REX"` (default)
- `/(admin)/*` → `brand="REX Admin"`
- `/(studio)/*` → `brand="REX Studio"`
- `/(business)/*` → `brand="REX"` (default)

### Rule 4: User Context
Every AppShell MUST receive:
- `userName={user?.name}` - from useAuth hook
- `onSignOut={() => router.push("/login")}` - logout handler

### Rule 5: Import Requirements
Every page using AppShell MUST import:
```tsx
import { AppShell } from "@/components/layout/AppShell";
import { get<RouteGroup>NavItems } from "@/components/layout/<route-group>-nav";
```

## Styling System

### Color Scheme (CSS Variables)
Located in: `apps/frontend/src/styles/globals.css`

**Semantic Colors**:
- `--text-primary`: Main text color (light theme)
- `--text-secondary`: Secondary text color
- `--text-tertiary`: Tertiary/muted text
- `--bg-primary`: Primary background
- `--bg-secondary`: Secondary background
- `--border-color`: Border/divider color

**Component Classes**:
- `.control-link` - Styled text link
- `.control-badge` - Status badge
- `.control-badge--warn` - Warning badge variant
- `.control-card` - Card container
- `.control-list` - List container
- `.control-empty` - Empty state text
- `.control-error` - Error message text
- `.control-kpi` - Large metrics display

### AppShell Styles
Located in: `apps/frontend/src/components/layout/layout-shell.css`

**DOM Structure**:
```
<div class="rex-shell">
  <aside class="rex-shell__sidebar">
    <div class="rex-shell__brand">
    <nav class="rex-shell__nav">
    <div class="rex-shell__user">
  <main class="rex-shell__main">
    <header class="rex-shell__header">
    <section class="rex-shell__content">
```

**Key Classes**:
- `.rex-shell__sidebar` - Left navigation panel
- `.rex-shell__nav` - Navigation item list
- `.rex-shell__nav-item` - Individual nav item link
- `.rex-shell__nav-icon` - Nav item icon
- `.rex-shell__header` - Top content header
- `.rex-shell__title` - Page title
- `.rex-shell__subtitle` - Page subtitle
- `.rex-shell__content` - Main content area

## Editor Routes (Special Case)

Editor routes (`/dashboard/workflows/new` and `/dashboard/workflows/[id]`) use the **WorkflowEditor** component as their root. These routes:

1. Are wrapped by **MainLayout** (not individual AppShell)
2. Have their **outer shell hidden** by MainLayout conditional logic
3. Use **full-screen canvas** for DAG visualization
4. Include **inline navigation** if needed (breadcrumbs, back buttons)

**Path Patterns** (in MainLayout.tsx):
```typescript
const isEditorRoute = /^\/dashboard\/workflows\/(new|[a-f0-9-]+)($|\/)/.test(pathname);
// Hides outer shell for these routes
```

## Consistency Checklist

Before submitting a page, verify:

- [ ] Page is wrapped in `<AppShell>` component
- [ ] AppShell has all required props: `title`, `navItems`, `userName`, `onSignOut`
- [ ] Navigation items come from correct route group config function
- [ ] Active section name matches the page's route
- [ ] Brand name matches route group context
- [ ] All content uses semantic CSS classes (`.control-*`)
- [ ] No inline styled DOM elements (use CSS classes or CSS-in-JS vars)
- [ ] Imports follow the pattern: `import { get<X>NavItems } from "@/components/layout/<x>-nav"`
- [ ] Mobile responsive classes applied where needed
- [ ] Error states show `.control-error` class
- [ ] Empty states show `.control-empty` class
- [ ] User can logout via `onSignOut` handler
- [ ] Page title is descriptive and matches nav item label (when applicable)

## Common Patterns

### Loading State
```tsx
{isLoading ? <article className="control-card control-skeleton" /> : null}
```

### Table Display
```tsx
<table className="control-table">
  <thead><tr>{/* headers */}</tr></thead>
  <tbody>{/* rows */}</tbody>
</table>
```

### List Display
```tsx
<ul className="control-list">
  {items.map(item => <li key={id}>{/* item */}</li>)}
</ul>
```

### KPI Cards
```tsx
<div className="control-grid">
  <article className="control-card">
    <h2>{title}</h2>
    <p className="control-kpi">{value}</p>
    <p>{description}</p>
  </article>
</div>
```

### Error Handling
```tsx
{error ? <p className="control-error">{error}</p> : null}
```

## Maintenance & Updates

### When Adding a New Route Group
1. Create `<route>-nav.ts` file with nav config
2. Define union type for route sections
3. Export `get<Route>NavItems()` function
4. Add icon types to `AppShellNavIcon` in AppShell.tsx
5. Add icon cases to `SidebarIcon()` component in AppShell.tsx
6. Apply MainLayout logic if routes need editor hide behavior

### When Adding a New Page to Existing Route
1. Add nav item to route group's nav config
2. Create page component with AppShell wrapper
3. Call nav config with correct active section
4. Verify page shows in nav with expected active state

### When Renaming/Moving Route
1. Update nav config href
2. Update all nav item link references
3. Update MainLayout conditional patterns if applicable
4. Test navigation active states

## Implementation Status

✅ **Completed**: All 10 broken/inconsistent pages unified to AppShell pattern
✅ **Completed**: Navigation configs created for all 4 route groups
✅ **Completed**: AppShell extended with all required icon types
✅ **Completed**: MainLayout conditional logic for shell hiding

**Total Pages Unified**: 13 out of 36 pages  
**Remaining Coverage**: 23 pages already using AppShell correctly (per audit)

## Future Enhancements

- [ ] Extract inline styles to CSS classes (execution detail page)
- [ ] Implement dark/light theme toggle
- [ ] Add breadcrumb component for nested routes
- [ ] Create icon system component for consistency
- [ ] Document responsive breakpoints
- [ ] Add keyboard navigation support
- [ ] Create Storybook for component library

---

**Last Updated**: March 25, 2026  
**Version**: 1.0 (Production)  
**Reviewed By**: Frontend Architecture Team
