"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/session-context";

const MODE_PREF_KEY = "rex_mode_preference";
const SELECT_TIP_KEY = "rex_select_mode_tip_seen";

type ModeCardProps = {
  title: string;
  label: string;
  description: string;
  bullets: string[];
  icon: string;
  ctaLabel: string;
  href: string;
  accent: "studio" | "business";
  onChoose: (mode: "studio" | "business") => void;
};

function ModeCard({ title, label, description, bullets, icon, ctaLabel, href, accent, onChoose }: ModeCardProps) {
  return (
    <article className={`mode-card mode-card-${accent}`}>
      <div className="mode-card-head">
        <span className="mode-card-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <p className="mode-card-label">{label}</p>
          <h2>{title}</h2>
        </div>
      </div>

      <p className="mode-card-description">{description}</p>

      <ul className="mode-card-list">
        {bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <Link className="button button-primary mode-card-cta" href={href} onClick={() => onChoose(accent)}>
        {ctaLabel}
      </Link>
    </article>
  );
}

export default function SelectModePage() {
  const { user } = useSession();
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    try {
      const seenTip = window.localStorage.getItem(SELECT_TIP_KEY);
      if (!seenTip) {
        setShowTip(true);
      }
    } catch {
      setShowTip(false);
    }
  }, []);

  const handleChoose = (mode: "studio" | "business") => {
    try {
      window.localStorage.setItem(MODE_PREF_KEY, mode);
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  };

  const dismissTip = () => {
    setShowTip(false);
    try {
      window.localStorage.setItem(SELECT_TIP_KEY, "1");
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  };

  return (
    <main className="mode-select-shell">
      {showTip ? (
        <div className="mode-tip" role="status">
          <p>
            Tip: Choose <strong>Studio</strong> for full technical control or <strong>Business</strong> for fast template-based setup.
          </p>
          <button type="button" onClick={dismissTip} aria-label="Dismiss tip">
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="mode-select-hero">
        <p className="mode-select-eyebrow">Rex Platform</p>
        <h1>Choose Your Product Experience</h1>
        <p>
          Select the flow that matches how you work. You can switch modes any time.
          {user ? " You are currently signed in." : ""}
        </p>
      </section>

      <section className="mode-select-grid" aria-label="Product selection">
        <ModeCard
          title="Rex Studio"
          label="For Developers"
          description="Advanced workflow builder with full control, node-level configuration, and coding-friendly tooling."
          bullets={[
            "Visual automation builder with deep customization",
            "Technical controls for workflows and execution diagnostics",
            "Designed for developer and operator teams",
          ]}
          icon="</>"
          ctaLabel="Open Rex Studio"
          href="/studio"
          accent="studio"
          onChoose={handleChoose}
        />

        <ModeCard
          title="Rex Business"
          label="For Non-Technical Users"
          description="Template-first automation experience focused on quick setup and simple business outcomes."
          bullets={[
            "Pre-built templates with minimal configuration",
            "Business-focused categories and simplified actions",
            "No coding exposure required",
          ]}
          icon="▦"
          ctaLabel="Open Rex Business"
          href="/business"
          accent="business"
          onChoose={handleChoose}
        />
      </section>
    </main>
  );
}
