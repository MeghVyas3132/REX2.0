"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/session-context";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { Button } from "@/components/ui/Button";

export function AppTopbar() {
  const { user, signOut } = useSession();

  return (
    <header className="topbar shell-topbar">
      <div className="topbar-left">
        <div className="shell-topbar-title-wrap">
          <p className="shell-topbar-eyebrow">REX Platform</p>
          <h2>REX Control Plane</h2>
        </div>
        {user && <RoleBadge user={user} />}
      </div>
      <div className="topbar-actions">
        <Link className="shell-link-pill" href="/tools/chat">
          Command Palette
        </Link>
        <Button variant="secondary" className="shell-signout-btn" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
