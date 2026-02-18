import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { BaseNodeDefinition, RuntimeKnowledgeQuery, RuntimeKnowledgeRetrievalEvent } from "@rex/types";
import { executeWorkflow, registerNode, clearRegistry } from "./index.js";

const echoNode: BaseNodeDefinition = {
  type: "phase4-echo",
  validate: () => ({ valid: true, errors: [] }),
  execute: async (input) => ({ data: { ...input.data } }),
};

test("first-non-empty strategy selects downstream retriever branch", async () => {
  clearRegistry();
  registerNode(echoNode);

  const retrievalEvents: RuntimeKnowledgeRetrievalEvent[] = [];
  const retrievalQueries: RuntimeKnowledgeQuery[] = [];

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: echoNode.type,
        label: "Phase4 First Non Empty",
        position: { x: 0, y: 0 },
        config: {
          retrieval: {
            strategy: "first-non-empty",
            retrievers: [
              { key: "lexical", query: "q-empty" },
              { key: "semantic", query: "q-hit" },
            ],
          },
        },
      },
    ],
    edges: [],
    triggerPayload: {},
    getApiKey: async () => "unused",
    retrieveKnowledge: async (query) => {
      retrievalQueries.push(query);
      if (query.query === "q-hit") {
        return {
          query: query.query,
          topK: query.topK,
          matches: [
            {
              corpusId: randomUUID(),
              documentId: randomUUID(),
              chunkId: "c-1",
              chunkIndex: 0,
              score: 0.88,
              content: "useful chunk",
              title: "doc",
              sourceType: "upload",
              metadata: {},
            },
          ],
        };
      }
      return { query: query.query, topK: query.topK, matches: [] };
    },
    onRetrievalEvent: async (event) => {
      retrievalEvents.push(event);
    },
  });

  assert.equal(result.status, "completed");
  const payload = result.steps[0]?.output?._knowledge as
    | { orchestration?: { selectedRetrieverKey?: string; strategy?: string } }
    | undefined;
  assert.equal(payload?.orchestration?.strategy, "first-non-empty");
  assert.equal(payload?.orchestration?.selectedRetrieverKey, "semantic");

  assert.equal(retrievalQueries[0]?.retrieverKey, "lexical");
  assert.equal(retrievalQueries[1]?.retrieverKey, "semantic");
  assert.ok(retrievalEvents.some((event) => event.retrieverKey === "semantic" && event.status === "success"));

  clearRegistry();
});

test("merge strategy combines retriever branches with dedupe", async () => {
  clearRegistry();
  registerNode(echoNode);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: echoNode.type,
        label: "Phase4 Merge",
        position: { x: 0, y: 0 },
        config: {
          retrieval: {
            strategy: "merge",
            speculative: true,
            topK: 3,
            retrievers: [
              { key: "a", query: "qa" },
              { key: "b", query: "qb" },
            ],
          },
        },
      },
    ],
    edges: [],
    triggerPayload: {},
    getApiKey: async () => "unused",
    retrieveKnowledge: async (query) => {
      if (query.query === "qa") {
        return {
          query: query.query,
          topK: query.topK,
          matches: [
            {
              corpusId: randomUUID(),
              documentId: randomUUID(),
              chunkId: "c-shared",
              chunkIndex: 0,
              score: 0.6,
              content: "shared-low",
              title: "doc-a",
              sourceType: "upload",
              metadata: {},
            },
            {
              corpusId: randomUUID(),
              documentId: randomUUID(),
              chunkId: "c-a-only",
              chunkIndex: 1,
              score: 0.55,
              content: "a-only",
              title: "doc-a",
              sourceType: "upload",
              metadata: {},
            },
          ],
        };
      }

      return {
        query: query.query,
        topK: query.topK,
        matches: [
          {
            corpusId: randomUUID(),
            documentId: randomUUID(),
            chunkId: "c-shared",
            chunkIndex: 9,
            score: 0.91,
            content: "shared-high",
            title: "doc-b",
            sourceType: "upload",
            metadata: {},
          },
          {
            corpusId: randomUUID(),
            documentId: randomUUID(),
            chunkId: "c-b-only",
            chunkIndex: 2,
            score: 0.8,
            content: "b-only",
            title: "doc-b",
            sourceType: "upload",
            metadata: {},
          },
        ],
      };
    },
  });

  assert.equal(result.status, "completed");
  const knowledge = result.steps[0]?.output?._knowledge as
    | {
        matches?: Array<{ chunkId: string; score: number }>;
        orchestration?: { strategy?: string; branchCount?: number };
      }
    | undefined;

  assert.equal(knowledge?.orchestration?.strategy, "merge");
  assert.equal(knowledge?.orchestration?.branchCount, 2);
  assert.equal(knowledge?.matches?.length, 3);
  assert.equal(knowledge?.matches?.[0]?.chunkId, "c-shared");
  assert.equal(knowledge?.matches?.[0]?.score, 0.91);

  clearRegistry();
});

test("adaptive strategy prefers retriever from execution memory", async () => {
  clearRegistry();
  registerNode(echoNode);

  const observedOrder: string[] = [];

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: echoNode.type,
        label: "Phase4 Adaptive",
        position: { x: 0, y: 0 },
        config: {
          retrieval: {
            strategy: "adaptive",
            preferredRetrieverMemoryKey: "routing.preferredRetriever",
            retrievers: [
              { key: "lexical", query: "q-lex" },
              { key: "dense", query: "q-dense" },
            ],
          },
        },
      },
    ],
    edges: [],
    triggerPayload: {},
    getApiKey: async () => "unused",
    initialContext: {
      memory: {
        "routing.preferredRetriever": "dense",
      },
    },
    retrieveKnowledge: async (query) => {
      if (typeof query.retrieverKey === "string") {
        observedOrder.push(query.retrieverKey);
      }
      if (query.retrieverKey === "dense") {
        return {
          query: query.query,
          topK: query.topK,
          matches: [
            {
              corpusId: randomUUID(),
              documentId: randomUUID(),
              chunkId: "c-dense",
              chunkIndex: 0,
              score: 0.93,
              content: "dense hit",
              title: "doc-d",
              sourceType: "upload",
              metadata: {},
            },
          ],
        };
      }
      return { query: query.query, topK: query.topK, matches: [] };
    },
  });

  assert.equal(result.status, "completed");
  assert.equal(observedOrder[0], "dense");

  const knowledge = result.steps[0]?.output?._knowledge as
    | { orchestration?: { selectedRetrieverKey?: string; strategy?: string } }
    | undefined;
  assert.equal(knowledge?.orchestration?.strategy, "adaptive");
  assert.equal(knowledge?.orchestration?.selectedRetrieverKey, "dense");

  clearRegistry();
});

test("edge conditions route branches and skip unmatched nodes", async () => {
  clearRegistry();

  const conditionNode: BaseNodeDefinition = {
    type: "phase4-branch-condition",
    validate: () => ({ valid: true, errors: [] }),
    execute: async () => ({
      data: {
        _condition: {
          result: true,
        },
      },
    }),
  };

  const truePath: BaseNodeDefinition = {
    type: "phase4-true-path",
    validate: () => ({ valid: true, errors: [] }),
    execute: async () => ({ data: { branch: "true-path" } }),
  };

  const falsePath: BaseNodeDefinition = {
    type: "phase4-false-path",
    validate: () => ({ valid: true, errors: [] }),
    execute: async () => ({ data: { branch: "false-path" } }),
  };

  registerNode(conditionNode);
  registerNode(truePath);
  registerNode(falsePath);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: conditionNode.type,
        label: "Decision Gate",
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: "n2",
        type: truePath.type,
        label: "True Path",
        position: { x: 150, y: -40 },
        config: {},
      },
      {
        id: "n3",
        type: falsePath.type,
        label: "False Path",
        position: { x: 150, y: 40 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", condition: "true" },
      { id: "e2", source: "n1", target: "n3", condition: "false" },
    ],
    triggerPayload: {},
    getApiKey: async () => "unused",
  });

  assert.equal(result.status, "completed");
  const trueStep = result.steps.find((step) => step.nodeId === "n2");
  const falseStep = result.steps.find((step) => step.nodeId === "n3");
  assert.equal(trueStep?.status, "completed");
  assert.equal(falseStep?.status, "skipped");

  clearRegistry();
});

test("scheduler captures execution wave plan in context knowledge", async () => {
  clearRegistry();

  const source: BaseNodeDefinition = {
    type: "phase4-wave-source",
    validate: () => ({ valid: true, errors: [] }),
    execute: async () => ({ data: { seed: 1 } }),
  };
  const branchA: BaseNodeDefinition = {
    type: "phase4-wave-a",
    validate: () => ({ valid: true, errors: [] }),
    execute: async (input) => ({ data: { a: input.data.seed } }),
  };
  const branchB: BaseNodeDefinition = {
    type: "phase4-wave-b",
    validate: () => ({ valid: true, errors: [] }),
    execute: async (input) => ({ data: { b: input.data.seed } }),
  };

  registerNode(source);
  registerNode(branchA);
  registerNode(branchB);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      { id: "n1", type: source.type, label: "Source", position: { x: 0, y: 0 }, config: {} },
      { id: "n2", type: branchA.type, label: "A", position: { x: 100, y: -30 }, config: {} },
      { id: "n3", type: branchB.type, label: "B", position: { x: 100, y: 30 }, config: {} },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n1", target: "n3" },
    ],
    triggerPayload: {},
    getApiKey: async () => "unused",
  });

  assert.equal(result.status, "completed");
  const waves = result.context.knowledge["scheduler.waves"] as
    | Array<{ index: number; nodes: string[]; parallelCandidate: boolean }>
    | undefined;
  assert.ok(Array.isArray(waves));
  assert.equal(waves?.length, 2);
  assert.equal(waves?.[1]?.parallelCandidate, true);
  assert.deepEqual(waves?.[1]?.nodes, ["n2", "n3"]);

  clearRegistry();
});
