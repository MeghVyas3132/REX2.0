"use client";

import { AppNav } from "@/components/navigation/AppNav";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/lib/utils/ui-store";

export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const eyebrow = "Workspace";

  return (
    <aside className="sidebar shell-sidebar">
      <div className="shell-sidebar-head">
        <p className="shell-sidebar-eyebrow">{eyebrow}</p>
        <Button variant="secondary" className="shell-sidebar-toggle" onClick={toggleSidebar}>
          {sidebarCollapsed ? "Expand" : "Collapse"}
        </Button>
      </div>
      <div className="shell-sidebar-body">{!sidebarCollapsed ? <AppNav /> : null}</div>
    </aside>
  );
}
