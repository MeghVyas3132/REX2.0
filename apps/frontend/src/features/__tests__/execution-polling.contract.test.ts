import { describe, expect, it } from "vitest";

import { getExecutionRefetchInterval, shouldPollExecution } from "@/features/executions/queries";

describe("execution polling behavior", () => {
  it("polls while execution is pending or running", () => {
    expect(shouldPollExecution("pending")).toBe(true);
    expect(shouldPollExecution("running")).toBe(true);
    expect(getExecutionRefetchInterval("pending")).toBe(5000);
    expect(getExecutionRefetchInterval("running")).toBe(5000);
  });

  it("stops polling after execution reaches terminal state", () => {
    expect(shouldPollExecution("completed")).toBe(false);
    expect(shouldPollExecution("failed")).toBe(false);
    expect(shouldPollExecution("stopped")).toBe(false);
    expect(getExecutionRefetchInterval("completed")).toBe(false);
    expect(getExecutionRefetchInterval("failed")).toBe(false);
    expect(getExecutionRefetchInterval("stopped")).toBe(false);
  });

  it("does not poll when status is unknown", () => {
    expect(shouldPollExecution(undefined)).toBe(false);
    expect(getExecutionRefetchInterval(undefined)).toBe(false);
  });
});
