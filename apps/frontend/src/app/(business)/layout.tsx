import type { ReactNode } from "react";
import Link from "next/link";

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #faf8ef 0%, #ffffff 55%)" }}>
      <header style={{ borderBottom: "1px solid #e8e1c6", padding: "14px 24px", display: "flex", justifyContent: "space-between" }}>
        <strong>REX Business</strong>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/business">Dashboard</Link>
          <Link href="/business/workflows">Workflows</Link>
          <Link href="/business/history">History</Link>
          <Link href="/studio">Switch to Studio</Link>
        </nav>
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
