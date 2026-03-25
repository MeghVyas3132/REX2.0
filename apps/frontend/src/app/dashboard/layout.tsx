"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRoleLandingPath, getRolePersona } from "@/lib/rbac";
import { MainLayout } from "@/components/layout";

const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/dashboard/workflows/new", label: "Create Workflow", icon: "✨" },
  { href: "/dashboard/workflows", label: "Workflows", icon: "🧩" },
  { href: "/dashboard/templates", label: "Templates", icon: "📚" },
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
