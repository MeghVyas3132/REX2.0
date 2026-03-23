import type { ReactNode } from "react";
import Link from "next/link";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr" }}>
      <aside style={{ borderRight: "1px solid #e5e5e5", padding: 20 }}>
        <h2>REX Studio</h2>
        <nav style={{ display: "grid", gap: 10 }}>
          <Link href="/studio">Dashboard</Link>
          <Link href="/studio/workflows">Workflows</Link>
          <Link href="/studio/plugins">Plugins</Link>
          <Link href="/studio/settings">Settings</Link>
          <Link href="/business">Switch to Business</Link>
        </nav>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
