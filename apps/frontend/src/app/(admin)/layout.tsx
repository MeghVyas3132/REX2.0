import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
          <Link href="/admin/plugins">Plugins</Link>
          <Link href="/admin/audit-log">Audit Log</Link>
          <Link href="/studio">Switch to Studio</Link>
        </nav>
        <div className="control-shell__footer">Guardrails, billing, and governance</div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  );
}
