# API Endpoints

Base URL defaults to `http://localhost:4000`.

## Response Contract

- Success: `success: true`, with `data` and optional `meta`
- Failure: `success: false`, with `error.code`, `error.message`, and optional `error.details`

## Authentication

Protected routes require `Authorization: Bearer <jwt>`.

## Endpoint Catalog

| Domain | Method | Path | Auth | Description |
| --- | --- | --- | --- | --- |
| Auth | POST | `/api/auth/register` | No | Register user and issue JWT |
| Auth | POST | `/api/auth/login` | No | Login and issue JWT |
| Auth | GET | `/api/auth/me` | Yes | Current authenticated user |
| Keys | POST | `/api/keys` | Yes | Store encrypted provider key |
| Keys | GET | `/api/keys` | Yes | List stored key metadata |
| Keys | DELETE | `/api/keys/:keyId` | Yes | Delete key |
| Workflows | POST | `/api/workflows` | Yes | Create workflow |
| Workflows | GET | `/api/workflows` | Yes | List workflows (paginated) |
| Workflows | GET | `/api/workflows/:workflowId` | Yes | Workflow detail |
| Workflows | PATCH | `/api/workflows/:workflowId` | Yes | Update workflow |
| Workflows | DELETE | `/api/workflows/:workflowId` | Yes | Delete workflow |
| Workflows | POST | `/api/workflows/:workflowId/execute` | Yes | Trigger execution |
| Workflows | GET | `/api/workflows/:workflowId/executions` | Yes | Workflow executions |
| Workflows | GET | `/api/workflows/active` | Yes | Active executions grouped by workflow |
| Executions | GET | `/api/executions/:executionId` | Yes | Execution summary and steps |
| Executions | POST | `/api/executions/:executionId/stop` | Yes | Stop execution |
| Executions | GET | `/api/executions/:executionId/step-attempts` | Yes | Step attempt telemetry |
| Executions | GET | `/api/executions/:executionId/retrieval-events` | Yes | Retrieval telemetry |
| Executions | GET | `/api/executions/:executionId/context-snapshots` | Yes | Context snapshot telemetry |
| Templates | GET | `/api/workflow-templates` | Yes | List templates |
| Templates | GET | `/api/workflow-templates/:templateId` | Yes | Template detail |
| Templates | POST | `/api/workflow-templates/:templateId/preview` | Yes | Preview template graph |
| Templates | POST | `/api/workflow-templates/:templateId/instantiate` | Yes | Instantiate template as workflow |
| Knowledge | POST | `/api/knowledge/corpora` | Yes | Create scoped corpus |
| Knowledge | GET | `/api/knowledge/corpora` | Yes | List corpora |
| Knowledge | POST | `/api/knowledge/documents/ingest` | Yes | Queue ingestion |
| Knowledge | GET | `/api/knowledge/corpora/:corpusId/documents` | Yes | List corpus documents |
| Knowledge | GET | `/api/knowledge/documents/:documentId/chunks` | Yes | List document chunks |
| Knowledge | POST | `/api/knowledge/query` | Yes | Scoped retrieval query |
| Models | GET | `/api/models` | Yes | List model registry entries |
| Models | POST | `/api/models` | Yes | Upsert model registry entry (admin) |
| Domain Config | GET | `/api/domain-configs` | Yes | List active configs for requester |
| Domain Config | PUT | `/api/domain-configs` | Yes | Upsert domain config overlay |
| Domain Config | POST | `/api/domain-configs/resolve` | Yes | Resolve merged runtime config |
| Workspaces | GET | `/api/workspaces` | Yes | List requester workspaces |
| Workspaces | POST | `/api/workspaces` | Yes | Create workspace |
| Workspaces | POST | `/api/workspaces/:workspaceId/members` | Yes | Add/update workspace member |
| Workspaces | POST | `/api/workspaces/:workspaceId/assign-workflow` | Yes | Assign workflow to workspace |
| Sharing | GET | `/api/workflows/:workflowId/permissions` | Yes | List workflow share permissions |
| Sharing | PUT | `/api/workflows/:workflowId/permissions` | Yes | Upsert workflow share permission |
| Policies | GET | `/api/policies` | Yes | List IAM policies |
| Policies | PUT | `/api/policies` | Yes | Upsert IAM policy |
| Hyperparameters | GET | `/api/hyperparameters/profiles` | Yes | List profiles |
| Hyperparameters | PUT | `/api/hyperparameters/profiles` | Yes | Upsert profile |
| Hyperparameters | POST | `/api/hyperparameters/compare` | Yes | Compare two profiles |
| Alerts | GET | `/api/alerts/rules` | Yes | List alert rules |
| Alerts | PUT | `/api/alerts/rules` | Yes | Upsert alert rule |
| Alerts | GET | `/api/alerts/events` | Yes | List alert events |
| Alerts | GET | `/api/alerts/metrics` | Yes | Prometheus-formatted metrics |
| KPI | GET | `/api/kpi/summary` | Yes | KPI rollup |
| KPI | GET | `/api/kpi/timeseries` | Yes | KPI daily time-series |
| Compliance | GET | `/api/compliance/consents` | Yes | List consent records |
| Compliance | POST | `/api/compliance/consents` | Yes | Set consent |
| Compliance | PUT | `/api/compliance/retention-policies` | Yes | Upsert retention policy |
| Compliance | POST | `/api/compliance/retention-sweep` | Yes | Run retention sweep |
| GDPR | GET | `/api/me/export` | Yes | Export requester data |
| GDPR | DELETE | `/api/me` | Yes | Delete requester data |
| Files | POST | `/api/files/parse` | Yes | Parse uploaded file payload |
| Chat | POST | `/api/chat` | Yes | Assistant interaction for workflow guidance |
| Webhook | POST | `/api/webhooks/:workflowId` | No | External trigger for active workflow |
| System | GET | `/api/health` | No | Health check |

## Pagination

Paginated responses include:

- `meta.total`
- `meta.page`
- `meta.limit`
- `meta.totalPages`

## Access Notes

- Viewer role is read-only for mutation endpoints.
- Policy checks are enforced for workflow actions (`view`, `edit`, `delete`, `execute`, `manage`).
- `/api/models` write access is limited to admin users.
