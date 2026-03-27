"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session-context";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function Topbar() {
  const { user, signOut } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", fontWeight: 600, color: "var(--primary)" }}>
        REX
      </Link>

      {user && (
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{user.email}</span>
          <Button onClick={handleSignOut} variant="secondary">
            Sign Out
          </Button>
        </div>
      )}
    </header>
  );
}
