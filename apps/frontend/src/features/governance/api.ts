import { apiRequest } from "@/lib/api/client";
import type {
  AlertRule,
  GovernanceFilters,
  GovernanceKpi,
  Policy,
  UpsertAlertRuleInput,
  UpsertPolicyInput,
  UpsertWorkspaceInput,
  Workspace,
} from "./types";

function toQuery(filters: GovernanceFilters = {}): string {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const search = filters.search ? `&search=${encodeURIComponent(filters.search)}` : "";
  return `?page=${page}&limit=${limit}${search}`;
}

export async function listWorkspaces(filters?: GovernanceFilters): Promise<Workspace[]> {
  return apiRequest<Workspace[]>(`/api/governance/workspaces${toQuery(filters)}`);
}

export async function createWorkspace(input: UpsertWorkspaceInput): Promise<Workspace> {
  return apiRequest<Workspace>("/api/governance/workspaces", { method: "POST", body: input });
}

export async function updateWorkspace(workspaceId: string, input: Partial<UpsertWorkspaceInput>): Promise<Workspace> {
  return apiRequest<Workspace>(`/api/governance/workspaces/${workspaceId}`, { method: "PATCH", body: input });
}

export async function listPolicies(filters?: GovernanceFilters): Promise<Policy[]> {
  return apiRequest<Policy[]>(`/api/governance/policies${toQuery(filters)}`);
}

export async function createPolicy(input: UpsertPolicyInput): Promise<Policy> {
  return apiRequest<Policy>("/api/governance/policies", { method: "POST", body: input });
}

export async function updatePolicy(policyId: string, input: Partial<UpsertPolicyInput>): Promise<Policy> {
  return apiRequest<Policy>(`/api/governance/policies/${policyId}`, { method: "PATCH", body: input });
}

export async function listAlertRules(filters?: GovernanceFilters): Promise<AlertRule[]> {
  return apiRequest<AlertRule[]>(`/api/governance/alerts/rules${toQuery(filters)}`);
}

export async function createAlertRule(input: UpsertAlertRuleInput): Promise<AlertRule> {
  return apiRequest<AlertRule>("/api/governance/alerts/rules", { method: "POST", body: input });
}

export async function updateAlertRule(alertRuleId: string, input: Partial<UpsertAlertRuleInput>): Promise<AlertRule> {
  return apiRequest<AlertRule>(`/api/governance/alerts/rules/${alertRuleId}`, { method: "PATCH", body: input });
}

export async function listKpis(): Promise<GovernanceKpi[]> {
  return apiRequest<GovernanceKpi[]>("/api/governance/kpi");
}

export const governanceApi = {
  listWorkspaces,
  createWorkspace,
  updateWorkspace,
  listPolicies,
  createPolicy,
  updatePolicy,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  listKpis,
};
