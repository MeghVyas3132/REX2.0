import type { AuthUser } from "@/lib/api/types";
import { canEdit, hasAnyRole, type AppRole } from "@/lib/rbac/permissions";

type PermissionGateProps = {
  user: AuthUser | null;
  requireEdit?: boolean;
  requireRoles?: readonly AppRole[];
  check?: (user: AuthUser | null) => boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function PermissionGate({
  user,
  requireEdit = false,
  requireRoles,
  check,
  fallback = null,
  children,
}: PermissionGateProps) {
  if (requireEdit && !canEdit(user)) {
    return <>{fallback}</>;
  }

  if (requireRoles && !hasAnyRole(user, requireRoles)) {
    return <>{fallback}</>;
  }

  if (check && !check(user)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
