"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessStudio, getRoleLandingPath } from "@/lib/rbac";

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
    <div className="control-shell">
      <aside className="control-shell__sidebar">
        <div>
          <h2 className="control-shell__brand">REX Studio</h2>
          <p className="control-shell__tag">Build, test, and certify</p>
        </div>
        <nav className="control-shell__nav">
          <Link href="/studio">Dashboard</Link>
          <Link href="/studio/workflows">Workflows</Link>
          <Link href="/studio/plugins">Plugins</Link>
          <Link href="/studio/settings">Settings</Link>
          <Link href="/business">Switch to Business</Link>
        </nav>
        <div className="control-shell__footer">Node graph, policy simulation, deployment</div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  );
}
