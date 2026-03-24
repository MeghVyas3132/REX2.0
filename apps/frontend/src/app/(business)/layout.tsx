"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { canAccessBusiness, canManageCompany, getRoleLandingPath } from "@/lib/rbac";

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

  return (
    <div className="control-shell">
      <aside className="control-shell__sidebar">
        <div>
          <h2 className="control-shell__brand">REX Business</h2>
          <p className="control-shell__tag">Operate certified workflows</p>
        </div>
        <nav className="control-shell__nav">
          <Link href="/business">Dashboard</Link>
          <Link href="/business/workflows">Workflows</Link>
          <Link href="/business/history">History</Link>
          {isCompanyAdmin ? <Link href="/business/company-admin">Company Admin</Link> : null}
        </nav>
        <div className="control-shell__footer">
          {isCompanyAdmin ? "Company operations, RBAC, and access control" : "Execution-only mode for business operators"}
        </div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  );
}
