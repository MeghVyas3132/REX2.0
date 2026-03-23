import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <aside style={{ padding: 20, borderRight: "1px solid #ddd" }}>
        <h2>REX Admin</h2>
        <nav style={{ display: "grid", gap: 10 }}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/tenants">Tenants</Link>
          <Link href="/admin/plugins">Plugins</Link>
          <Link href="/admin/audit-log">Audit Log</Link>
        </nav>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
