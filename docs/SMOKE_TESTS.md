# Smoke Tests

## 1. Preconditions
- Postgres and Redis are running.
- Migrations applied (`pnpm db:migrate`).
- Backend and worker running.
- Seed user exists or register endpoint available.
- Frontend mode decided before test run:
	- `full-stack`: frontend restored and runnable.
	- `backend-only`: frontend references removed/gated from CI/compose/scripts.

## 1.1 Frontend Reconciliation Smoke
1. Deletion inventory
- Run `git status --short | grep '^ D apps/frontend' | wc -l` and record value.

2. Stale reference scan
- Run `grep -Rno "apps/frontend\|@rex/frontend\|frontend" .github docker-compose.yml package.json turbo.json pnpm-workspace.yaml`.

3. Pass criteria
- `full-stack`: deletion count should be 0.
- `backend-only`: scan output should not contain executable frontend build/test targets.

## 2. Service Health
1. `GET /api/health`
- Expect HTTP 200 and `status=ok`.

2. Queue pipeline readiness
- Trigger a workflow execution and verify `pending -> running -> terminal` transition in `/api/executions/:id`.

## 3. Auth and Access
1. Register/Login
- Register new user.
- Login with same credentials.
- Capture JWT token.

2. Protected route rejects without token
- Call `/api/workflows` without JWT.
- Expect 401 UNAUTHORIZED.

3. Protected route accepts with token
- Call `/api/workflows` with JWT.
- Expect 200.

## 4. Workflow Critical Path
1. Create minimal workflow
- Trigger node + output node.
- Expect 201 and workflow id.

2. Execute workflow
- `POST /api/workflows/:id/execute`.
- Expect 202 + execution id.

3. Read execution detail
- Poll `/api/executions/:executionId` until terminal status.
- Expect steps array populated.

## 5. Knowledge Path
1. Create corpus.
2. Ingest short document.
3. Wait and verify document status changes from `pending/processing` to `ready`.
4. Query knowledge and expect `matches` array.

## 6. Governance Path
1. Upsert a domain config.
2. Resolve config endpoint returns merged config.
3. Create/list workspace.
4. Upsert and list alert rule.
5. Fetch KPI summary.

## 7. Compliance Path
1. Set consent.
2. Upsert retention policy.
3. Create DSAR request.
4. (admin/editor) respond DSAR.
5. Fetch compliance report.

## 8. Publication and REX Path
1. Create publication for a workflow.
2. Publish and list in catalog endpoint.
3. Fetch REX scores and preview fixes.
4. Apply one fix action and verify workflow graph updates.

## 9. Failure-Mode Smokes
- Invalid schema body returns `VALIDATION_ERROR`.
- Unauthorized workflow action returns `FORBIDDEN`.
- Non-existent resources return `NOT_FOUND`.
- Missing model/API keys in chat path returns `MISSING_API_KEY`.

## 10. Suggested Minimal Curl Sequence
1. Register/login.
2. Create workflow.
3. Execute workflow.
4. Get execution details.
5. Create corpus + ingest + query.
6. KPI summary.
7. Compliance report.

## 11. Frontend-Conditional Smokes
1. If `full-stack`
- Run frontend build and e2e checks from CI workflow parity.

2. If `backend-only`
- Assert CI path excludes frontend gates.
- Assert compose can start without `frontend` service context.
