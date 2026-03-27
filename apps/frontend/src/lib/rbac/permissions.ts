import type { AuthUser } from "@/lib/api/types";

export type AppRole = "super_admin" | "org_admin" | "org_editor" | "org_viewer";

export type RoleCapabilities = {
  canAccessAdminShell: boolean;
  canManageTenant: boolean;
  canOperateWorkflows: boolean;
  canAccessGovernance: boolean;
  canAccessCompliance: boolean;
};

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  org_editor: "Org Editor",
  org_viewer: "Org Viewer",
};

const ROLE_CAPABILITIES: Record<AppRole, RoleCapabilities> = {
  super_admin: {
    canAccessAdminShell: true,
    canManageTenant: true,
    canOperateWorkflows: true,
    canAccessGovernance: true,
    canAccessCompliance: true,
  },
  org_admin: {
    canAccessAdminShell: false,
    canManageTenant: true,
    canOperateWorkflows: true,
    canAccessGovernance: true,
    canAccessCompliance: true,
  },
  org_editor: {
    canAccessAdminShell: false,
    canManageTenant: false,
    canOperateWorkflows: true,
    canAccessGovernance: true,
    canAccessCompliance: true,
  },
  org_viewer: {
    canAccessAdminShell: false,
    canManageTenant: false,
    canOperateWorkflows: false,
    canAccessGovernance: true,
    canAccessCompliance: true,
  },
};

export function getAppRole(user: AuthUser | null): AppRole | null {
  if (!user) return null;
  if (user.globalRole === "super_admin") return "super_admin";
  if (user.tenantRole === "org_admin") return "org_admin";
  if (user.tenantRole === "org_editor") return "org_editor";
  return "org_viewer";
}

export function getRoleLabel(role: AppRole | null): string {
  if (!role) return "Viewer";
  return ROLE_LABELS[role];
}

export function getRoleCapabilities(role: AppRole | null): RoleCapabilities {
  if (!role) {
    return {
      canAccessAdminShell: false,
      canManageTenant: false,
      canOperateWorkflows: false,
      canAccessGovernance: false,
      canAccessCompliance: false,
    };
  }
  return ROLE_CAPABILITIES[role];
}

export function canAccessAdmin(user: AuthUser | null): boolean {
  return getRoleCapabilities(getAppRole(user)).canAccessAdminShell;
}

export function canEdit(user: AuthUser | null): boolean {
  return hasAnyRole(user, ["super_admin", "org_admin", "org_editor"]);
}

export function hasAnyRole(user: AuthUser | null, allowedRoles: readonly AppRole[]): boolean {
  const role = getAppRole(user);
  return Boolean(role && allowedRoles.includes(role));
}

export function hasRole(user: AuthUser | null, role: AppRole): boolean {
  return getAppRole(user) === role;
}

export function canViewTenant(user: AuthUser | null): boolean {
  return Boolean(user);
}

export function canManageTenant(user: AuthUser | null): boolean {
  return getRoleCapabilities(getAppRole(user)).canManageTenant;
}

export function canOperateWorkflows(user: AuthUser | null): boolean {
  return getRoleCapabilities(getAppRole(user)).canOperateWorkflows;
}

export function canAccessGovernance(user: AuthUser | null): boolean {
  return getRoleCapabilities(getAppRole(user)).canAccessGovernance;
}

export function canAccessCompliance(user: AuthUser | null): boolean {
  return getRoleCapabilities(getAppRole(user)).canAccessCompliance;
}
