# Database Model

## Overview

REX uses PostgreSQL with Drizzle ORM. The schema now includes PROP3 governance, observability, and compliance capabilities in addition to core workflow execution and knowledge retrieval.

## Core Domains

### Identity and Access

- `users`
- `api_keys`
- `workspaces`
- `workspace_members`
- `workflow_permissions`
- `iam_policies`
- `execution_authorizations`

### Workflow and Execution

- `workflows`
- `executions`
- `execution_steps`
- `execution_step_attempts`
- `execution_context_snapshots`
- `execution_retrieval_events`

### Knowledge and Retrieval

- `knowledge_corpora`
- `knowledge_documents`
- `knowledge_chunks`

`knowledge_chunks` includes:

- `embedding` (JSON)
- `embedding_vector` (pgvector)
- `page_number`
- `section_path`

### Runtime Safety and Observability

- `guardrail_events`
- `alert_rules`
- `alert_events`

### Configuration and Optimization

- `domain_configs`
- `model_registry`
- `hyperparameter_profiles`
- `hyperparameter_experiments`

### Compliance

- `user_consents`
- `data_access_audit_logs`
- `retention_policies`

## Key Relationships

- A user owns workflows and API keys.
- Workflows may belong to a workspace.
- Workspace membership controls team access.
- Workflow-specific sharing is managed via `workflow_permissions`.
- Executions belong to workflows and are authorized by `execution_authorizations`.
- Execution telemetry tables reference execution IDs.
- Knowledge chunks reference both document and corpus IDs.

## Indexing Highlights

- Ownership and status indexes for workflow/execution lookups
- Telemetry indexes for execution detail pages and KPI aggregations
- Scope indexes for domain config resolution
- Alert indexes for recent event/rule queries
- pgvector HNSW index for `knowledge_chunks.embedding_vector`

## Notes

- JSON and vector embeddings are both stored to support compatibility and migration.
- Governance and compliance tables are required for full PROP3 behavior.
