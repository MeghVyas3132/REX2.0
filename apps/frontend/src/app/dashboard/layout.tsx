"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRoleLandingPath, getRolePersona } from "@/lib/rbac";
import { MainLayout } from "@/components/layout";

const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" as const },
  { href: "/dashboard/workflows", label: "Workflows", icon: "workflows" as const },
  { href: "/dashboard/active-workflows", label: "Active Workflows", icon: "active-workflows" as const },
  { href: "/dashboard/current-workflow", label: "Current Workflow", icon: "current-workflow" as const },
  { href: "/dashboard/corpora", label: "Corpora", icon: "corpora" as const },
  { href: "/dashboard/kpi", label: "KPI", icon: "kpi" as const },
  { href: "/templates", label: "Templates", icon: "templates" as const },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" as const },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (getRolePersona(user) !== "manager") {
      router.replace(getRoleLandingPath(user));
    }
  }, [loading, token, user, router]);

  if (loading || !token || !user || getRolePersona(user) !== "manager") {
    return null;
  }

  return (
    <MainLayout
      sidebarItems={DASHBOARD_NAV_ITEMS}
      sidebarTitle="Workflow Studio"
      sidebarSubtitle="Manager workspace"
    >
      {children}
    </MainLayout>
  );
}
