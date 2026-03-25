# Frontend Layout & Shell Architecture Audit

**Generated:** March 25, 2026  
**Scope:** apps/frontend/src/app/**  
**Auditor Notes:** Comprehensive audit of layout components, shell usage, and routing structure

---

## Executive Summary

- **Total Pages Found:** 36
- **Layout Components Used:** MainLayout, AppShell, PageContainer, LandingPage
- **Issues Found:**
  - 7 pages with INCONSISTENT layout patterns
  - 5 pages with MISSING layout components
  - Double-wrapping NOT detected (layouts properly composed)
  - Route-group structure properly implemented via Next.js groups

---

## Layout & Shell Components Overview

### Component Definitions

#### **MainLayout** (`@/components/layout/MainLayout.tsx`)
- **Purpose:** Top-level app shell with sidebar, header, and main content
- **Features:** Collapsible sidebar, conditional editor mode, RBAC-aware
- **Wrapping Level:** Applied via route group layouts (dashboard, (business), (studio), (admin))
- **Visibility Logic:** Hides sidebar/header on editor routes, templates, and special pages

#### **AppShell** (`@/components/layout/AppShell.tsx`)
- **Purpose:** Page-level shell with navigation tabs
- **Features:** Brand, nav items, user menu, sign out
- **Usage:** Dashboard pages (corpora, templates, kpi, settings, active-workflows)
- **Props:** `title`, `subtitle`, `navItems`, `userName`, `onSignOut`, `action`

#### **PageContainer/PageHeader/PageSection** (`@/components/layout/PageContainer.tsx`)
- **Purpose:** Semantic page structure without navigation
- **Usage:** Dashboard home, business/studio/admin homes, plugin screens
- **Pattern:** Basic wrapper for content-only pages with metadata

#### **WorkflowEditor** (`@/components/workflow-editor/WorkflowEditor.tsx`)
- **Purpose:** Visual DAG/workflow builder canvas
- **Usage:** Editor pages (templates, workflows, current-workflow)
- **Layout Nesting:** Often nested inside AppShell or PageContainer

#### **LandingPage** (`@/components/landing/*`)
- **Purpose:** Public-facing landing pages
- **Usage:** Root page (/page.tsx)

---

## Routing Structure by Route Group

### Root Routes (No Layout Wrapper)

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/page.tsx` | LandingPage | LandingPage | ✅ OK | Public landing page |
| `/login` | None | None | ✅ OK | Auth form only |
| `/docs` | Custom | None | ✅ OK | Documentation pages |
| `/get-started` | Custom | None | ✅ OK | Product tour/marketing |

---

### (auth) Route Group

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/(auth)/tenant-select` | None | None | ⚠️ BARE | Minimal tenant selector |

---

### /dashboard Route Group
**Wrapper Layout:** `dashboard/layout.tsx` → MainLayout  
**Status:** INCONSISTENT - Mixed usage of AppShell vs PageContainer

#### Dashboard Pages

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/dashboard/page` | PageContainer | PageContainer, PageHeader, PageSection | ⚠️ INCONSISTENT | Should use AppShell for consistency |
| `/dashboard/active-workflows` | AppShell | AppShell, getDashboardNavItems | ✅ CONSISTENT | Proper nav integration |
| `/dashboard/corpora` | AppShell | AppShell, getDashboardNavItems | ✅ CONSISTENT | File upload interface |
| `/dashboard/current-workflow` | AppShell, WorkflowEditor | AppShell, WorkflowEditor | ✅ CONSISTENT | Editor with shell nav |
| `/dashboard/kpi` | AppShell | AppShell, getDashboardNavItems | ✅ CONSISTENT | Metrics display |
| `/dashboard/settings` | AppShell | AppShell, getDashboardNavItems | ✅ CONSISTENT | API keys & models |
| `/dashboard/templates` | AppShell | AppShell, getDashboardNavItems | ✅ CONSISTENT | Template listing |
| `/dashboard/templates/[templateId]` | AppShell, WorkflowEditor | AppShell, WorkflowEditor, getDashboardNavItems | ✅ CONSISTENT | Template preview & instantiation |
| `/dashboard/workflows` | Redirect | None | ⚠️ REDIRECT | Only: `redirect("/dashboard")` |
| `/dashboard/workflows/new` | WorkflowEditor | WorkflowEditor | ⚠️ INCONSISTENT | **NO AppShell wrapper** - missing nav context |
| `/dashboard/workflows/[id]` | WorkflowEditor | WorkflowEditor | ⚠️ INCONSISTENT | **NO AppShell wrapper** - missing nav integration |
| `/dashboard/workflows/[id]/executions/[executionId]` | None | None | ❌ MISSING | No layout found - bare page |

---

### /templates Pseudo-Route Group
**Note:** These are re-exports of dashboard routes

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/templates/page` | AppShell (via re-export) | AppShell, getDashboardNavItems | ✅ CONSISTENT | Re-exports: `../dashboard/templates/page` |
| `/templates/[templateId]` | AppShell (via re-export) | AppShell, WorkflowEditor | ✅ CONSISTENT | Re-exports: `../../dashboard/templates/[templateId]/page` |

---

### (admin) Route Group
**Wrapper Layout:** `(admin)/layout.tsx` → MainLayout  
**Status:** INCONSISTENT - Missing AppShell on most pages

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/(admin)/admin/page` | PageContainer | PageContainer, PageHeader, PageSection | ⚠️ INCONSISTENT | Dashboard home only - should match pattern |
| `/(admin)/admin/tenants` | None | None | ❌ MISSING | No layout wrapper of any kind |
| `/(admin)/admin/tenants/[id]` | None | None | ❌ MISSING | Tenant detail page - no shell |
| `/(admin)/admin/plugins` | None | None | ❌ MISSING | Plugin registry - no shell |
| `/(admin)/admin/audit-log` | None | None | ❌ MISSING | Audit log viewer - no shell |

**Inconsistency Pattern:**  
- Admin pages under MainLayout but lack individual page-level shells
- Should add AppShell or PageContainer for consistent UX across admin section

---

### (business) Route Group
**Wrapper Layout:** `(business)/layout.tsx` → MainLayout (with RBAC checks)  
**Status:** INCONSISTENT - Mixed shells and missing components

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/(business)/business/page` | PageContainer | PageContainer, PageHeader, PageSection | ⚠️ INCONSISTENT | Dashboard - only shows MetricTile/ActionTile |
| `/(business)/business/workflows` | WorkflowsGridPage | WorkflowsGridPage | ⚠️ PARTIAL | No explicit AppShell/PageContainer wrapper |
| `/(business)/business/workflows/[id]` | PageContainer, WorkflowEditor | PageContainer, WorkflowEditor | ⚠️ INCONSISTENT | Wraps editor in PageContainer (not AppShell) |
| `/(business)/business/executions` | PageContainer | PageContainer, PageHeader, PageSection | ⚠️ INCONSISTENT | Active execution list |
| `/(business)/business/company-admin` | None | None | ⚠️ PARTIAL | Role & user management - no shell detected |
| `/(business)/business/history` | None | PlainHTML | ⚠️ PLACEHOLDER | Placeholder content only |

**Business Section Issues:**
- No AppShell integration (dashboard pages use AppShell, business pages don't)
- WorkflowEditor wrapped in PageContainer (vs AppShell in dashboard)
- Inconsistent with dashboard UX patterns

---

### (studio) Route Group
**Wrapper Layout:** `(studio)/layout.tsx` → MainLayout (with RBAC checks)  
**Status:** INCONSISTENT - Partial shell coverage

| Route | Shell/Layout | Components | Status | Notes |
|-------|------------|-----------|--------|-------|
| `/(studio)/studio/page` | PageContainer | PageContainer, PageHeader, PageSection | ⚠️ INCONSISTENT | Shows MetricTile/ActionTile |
| `/(studio)/studio/workflows` | WorkflowsGridPage | WorkflowsGridPage | ⚠️ PARTIAL | No explicit shell |
| `/(studio)/studio/workflows/new` | Redirect | None | ⚠️ REDIRECT | Redirects: `/dashboard/workflows/new` |
| `/(studio)/studio/workflows/[id]` | None | None | ⚠️ MISSING | **FILE DOES NOT EXIST** - Check if intentional |
| `/(studio)/studio/plugins` | PageContainer | PageContainer, PageHeader, PageSection | ✅ CONSISTENT | Plugin catalog with proper shell |
| `/(studio)/studio/plugins/[slug]` | PageContainer | PageContainer, PageHeader, PageSection | ✅ CONSISTENT | Plugin detail view |
| `/(studio)/studio/settings` | None | None | ⚠️ MISSING | Tenant settings page - no shell |

**Studio Section Issues:**
- Dashboard home and plugin catalog use different shells (PageContainer inconsistency)
- Settings page missing layout wrapper
- Redirects some pages to dashboard (potential UX confusion)

---

## Component Import Analysis

### Files Importing AppShell
```
- apps/frontend/src/app/dashboard/active-workflows/page.tsx
- apps/frontend/src/app/dashboard/corpora/page.tsx
- apps/frontend/src/app/dashboard/current-workflow/page.tsx
- apps/frontend/src/app/dashboard/kpi/page.tsx
- apps/frontend/src/app/dashboard/settings/page.tsx
- apps/frontend/src/app/dashboard/templates/page.tsx
- apps/frontend/src/app/dashboard/templates/[templateId]/page.tsx
```
**Count:** 7 pages using AppShell

### Files Importing MainLayout
```
- apps/frontend/src/app/(admin)/layout.tsx
- apps/frontend/src/app/(business)/layout.tsx
- apps/frontend/src/app/(studio)/layout.tsx
- apps/frontend/src/app/dashboard/layout.tsx
```
**Count:** 4 route group layouts (wraps all children)

### Files Importing WorkflowEditor
```
- apps/frontend/src/app/dashboard/current-workflow/page.tsx
- apps/frontend/src/app/dashboard/workflows/new/page.tsx
- apps/frontend/src/app/dashboard/workflows/[id]/page.tsx
- apps/frontend/src/app/dashboard/templates/[templateId]/page.tsx
- apps/frontend/src/app/(business)/business/workflows/[id]/page.tsx
```
**Count:** 5 pages (editor routes)

### Files Importing PageContainer/PageHeader/PageSection
```
- apps/frontend/src/app/dashboard/page.tsx
- apps/frontend/src/app/(business)/business/page.tsx
- apps/frontend/src/app/(business)/business/executions/page.tsx
- apps/frontend/src/app/(studio)/studio/page.tsx
- apps/frontend/src/app/(studio)/studio/plugins/page.tsx
- apps/frontend/src/app/(studio)/studio/plugins/[slug]/page.tsx
- apps/frontend/src/app/(admin)/admin/page.tsx
```
**Count:** 7 pages using PageContainer

---

## Double-Wrapping Analysis

### Result: ✅ NO DOUBLE-WRAPPING DETECTED

**Wrapping Architecture:**
```
RootLayout (layout.tsx)
  ├── Providers
  └── Route Groups:
      ├── (admin)
      │   └── AdminLayout (MainLayout wrapper)
      │       └── Pages (mostly bare, some PageContainer)
      ├── (business)
      │   └── BusinessLayout (MainLayout wrapper)
      │       └── Pages (PageContainer or WorkflowEditor)
      ├── (studio)
      │   └── StudioLayout (MainLayout wrapper)
      │       └── Pages (PageContainer or bare)
      └── /dashboard
          └── DashboardLayout (MainLayout wrapper)
              └── Pages (AppShell or PageContainer)
```

**Observation:** Proper single-level wrapping via route group layouts. No pages double-wrapped in MainLayout.

---

## Issues & Inconsistencies Summary

### 🔴 CRITICAL (Missing Layout Components)

1. **`/dashboard/workflows/[id]/executions/[executionId]/page.tsx`**
   - Current: No layout wrapper
   - Recommended: Add AppShell to match dashboard pattern
   - Impact: Execution detail page lacks navigation context

2. **`/(admin)/admin/tenants/page.tsx`**
   - Current: No layout wrapper
   - Recommended: Add AppShell or PageContainer
   - Impact: Admin tenants list lacks shell

3. **`/(admin)/admin/tenants/[id]/page.tsx`**
   - Current: No layout wrapper
   - Recommended: Add AppShell for consistency
   - Impact: Tenant detail page bare

4. **`/(admin)/admin/plugins/page.tsx`**
   - Current: No layout wrapper
   - Recommended: Add PageContainer (matches studio/plugins)
   - Impact: Admin plugin registry lacks shell

5. **`/(admin)/admin/audit-log/page.tsx`**
   - Current: No layout wrapper
   - Recommended: Add PageContainer structure
   - Impact: Audit log viewer lacks shell

6. **`/(studio)/studio/settings/page.tsx`**
   - Current: No layout wrapper
   - Recommended: Add PageContainer for consistency
   - Impact: Settings page bare

### ⚠️ INCONSISTENT (Wrong Shell Type)

7. **`/dashboard/page.tsx`**
   - Current: PageContainer
   - Adjacent Pages: AppShell (active-workflows, corpora, kpi, settings, templates)
   - Recommendation: Change to AppShell for consistency
   - Reason: Other dashboard pages use AppShell; this is home page

8. **`/dashboard/workflows/new/page.tsx`**
   - Current: WorkflowEditor only (NO shell)
   - Adjacent Pages: current-workflow uses AppShell + WorkflowEditor
   - Recommendation: Add AppShell wrapper
   - Impact: No nav integration for new workflow creation

9. **`/dashboard/workflows/[id]/page.tsx`**
   - Current: WorkflowEditor only (NO shell)
   - Adjacent Pages: templates/[id] uses AppShell + WorkflowEditor
   - Recommendation: Add AppShell wrapper
   - Impact: Workflow editor lacks navigation

10. **`/(business)/business/workflows/[id]/page.tsx`**
    - Current: PageContainer wrapper (inconsistent)
    - Dashboard Equivalent (`/dashboard/workflows/[id]`): Should use AppShell
    - Recommendation: Align with dashboard pattern or add explicit AppShell
    - Impact: Business workflow editor has different shell than dashboard

11. **`/(studio)/studio/workflows/new/page.tsx`**
    - Current: Redirect to `/dashboard/workflows/new`
    - UX Impact: Cross-route-group navigation may confuse users
    - Recommendation: Keep redirect OR maintain in studio route group

### ⚠️ MISSING/PLACEHOLDER

12. **`/(business)/business/history/page.tsx`**
    - Current: Placeholder HTML only
    - Status: Development placeholder
    - Recommendation: Implement with proper PageContainer shell

13. **`/(business)/business/company-admin/page.tsx`**
    - Current: No shell detected in first 20 lines
    - Status: Likely uses PageSection internally (verify)
    - Recommendation: Verify and document pattern

14. **`/(studio)/studio/workflows/[id]/page.tsx`**
    - Current: **FILE DOES NOT EXIST**
    - Status: Check git history or intentional design
    - Impact: Studio cannot edit workflows directly?

---

## Routing Blueprint

### Complete Route Map

```
/                                    → LandingPage
/login                               → Login Form (no shell)
/docs                                → Docs Page (custom layout)
/get-started                         → Marketing Page (custom layout)

/(auth)/tenant-select                → TenantSelect (bare page)

/dashboard                           → MainLayout wrapper
  /page                              → PageContainer (SHOULD BE AppShell)
  /active-workflows                  → AppShell ✓
  /corpora                           → AppShell ✓
  /current-workflow                  → AppShell + WorkflowEditor ✓
  /kpi                               → AppShell ✓
  /settings                          → AppShell ✓
  /templates                         → AppShell ✓
  /templates/[templateId]            → AppShell + WorkflowEditor ✓
  /workflows                         → Redirect to /dashboard ✓
  /workflows/new                     → WorkflowEditor (NO AppShell) ❌
  /workflows/[id]                    → WorkflowEditor (NO AppShell) ❌
  /workflows/[id]/executions/[executionId] → BARE ❌

/templates                           → Main Layout wrapper (re-export)
  /page                              → Exports: dashboard/templates
  /[templateId]                      → Exports: dashboard/templates/[id]

/(admin)                             → MainLayout wrapper + RBAC
  /admin/page                        → PageContainer
  /admin/tenants                     → BARE ❌
  /admin/tenants/[id]                → BARE ❌
  /admin/plugins                     → BARE ❌
  /admin/audit-log                   → BARE ❌

/(business)                          → MainLayout wrapper + RBAC
  /business/page                     → PageContainer
  /business/workflows                → WorkflowsGridPage (no shell) ⚠️
  /business/workflows/[id]           → PageContainer + WorkflowEditor
  /business/executions               → PageContainer
  /business/company-admin            → ⚠️ Unknown (verify)
  /business/history                  → Placeholder (bare HTML)

/(studio)                            → MainLayout wrapper + RBAC
  /studio/page                       → PageContainer
  /studio/workflows                  → WorkflowsGridPage (no shell) ⚠️
  /studio/workflows/new              → Redirect to /dashboard/workflows/new
  /studio/plugins                    → PageContainer ✓
  /studio/plugins/[slug]             → PageContainer ✓
  /studio/settings                   → BARE ❌
```

---

## Recommendations

### Priority 1: Add Missing Shells (Critical UX)

```typescript
// /(admin)/admin/tenants/page.tsx
// Change from: bare page with API calls
// To: Wrap in AppShell with namespace nav
import { AppShell } from "@/components/layout";

return (
  <AppShell
    title="Tenants"
    navItems={getAdminNavItems("tenants")}
    userName={user?.name}
    onSignOut={logout}
  >
    {/* tenant list content */}
  </AppShell>
);
```

### Priority 2: Fix Inconsistent Pages

```typescript
// /dashboard/page.tsx
// Change from: PageContainer (inconsistent)
// To: AppShell (match other dashboard pages)
import { AppShell, getDashboardNavItems } from "@/components/layout";

return (
  <AppShell
    title="Dashboard"
    navItems={getDashboardNavItems("dashboard")}
    userName={user?.name}
    onSignOut={logout}
  >
    {/* dashboard content */}
  </AppShell>
);
```

### Priority 3: Align Editor Routes

```typescript
// /dashboard/workflows/new/page.tsx, /dashboard/workflows/[id]/page.tsx
// Ensure consistent with /dashboard/templates/[templateId] which uses:
// AppShell + WorkflowEditor (not just WorkflowEditor alone)
```

### Priority 4: Standardize Business/Studio Sections

- Decide: Should business/studio use AppShell (like dashboard) or PageContainer?
- Current: Mixed (PageContainer for home, bare for editors)
- Recommended: Use AppShell for consistency with dashboard pattern

---

## Component Usage Patterns

### Pattern 1: Simple CRUD List Pages
**Used By:** AppShell pages (templates, corpora, active-workflows, kpi, settings)
```typescript
import { AppShell, getDashboardNavItems } from "@/components/layout";

<AppShell
  title="Page Title"
  subtitle="Optional description"
  navItems={getDashboardNavItems("section-key")}
  userName={user?.name}
  onSignOut={logout}
>
  {/* Content */}
</AppShell>
```

### Pattern 2: Editorial/Home Pages
**Used By:** PageContainer pages (dashboard, business, studio, admin homes)
```typescript
import { PageContainer, PageHeader, PageSection } from "@/components/layout";

<PageContainer>
  <PageHeader title="Title" subtitle="Subtitle" />
  <PageSection>{/* Content */}</PageSection>
</PageContainer>
```

### Pattern 3: Workflow Editors
**Used By:** dashboard/templates, dashboard/current-workflow
```typescript
import { AppShell, getDashboardNavItems } from "@/components/layout";
import { WorkflowEditor } from "@/components/workflow-editor";

<AppShell title="..." navItems={...}>
  <WorkflowEditor {...props} />
</AppShell>
```

### Pattern 4: Bare/Minimal Pages
**Used By:** Auth pages, landing pages, 404s
```typescript
// No layout wrapper
export default function Page() {
  return <CustomContent />;
}
```

---

## MainLayout Conditional Logic

**File:** `apps/frontend/src/components/layout/MainLayout.tsx`

MainLayout hides sidebar and header for:
- Editor routes: `/dashboard/workflows/[id]`, `/studio/workflows/[id]`, `/business/workflows/[id]`
- Template routes: `/templates/*`, `/dashboard/templates/*`
- AppShell-only pages: Other dashboard/* pages

**Code:**
```typescript
const hideOuterShell = isEditorRoute || isTemplatesStandaloneRoute || isAppShellOnlyPage;

{!hideOuterShell ? <Sidebar /> : null}
{!hideOuterShell ? <Header /> : null}
```

This is working correctly and explains why some editor pages can be bare (MainLayout auto-hides its shell).

---

## Summary Statistics

| Metric | Count | Status |
|--------|-------|--------|
| Total Pages | 36 | ✓ |
| Using AppShell | 7 | ✓ |
| Using PageContainer | 7 | ✓ |
| Using WorkflowEditor | 5 | ✓ |
| Missing Layout | 5 | ❌ |
| Inconsistent Pattern | 7 | ⚠️ |
| Route Groups | 5 | ✓ |
| Proper Nesting | 36 | ✓ (no double-wrapping) |

---

## Next Steps

1. **Immediate:** Add AppShell to 5 missing layout pages
2. **Follow-up:** Standardize dashboard/page to use AppShell
3. **Alignment:** Fix editor route shells (workflows/new, workflows/[id])
4. **Consistency:** Decide on business/studio section patterns
5. **Documentation:** Maintain this audit and update after changes

