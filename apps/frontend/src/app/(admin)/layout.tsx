"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessAdmin, getRoleLandingPath } from "@/lib/rbac";
import { MainLayout } from "@/components/layout";

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "📊",
  },
  {
    href: "/admin/tenants",
    label: "Tenants",
    icon: "🏢",
  },
  {
    href: "/admin/plugins",
    label: "Node Registry",
    icon: "🔌",
  },
  {
    href: "/admin/audit-log",
    label: "Audit Log",
    icon: "📝",
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!canAccessAdmin(user)) {
      router.replace(getRoleLandingPath(user));
    }
  }, [loading, token, user, router]);

  if (loading || !token || !user || !canAccessAdmin(user)) {
    return null;
  }

  return (
    <MainLayout
      sidebarItems={ADMIN_NAV_ITEMS}
      sidebarTitle="System Admin"
      sidebarSubtitle="Global management"
    >
      {children}
    </MainLayout>
  );
}
