"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessBusiness, canManageCompany, getRoleLandingPath } from "@/lib/rbac";
import { MainLayout } from "@/components/layout";

export default function BusinessLayout({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!canAccessBusiness(user)) {
      router.replace(getRoleLandingPath(user));
    }
  }, [loading, token, user, router]);

  if (loading || !token || !user || !canAccessBusiness(user)) {
    return null;
  }

  const isCompanyAdmin = canManageCompany(user);

  const businessNavItems = [
    {
      href: "/business",
      label: "Dashboard",
      icon: "📊",
    },
    {
      href: "/business/workflows",
      label: "Workflows",
      icon: "⚙️",
    },
    {
      href: "/business/executions",
      label: "Executions",
      icon: "▶️",
    },
    ...(isCompanyAdmin
      ? [
          {
            href: "/business/company-admin",
            label: "Company Admin",
            icon: "👥",
          },
        ]
      : []),
  ];

  return (
    <MainLayout
      sidebarItems={businessNavItems}
      sidebarTitle="REX Business"
      sidebarSubtitle={isCompanyAdmin ? "Operations & Admin" : "Operations"}
    >
      {children}
    </MainLayout>
  );
}
