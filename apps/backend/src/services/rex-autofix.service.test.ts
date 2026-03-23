import { describe, expect, it } from "vitest";
import { applyRexFixesToGraph } from "./rex-autofix.service.js";

describe("applyRexFixesToGraph", () => {
  it("enables audit and output justification on target node", () => {
    const nodes = [{ id: "n1", type: "llm", config: {} }];
    const edges: Array<{ source: string; target: string }> = [];

    const updated = applyRexFixesToGraph(
      nodes,
      edges,
      "n1",
      ["ENABLE_AUDIT_LOGGING", "ENABLE_OUTPUT_JUSTIFICATION"],
      "user-1"
    );

    const target = updated.nodes.find((node) => node.id === "n1");
    expect(target?.config?.["auditEnabled"]).toBe(true);
    expect(target?.config?.["emitJustification"]).toBe(true);
    expect(updated.applied).toEqual([
      "ENABLE_AUDIT_LOGGING",
      "ENABLE_OUTPUT_JUSTIFICATION",
    ]);
  });

  it("inserts helper nodes and edges for upstream/downstream fixes", () => {
    const nodes = [{ id: "n1", type: "llm", config: {} }];
    const edges: Array<{ source: string; target: string }> = [];

    const updated = applyRexFixesToGraph(
      nodes,
      edges,
      "n1",
      ["INSERT_CONSENT_GATE_UPSTREAM", "INSERT_PII_ANONYMISER_DOWNSTREAM"],
      "user-1"
    );

    expect(updated.nodes.length).toBe(3);
    expect(updated.edges.length).toBe(2);
    const hasUpstream = updated.edges.some((edge) => edge.target === "n1");
    const hasDownstream = updated.edges.some((edge) => edge.source === "n1");
    expect(hasUpstream).toBe(true);
    expect(hasDownstream).toBe(true);
  });
});
