import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { BaseNodeDefinition } from "@rex/types";
import { executeWorkflow, registerNode, clearRegistry } from "./index.js";

test("retries on directive and succeeds within max attempts", async () => {
  clearRegistry();

  const node: BaseNodeDefinition = {
    type: "phase3-retry-directive-success",
    validate: () => ({ valid: true, errors: [] }),
    execute: async (input, context) => {
      void input;
      const current = context.getMemory<number>("test.count") ?? 0;
      const next = current + 1;
      context.setMemory("test.count", next);

      if (next < 2) {
        return {
          data: { ok: false },
          metadata: { retry: { requested: true, reason: "Need one more pass" } },
        };
      }

      return { data: { ok: true } };
    },
  };
  registerNode(node);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: node.type,
        label: "Retry node",
        position: { x: 0, y: 0 },
        config: { retryEnabled: true, retryMaxAttempts: 3 },
      },
    ],
    edges: [],
    triggerPayload: {},
    getApiKey: async () => "unused",
  });

  assert.equal(result.status, "completed");
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0]?.status, "completed");
  assert.equal(result.steps[0]?.output?._attemptCount, 2);
  assert.equal(
    (result.context.memory["retry.outcome.n1"] as { status: string }).status,
    "retry_succeeded_after_n"
  );

  clearRegistry();
});

test("fails when retry attempts are exhausted", async () => {
  clearRegistry();

  const node: BaseNodeDefinition = {
    type: "phase3-retry-exhausted",
    validate: () => ({ valid: true, errors: [] }),
    execute: async () => ({
      data: { ok: false },
      metadata: { retry: { requested: true, reason: "Still not good" } },
    }),
  };
  registerNode(node);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: node.type,
        label: "Retry exhaust",
        position: { x: 0, y: 0 },
        config: { retryEnabled: true, retryMaxAttempts: 2 },
      },
    ],
    edges: [],
    triggerPayload: {},
    getApiKey: async () => "unused",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.steps[0]?.status, "failed");
  assert.equal(
    (result.context.memory["retry.outcome.n1"] as { status: string }).status,
    "retry_exhausted"
  );

  clearRegistry();
});

test("memory writes persist across retry attempts", async () => {
  clearRegistry();

  const node: BaseNodeDefinition = {
    type: "phase3-memory-across-retries",
    validate: () => ({ valid: true, errors: [] }),
    execute: async (input, context) => {
      void input;
      const marker = context.getMemory<string>("phase3.marker");
      if (!marker) {
        context.setMemory("phase3.marker", "kept");
        return {
          data: { firstPass: true },
          metadata: { retry: { requested: true, reason: "Re-check with memory" } },
        };
      }

      return {
        data: { marker },
      };
    },
  };
  registerNode(node);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: node.type,
        label: "Memory retry",
        position: { x: 0, y: 0 },
        config: { retryEnabled: true, retryMaxAttempts: 2 },
      },
    ],
    edges: [],
    triggerPayload: {},
    getApiKey: async () => "unused",
  });

  assert.equal(result.status, "completed");
  assert.equal(result.steps[0]?.output?.marker, "kept");
  assert.equal(result.steps[0]?.output?._attemptCount, 2);

  clearRegistry();
});

test("terminate control state skips downstream nodes and marks outcome", async () => {
  clearRegistry();

  const terminator: BaseNodeDefinition = {
    type: "phase3-terminator",
    validate: () => ({ valid: true, errors: [] }),
    execute: async (input, context) => {
      void input;
      context.setMemory("control.terminateReason", "Evaluation requested stop");
      context.updateExecutionContext({ control: { terminate: true } });
      return { data: { stopped: true } };
    },
  };

  const downstream: BaseNodeDefinition = {
    type: "phase3-downstream",
    validate: () => ({ valid: true, errors: [] }),
    execute: async () => ({ data: { executed: true } }),
  };

  registerNode(terminator);
  registerNode(downstream);

  const result = await executeWorkflow({
    executionId: randomUUID(),
    workflowId: randomUUID(),
    userId: randomUUID(),
    nodes: [
      {
        id: "n1",
        type: terminator.type,
        label: "Terminator",
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: "n2",
        type: downstream.type,
        label: "Downstream",
        position: { x: 200, y: 0 },
        config: {},
      },
    ],
    edges: [
      {
        id: "e1",
        source: "n1",
        target: "n2",
      },
    ],
    triggerPayload: {},
    getApiKey: async () => "unused",
  });

  assert.equal(result.status, "completed");
  assert.equal(result.steps.length, 2);
  assert.equal(result.steps[0]?.status, "completed");
  assert.equal(result.steps[1]?.status, "skipped");
  assert.equal(
    (result.context.memory["execution.outcome"] as { status: string }).status,
    "terminated_by_control"
  );

  clearRegistry();
});
