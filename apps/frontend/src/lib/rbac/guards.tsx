"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/session-context";
import { canAccessAdmin, hasAnyRole, type AppRole } from "@/lib/rbac/permissions";

type GuardProps = {
  children: React.ReactNode;
};

type RequireRoleProps = GuardProps & {
  roles: readonly AppRole[];
  redirectTo?: string;
};

export function RequireAuth({ children }: GuardProps) {
  const router = useRouter();
  const { loading, user } = useSession();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="page-state">Loading session...</div>;
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: GuardProps) {
  const router = useRouter();
  const { loading, user } = useSession();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="page-state">Loading session...</div>;
  }

  if (user) {
    return <div className="page-state">Redirecting...</div>;
  }

  return <>{children}</>;
}

export function RequireRole({ children, roles, redirectTo = "/dashboard" }: RequireRoleProps) {
  const router = useRouter();
  const { loading, user } = useSession();

  useEffect(() => {
    if (!loading && !hasAnyRole(user, roles)) {
      router.replace(redirectTo);
    }
  }, [loading, redirectTo, roles, router, user]);

  if (loading || !user || !hasAnyRole(user, roles)) {
    return <div className="page-state">Checking permissions...</div>;
  }

  return <>{children}</>;
}

export function RequireSuperAdmin({ children }: GuardProps) {
  const router = useRouter();
  const { loading, user } = useSession();

  useEffect(() => {
    if (!loading && !canAccessAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || !canAccessAdmin(user)) {
    return <div className="page-state">Checking permissions...</div>;
  }

  return <>{children}</>;
}
