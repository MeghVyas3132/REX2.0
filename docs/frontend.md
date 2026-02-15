# Frontend Architecture

## Application Role

The frontend provides authenticated workflow authoring, template instantiation, settings/key management, and execution visualization.

## Runtime Stack

- Framework: Next.js App Router
- UI: React client components
- API client: typed fetch wrapper in `src/lib/api.ts`
- Auth state: client-side auth context

## Primary Areas

- Dashboard
  - Workflow list and lifecycle entry points.
- Workflow Editor
  - Create and edit workflows in DAG canvas form.
  - Node palette, node config panel, edge linking, execution polling.
- Templates
  - Browse template catalog.
  - Configure runtime params.
  - Preview generated graph.
  - Instantiate into editable workflow.
- Settings
  - API key management.
- Execution Detail
  - Step-by-step runtime outputs and errors.

## Workflow Editor Boundaries

- The editor controls graph construction and node configuration only.
- Validation and execution guarantees are enforced server-side and engine-side.
- Execution polling surfaces run status, step states, and errors.

## Node Palette Coverage

Editor node definitions are aligned with runtime node registry, including:

- core trigger/action/logic/output nodes
- memory/evaluation/control nodes
- knowledge ingestion and retrieval nodes

## API Integration Pattern

- Frontend sends JWT bearer token on protected API calls.
- API client throws on non-2xx responses using backend error envelope.
- Pages handle authorization redirects and request-level errors.

## Navigation Model

- Sidebar includes:
  - Workflows
  - Templates
  - Settings

## Operational Notes

- `NEXT_PUBLIC_API_URL` controls backend target.
- Static build output includes dashboard, template, and execution routes.
