import type {
	UpsertAlertRuleInput,
	UpsertPolicyInput,
	UpsertWorkspaceInput,
} from "./schemas";

export type Workspace = {
	id: string;
	name: string;
	description?: string;
	memberCount: number;
	createdAt: string;
	updatedAt: string;
};

export type Policy = {
	id: string;
	name: string;
	effect: "allow" | "deny";
	definition: Record<string, unknown>;
	updatedAt: string;
};

export type AlertRule = {
	id: string;
	name: string;
	severity: "low" | "medium" | "high";
	enabled: boolean;
	condition: Record<string, unknown>;
};

export type GovernanceKpi = {
	key: string;
	label: string;
	value: number;
	trend: number;
};

export type GovernanceFilters = {
	page?: number;
	limit?: number;
	search?: string;
};

export type { UpsertWorkspaceInput, UpsertPolicyInput, UpsertAlertRuleInput };
