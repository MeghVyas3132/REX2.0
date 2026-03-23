import type { ReactNode } from "react";
import Link from "next/link";

export default function BusinessLayout({ children }: { children: ReactNode }) {
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
          <Link href="/studio">Switch to Studio</Link>
        </nav>
        <div className="control-shell__footer">Execution-only mode for business operators</div>
      </aside>
      <main className="control-main">{children}</main>
    </div>
  );
}
