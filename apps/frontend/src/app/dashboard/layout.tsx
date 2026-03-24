"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getRoleLandingPath, getRolePersona } from "@/lib/rbac";
import { MainLayout } from "@/components/layout";

const dashboardNavItems = [
  { label: "Dashboard", href: "/dashboard", title: "Dashboard" },
  { label: "Create Workflow", href: "/dashboard/workflows/new", title: "New Workflow" },
  { label: "Workflows", href: "/dashboard/workflows", title: "Workflows" },
  { label: "Templates", href: "/dashboard/templates", title: "Templates" },
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
    <MainLayout navItems={dashboardNavItems}>
      {children}
    </MainLayout>
  );
}
