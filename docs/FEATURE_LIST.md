# Feature List (Implementation-Derived)

## 1. Authentication and Identity
- User register/login with bcrypt password hashing.
- JWT issuance with tenant and role claims.
- Current user profile endpoint.

## 2. Multi-Tenancy and Access
- Tenant membership and tenant-role context (`org_admin/org_editor/org_viewer`).
- Tenant activation gating middleware.
- Tenant plan and enabled plugin enrichment.
- Global super-admin lane for platform administration.
- IAM workflow action checks with policy conditions.
- ABAC middleware support with JSON logic.

## 3. Workflow Authoring and Execution
- Workflow CRUD with versioning on graph edits.
- Trigger workflow execution (API and webhook).
- Stop/cancel active execution.
- Active execution listing.
- Detailed execution telemetry retrieval:
  - steps
  - step attempts
  - retrieval events
  - context snapshots

## 4. Queue and Worker Runtime
- BullMQ-backed asynchronous execution.
- Separate worker process for execution and knowledge ingestion.
- Retries/backoff for queue jobs.

## 5. Engine and Node Runtime
- DAG validation and topological ordering.
- Built-in node types for trigger, transformation, control, memory, knowledge, guardrails, and outputs.
- Context update hooks and execution state management.
- Retrieval orchestration metadata support.

## 6. Knowledge/RAG
- Corpus creation with user/workflow/execution scope.
- Document ingestion queue pipeline.
- Chunking and embedding storage (`jsonb` + `vector`).
- Deterministic embedding fallback when provider keys unavailable.
- Query endpoint with top-k similarity and scoped filters.

## 7. Template System
- Built-in workflow template catalog.
- Template preview and instantiation.
- Tenant plan-level template allow-list enforcement.

## 8. Governance and Operations
- Model registry CRUD-style upsert/list.
- Domain configuration overlays and resolver.
- Workspace creation and member management.
- Workflow sharing permissions and IAM policy management.
- Hyperparameter profile upsert/list/compare.
- Alert rule management and event listing.
- Prometheus-style metrics export.
- KPI summary and timeseries endpoints.

## 9. Publication and Business Catalog
- Publish/unpublish workflow publication records.
- List public catalog and internal publication inventory.
- Execute published workflows.

## 10. Compliance and Privacy
- Consent management.
- Retention policy management and sweep execution.
- Workflow legal basis register (GDPR/DPDP fields).
- Data subject request lifecycle (create/list/respond).
- Compliance summary report generation.
- GDPR endpoints for user data export and account deletion.
- Data access audit log persistence.

## 11. REX Scoring and Autofix
- Per-node R/E/X scoring.
- Gap and autofix recommendation generation.
- Fix preview and graph mutation application.

## 12. File and Chat Utilities
- File parse endpoint for csv/json/txt/pdf(base extraction).
- Workflow-aware chat assistant endpoint using user-provided Gemini/Groq API keys.

## 13. Frontend Feature State (Current Workspace)
- UI feature implementation files under `apps/frontend` are currently deleted in the working tree.
- Backend API capabilities listed in this document remain implemented and testable.
- Frontend-dependent capabilities are in one of two states until reconciliation:
  - restored full-stack mode (frontend files restored)
  - backend-only mode (frontend references removed/gated from CI/infra/scripts)
