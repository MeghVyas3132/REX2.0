# Migration History

## Sequence

### `0000_melted_swarm`

Initial core schema:

- users
- api_keys
- workflows
- executions
- execution_steps
- execution_context_snapshots

### `0001_tranquil_mantis`

Knowledge storage:

- knowledge_corpora
- knowledge_documents
- knowledge_chunks

### `0002_kind_slayback`

Retrieval telemetry:

- execution_retrieval_events

### `0003_curious_demogoblin`

Step attempts:

- execution_step_attempts

### `0004_tan_titaniumer`

Retrieval orchestration columns:

- strategy
- retriever_key
- branch_index
- selected

### `0005_happy_one_above_all`

Workflow template provenance columns:

- source_template_id
- source_template_version
- source_template_params

### `0006_prop3_foundations`

PROP3 foundations:

- `users.role`
- `users.consent_given_at`
- `model_registry`
- `domain_configs`
- `guardrail_events`

### `0007_prop3_enterprise_upgrade`

PROP3 governance, observability, and compliance expansion:

- pgvector extension and `knowledge_chunks.embedding_vector`
- `knowledge_chunks.page_number`, `knowledge_chunks.section_path`
- workspaces and membership:
  - `workspaces`
  - `workspace_members`
  - `workflows.workspace_id`
- authorization and sharing:
  - `workflow_permissions`
  - `iam_policies`
  - `execution_authorizations`
- optimization:
  - `hyperparameter_profiles`
  - `hyperparameter_experiments`
- alerting:
  - `alert_rules`
  - `alert_events`
- compliance:
  - `user_consents`
  - `data_access_audit_logs`
  - `retention_policies`

## Execution

Run migrations from repository root:

```bash
pnpm db:migrate
```

## Deployment Guidance

- Apply migrations before backend/worker rollout.
- Do not skip `0006` or `0007` if deploying governance-enabled code.
- Validate pgvector extension availability in target environments.
