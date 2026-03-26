# API Endpoints

## Conventions
- Success envelope: `{ success: true, data: ... }` (some include `meta`).
- Error envelope: `{ success: false, error: { code, message, details? } }`.
- Auth:
  - `Public` = no `app.authenticate` hook.
  - `JWT` = authenticated route scope.
  - Additional role/action checks noted where explicit.
- Repository state note: this endpoint registry remains valid in backend-only mode even when `apps/frontend` is absent.

## 1. Health and Public
| Method | Path | Auth | Request Schema | Response Schema | Notes |
|---|---|---|---|---|---|
| GET | /api/health | Public | none | `{status,timestamp}` | Health check |
| POST | /api/webhooks/:workflowId | Public + route rate limit | arbitrary JSON body | `{executionId}` | Requires active workflow; triggers execution |

## 2. Auth
| Method | Path | Auth | Request | Response | Errors |
|---|---|---|---|---|---|
| POST | /api/auth/register | Public | `registerSchema` | `{user,token}` | VALIDATION_ERROR, USER_EXISTS |
| POST | /api/auth/login | Public | `loginSchema` | `{user,token}` | VALIDATION_ERROR, INVALID_CREDENTIALS |
| GET | /api/auth/me | JWT | none | `{user}` | UNAUTHORIZED, NOT_FOUND |

## 3. API Keys
| Method | Path | Auth | Request | Response | Notes |
|---|---|---|---|---|---|
| POST | /api/keys | JWT + role(admin/editor) | `createApiKeySchema` | stored key metadata | encrypted at rest |
| GET | /api/keys | JWT | none | key list | |
| DELETE | /api/keys/:keyId | JWT + role(admin/editor) | path param | `{deleted:true}` | |

## 4. Workflows and Executions
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | /api/workflows | JWT + tenant role edit | `createWorkflowSchema` | workflow |
| GET | /api/workflows | JWT | `paginationSchema` query | paginated workflows |
| GET | /api/workflows/active | JWT | pagination query | active executions by user |
| GET | /api/workflows/:workflowId | JWT | path param | workflow |
| PATCH | /api/workflows/:workflowId | JWT + tenant role edit | `updateWorkflowSchema` | workflow |
| DELETE | /api/workflows/:workflowId | JWT + tenant role edit | path param | `{deleted:true}` |
| POST | /api/workflows/:workflowId/execute | JWT + IAM execute | `triggerWorkflowSchema` | `{executionId}` (202) |
| GET | /api/workflows/:workflowId/executions | JWT | pagination query | paginated execution list |
| GET | /api/executions/:executionId | JWT | path param | execution + steps + previews |
| POST | /api/executions/:executionId/stop | JWT + role(admin/editor) | path param | `{executionId,status}` (202) |
| GET | /api/executions/:executionId/step-attempts | JWT | `listExecutionStepAttemptsQuerySchema` | paginated step attempts |
| GET | /api/executions/:executionId/retrieval-events | JWT | `listExecutionRetrievalEventsQuerySchema` | paginated retrieval events |
| GET | /api/executions/:executionId/context-snapshots | JWT | `listExecutionContextSnapshotsQuerySchema` | paginated context snapshots |

## 5. Knowledge
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | /api/knowledge/corpora | JWT + role(admin/editor) | `createKnowledgeCorpusSchema` | `{id}` |
| POST | /api/knowledge/documents/ingest | JWT + role(admin/editor) | `ingestKnowledgeDocumentSchema` | `{documentId,jobId}` (202) |
| GET | /api/knowledge/corpora | JWT | `listKnowledgeCorporaQuerySchema` | paginated corpora |
| GET | /api/knowledge/corpora/:corpusId/documents | JWT | `listKnowledgeDocumentsQuerySchema` | paginated docs |
| GET | /api/knowledge/documents/:documentId/chunks | JWT | `listKnowledgeChunksQuerySchema` | paginated chunks |
| POST | /api/knowledge/query | JWT | `queryKnowledgeSchema` | ranked matches |

## 6. Templates
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | /api/workflow-templates | JWT | none | template list (plan-filtered) |
| GET | /api/workflow-templates/:templateId | JWT | path param | template |
| POST | /api/workflow-templates/:templateId/instantiate | JWT + tenant role edit | `instantiateWorkflowTemplateSchema` | created workflow |
| POST | /api/workflow-templates/:templateId/preview | JWT | `instantiateWorkflowTemplateSchema` | node/edge preview |

## 7. Governance and Compliance
| Method | Path |
|---|---|
| GET | /api/models |
| POST | /api/models |
| GET | /api/domain-configs |
| POST | /api/domain-configs/resolve |
| PUT | /api/domain-configs |
| GET | /api/workspaces |
| POST | /api/workspaces |
| POST | /api/workspaces/:workspaceId/members |
| POST | /api/workspaces/:workspaceId/assign-workflow |
| GET | /api/workflows/:workflowId/permissions |
| PUT | /api/workflows/:workflowId/permissions |
| GET | /api/policies |
| PUT | /api/policies |
| GET | /api/hyperparameters/profiles |
| PUT | /api/hyperparameters/profiles |
| POST | /api/hyperparameters/compare |
| GET | /api/alerts/rules |
| PUT | /api/alerts/rules |
| GET | /api/alerts/events |
| GET | /api/alerts/metrics |
| GET | /api/kpi/summary |
| GET | /api/kpi/timeseries |
| GET | /api/compliance/consents |
| POST | /api/compliance/consents |
| PUT | /api/compliance/retention-policies |
| POST | /api/compliance/retention-sweep |
| GET | /api/compliance/workflows/:workflowId/legal-basis |
| PUT | /api/compliance/workflows/:workflowId/legal-basis |
| POST | /api/compliance/data-subject-requests |
| GET | /api/compliance/data-subject-requests |
| POST | /api/compliance/data-subject-requests/:requestId/respond |
| GET | /api/compliance/report |
| GET | /api/me/export |
| DELETE | /api/me |

All above require JWT; several include explicit admin/editor checks and input schemas in `validation/schemas.ts`.

## 8. Tenant and Plugin
| Method | Path |
|---|---|
| GET | /api/tenant |
| PATCH | /api/tenant |
| GET | /api/tenant/users |
| POST | /api/tenant/users/invite |
| PATCH | /api/tenant/users/:userId |
| DELETE | /api/tenant/users/:userId |
| GET | /api/tenant/plugins |
| PATCH | /api/tenant/plugins/:slug/byok |
| GET | /api/tenant/plugins/:slug/byok/test |
| GET | /api/tenant/plan |
| GET | /api/tenant/usage |
| GET | /api/plugins |
| GET | /api/plugins/:slug |
| GET | /api/plugins/categories |

JWT required. Selected tenant mutations require `tenantRole === org_admin`.

## 9. Admin (Super Admin)
| Method | Path |
|---|---|
| POST | /admin/tenants |
| GET | /admin/tenants |
| GET | /admin/tenants/:id |
| GET | /admin/tenants/:id/users |
| PATCH | /admin/tenants/:id |
| DELETE | /admin/tenants/:id |
| POST | /admin/tenants/:id/users |
| PATCH | /admin/tenants/:id/users/:userId |
| DELETE | /admin/tenants/:id/users/:userId |
| POST | /admin/tenants/:id/plan |
| GET | /admin/tenants/:id/plan |
| POST | /admin/tenants/:id/plugins |
| DELETE | /admin/tenants/:id/plugins/:slug |
| GET | /admin/tenants/:id/metrics |
| POST | /admin/plugins |
| GET | /admin/plugins |
| PATCH | /admin/plugins/:slug |
| DELETE | /admin/plugins/:slug |
| GET | /admin/audit-log |

Requires JWT and `globalRole=super_admin`.

## 10. Publication and REX
| Method | Path |
|---|---|
| POST | /api/publications |
| GET | /api/publications |
| GET | /api/publications/catalog |
| GET | /api/publications/:id |
| PATCH | /api/publications/:id |
| DELETE | /api/publications/:id |
| POST | /api/publications/:id/publish |
| POST | /api/publications/:id/unpublish |
| POST | /api/publications/:id/execute |
| GET | /api/workflows/:workflowId/rex-scores |
| GET | /api/workflows/:workflowId/rex-fixes/preview/:nodeId |
| POST | /api/workflows/:workflowId/rex-fixes/apply |

All require JWT; publication/rex operations include workflow action checks.

## 11. Chat and File Utility
| Method | Path | Auth | Request |
|---|---|---|---|
| POST | /api/chat | JWT | workflow-aware message payload |
| POST | /api/files/parse | JWT | `{fileContent(base64),fileName,fileFormat}` |

`/api/files/parse` supports `csv`, `json`, `txt`, `pdf`.
