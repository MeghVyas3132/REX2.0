"use client";

import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { AppTopbar } from "@/components/app-shell/AppTopbar";

export function AppShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <AppSidebar />
      <div className="content-shell">
        <AppTopbar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
