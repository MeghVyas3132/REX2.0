# API Endpoints

Base path assumes backend host and port, default `http://localhost:4000`.

## Response Convention

- Success: `success: true`, plus `data` and optional `meta`
- Failure: `success: false`, plus `error` object

## Authentication

Most endpoints require JWT bearer token in `Authorization` header.

## Endpoint Catalog

| Area | Method | Path | Auth | Purpose |
| --- | --- | --- | --- | --- |
| Auth | POST | /api/auth/register | No | Register new user and issue token |
| Auth | POST | /api/auth/login | No | Login and issue token |
| Auth | GET | /api/auth/me | Yes | Get current authenticated user |
| API Keys | POST | /api/keys | Yes | Store encrypted provider API key |
| API Keys | GET | /api/keys | Yes | List stored key metadata |
| API Keys | DELETE | /api/keys/:keyId | Yes | Delete a provider API key |
| Workflows | POST | /api/workflows | Yes | Create workflow |
| Workflows | GET | /api/workflows | Yes | List workflows with pagination |
| Workflows | GET | /api/workflows/:workflowId | Yes | Get workflow details |
| Workflows | PATCH | /api/workflows/:workflowId | Yes | Update workflow |
| Workflows | DELETE | /api/workflows/:workflowId | Yes | Delete workflow |
| Workflows | POST | /api/workflows/:workflowId/execute | Yes | Trigger workflow execution |
| Workflows | GET | /api/workflows/:workflowId/executions | Yes | List executions for workflow |
| Executions | GET | /api/executions/:executionId | Yes | Get execution summary and previews |
| Executions | GET | /api/executions/:executionId/step-attempts | Yes | Paginated attempt telemetry |
| Executions | GET | /api/executions/:executionId/retrieval-events | Yes | Paginated retrieval telemetry |
| Executions | GET | /api/executions/:executionId/context-snapshots | Yes | Paginated context snapshots |
| Templates | GET | /api/workflow-templates | Yes | List template descriptors |
| Templates | GET | /api/workflow-templates/:templateId | Yes | Get template descriptor |
| Templates | POST | /api/workflow-templates/:templateId/preview | Yes | Build graph preview from params |
| Templates | POST | /api/workflow-templates/:templateId/instantiate | Yes | Create workflow from template |
| Knowledge | POST | /api/knowledge/corpora | Yes | Create scoped corpus |
| Knowledge | POST | /api/knowledge/documents/ingest | Yes | Create document and enqueue ingestion |
| Knowledge | GET | /api/knowledge/corpora | Yes | List corpora with filters |
| Knowledge | GET | /api/knowledge/corpora/:corpusId/documents | Yes | List documents in corpus |
| Knowledge | GET | /api/knowledge/documents/:documentId/chunks | Yes | List chunks for document |
| Knowledge | POST | /api/knowledge/query | Yes | Scoped retrieval query |
| Files | POST | /api/files/parse | Yes | Parse uploaded base64 file payload |
| Chat | POST | /api/chat | Yes | Workflow assistant chat request |
| Webhook | POST | /api/webhooks/:workflowId | No | External trigger for active workflow |
| System | GET | /api/health | No | Health check |

## Pagination Pattern

Paginated endpoints return:

- `meta.total`
- `meta.page`
- `meta.limit`
- `meta.totalPages`

## Endpoint Notes

- Webhook execution requires target workflow to be active.
- Template preview does not persist workflow records.
- Execution detail endpoint includes capped preview arrays for attempts, retrieval events, and context snapshots.
- Knowledge query supports explicit corpus ID or scoped corpus resolution.
