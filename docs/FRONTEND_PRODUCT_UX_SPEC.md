# FRONTEND_PRODUCT_UX_SPEC

## Scope and Source of Truth
This specification is derived from backend-first documentation and API contracts:
- `docs/API_ENDPOINTS.md`
- `docs/FEATURE_LIST.md`
- `docs/prd.md`
- `docs/HLD.md`
- `docs/PAYLOAD_REGISTRY.md`

System context:
- API-first platform.
- Frontend currently does not exist in repository.
- Spec targets a production-grade frontend rebuild from scratch.

---

## SECTION 1: INFORMATION ARCHITECTURE (IA) + NAVIGATION

### 1.1 Navigation Model
Recommended shell: left sidebar + top utility bar.

Top-level navigation groups:
1. Home
- Dashboard

2. Workflows
- Workflow Library
- New Workflow
- Workflow Detail
- Workflow Editor
- Executions
- Active Executions
- Templates
- Template Detail

3. Knowledge
- Corpora
- Corpus Detail (documents)
- Document Detail (chunks)
- Knowledge Query

4. Publications
- Publication Library
- Catalog
- Publication Detail

5. Governance
- KPI
- Alerts
- Models
- Domain Config
- Workspaces
- Workflow Permissions
- IAM Policies
- Hyperparameter Profiles

6. Compliance
- Consents
- Retention Policies
- Legal Basis (workflow-scoped)
- Data Subject Requests
- Compliance Report
- Privacy Controls (Export/Delete Me)

7. Tenant
- Tenant Profile
- Tenant Users
- Tenant Plugins
- Tenant Plan
- Tenant Usage

8. Admin (Super Admin only)
- Tenants
- Tenant Detail
- Global Plugins
- Admin Audit Log

9. Developer Tools
- API Keys
- Chat Assistant
- File Parser

### 1.2 Route Tree
```text
/
  /login
  /register
  /app
    /dashboard

    /workflows
      /new
      /:workflowId
      /:workflowId/editor
      /:workflowId/executions
      /active

    /executions
      /:executionId
      /:executionId/attempts
      /:executionId/retrieval-events
      /:executionId/context-snapshots

    /templates
      /:templateId

    /knowledge
      /corpora
      /corpora/:corpusId
      /documents/:documentId
      /query

    /publications
      /catalog
      /:publicationId

    /governance
      /kpi
      /alerts
      /models
      /domain-config
      /workspaces
      /workflows/:workflowId/permissions
      /policies
      /hyperparameters

    /compliance
      /consents
      /retention
      /workflows/:workflowId/legal-basis
      /data-subject-requests
      /report
      /privacy

    /tenant
      /profile
      /users
      /plugins
      /plan
      /usage

    /admin
      /tenants
      /tenants/:tenantId
      /plugins
      /audit-log

    /tools
      /api-keys
      /chat
      /file-parse
```

### 1.3 Backend Feature to Frontend Page Mapping
| Backend Feature | Frontend Page(s) |
|---|---|
| Auth register/login/me | `/register`, `/login`, auth bootstrap in `/app/*` |
| Workflow CRUD + execute + active + execution history | `/workflows`, `/workflows/new`, `/workflows/:id`, `/workflows/:id/editor`, `/workflows/:id/executions`, `/workflows/active` |
| Execution telemetry (steps/attempts/retrieval/context) | `/executions/:executionId`, `/:executionId/attempts`, `/:executionId/retrieval-events`, `/:executionId/context-snapshots` |
| Webhook execution trigger | `/workflows/:id` integration/settings panel |
| API keys | `/tools/api-keys` |
| Knowledge corpora/documents/chunks/query | `/knowledge/corpora`, `/knowledge/corpora/:id`, `/knowledge/documents/:id`, `/knowledge/query` |
| Templates list/get/preview/instantiate | `/templates`, `/templates/:id` |
| Governance models/domain/workspaces/permissions/policies/hyperparameters | `/governance/models`, `/domain-config`, `/workspaces`, `/workflows/:id/permissions`, `/policies`, `/hyperparameters` |
| Alerts + metrics + KPI | `/governance/alerts`, `/governance/kpi` |
| Compliance consents/retention/legal-basis/DSAR/report/privacy | `/compliance/*` |
| Tenant profile/users/plugins/plan/usage | `/tenant/*` |
| Admin tenants/plugins/audit | `/admin/*` |
| Publications + catalog + execution | `/publications`, `/publications/catalog`, `/publications/:id` |
| REX score/preview/apply fixes | `/workflows/:id` (quality tab), `/workflows/:id/editor` |
| Chat/file parse utility endpoints | `/tools/chat`, `/tools/file-parse` |

### 1.4 Page Definition Matrix (Purpose, Actions, Data, Entry/Exit)
| Page | Purpose | Key User Actions | Data Dependencies | Entry Points | Exit Points |
|---|---|---|---|---|---|
| Login | Start authenticated session | Login | `POST /api/auth/login`, `GET /api/auth/me` | Direct URL, auth redirect | Dashboard |
| Register | Create account | Register | `POST /api/auth/register` | Login CTA | Dashboard |
| Dashboard | Operational overview | Navigate, review activity | `GET /api/workflows/active`, `GET /api/kpi/summary` | Post-login | All domains |
| Workflow Library | Manage workflows | Create, open, run, delete | `GET/POST /api/workflows`, `POST /api/workflows/:id/execute`, `DELETE /api/workflows/:id` | Dashboard | Editor, Execution detail |
| Workflow Editor | Build and tune workflow graph | Edit graph, save, run, REX fix | `GET/PATCH /api/workflows/:id`, `POST /api/workflows/:id/execute`, `GET /api/workflows/:id/rex-scores`, `GET .../rex-fixes/preview/:nodeId`, `POST .../rex-fixes/apply` | Workflow detail | Executions, Workflows list |
| Workflow Executions | Audit runs for workflow | Filter, open execution | `GET /api/workflows/:id/executions` | Workflow detail | Execution detail |
| Execution Detail | Diagnose execution | View steps, stop run | `GET /api/executions/:executionId`, `POST /api/executions/:executionId/stop` | Executions list | Attempts/events/snapshots |
| Execution Attempts | Retry diagnostics | Filter attempts | `GET /api/executions/:executionId/step-attempts` | Execution detail | Execution detail |
| Retrieval Events | Retrieval quality diagnostics | Filter events | `GET /api/executions/:executionId/retrieval-events` | Execution detail | Execution detail |
| Context Snapshots | Inspect runtime context | Compare snapshots | `GET /api/executions/:executionId/context-snapshots` | Execution detail | Execution detail |
| Active Executions | Live ops view | Open running execution | `GET /api/workflows/active` | Dashboard | Execution detail |
| Templates | Reuse proven workflows | Browse templates | `GET /api/workflow-templates` | Dashboard, workflows | Template detail |
| Template Detail | Instantiate template | Preview, instantiate | `GET /api/workflow-templates/:id`, `POST /api/workflow-templates/:id/preview`, `POST /api/workflow-templates/:id/instantiate` | Templates list | Workflow detail |
| Corpora | Manage knowledge corpora | Create corpus, open corpus | `GET/POST /api/knowledge/corpora` | Dashboard, nav | Corpus detail |
| Corpus Detail | Manage documents in corpus | Ingest document, inspect docs | `GET /api/knowledge/corpora/:id/documents`, `POST /api/knowledge/documents/ingest` | Corpora | Document detail |
| Document Detail | Inspect chunks | Review chunk quality | `GET /api/knowledge/documents/:id/chunks` | Corpus detail | Corpus detail |
| Knowledge Query | Test retrieval | Query corpus/scope | `POST /api/knowledge/query` | Corpora, editor | Corpus/workflow |
| Publications | Manage internal publications | Create/update/publish/unpublish/delete | `GET/POST /api/publications`, `PATCH/DELETE /api/publications/:id`, `POST /api/publications/:id/publish`, `POST /api/publications/:id/unpublish` | Nav | Publication detail |
| Catalog | Browse published catalog | Open catalog item | `GET /api/publications/catalog` | Nav | Publication detail |
| Publication Detail | Operate one publication | Execute published workflow | `GET /api/publications/:id`, `POST /api/publications/:id/execute` | Publications/Catalog | Executions |
| Models | Manage model registry | List, upsert model | `GET/POST /api/models` | Governance | Governance home |
| Domain Config | Configure runtime overlays | List, upsert, resolve | `GET /api/domain-configs`, `PUT /api/domain-configs`, `POST /api/domain-configs/resolve` | Governance | Workflow editor |
| Workspaces | Manage sharing spaces | Create workspace, add members, assign workflow | `GET/POST /api/workspaces`, `POST /api/workspaces/:id/members`, `POST /api/workspaces/:id/assign-workflow` | Governance | Workflow detail |
| Workflow Permissions | Fine-grained access | View/upsert permissions | `GET/PUT /api/workflows/:id/permissions` | Workflow detail | Workflow detail |
| IAM Policies | Rule-based access control | List/upsert policy | `GET/PUT /api/policies` | Governance | Governance home |
| Hyperparameters | Prompt/runtime tuning profiles | List/upsert/compare | `GET/PUT /api/hyperparameters/profiles`, `POST /api/hyperparameters/compare` | Governance, workflow | Governance home |
| Alerts | Alert operations | List/upsert rules, inspect events, inspect metrics | `GET/PUT /api/alerts/rules`, `GET /api/alerts/events`, `GET /api/alerts/metrics` | Governance | KPI |
| KPI | Business/ops metrics | Time-window analysis | `GET /api/kpi/summary`, `GET /api/kpi/timeseries` | Dashboard, governance | Dashboard |
| Consents | Consent lifecycle | Grant/revoke consent | `GET/POST /api/compliance/consents` | Compliance | Privacy |
| Retention | Data retention governance | Upsert policy, run sweep | `PUT /api/compliance/retention-policies`, `POST /api/compliance/retention-sweep` | Compliance | Report |
| Legal Basis | Workflow legal basis | View/upsert legal basis | `GET/PUT /api/compliance/workflows/:id/legal-basis` | Workflow detail | Compliance home |
| Data Subject Requests | Handle DSAR | Create/list/respond | `GET/POST /api/compliance/data-subject-requests`, `POST /api/compliance/data-subject-requests/:id/respond` | Compliance | Report |
| Compliance Report | Audit summary | Review compliance health | `GET /api/compliance/report` | Compliance | Governance |
| Privacy | User privacy controls | Export me, delete me | `GET /api/me/export`, `DELETE /api/me` | Profile/compliance | Logout |
| Tenant Profile | Tenant metadata settings | Edit profile | `GET/PATCH /api/tenant` | Tenant nav | Tenant home |
| Tenant Users | Tenant user management | Invite/update/remove user | `GET /api/tenant/users`, `POST /api/tenant/users/invite`, `PATCH/DELETE /api/tenant/users/:userId` | Tenant nav | Tenant home |
| Tenant Plugins | Tenant plugin controls | Configure/test BYOK, browse plugins | `GET /api/tenant/plugins`, `PATCH /api/tenant/plugins/:slug/byok`, `GET /api/tenant/plugins/:slug/byok/test`, `GET /api/plugins`, `GET /api/plugins/:slug`, `GET /api/plugins/categories` | Tenant nav | Tenant home |
| Tenant Plan | Plan visibility | View plan | `GET /api/tenant/plan` | Tenant nav | Tenant usage |
| Tenant Usage | Consumption visibility | Monitor usage | `GET /api/tenant/usage` | Tenant nav | Tenant plan |
| Admin Tenants | Platform tenant governance | Create/list tenants | `POST/GET /admin/tenants` | Admin nav | Tenant detail |
| Admin Tenant Detail | Operate a tenant | Update tenant, users, plugins, plan, metrics | `/admin/tenants/:id*` endpoints | Admin tenants | Admin tenants |
| Admin Plugins | Global plugin governance | Create/list/update/delete | `POST/GET /admin/plugins`, `PATCH/DELETE /admin/plugins/:slug` | Admin nav | Admin home |
| Admin Audit Log | Platform audit visibility | Filter and inspect events | `GET /admin/audit-log` | Admin nav | Admin home |
| API Keys | Provider credential management | Add/delete keys | `GET/POST /api/keys`, `DELETE /api/keys/:keyId` | Tools nav | Any AI-dependent page |
| Chat Assistant | Runtime assistant | Send workflow-aware prompts | `POST /api/chat` | Tools nav, execution detail | Workflow/execution |
| File Parser | Parse user files for workflow use | Upload/parse file | `POST /api/files/parse` | Tools nav, workflow editor | Workflow editor |

Design constraints:
- Keep global nav depth <= 3 levels.
- Workflow/Execution/Knowledge pages remain directly reachable from each other.
- Admin remains hard-isolated from tenant app shell.

---

## SECTION 2: PAGE-BY-PAGE UX PRIORITIES

### 2.1 UX Priorities Matrix
| Page | Primary Goal | Secondary Actions | Critical UI Components | Data Loading Strategy | Loading/Empty/Error Handling |
|---|---|---|---|---|---|
| Login/Register | Fast, secure onboarding | Switch auth mode | Auth form, validation, password strength, submit state | No prefetch; submit-driven | Loading: button spinner. Empty: n/a. Error: inline field + global banner |
| Dashboard | Quickly understand platform status | Jump to high-priority actions | KPI cards, active executions list, quick actions | Parallel fetch summary + active runs with stale-while-revalidate | Loading skeleton tiles; empty cards with CTA; recoverable API banners |
| Workflow Library | Find or create workflows quickly | Execute inline, delete | Search/filter bar, paginated table/cards, row actions | Server pagination and optimistic create/delete | Empty: first-workflow CTA; error row fallback |
| Workflow Editor | Build and ship workflows with confidence | Run, score, apply fixes | Graph canvas, node panel, inspector, validation panel, REX panel | Load workflow once; autosave debounce on edits | Loading canvas skeleton; empty graph starter template; error guardrail on save/execute |
| Execution Detail | Diagnose failures fast | Stop running flow | Step timeline, status badges, log/output viewers | Poll when status pending/running; stop polling terminal | Empty steps as anomaly warning; error callouts with retry |
| Knowledge pages | Manage corpora/documents and retrieval quality | Ingest, query, inspect chunks | Corpus list, ingestion modal, query console, chunk table | Cursor/page-based fetch; background refresh on ingest | Empty onboarding state; ingest failed state with actionable copy |
| Templates | Start from reusable patterns | Preview, instantiate | Template cards, detail preview diff, instantiate modal | Prefetch template detail on hover/intent | Empty (if plan-restricted) explains entitlement |
| Publications/Catalog | Operationalize reusable published workflows | Execute publication | Publication table/card, status chips, execute form | Demand load details; invalidate on publish/unpublish | Empty catalog message for no published items |
| Governance pages | Configure controls safely | Compare/tune policies and profiles | Split-pane forms + table lists, diff views, confirmations | Query cached lists + mutation invalidation | Empty = no rules yet CTA; errors include backend code and impacted scope |
| Compliance pages | Ensure policy/legal completeness | Run sweeps, respond DSAR | Checklist cards, legal basis form, DSAR queue, report summary | Deterministic load order (consents -> legal basis -> retention/report) | Empty DSAR queue state, legal basis missing-state warning |
| Tenant pages | Operate tenant settings and access | Manage users/plugins | Profile form, user role table, plugin BYOK test panel | Fetch profile/users/plugins in parallel | Empty users/plugins states with invite/configure CTA |
| Admin pages | Platform-wide supervision | Tenant and plugin operations | Multi-tenant table, tenant detail tabs, audit log explorer | Server pagination + filters | Empty audit log state; irreversible actions require confirmations |
| Tools pages | Setup integration and debug data quickly | Validate upstream readiness | API key manager, chat console, file parse uploader | Submit-driven mutations | Empty API keys state blocks AI actions with CTA |

### 2.2 UX Principles Applied Across Pages
1. Primary action prominence
- One dominant CTA per page (Create, Save, Execute, Respond).

2. Progressive disclosure
- Advanced controls (policies, hyperparams, legal basis detail) collapsed by default.

3. Fast perception
- Skeletons for first load, optimistic updates for low-risk mutations, explicit pending states for async jobs.

4. Cognitive load minimization
- Domain grouping by user intent (Build, Run, Govern, Comply, Admin).

---

## SECTION 3: DESIGN SYSTEM DECISIONS

### 3.1 Design Tokens

#### Color Tokens
| Token | Value | Usage |
|---|---|---|
| `color.bg.base` | `#F7F8FA` | App background |
| `color.bg.surface` | `#FFFFFF` | Cards/panels |
| `color.bg.subtle` | `#EEF1F5` | Sub-panels |
| `color.text.primary` | `#111827` | Primary text |
| `color.text.secondary` | `#4B5563` | Secondary text |
| `color.border.default` | `#D6DCE5` | Default borders |
| `color.primary.500` | `#0E7490` | Primary action |
| `color.primary.600` | `#155E75` | Hover/active primary |
| `color.accent.500` | `#C2410C` | Secondary emphasis |
| `color.success.500` | `#15803D` | Success states |
| `color.warning.500` | `#B45309` | Warning states |
| `color.error.500` | `#B91C1C` | Error states |
| `color.info.500` | `#1D4ED8` | Informational states |

#### Typography Scale
| Token | Size/Line | Weight |
|---|---|---|
| `type.display.lg` | 40/48 | 700 |
| `type.h1` | 32/40 | 700 |
| `type.h2` | 24/32 | 700 |
| `type.h3` | 20/28 | 600 |
| `type.body.lg` | 18/28 | 400 |
| `type.body.md` | 16/24 | 400 |
| `type.body.sm` | 14/20 | 400 |
| `type.caption` | 12/16 | 500 |
| `type.code` | 13/20 | 400 (mono) |

#### Spacing and Layout
- Base unit: 4px.
- Primary spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- Standard page gutters: 24px desktop, 16px tablet, 12px mobile.

#### Radius and Shadow
| Token | Value |
|---|---|
| `radius.sm` | 6px |
| `radius.md` | 10px |
| `radius.lg` | 14px |
| `radius.xl` | 20px |
| `shadow.sm` | `0 1px 2px rgba(17,24,39,0.08)` |
| `shadow.md` | `0 6px 16px rgba(17,24,39,0.12)` |
| `shadow.lg` | `0 12px 28px rgba(17,24,39,0.16)` |

### 3.2 Component System

#### Core Components and Variants
| Component | Variants | States |
|---|---|---|
| Button | `primary`, `secondary`, `tertiary`, `danger`, `ghost`, `link` | default, hover, active, focus-visible, disabled, loading |
| Input | `text`, `password`, `email`, `search`, `number` | default, focus, error, disabled, readonly |
| Select | `single`, `multi` | default, focus, error, disabled |
| Textarea | `default`, `code` | default, focus, error, disabled |
| Table | `default`, `compact`, `virtualized` | sorting, filtering, row-select, empty, loading |
| Card | `default`, `interactive`, `status` | hover, active, disabled |
| Modal/Drawer | `confirm`, `form`, `detail` | open, closing, blocked-submit, destructive-confirm |
| Toast | `success`, `error`, `warning`, `info` | timed-dismiss, sticky, action |
| Tabs | `line`, `segmented` | active, hover, disabled |
| Badge | `neutral`, `success`, `warning`, `error`, `info` | default |
| Navigation | sidebar group, breadcrumb, command palette | active, collapsed, keyboard-nav |
| EmptyState | `first-run`, `no-results`, `restricted` | with CTA/without CTA |

#### Interaction Requirements
1. Every actionable control has visible label + icon optional.
2. Destructive actions require two-step confirmation.
3. Async mutation components expose pending and completion feedback.

### 3.3 Accessibility Standards
1. Compliance target
- WCAG 2.2 AA minimum.

2. Keyboard navigation
- Full tab/shift-tab traversal.
- Logical focus order by reading flow.
- Command palette and modals must trap focus.

3. Focus states
- 3:1 contrast minimum for focus ring against adjacent colors.
- Focus ring always visible for keyboard users.

4. Color contrast
- Text contrast >= 4.5:1 (normal) and >= 3:1 (large text/UI components).
- Color cannot be sole indicator of status; pair with icon/text.

5. Semantics
- Use landmark roles and heading hierarchy.
- Form inputs must have associated labels and error descriptions.

---

## SECTION 4: ERROR STATES & EMPTY STATES

### 4.1 Error UX Standards
| Error Type | UX Behavior | Copy Tone | Suggested Message |
|---|---|---|---|
| API request failure (5xx/network) | Inline page banner + retry action + retain last good data if available | Calm, action-oriented | "We could not load this data right now. Please try again." |
| Validation error (400) | Field-level message + summary banner | Specific, non-technical | "Please fix the highlighted fields and try again." |
| Auth/session expiry (401) | Global interceptor, show toast, redirect to login with return URL | Direct | "Your session has expired. Please sign in again." |
| Authorization failure (403) | Permission empty state; hide unavailable actions preemptively | Respectful, clear | "You do not have access to this action." |
| Missing dependency (e.g., API key) | Blocked action panel with CTA to setup | Practical | "Add an API key to continue with this feature." |

### 4.2 Empty State Standards
| Empty Type | UX Behavior | Copy Tone | Suggested Message |
|---|---|---|---|
| No data yet | Explain value + primary CTA | Encouraging | "No workflows yet. Create your first workflow to get started." |
| First-time user | Guided checklist + progressive setup | Guided, concise | "Set up API keys, then create a workflow." |
| Filtered no results | Preserve filters + clear filter CTA | Neutral | "No results match these filters." |
| Restricted by role/plan | Explain constraint + next step | Transparent | "This feature is not available for your current role or plan." |

Copy rules:
1. No stack traces or backend internals in user-facing text.
2. Include one clear next action when possible.
3. Keep messages <= 2 short sentences.

---

## SECTION 5: ROLE-BASED UX MATRIX

Roles:
- Super Admin
- Org Admin
- Editor
- Viewer

Legend:
- Access: `Full`, `Read`, `None`, `Scoped`

| Screen | Role | Access | Actions | Notes |
|---|---|---|---|---|
| Login/Register | Super Admin | Full | sign in/register | Public endpoints |
| Login/Register | Org Admin | Full | sign in/register | Public endpoints |
| Login/Register | Editor | Full | sign in/register | Public endpoints |
| Login/Register | Viewer | Full | sign in/register | Public endpoints |
| Dashboard | Super Admin | Scoped | read ops summary | Use admin-oriented summary widgets |
| Dashboard | Org Admin | Full | read, navigate | Tenant scope |
| Dashboard | Editor | Full | read, navigate | Tenant scope |
| Dashboard | Viewer | Read | read, navigate | No mutation CTAs |
| Workflows list/detail | Super Admin | Scoped | read tenant workflows | No explicit admin workflow mutation endpoint |
| Workflows list/detail | Org Admin | Full | CRUD + execute + manage permissions/legal basis | Based on tenant role + IAM |
| Workflows list/detail | Editor | Full | CRUD + execute | Permission/legal basis actions may be restricted by policy |
| Workflows list/detail | Viewer | Read | read only | Mutation disabled |
| Workflow Editor | Super Admin | Scoped | view only unless tenant role context present | Avoid implicit escalation |
| Workflow Editor | Org Admin | Full | edit graph, run, apply REX fixes | |
| Workflow Editor | Editor | Full | edit graph, run, apply REX fixes | |
| Workflow Editor | Viewer | None | none | Route hidden/blocked |
| Executions pages | Super Admin | Scoped | read execution diagnostics | Stop action disabled by default |
| Executions pages | Org Admin | Full | read + stop execution | stop endpoint admin/editor |
| Executions pages | Editor | Full | read + stop execution | |
| Executions pages | Viewer | Read | inspect status/steps | no stop |
| Knowledge pages | Super Admin | Scoped | read diagnostics | |
| Knowledge pages | Org Admin | Full | create corpus, ingest, query | |
| Knowledge pages | Editor | Full | create corpus, ingest, query | |
| Knowledge pages | Viewer | Read | list/read/query if policy allows | ingestion blocked |
| Templates | Super Admin | Read | browse | |
| Templates | Org Admin | Full | browse/preview/instantiate | instantiate requires edit-capable role |
| Templates | Editor | Full | browse/preview/instantiate | |
| Templates | Viewer | Read | browse/preview | instantiate disabled |
| Publications | Super Admin | Scoped | read/manage when tenant context allows | |
| Publications | Org Admin | Full | CRUD publish/unpublish/execute | |
| Publications | Editor | Full | CRUD publish/unpublish/execute | |
| Publications | Viewer | Read | list/detail/catalog only | no publish/execute |
| Governance: Models/Domain/Workspaces/Policies/Hyperparams/Alerts | Super Admin | Scoped | read/operate selectively | Keep global admin in admin shell |
| Governance: Models/Domain/Workspaces/Policies/Hyperparams/Alerts | Org Admin | Full | list/create/update/compare | |
| Governance: Models/Domain/Workspaces/Policies/Hyperparams/Alerts | Editor | Full | list/create/update/compare (policy dependent) | |
| Governance: Models/Domain/Workspaces/Policies/Hyperparams/Alerts | Viewer | Read | read only | no upsert actions |
| KPI | Super Admin | Read | observe | |
| KPI | Org Admin | Full | read | |
| KPI | Editor | Full | read | |
| KPI | Viewer | Read | read | |
| Compliance pages | Super Admin | Scoped | read/report/audit | |
| Compliance pages | Org Admin | Full | consent, retention, legal basis, DSAR respond | |
| Compliance pages | Editor | Full | consent, retention, legal basis, DSAR respond | |
| Compliance pages | Viewer | Read | read report/requests | respond/create may be restricted |
| Privacy (export/delete me) | Super Admin | Full | export/delete own account | user-scoped |
| Privacy (export/delete me) | Org Admin | Full | export/delete own account | user-scoped |
| Privacy (export/delete me) | Editor | Full | export/delete own account | user-scoped |
| Privacy (export/delete me) | Viewer | Full | export/delete own account | user-scoped |
| Tenant Profile | Super Admin | Scoped | read | tenant admin path preferred |
| Tenant Profile | Org Admin | Full | view/update | org admin mutation |
| Tenant Profile | Editor | Read | view | mutation restricted |
| Tenant Profile | Viewer | Read | view | |
| Tenant Users | Super Admin | Scoped | read | |
| Tenant Users | Org Admin | Full | invite/update/remove | org admin mutation |
| Tenant Users | Editor | Read | list | mutation restricted |
| Tenant Users | Viewer | None | none | |
| Tenant Plugins | Super Admin | Scoped | read | |
| Tenant Plugins | Org Admin | Full | configure BYOK/test | org admin mutation |
| Tenant Plugins | Editor | Read | list plugin state | no BYOK patch |
| Tenant Plugins | Viewer | Read | list plugin state | |
| Tenant Plan/Usage | Super Admin | Scoped | read | |
| Tenant Plan/Usage | Org Admin | Full | read | |
| Tenant Plan/Usage | Editor | Read | read | |
| Tenant Plan/Usage | Viewer | Read | read | |
| Admin screens | Super Admin | Full | tenants/plugins/audit full operations | `/admin/*` only |
| Admin screens | Org Admin | None | none | hidden |
| Admin screens | Editor | None | none | hidden |
| Admin screens | Viewer | None | none | hidden |
| API Keys | Super Admin | Scoped | read/add/remove own keys where applicable | |
| API Keys | Org Admin | Full | add/list/delete | admin/editor endpoint |
| API Keys | Editor | Full | add/list/delete | |
| API Keys | Viewer | Read | list only | no create/delete |
| Tools: Chat/File parse | Super Admin | Scoped | test utilities | |
| Tools: Chat/File parse | Org Admin | Full | use endpoints | |
| Tools: Chat/File parse | Editor | Full | use endpoints | |
| Tools: Chat/File parse | Viewer | Read | limited access by policy | disable write-like flows if denied |

---

## SECTION 6: FRONTEND NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance Targets
1. Initial load (authenticated shell)
- p75 <= 2.5s on 4G mid-tier mobile.

2. Route transition
- p75 <= 500ms perceived transition for cached routes.

3. API responsiveness (frontend perspective)
- Show first meaningful skeleton <= 150ms after navigation.
- Show error fallback if request exceeds 10s timeout.

4. Bundle budgets
- Initial JS <= 250KB gzip.
- Per route chunk <= 150KB gzip preferred.

5. Data strategy
- Code split by route and heavy feature modules.
- Lazy load graph editor and admin pages.
- Preload likely next route on intent (hover/focus).

### 6.2 Browser and Device Support
- Desktop: latest 2 versions of Chrome, Edge, Safari.
- Mobile web: iOS Safari >= 16, Android Chrome >= 120.
- Responsive breakpoints: 360, 768, 1024, 1280+.
- No horizontal overflow on any supported viewport.

### 6.3 Telemetry and Observability
1. Error tracking
- Capture uncaught exceptions, failed API calls, and route-level crashes.
- Include `endpoint`, `status`, `role`, `tenantId` (non-PII), `correlationId` if provided.

2. Product analytics events (minimum)
- `auth_login_success`, `workflow_created`, `workflow_executed`, `execution_viewed`, `corpus_created`, `document_ingested`, `template_instantiated`, `policy_updated`, `dsar_created`, `publication_published`.

3. Performance telemetry
- Route load duration.
- API latency histogram by endpoint group.

4. Logging rules
- No secrets or raw tokens in logs.
- Redact payload fields containing key material and personal identifiers.

### 6.4 Reliability Requirements
1. Retry strategy
- GET failures: auto-retry up to 2 times with exponential backoff (250ms, 750ms).
- Mutation failures: no silent retry; user-triggered retry only.

2. Timeout handling
- Global request timeout 10s (configurable by endpoint category).

3. Async operations
- Polling for execution/document status with capped interval and terminal stop.

4. Offline behavior
- Detect offline; show banner and pause polling.
- Queue no mutations offline (avoid optimistic divergence for governance/compliance actions).

---

## SECTION 7: CONSISTENCY RULES

### 7.1 Naming Conventions
1. Route naming
- Kebab-case for URL segments.
- Singular IDs: `:workflowId`, `:executionId`.

2. UI labels
- Domain nouns must match backend terms: workflow, execution, corpus, publication, policy.

3. Component naming
- `DomainActionObject` pattern (example: `WorkflowExecuteButton`).

### 7.2 API Usage Patterns
1. Single API client layer
- Centralized auth header injection and error mapping.

2. Envelope handling
- Standard decode for `{ success, data }` and `{ success, error }`.

3. Query/mutation split
- Read operations via query cache.
- Write operations via mutation handlers with cache invalidation.

### 7.3 State Handling Consistency
1. Data states required for all pages
- `loading`, `ready`, `empty`, `error`, `forbidden`.

2. Polling pages
- Explicit `live` badge while polling.
- Stop polling on terminal statuses.

3. Form state
- Dirty tracking, submit disable while pending, unsaved-change guard for editor forms.

### 7.4 UI Behavior Consistency
1. Confirmation policy
- Required for delete, publish/unpublish, retention sweep, delete-me.

2. Toast policy
- Success toasts auto-dismiss 4s.
- Error toasts remain until dismissed.

3. Table policy
- Server-driven pagination and stable sort indicators.

4. Permission policy
- Hide inaccessible nav items.
- If deep-linked, show explicit forbidden state (not blank page).

---

## SECTION 8: ASSUMPTIONS & GAPS

### 8.1 Missing Backend Details
1. Exact per-endpoint field-level authorization granularity for all governance actions is not fully enumerated in docs.
2. Complete response schemas for every endpoint are not listed in full (many are summarized).
3. No explicit backend-provided taxonomy for workflow statuses beyond observed values.
4. No explicit localization strategy or content language support.
5. No explicit websocket/real-time channel; status UX assumes polling.

### 8.2 Inferred UX Decisions
1. Route structure and nav grouping are inferred from endpoint domains.
2. Some viewer/editor/admin action boundaries are inferred from role notes and mutation constraints.
3. Performance budgets are defined as implementation targets (not backend guarantees).
4. Design tokens and component variants are proposed to support production consistency and accessibility.

### 8.3 Clarifications Needed Before Implementation Freeze
1. Final policy for super admin behavior inside tenant-scoped app shell.
2. Canonical permission matrix from backend IAM for each mutate endpoint.
3. Error code catalog standardization beyond current examples.
4. Whether chat/file-parse tools should be tenant role restricted or broadly available.
5. Prioritization of MVP page subset for phase 1 launch.

---

## Final Validation Checklist
- Every backend feature in `docs/FEATURE_LIST.md` is represented in IA or page mapping.
- Every endpoint group in `docs/API_ENDPOINTS.md` has at least one page dependency.
- Role matrix covers Super Admin, Org Admin, Editor, Viewer.
- UX patterns align with API-first, backend-only current architecture.
- No mandatory UI behavior depends on capabilities absent from documented backend contracts.
