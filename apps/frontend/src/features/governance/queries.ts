"use client";

import { useQuery } from "@tanstack/react-query";
import {
	listAlertRules,
	listKpis,
	listPolicies,
	listWorkspaces,
} from "./api";
import type { GovernanceFilters } from "./types";

export const governanceQueryKeys = {
	all: ["governance"] as const,
	workspaces: (filters?: GovernanceFilters) => ["governance", "workspaces", "list", filters ?? {}] as const,
	policies: (filters?: GovernanceFilters) => ["governance", "policies", "list", filters ?? {}] as const,
	alertRules: (filters?: GovernanceFilters) => ["governance", "alertRules", "list", filters ?? {}] as const,
	kpis: () => ["governance", "kpis"] as const,
};

export function useGovernanceWorkspacesQuery(filters?: GovernanceFilters) {
	return useQuery({
		queryKey: governanceQueryKeys.workspaces(filters),
		queryFn: () => listWorkspaces(filters),
	});
}

export function useGovernancePoliciesQuery(filters?: GovernanceFilters) {
	return useQuery({
		queryKey: governanceQueryKeys.policies(filters),
		queryFn: () => listPolicies(filters),
	});
}

export function useGovernanceAlertRulesQuery(filters?: GovernanceFilters) {
	return useQuery({
		queryKey: governanceQueryKeys.alertRules(filters),
		queryFn: () => listAlertRules(filters),
	});
}

export function useGovernanceKpisQuery() {
	return useQuery({
		queryKey: governanceQueryKeys.kpis(),
		queryFn: listKpis,
	});
}
