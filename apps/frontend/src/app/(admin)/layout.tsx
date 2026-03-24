"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessAdmin, getRoleLandingPath } from "@/lib/rbac";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (!canAccessAdmin(user)) {
      router.replace(getRoleLandingPath(user));
    }
  }, [loading, token, user, router]);

  if (loading || !token || !user || !canAccessAdmin(user)) {
    return null;
  }

  return (
    <div className="control-shell">
      <aside className="control-shell__sidebar">
        <div>
          <h2 className="control-shell__brand">REX Admin</h2>
          <p className="control-shell__tag">Global control plane</p>
        </div>
        <nav className="control-shell__nav">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/tenants">Tenants</Link>
          <Link href="/admin/plugins">Node Registry</Link>
          <Link href="/admin/audit-log">Audit Log</Link>
          <Link href="/studio">Switch to Studio</Link>
        </nav>
        <div className="control-shell__footer">Guardrails, billing, and governance</div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  );
}
