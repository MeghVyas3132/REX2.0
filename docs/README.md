# REX Documentation

REX stands for Responsible, Ethical and Explainable AI.

This documentation set is written for engineering handover, onboarding, and production operations.

## Document Index

- [Product Requirements Document (PRD)](./prd.md)
- [Technical Requirements Document (TRD)](./trd.md)
- [Backend Architecture](./backend.md)
- [Worker Runtime](./worker.md)
- [Execution Engine](./engine.md)
- [DAG Validation and Scheduling](./dag.md)
- [RAG Runtime and Templates](./rag.md)
- [Frontend Architecture](./frontend.md)
- [Database Model](./database.md)
- [Migration History](./migrations.md)
- [API Endpoints](./endpoints.md)

## How to Read This Set

1. Start with `prd.md` for product scope and non-functional requirements.
2. Read `trd.md` for architecture constraints and implementation contracts.
3. Read `engine.md`, `dag.md`, and `worker.md` to understand execution behavior.
4. Read `rag.md` for knowledge ingestion, retrieval orchestration, and template behavior.
5. Read `database.md` and `migrations.md` for persistence and schema evolution.
6. Use `endpoints.md` as the API contract reference.

## Current Platform Scope

- Visual DAG workflow authoring and execution
- BullMQ-based distributed worker runtime
- Execution context snapshots, retrieval event logs, and step attempt tracking
- Knowledge corpus ingestion and scoped retrieval
- RAG workflow templates instantiated into editable DAGs
- Multi-provider LLM abstraction (Gemini, Groq)
