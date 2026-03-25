"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessStudio, getRoleLandingPath } from "@/lib/rbac";
import { MainLayout } from "@/components/layout";

const STUDIO_NAV_ITEMS = [
  {
    href: "/studio",
    label: "Dashboard",
    icon: "dashboard" as const,
  },
  {
    href: "/studio/workflows",
    label: "Workflows",
    icon: "workflows" as const,
  },
  {
    href: "/studio/plugins",
    label: "Plugins",
    icon: "plugins" as const,
  },
  {
    href: "/studio/templates",
    label: "Templates",
    icon: "templates" as const,
  },
];

export default function StudioLayout({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!canAccessStudio(user)) {
      router.replace(getRoleLandingPath(user));
    }
  }, [loading, token, user, router]);

  if (loading || !token || !user || !canAccessStudio(user)) {
    return null;
  }

  return (
    <MainLayout
      sidebarItems={STUDIO_NAV_ITEMS}
      sidebarTitle="REX Studio"
      sidebarSubtitle="Build & certify"
    >
      {children}
    </MainLayout>
  );
}
