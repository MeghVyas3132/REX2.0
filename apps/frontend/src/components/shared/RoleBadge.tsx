import { getAppRole, getRoleLabel } from "@/lib/rbac/permissions";
import type { AuthUser } from "@/lib/api/types";

type RoleBadgeProps = {
  user: AuthUser;
};

export function RoleBadge({ user }: RoleBadgeProps) {
  const role = getRoleLabel(getAppRole(user));
  return <span className="role-badge">{role}</span>;
}
