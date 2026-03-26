# Implementation Work Packages Operational Guide

This document implements section 11 of `docs/NEXTJS_COMPONENT_IMPLEMENTATION_PLAN.md` as a production operating model.

## Goals

- Enable parallel delivery across four teams with low merge friction.
- Preserve API contract consistency between frontend and backend.
- Keep quality gates enforceable per work package and at full-system level.

## Team Work Packages

### 1. Platform Team

Scope:
- App shell and navigation (`components/app-shell`, `components/navigation`)
- Shared components and primitives (`components/shared`)
- API/auth/RBAC/query/telemetry foundations (`src/lib/*`)

Primary validation:
- `pnpm verify:platform`

### 2. Core Runtime Team

Scope:
- Workflows and executions feature stacks
- API keys runtime path
- Engine/runtime integration path (`packages/engine`, backend workflow routes)

Primary validation:
- `pnpm verify:core-runtime`

### 3. Knowledge/Template Team

Scope:
- Knowledge, templates, publications, and related tools (`chat`, `file-parse`)

Primary validation:
- `pnpm verify:knowledge-template`

### 4. Governance/Compliance Team

Scope:
- Governance, compliance, tenant, admin domains

Primary validation:
- `pnpm verify:governance-compliance`

## Ownership Enforcement

- File ownership and review boundaries are encoded in `.github/CODEOWNERS`.
- PRs must declare work package in `.github/pull_request_template.md`.
- Work package tasks use `.github/ISSUE_TEMPLATE/work-package-task.yml`.

## Shared Contract Sync Process

Canonical contract docs:
- `docs/API_ENDPOINTS.md`
- `docs/PAYLOAD_REGISTRY.md`
- `docs/FEATURE_LIST.md`

Automation:
- `pnpm contracts:sync:report` generates `artifacts/contract-sync-report.json`.
- `.github/workflows/contract-sync-review.yml` runs weekly and on contract-impacting PRs.

Definition:
- Any frontend or backend endpoint/payload behavior change must update one or more canonical docs above.

## Delivery Pipeline

Per-team verification commands:
- `pnpm verify:platform`
- `pnpm verify:core-runtime`
- `pnpm verify:knowledge-template`
- `pnpm verify:governance-compliance`
- `pnpm verify:work-packages` (runs all team gates)

Full production gate:
- `pnpm verify:e2e`

## Handoff Contract

Before cross-team handoff, source team must provide:
- Scope summary and changed file list.
- API contract delta (or explicit "none").
- Verification command output for its package.
- Rollout notes for downstream teams.

## Weekly Cadence

1. Review `contract-sync-report` artifact.
2. Review cross-package PRs and unresolved API contract deltas.
3. Rebalance package scope if one stream blocks others.
