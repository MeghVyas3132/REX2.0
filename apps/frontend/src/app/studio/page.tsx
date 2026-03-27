"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session-context";

const MODE_PREF_KEY = "rex_mode_preference";
const STUDIO_TIP_KEY = "rex_studio_tip_seen";

export default function StudioPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_PREF_KEY, "studio");
      const seenTip = window.localStorage.getItem(STUDIO_TIP_KEY);
      setShowTip(!seenTip);
    } catch {
      setShowTip(false);
    }

    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const dismissTip = () => {
    setShowTip(false);
    try {
      window.localStorage.setItem(STUDIO_TIP_KEY, "1");
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  };

  if (loading) {
    return <main className="center-page">Preparing Rex Studio...</main>;
  }

  if (user) {
    return <main className="center-page">Redirecting to Rex Studio...</main>;
  }

  return (
    <main className="mode-bridge-shell">
      {showTip ? (
        <div className="mode-tip" role="status">
          <p>Studio tip: after sign-in, open Workflows to start building with full node-level customization.</p>
          <button type="button" onClick={dismissTip} aria-label="Dismiss studio tip">
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="mode-bridge-card">
        <p className="mode-select-eyebrow">Rex Studio</p>
        <h1>Developer Experience</h1>
        <p>
          Sign in or create an account to access the full developer dashboard with workflows,
          nodes, automation builder, and advanced controls.
        </p>

        <div className="mode-bridge-actions">
          <Link className="button button-primary" href="/login">
            Sign In to Studio
          </Link>
          <Link className="button button-secondary" href="/register">
            Sign Up
          </Link>
        </div>

        <p className="mode-bridge-switch">
          Prefer a simpler template-first path? <Link href="/business">Switch to Rex Business</Link>
        </p>
      </section>
    </main>
  );
}
