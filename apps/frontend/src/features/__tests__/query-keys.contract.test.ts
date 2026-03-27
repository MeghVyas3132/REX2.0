import { describe, expect, it } from "vitest";

import { adminQueryKeys } from "../admin/queries";
import { authQueryKeys } from "../auth/queries";
import { complianceQueryKeys } from "../compliance/queries";
import { executionQueryKeys } from "../executions/queries";
import { governanceQueryKeys } from "../governance/queries";
import { knowledgeQueryKeys } from "../knowledge/queries";
import { publicationQueryKeys } from "../publications/queries";
import { templateQueryKeys } from "../templates/queries";
import { tenantQueryKeys } from "../tenant/queries";
import { toolsQueryKeys } from "../tools/queries";
import { workflowQueryKeys } from "../workflows/queries";

describe("feature query key contracts", () => {
  it("uses all/list/detail style for workflows", () => {
    expect(workflowQueryKeys.all).toEqual(["workflows"]);
    expect(workflowQueryKeys.list(2, 10)).toEqual(["workflows", "list", { page: 2, limit: 10 }]);
    expect(workflowQueryKeys.detail("wf_1")).toEqual(["workflows", "detail", "wf_1"]);
  });

  it("uses all/list/detail style for executions", () => {
    expect(executionQueryKeys.all).toEqual(["executions"]);
    expect(executionQueryKeys.list(1, 25)).toEqual(["executions", "list", { page: 1, limit: 25 }]);
    expect(executionQueryKeys.detail("ex_1")).toEqual(["executions", "detail", "ex_1"]);
  });

  it("uses all/list/detail style for templates", () => {
    expect(templateQueryKeys.all).toEqual(["templates"]);
    expect(templateQueryKeys.list(1, 20)).toEqual(["templates", "list", { page: 1, limit: 20 }]);
    expect(templateQueryKeys.detail("tpl_1")).toEqual(["templates", "detail", "tpl_1"]);
  });

  it("uses all/list/detail style for publications", () => {
    expect(publicationQueryKeys.all).toEqual(["publications"]);
    expect(publicationQueryKeys.list(1, 20)).toEqual(["publications", "list", { page: 1, limit: 20 }]);
    expect(publicationQueryKeys.detail("pub_1")).toEqual(["publications", "detail", "pub_1"]);
  });

  it("uses namespaced list/detail keys for knowledge corpora", () => {
    expect(knowledgeQueryKeys.all).toEqual(["knowledge", "corpora"]);
    expect(knowledgeQueryKeys.list(1, 20)).toEqual(["knowledge", "corpora", "list", { page: 1, limit: 20 }]);
    expect(knowledgeQueryKeys.detail("corpus_1")).toEqual(["knowledge", "corpora", "detail", "corpus_1"]);
  });

  it("uses namespaced list/detail keys for compliance", () => {
    expect(complianceQueryKeys.all).toEqual(["compliance"]);
    expect(complianceQueryKeys.list("consent", 1, 20)).toEqual(["compliance", "list", "consent", { page: 1, limit: 20 }]);
    expect(complianceQueryKeys.detail("rec_1")).toEqual(["compliance", "detail", "rec_1"]);
  });

  it("uses normalized admin list keys", () => {
    expect(adminQueryKeys.all).toEqual(["admin"]);
    expect(adminQueryKeys.tenants(1, 20)).toEqual(["admin", "tenants", "list", { page: 1, limit: 20 }]);
    expect(adminQueryKeys.plugins(1, 20)).toEqual(["admin", "plugins", "list", { page: 1, limit: 20 }]);
    expect(adminQueryKeys.auditLog(1, 20)).toEqual(["admin", "audit-log", "list", { page: 1, limit: 20 }]);
  });

  it("uses normalized governance list keys", () => {
    expect(governanceQueryKeys.all).toEqual(["governance"]);
    expect(governanceQueryKeys.workspaces({ page: 1 })).toEqual(["governance", "workspaces", "list", { page: 1 }]);
    expect(governanceQueryKeys.policies({ search: "abac" })).toEqual(["governance", "policies", "list", { search: "abac" }]);
    expect(governanceQueryKeys.alertRules()).toEqual(["governance", "alertRules", "list", {}]);
    expect(governanceQueryKeys.kpis()).toEqual(["governance", "kpis"]);
  });

  it("uses normalized tenant and tools keys", () => {
    expect(tenantQueryKeys.all).toEqual(["tenant"]);
    expect(tenantQueryKeys.settings()).toEqual(["tenant", "settings"]);
    expect(tenantQueryKeys.users(1, 20)).toEqual(["tenant", "users", "list", { page: 1, limit: 20 }]);

    expect(toolsQueryKeys.all).toEqual(["tools"]);
    expect(toolsQueryKeys.apiKeys()).toEqual(["tools", "api-keys"]);
  });

  it("uses stable auth namespace keys", () => {
    expect(authQueryKeys.all).toEqual(["auth"]);
    expect(authQueryKeys.session()).toEqual(["auth", "session"]);
  });
});
