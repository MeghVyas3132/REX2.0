"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session-context";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { Button } from "@/components/ui/Button";

export function AppTopbar() {
  const { user, signOut } = useSession();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>REX Control Plane</h2>
        {user && <RoleBadge user={user} />}
      </div>
      <div className="topbar-actions">
        <Link href="/tools/chat">Command Palette</Link>
        <Button variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
