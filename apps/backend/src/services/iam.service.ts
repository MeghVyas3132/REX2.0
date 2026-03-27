// ──────────────────────────────────────────────
// REX - IAM Service (RBAC + ABAC + Sharing)
// ──────────────────────────────────────────────

import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { Database } from "@rex/database";
import {
  iamPolicies,
  users,
  workflowPermissions,
  workflows,
  workspaceMembers,
  tenantUsers,
} from "@rex/database";
import type { UserRole, GlobalRole, TenantRole } from "@rex/types";

export type WorkflowAction = "view" | "edit" | "delete" | "execute" | "manage";

export interface UserRoles {
  legacyRole: UserRole;
  globalRole: GlobalRole;
  tenantRole: TenantRole;
  tenantId: string;
}

export interface IAMService {
  getUserRoles(userId: string): Promise<UserRoles>;
  getUserRole(userId: string): Promise<UserRole>; // Legacy compat
  assertRole(userId: string, allowedRoles: UserRole[]): Promise<UserRole>;
  canWorkflowAction(
    userId: string,
    workflowId: string,
    action: WorkflowAction,
    contextAttributes?: Record<string, unknown>
  ): Promise<boolean>;
  assertWorkflowAction(
    userId: string,
    workflowId: string,
    action: WorkflowAction,
    contextAttributes?: Record<string, unknown>
  ): Promise<void>;
}

export function createIAMService(db: Database): IAMService {
  return {
    async getUserRoles(userId) {
      const [user] = await db
        .select({ 
          role: users.role,
          globalRole: users.globalRole,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new IAMError("User not found", "NOT_FOUND", 404);
      }

      // Get tenant role from tenant_users (primary source)
      const [membership] = await db
        .select({
          tenantRole: tenantUsers.tenantRole,
          tenantId: tenantUsers.tenantId,
        })
        .from(tenantUsers)
        .where(and(eq(tenantUsers.userId, userId), eq(tenantUsers.isActive, true)))
        .limit(1);

      return {
        legacyRole: normalizeRole(user.role),
        globalRole: user.globalRole as GlobalRole,
        tenantRole: (membership?.tenantRole as TenantRole) || "org_viewer",
        tenantId: membership?.tenantId || "00000000-0000-0000-0000-000000000001",
      };
    },

    async getUserRole(userId) {
      // Legacy method - returns effective role
      const roles = await this.getUserRoles(userId);
      
      // Priority: globalRole > tenantRole > legacyRole
      if (roles.globalRole === "super_admin") return "admin";
      if (roles.tenantRole === "org_admin") return "admin";
      if (roles.tenantRole === "org_editor") return "editor";
      if (roles.tenantRole === "org_viewer") return "viewer";
      
      return roles.legacyRole;
    },

    async assertRole(userId, allowedRoles) {
      const role = await this.getUserRole(userId);
      if (!allowedRoles.includes(role)) {
        throw new IAMError(
          `Role "${role}" is not permitted for this action`,
          "FORBIDDEN",
          403
        );
      }
      return role;
    },

    async canWorkflowAction(userId, workflowId, action, contextAttributes) {
      const roles = await this.getUserRoles(userId);
      
      // Super admin has full access
      if (roles.globalRole === "super_admin") return true;
      
      // Org admin has full access within tenant
      if (roles.tenantRole === "org_admin") return true;

      const [workflow] = await db
        .select({
          id: workflows.id,
          userId: workflows.userId,
          status: workflows.status,
          workspaceId: workflows.workspaceId,
          tenantId: workflows.tenantId,
          isAssigned: workflows.isAssigned,
        })
        .from(workflows)
        .where(eq(workflows.id, workflowId))
        .limit(1);

      if (!workflow) {
        return false;
      }

      const attributeContext: Record<string, unknown> = {
        action,
        nowIso: new Date().toISOString(),
        workflow: {
          id: workflow.id,
          ownerUserId: workflow.userId,
          status: workflow.status,
          workspaceId: workflow.workspaceId,
          tenantId: workflow.tenantId,
          isAssigned: workflow.isAssigned,
        },
        requester: {
          userId,
          globalRole: roles.globalRole,
          tenantRole: roles.tenantRole,
          legacyRole: roles.legacyRole,
        },
        ...(contextAttributes ?? {}),
      };

      // Check tenant membership
      if (workflow.tenantId && workflow.tenantId !== roles.tenantId) {
        return false; // Cross-tenant access denied
      }

      // Owner logic - user created this workflow
      const isOwner = workflow.userId === userId;
      if (isOwner && !workflow.isAssigned) {
        // User owns this workflow (created it themselves)
        if (roles.tenantRole === "org_editor") return true;
        if (action === "view" || action === "execute") return true;
      }

      // Assigned workflow logic - admin assigned this to user
      if (workflow.isAssigned) {
        // Assigned workflows are read-only for non-admins
        if (action === "view" || action === "execute") {
          // Check if user has permission to view assigned workflow
          return isOwner; // Only assigned user can view/execute
        }
        return false; // Can't edit/delete assigned workflows
      }

      // Org editor can edit workflows in their tenant
      if (roles.tenantRole === "org_editor" && (action === "view" || action === "execute" || action === "edit")) {
        return isOwner; // Only their own workflows
      }

      // Org viewer can only view and execute
      if (roles.tenantRole === "org_viewer" && (action === "view" || action === "execute")) {
        return isOwner;
      }

      // Workspace membership logic (legacy)
      if (workflow.workspaceId) {
        const [member] = await db
          .select({ role: workspaceMembers.role })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, workflow.workspaceId),
              eq(workspaceMembers.userId, userId)
            )
          )
          .limit(1);
        if (member) {
          const memberRole = normalizeRole(member.role);
          if (isRoleAllowed(memberRole, action)) {
            return evaluatePolicies(db, userId, workflowId, action, attributeContext, true);
          }
        }
      }

      // Explicit share permissions (legacy)
      const [permission] = await db
        .select({
          role: workflowPermissions.role,
          attributes: workflowPermissions.attributes,
        })
        .from(workflowPermissions)
        .where(
          and(
            eq(workflowPermissions.workflowId, workflowId),
            eq(workflowPermissions.userId, userId),
            or(
              isNull(workflowPermissions.expiresAt),
              gt(workflowPermissions.expiresAt, new Date())
            )
          )
        )
        .limit(1);

      if (permission) {
        const permRole = permission.role === "editor" ? "editor" : "viewer";
        const allowedByShare = isRoleAllowed(permRole, action);
        const attributes = toRecord(permission.attributes);
        const allowedActions = Array.isArray(attributes["allowedActions"])
          ? (attributes["allowedActions"] as unknown[]).filter((item): item is string => typeof item === "string")
          : null;
        const actionAllowedByAttribute = allowedActions ? allowedActions.includes(action) : true;

        if (allowedByShare && actionAllowedByAttribute) {
          return evaluatePolicies(db, userId, workflowId, action, {
            ...attributeContext,
            share: attributes,
          }, true);
        }
      }

      return evaluatePolicies(db, userId, workflowId, action, attributeContext, false);
    },

    async assertWorkflowAction(userId, workflowId, action, contextAttributes) {
      const [workflow] = await db
        .select({ id: workflows.id })
        .from(workflows)
        .where(eq(workflows.id, workflowId))
        .limit(1);
      if (!workflow) {
        throw new IAMError("Workflow not found", "NOT_FOUND", 404);
      }

      const allowed = await this.canWorkflowAction(
        userId,
        workflowId,
        action,
        contextAttributes
      );
      if (!allowed) {
        throw new IAMError("Access denied for this workflow action", "FORBIDDEN", 403);
      }
    },
  };
}

function normalizeRole(value: string): UserRole {
  if (value === "admin" || value === "editor" || value === "viewer") {
    return value;
  }
  return "editor";
}

function isRoleAllowed(role: UserRole, action: WorkflowAction): boolean {
  if (role === "admin") return true;
  if (role === "editor") return action !== "manage";
  return action === "view";
}

async function fetchPolicies(
  db: Database,
  userId: string,
  workflowId: string,
  action: WorkflowAction
): Promise<Array<{ effect: string; conditions: Record<string, unknown> }>> {
  const rows = await db
    .select({
      effect: iamPolicies.effect,
      conditions: iamPolicies.conditions,
    })
    .from(iamPolicies)
    .where(
      and(
        eq(iamPolicies.isActive, true),
        eq(iamPolicies.action, action),
        or(isNull(iamPolicies.userId), eq(iamPolicies.userId, userId)),
        or(isNull(iamPolicies.workflowId), eq(iamPolicies.workflowId, workflowId))
      )
    );

  return rows.map((row) => ({
    effect: row.effect,
    conditions: toRecord(row.conditions),
  }));
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

async function evaluatePolicies(
  db: Database,
  userId: string,
  workflowId: string,
  action: WorkflowAction,
  attributes: Record<string, unknown>,
  baseAllow: boolean
): Promise<boolean> {
  const policies = await fetchPolicies(db, userId, workflowId, action);
  let allow = baseAllow;

  for (const policy of policies) {
    if (!evaluateConditionObject(policy.conditions, attributes)) continue;
    if (policy.effect === "deny") {
      return false;
    }
    if (policy.effect === "allow") {
      allow = true;
    }
  }

  return allow;
}

function evaluateConditionObject(
  conditions: Record<string, unknown>,
  attributes: Record<string, unknown>
): boolean {
  const all = Array.isArray(conditions["all"]) ? (conditions["all"] as unknown[]) : [];
  const any = Array.isArray(conditions["any"]) ? (conditions["any"] as unknown[]) : [];
  const not = Array.isArray(conditions["not"]) ? (conditions["not"] as unknown[]) : [];

  if (all.length > 0) {
    const allPass = all.every((rule) => evaluateRule(rule, attributes));
    if (!allPass) return false;
  }

  if (any.length > 0) {
    const anyPass = any.some((rule) => evaluateRule(rule, attributes));
    if (!anyPass) return false;
  }

  if (not.length > 0) {
    const notPass = not.every((rule) => !evaluateRule(rule, attributes));
    if (!notPass) return false;
  }

  if (all.length === 0 && any.length === 0 && not.length === 0) {
    return true;
  }

  return true;
}

function evaluateRule(rule: unknown, attributes: Record<string, unknown>): boolean {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return false;
  const asRecord = rule as Record<string, unknown>;
  const path = typeof asRecord["path"] === "string" ? asRecord["path"] : "";
  const op = typeof asRecord["op"] === "string" ? asRecord["op"] : "eq";
  const expected = asRecord["value"];
  const actual = resolvePath(attributes, path);

  switch (op) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return toNumber(actual) > toNumber(expected);
    case "gte":
      return toNumber(actual) >= toNumber(expected);
    case "lt":
      return toNumber(actual) < toNumber(expected);
    case "lte":
      return toNumber(actual) <= toNumber(expected);
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "contains":
      if (typeof actual === "string" && typeof expected === "string") {
        return actual.includes(expected);
      }
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;
    case "exists":
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}

function resolvePath(value: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let current: unknown = value;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

export class IAMError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = "IAMError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
