import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { AppTopbar } from "@/components/app-shell/AppTopbar";
import { RequireAuth } from "@/lib/rbac/guards";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppErrorBoundary>
        <div className="page-shell">
          <AppSidebar />
          <div className="content-shell">
            <AppTopbar />
            <main className="content">{children}</main>
          </div>
        </div>
      </AppErrorBoundary>
    </RequireAuth>
  );
}
