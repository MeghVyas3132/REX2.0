"use client";

import { AppNav } from "@/components/navigation/AppNav";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/lib/utils/ui-store";

export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside className="sidebar">
      <Button variant="secondary" onClick={toggleSidebar}>
        {sidebarCollapsed ? "Expand" : "Collapse"}
      </Button>
      {!sidebarCollapsed ? <AppNav /> : null}
    </aside>
  );
}
