"use client";

import { useAuth } from "@/lib/auth-context";
import { WorkflowsGridPage } from "@/components/workflows/WorkflowsGridPage";
import { AppShell } from "@/components/layout/AppShell";
import { getBusinessNavItems } from "@/components/layout/business-nav";

export default function BusinessWorkflowsPage() {
  const { user } = useAuth();

  return (
    <AppShell
      brand="REX"
      title="Available Workflows"
      subtitle="View and interact with available workflows"
      navItems={getBusinessNavItems("workflows")}
      userName={user?.name}
    >
      <WorkflowsGridPage
        title=""
        description=""
        routeBase="/business/workflows"
      />
    </AppShell>
  );
}
