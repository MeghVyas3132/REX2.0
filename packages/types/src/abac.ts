// ──────────────────────────────────────────────
// REX - ABAC (Attribute-Based Access Control) Types
// ──────────────────────────────────────────────

// ─── Policy Effect ────────────────────────────────────────────────────────────

export type PolicyEffect = "allow" | "deny";

// ─── Resource Types ───────────────────────────────────────────────────────────

export type AbacResourceType =
  | "workflow"
  | "execution"
  | "knowledge_corpus"
  | "knowledge_document"
  | "api_key"
  | "tenant_settings"
  | "user_management"
  | "billing"
  | "compliance"
  | "plugin";

// ─── Action Types ─────────────────────────────────────────────────────────────

export type AbacAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "execute"
  | "publish"
  | "share"
  | "manage"
  | "export"
  | "configure";

// ─── ABAC Policy ──────────────────────────────────────────────────────────────

export interface AbacPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  resourceType: AbacResourceType;
  action: AbacAction;
  conditions: AbacConditions;
  effect: PolicyEffect;
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

// ─── ABAC Conditions (JSONLogic-compatible) ───────────────────────────────────

export interface AbacConditions {
  and?: AbacConditions[];
  or?: AbacConditions[];
  not?: AbacConditions;
  "=="?: [AbacAttribute, unknown];
  "!="?: [AbacAttribute, unknown];
  ">"?: [AbacAttribute, number];
  "<"?: [AbacAttribute, number];
  ">="?: [AbacAttribute, number];
  "<="?: [AbacAttribute, number];
  in?: [AbacAttribute, unknown[]];
  contains?: [AbacAttribute, unknown];
  startsWith?: [AbacAttribute, string];
  endsWith?: [AbacAttribute, string];
}

export interface AbacAttribute {
  var: string; // e.g., "user.department", "resource.sensitivity", "environment.time"
}

// ─── ABAC Evaluation Context ──────────────────────────────────────────────────

export interface AbacEvaluationContext {
  user: AbacUserContext;
  resource: AbacResourceContext;
  environment: AbacEnvironmentContext;
  tenant: AbacTenantContext;
}

export interface AbacUserContext {
  id: string;
  email: string;
  tenantRole: string;
  interfaceAccess: string;
  attributes: Record<string, unknown>;
  // Custom attributes from tenant_users.abac_attributes
  department?: string;
  team?: string;
  clearanceLevel?: string;
  region?: string;
}

export interface AbacResourceContext {
  id: string;
  type: AbacResourceType;
  ownerId: string;
  attributes: Record<string, unknown>;
  // Resource-specific attributes
  sensitivityLevel?: string;
  dataCategories?: string[];
  rexEnabled?: boolean;
  published?: boolean;
}

export interface AbacEnvironmentContext {
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  // Time-based attributes
  dayOfWeek?: number;
  hourOfDay?: number;
  isBusinessHours?: boolean;
}

export interface AbacTenantContext {
  id: string;
  planTier: string;
  features: Record<string, boolean>;
  dataResidency?: string;
}

// ─── ABAC Evaluation Result ───────────────────────────────────────────────────

export interface AbacEvaluationResult {
  allowed: boolean;
  effect: PolicyEffect;
  matchedPolicies: string[];
  deniedBy?: string;
  evaluationTimeMs: number;
  context: AbacEvaluationContext;
}

// ─── IAM Policy (Legacy RBAC + ABAC hybrid) ───────────────────────────────────

export interface IamPolicy {
  id: string;
  tenantId: string;
  userId: string | null;
  workflowId: string | null;
  action: AbacAction;
  effect: PolicyEffect;
  conditions: AbacConditions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Workflow Permission ──────────────────────────────────────────────────────

export type WorkflowPermissionRole = "viewer" | "editor";

export interface WorkflowPermission {
  id: string;
  tenantId: string;
  workflowId: string;
  userId: string;
  role: WorkflowPermissionRole;
  attributes: Record<string, unknown>;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Execution Authorization ──────────────────────────────────────────────────

export interface ExecutionAuthorization {
  id: string;
  tenantId: string;
  executionId: string;
  workflowId: string;
  userId: string;
  action: string;
  attributes: Record<string, unknown>;
  expiresAt: Date;
  validatedAt: Date | null;
  revoked: boolean;
  createdAt: Date;
}

// ─── CRUD Input Types ─────────────────────────────────────────────────────────

export interface CreateAbacPolicyInput {
  name: string;
  description?: string;
  resourceType: AbacResourceType;
  action: AbacAction;
  conditions: AbacConditions;
  effect: PolicyEffect;
  priority?: number;
}

export interface UpdateAbacPolicyInput {
  name?: string;
  description?: string;
  conditions?: AbacConditions;
  effect?: PolicyEffect;
  priority?: number;
  isActive?: boolean;
}

export interface GrantWorkflowPermissionInput {
  workflowId: string;
  userId: string;
  role: WorkflowPermissionRole;
  attributes?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface CheckPermissionInput {
  userId: string;
  resourceType: AbacResourceType;
  resourceId: string;
  action: AbacAction;
  environmentContext?: Partial<AbacEnvironmentContext>;
}
