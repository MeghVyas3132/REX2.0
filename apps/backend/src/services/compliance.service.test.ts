import { describe, expect, it } from "vitest";
import { buildComplianceSummary } from "./compliance.service.js";

describe("buildComplianceSummary", () => {
  it("calculates workflow-level averages and coverage", () => {
    const summary = buildComplianceSummary({
      totalWorkflows: 4,
      publishedWorkflows: 2,
      legalBasisCount: 3,
      openDataSubjectRequests: 1,
      workflowRexScores: [
        { workflowId: "w1", totalScore: 80 },
        { workflowId: "w1", totalScore: 60 },
        { workflowId: "w2", totalScore: 92 },
        { workflowId: "w3", totalScore: 40 },
      ],
    });

    expect(summary.totalWorkflows).toBe(4);
    expect(summary.publishedWorkflows).toBe(2);
    expect(summary.legalBasisCoveragePercent).toBe(75);
    expect(summary.rexEnabledWorkflows).toBe(2);
    expect(summary.averageRexScore).toBe(67);
    expect(summary.openDataSubjectRequests).toBe(1);
  });

  it("handles empty workflows safely", () => {
    const summary = buildComplianceSummary({
      totalWorkflows: 0,
      publishedWorkflows: 0,
      legalBasisCount: 0,
      openDataSubjectRequests: 0,
      workflowRexScores: [],
    });

    expect(summary.legalBasisCoveragePercent).toBe(100);
    expect(summary.averageRexScore).toBe(0);
    expect(summary.rexEnabledWorkflows).toBe(0);
  });
});
