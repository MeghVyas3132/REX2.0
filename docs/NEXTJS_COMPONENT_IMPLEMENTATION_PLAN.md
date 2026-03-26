# NEXTJS_COMPONENT_IMPLEMENTATION_PLAN

## Purpose
This plan converts the product/UX specification into a component-level implementation blueprint for a new Next.js frontend (App Router), aligned to existing backend APIs and role model.

Primary source: `docs/FRONTEND_PRODUCT_UX_SPEC.md`.
Backend source constraints: `docs/API_ENDPOINTS.md`, `docs/PAYLOAD_REGISTRY.md`, `docs/FEATURE_LIST.md`, `docs/prd.md`, `docs/HLD.md`.

---

## 1. Technical Baseline (Next.js)

## 1.1 Framework Decisions
- Next.js 15+ App Router.
- TypeScript strict mode.
- React Server Components by default, Client Components only where interactivity/state is required.
- Route groups for domain shells: `(auth)`, `(app)`, `(admin)`.

## 1.2 Core Libraries
- Data fetching/cache: TanStack Query.
- Forms: React Hook Form + Zod resolver.
- Tables: TanStack Table.
- Charts: Recharts (KPI/alerts trends).
- State for ephemeral UI: Zustand (or Context for minimal shared UI state).
- Notifications: Sonner (or equivalent toast library).

## 1.3 Global Constraints
- API-first frontend, no local domain simulation.
- JWT-based session in secure storage strategy (httpOnly cookie preferred via BFF; fallback token storage abstraction if direct API calls are required).
- Role and permission checks enforced both in route guards and component action guards.

---

## 2. App Structure and Routing (Component-Oriented)

## 2.1 Directory Layout
```text
apps/frontend/
  src/
    app/
      (auth)/
        login/page.tsx
        register/page.tsx
        layout.tsx
      (app)/
        layout.tsx
        dashboard/page.tsx

        workflows/
          page.tsx
          new/page.tsx
          [workflowId]/page.tsx
          [workflowId]/editor/page.tsx
          [workflowId]/executions/page.tsx
          active/page.tsx

        executions/
          [executionId]/page.tsx
          [executionId]/attempts/page.tsx
          [executionId]/retrieval-events/page.tsx
          [executionId]/context-snapshots/page.tsx

        templates/
          page.tsx
          [templateId]/page.tsx

        knowledge/
          corpora/page.tsx
          corpora/[corpusId]/page.tsx
          documents/[documentId]/page.tsx
          query/page.tsx

        publications/
          page.tsx
          catalog/page.tsx
          [publicationId]/page.tsx

        governance/
          kpi/page.tsx
          alerts/page.tsx
          models/page.tsx
          domain-config/page.tsx
          workspaces/page.tsx
          workflows/[workflowId]/permissions/page.tsx
          policies/page.tsx
          hyperparameters/page.tsx

        compliance/
          consents/page.tsx
          retention/page.tsx
          workflows/[workflowId]/legal-basis/page.tsx
          data-subject-requests/page.tsx
          report/page.tsx
          privacy/page.tsx

        tenant/
          profile/page.tsx
          users/page.tsx
          plugins/page.tsx
          plan/page.tsx
          usage/page.tsx

        tools/
          api-keys/page.tsx
          chat/page.tsx
          file-parse/page.tsx

      (admin)/
        layout.tsx
        tenants/page.tsx
        tenants/[tenantId]/page.tsx
        plugins/page.tsx
        audit-log/page.tsx

    components/
      app-shell/
      navigation/
      auth/
      workflows/
      executions/
      knowledge/
      templates/
      governance/
      compliance/
      tenant/
      admin/
      tools/
      shared/
      ui/

    features/
      auth/
      workflows/
      executions/
      knowledge/
      templates/
      publications/
      governance/
      compliance/
      tenant/
      admin/
      tools/

    lib/
      api/
      auth/
      rbac/
      query/
      telemetry/
      validation/
      utils/
```

## 2.2 Route Group Shells
1. `(auth)/layout.tsx`
- Minimal shell, auth branding, no sidebar.

2. `(app)/layout.tsx`
- Main app shell: sidebar + topbar + command palette + global error boundary.

3. `(admin)/layout.tsx`
- Dedicated admin shell with strict super-admin guard.

---

## 3. Component Taxonomy

## 3.1 Foundation UI Components (`components/ui`)
1. Buttons
- `Button` (`primary|secondary|ghost|danger|link`, `loading`, `disabled`).

2. Inputs
- `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `SearchField`.

3. Feedback
- `ToastProvider`, `InlineError`, `StatusBadge`, `EmptyState`, `Skeleton`.

4. Layout
- `Card`, `Section`, `PageHeader`, `Tabs`, `Drawer`, `Modal`, `ConfirmDialog`.

5. Data display
- `DataTable`, `KeyValueList`, `CodeBlock`, `Timeline`, `Pagination`.

## 3.2 Shared Platform Components (`components/shared`)
- `AppErrorBoundary`
- `ApiErrorBanner`
- `PermissionGate`
- `RoleBadge`
- `AsyncStateView` (loading/empty/error wrapper)
- `EntityHeader` (title + status + actions)

## 3.3 Domain Components (by folder)

### Workflows
- `WorkflowListTable`
- `WorkflowFilters`
- `WorkflowCreateForm`
- `WorkflowHeaderActions` (execute/delete)
- `WorkflowGraphEditor` (canvas + inspector)
- `WorkflowRexPanel`

### Executions
- `ExecutionStatusHeader`
- `ExecutionStepTimeline`
- `ExecutionAttemptTable`
- `RetrievalEventsTable`
- `ContextSnapshotDiffView`

### Knowledge
- `CorporaTable`
- `CreateCorpusModal`
- `DocumentIngestionForm`
- `DocumentsTable`
- `ChunksTable`
- `KnowledgeQueryConsole`

### Templates
- `TemplateGrid`
- `TemplateDetailPanel`
- `TemplatePreviewGraph`
- `InstantiateTemplateModal`

### Governance
- `ModelRegistryTable`
- `DomainConfigEditor`
- `WorkspaceTable`
- `WorkspaceMemberManager`
- `WorkflowPermissionEditor`
- `PolicyEditor`
- `HyperparameterProfileEditor`
- `ProfileComparisonResult`
- `AlertRulesTable`
- `AlertEventsTable`
- `MetricsCardGrid`
- `TimeseriesChart`

### Compliance
- `ConsentTable`
- `RetentionPolicyEditor`
- `RetentionSweepAction`
- `LegalBasisForm`
- `DataSubjectRequestQueue`
- `DataSubjectResponseModal`
- `ComplianceReportPanels`
- `PrivacyActionPanel` (export/delete me)

### Tenant
- `TenantProfileForm`
- `TenantUsersTable`
- `InviteUserModal`
- `TenantPluginCards`
- `ByokConfigPanel`
- `TenantPlanPanel`
- `TenantUsagePanel`

### Admin
- `TenantsTable`
- `TenantDetailTabs`
- `AdminTenantUsersPanel`
- `AdminTenantPlanPanel`
- `AdminTenantPluginPanel`
- `AdminPluginsTable`
- `AuditLogExplorer`

### Tools
- `ApiKeysManager`
- `ChatAssistantConsole`
- `FileParseUploader`
- `ParsedFilePreview`

---

## 4. Feature Module Contracts (`features/*`)

Each feature module should expose:
1. `api.ts`
- Typed API calls for its endpoint group.

2. `queries.ts`
- Query keys + query hooks (`useXQuery`, `useXListQuery`).

3. `mutations.ts`
- Mutation hooks (`useCreateX`, `useUpdateX`, etc.) with invalidation strategy.

4. `schemas.ts`
- Client-side Zod schemas mirroring backend payload contracts.

5. `types.ts`
- DTO types and UI view-model types.

Example module API:
```ts
export const workflowsApi = {
  list,
  get,
  create,
  update,
  remove,
  execute,
  listExecutions,
  listActive,
  getRexScores,
  previewRexFixes,
  applyRexFixes,
};
```

---

## 5. Data Layer and API Client

## 5.1 HTTP Client (`lib/api/client.ts`)
- Centralized fetch wrapper.
- Inject auth token/cookie.
- Parse standard envelope `{ success, data }`.
- Normalize backend errors to typed `AppApiError`.
- Enforce timeout (default 10s) + optional retry policy (GET only).

## 5.2 Query Key Strategy
- Namespaced keys:
  - `['workflows', filters]`
  - `['workflow', workflowId]`
  - `['execution', executionId]`
  - `['knowledge', 'corpora', filters]`

## 5.3 Mutation Invalidation Rules
- Workflow create/update/delete invalidates `['workflows']`.
- Execution trigger invalidates `['workflows','active']` and workflow execution list.
- Publication publish/unpublish invalidates catalog + publication detail.

---

## 6. Auth, RBAC, and Route Protection

## 6.1 Auth Components
- `AuthProvider`
- `useSession`
- `SessionHydrator`
- `SessionExpiryHandler`

## 6.2 Guards
- Route guards:
  - `RequireAuth`
  - `RequireRole`
  - `RequireSuperAdmin`

- Action-level guards:
  - `PermissionGate` wrapper around mutation controls.

## 6.3 Role Mapping (UI layer)
- `super_admin` -> admin shell access.
- `org_admin` -> tenant management + broad mutations.
- `org_editor` -> workflow/editor mutations, selected governance actions.
- `org_viewer` -> read-focused UI with blocked mutation controls.

---

## 7. Page-Level Component Implementation Backlog

## 7.1 Phase 1 (Foundation + Core Runtime)
1. App shell + navigation + auth.
2. Dashboard.
3. Workflows list/create/detail.
4. Workflow editor (MVP graph editing + save + execute).
5. Execution detail + active executions.
6. API keys page.

## 7.2 Phase 2 (Knowledge + Templates + Publications)
1. Knowledge corpus/documents/chunks/query pages.
2. Templates list/detail/preview/instantiate.
3. Publications list/detail/catalog + execute.
4. REX panel in workflow pages.

## 7.3 Phase 3 (Governance + Compliance + Tenant)
1. KPI/alerts/models/domain config/workspaces/policies/hyperparameters.
2. Compliance pages (consents, retention, legal basis, DSAR, report, privacy).
3. Tenant profile/users/plugins/plan/usage.

## 7.4 Phase 4 (Admin + Tools Hardening)
1. Admin tenants/plugins/audit pages.
2. Chat and file parser tools.
3. Hardening: auditability, telemetry, a11y, performance tuning.

---

## 8. Component Acceptance Criteria (DoD)

Each component/page is done only if:
1. Handles all async states
- loading, success, empty, error, forbidden (if applicable).

2. Is role-safe
- forbidden actions are not executable from UI.

3. Is typed end-to-end
- request/response types from feature module contracts.

4. Is accessible
- keyboard traversable, focus visible, semantic labels present.

5. Is observable
- major user action emits telemetry event.

6. Is tested
- unit tests for pure logic/components.
- integration tests for page workflows.

---

## 9. Testing Strategy

## 9.1 Unit Tests
- UI components: variants + state rendering.
- Utilities: envelope parsing, error normalization.
- RBAC helpers.

## 9.2 Integration Tests
- Page-level tests with mocked API responses:
  - workflow create/execute flow.
  - ingestion/query flow.
  - policy update flow.

## 9.3 E2E (Playwright)
- Auth flow.
- Workflow happy path.
- Execution diagnostics path.
- Role access enforcement checks.

---

## 10. Performance and Delivery Controls

## 10.1 Route-Based Code Splitting
- Heavy domains lazy-loaded:
  - workflow editor
  - admin pages
  - compliance report charts

## 10.2 Rendering Strategy
- Use RSC for static shells and low-interactivity pages.
- Use Client Components for forms, tables with interactions, editor canvas.

## 10.3 Budget Gates
- CI checks:
  - typecheck
  - lint
  - test
  - bundle size threshold report

---

## 11. Implementation Work Packages (Team Parallelization)

1. Platform team
- Shell, auth, API client, telemetry, RBAC primitives.

2. Core runtime team
- Workflows + executions + API keys.

3. Knowledge/template team
- Knowledge + templates + publications + tools.

4. Governance/compliance team
- Governance + compliance + tenant + admin domains.

Shared contract sync:
- Weekly API contract review against backend docs and endpoint changes.

---

## 12. Immediate Build Checklist (Week 1)

1. Scaffold Next.js app with App Router + TypeScript.
2. Implement global providers:
- QueryClient
- Auth/session
- Toast
- Error boundary

3. Build foundation UI kit:
- Button/Input/Card/Table/Modal/Empty/Skeleton/Banner

4. Implement API client + error normalization.
5. Implement auth pages + app shell.
6. Implement workflows list/create/detail + execute.
7. Implement execution detail with polling.

This completes the first usable vertical slice from login to execution diagnostics.
