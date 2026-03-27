import { describe, expect, it } from "vitest";

import { governanceApi } from "../governance/api";
import { workflowsApi } from "../workflows/api";

describe("feature API contracts", () => {
  it("exposes complete workflows API surface", () => {
    expect(Object.keys(workflowsApi).sort()).toEqual(
      [
        "applyRexFixes",
        "create",
        "execute",
        "get",
        "getRexScores",
        "list",
        "listActive",
        "listExecutions",
        "previewRexFixes",
        "remove",
        "update",
      ].sort(),
    );
  });

  it("exposes complete governance API surface", () => {
    expect(Object.keys(governanceApi).sort()).toEqual(
      [
        "createAlertRule",
        "createPolicy",
        "createWorkspace",
        "listAlertRules",
        "listKpis",
        "listPolicies",
        "listWorkspaces",
        "updateAlertRule",
        "updatePolicy",
        "updateWorkspace",
      ].sort(),
    );
  });
});
