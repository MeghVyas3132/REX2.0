# RAG Runtime and Templates

## Scope

REX supports RAG execution through explicit DAG nodes, runtime retrieval orchestration, persisted corpora, and template-generated workflows.

## RAG Building Blocks

### Knowledge Ingestion

- Corpus entity defines scope and ownership.
- Document ingestion creates queued processing job or runtime ingestion flow.
- Worker chunks content and stores deterministic embeddings per chunk.

### Knowledge Retrieval

- Retrieval queries can target:
  - explicit corpus ID
  - user-scoped corpora
  - workflow-scoped corpora
  - execution-scoped corpora
- Retrieval returns ranked chunk matches with metadata.

### Runtime Memory

- Memory read/write nodes provide intra-execution working memory.
- Retrieval decisions can consume memory keys (adaptive strategies).

### Evaluation and Control

- Evaluation nodes can request retries.
- Conditional edges route pass/fail paths.
- Execution control tracks limits and can terminate run paths.

## Core RAG Node Types

- `knowledge-ingest`
  - Ingests runtime content/documents into scoped corpus.
  - Can set active corpus ID into execution memory.
- `knowledge-retrieve`
  - Retrieves context using strategy and branch configuration.
  - Emits retrieval payload for downstream reasoning nodes.

## Retrieval Strategies

- `single`: one retriever plan
- `first-non-empty`: first branch with matches wins
- `merge`: merge branch results
- `best-score`: select branch with strongest score profile
- `adaptive`: prefer retriever based on memory key, fallback when needed

## Template Catalog

Current RAG template IDs:

- simple-rag
- memory-augmented-rag
- agentic-rag
- graph-rag
- branched-rag
- self-rag
- adaptive-rag
- speculative-rag
- corrective-rag
- modular-rag
- multimodal-rag
- hyde-retrieval

## Template Instantiation Model

- Templates compile to normal workflow nodes and edges.
- Instantiated workflows remain editable in the same editor/runtime.
- Workflow record stores source template metadata for provenance.

## Dual-Flow Baseline

`simple-rag` is implemented as explicit dual flow:

- Flow A: trigger -> knowledge ingest
- Flow B: retrieval -> reasoner -> output

This pattern is used as the base abstraction for remaining RAG templates.

## Current Limitations

- Embeddings are deterministic hash-based vectors, not model embeddings.
- No external vector database integration in current runtime.
- Retrieval ranking quality is bounded by deterministic embedding approximation.
