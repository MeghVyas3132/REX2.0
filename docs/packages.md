# Packages and Node Inventory

## Purpose

This document provides a technical map of the monorepo packages and runtime node inventory.

## Monorepo Packages

### apps/backend

Control plane service built with Fastify.

Responsibilities:
- Authentication and tenant access control
- Workflow, execution, knowledge, governance, and compliance APIs
- Queue job creation for worker execution and ingestion

### apps/worker

Asynchronous execution plane built on BullMQ.

Responsibilities:
- Execute workflow jobs
- Execute knowledge ingestion jobs
- Persist execution and ingestion telemetry

### packages/database

Persistence layer using Drizzle ORM.

Responsibilities:
- Schema definitions
- SQL migration files
- DB connection and migration runner
- Plugin and tenant helpers

### packages/engine

Workflow runtime and DAG orchestration package.

Responsibilities:
- DAG validation and topological execution
- Node registry and node execution lifecycle
- Retry and control-flow handling
- REX scoring support

### packages/llm

Provider abstraction layer for LLM and retrieval-related services.

Responsibilities:
- Provider factory
- Gemini provider implementation
- Groq provider implementation
- Embedding and reranker provider abstractions

### packages/types

Shared TypeScript domain contracts.

Responsibilities:
- Auth, tenant, workflow, execution, compliance, publication, and node type contracts
- API payload and response shape contracts

### packages/utils

Shared runtime utilities.

Responsibilities:
- Environment configuration
- Encryption and security helpers
- Logging, data cleaning, and common helpers
- Knowledge and chunking helpers

## Runtime Node Inventory

Current core node families in `packages/engine/src/nodes`:

- Trigger nodes: webhook, manual, schedule
- Processing nodes: transformer, condition, code, evaluation, execution-control
- Integration nodes: llm, http-request, file-upload, storage
- Output and observability nodes: output, log
- Memory and knowledge nodes: memory-read, memory-write, knowledge-ingest, knowledge-retrieve
- Guardrail nodes: input-guard, output-guard, json-simplify

## Recommended Reading

- High-level architecture: `docs/HLD.md`
- Low-level implementation: `docs/LLD.md`
- Engine runtime behavior: `docs/engine.md`
- Backend services and APIs: `docs/backend.md`
- Database model and migrations: `docs/database.md`, `docs/migrations.md`
