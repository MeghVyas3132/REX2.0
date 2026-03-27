import { RequireSuperAdmin } from "@/lib/rbac/guards";
import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSuperAdmin>
      <AppErrorBoundary>
        <main className="content">{children}</main>
      </AppErrorBoundary>
    </RequireSuperAdmin>
  );
}
