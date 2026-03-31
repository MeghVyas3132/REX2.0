import { AppErrorBoundary } from "@/components/shared/AppErrorBoundary";
import { AppShellFrame } from "@/components/app-shell/AppShellFrame";
import { RequireAuth } from "@/lib/rbac/guards";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppErrorBoundary>
        <AppShellFrame>{children}</AppShellFrame>
      </AppErrorBoundary>
    </RequireAuth>
  );
}
