"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session-context";

const MODE_PREF_KEY = "rex_mode_preference";
const BUSINESS_TIP_KEY = "rex_business_tip_seen";

type BusinessTemplate = {
  id: string;
  title: string;
  category: "Marketing Automation" | "Email Workflows" | "CRM Integrations";
  description: string;
};

const templates: BusinessTemplate[] = [
  {
    id: "marketing-campaign-follow-up",
    title: "Campaign Lead Follow-Up",
    category: "Marketing Automation",
    description: "Capture inbound leads and trigger follow-up touchpoints automatically.",
  },
  {
    id: "email-onboarding-series",
    title: "Customer Onboarding Sequence",
    category: "Email Workflows",
    description: "Send scheduled welcome emails with milestone-based reminders.",
  },
  {
    id: "crm-deal-stage-sync",
    title: "Deal Stage Sync",
    category: "CRM Integrations",
    description: "Sync CRM deal stage updates and notify account stakeholders instantly.",
  },
  {
    id: "marketing-nurture-reengagement",
    title: "Re-Engagement Nurture",
    category: "Marketing Automation",
    description: "Re-engage inactive contacts with curated offers and gentle reminders.",
  },
  {
    id: "email-renewal-reminders",
    title: "Renewal Reminder Flow",
    category: "Email Workflows",
    description: "Notify customers ahead of renewal dates with timed reminder emails.",
  },
  {
    id: "crm-ticket-handoff",
    title: "Support Ticket Handoff",
    category: "CRM Integrations",
    description: "Move handoffs from CRM to support with clean status and owner updates.",
  },
];

export default function BusinessPage() {
  const router = useRouter();
  const { user } = useSession();
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_PREF_KEY, "business");
      const seenTip = window.localStorage.getItem(BUSINESS_TIP_KEY);
      setShowTip(!seenTip);
    } catch {
      setShowTip(false);
    }
  }, []);

  const dismissTip = () => {
    setShowTip(false);
    try {
      window.localStorage.setItem(BUSINESS_TIP_KEY, "1");
    } catch {
      // Ignore storage failures in restricted contexts.
    }
  };

  const handleUseTemplate = (templateId: string) => {
    if (!user) {
      router.push("/login");
      return;
    }

    router.push(`/workflows/new?template=${encodeURIComponent(templateId)}`);
  };

  return (
    <main className="mode-bridge-shell business-shell">
      {showTip ? (
        <div className="mode-tip" role="status">
          <p>Business tip: pick any template and click <strong>Use Template</strong> to launch with minimal setup.</p>
          <button type="button" onClick={dismissTip} aria-label="Dismiss business tip">
            Dismiss
          </button>
        </div>
      ) : null}

      <section className="mode-bridge-card business-hero-card">
        <p className="mode-select-eyebrow">Rex Business</p>
        <h1>Simplified Automation Dashboard</h1>
        <p>
          Choose a pre-built template and launch quickly with minimal setup.
        </p>

        <div className="mode-bridge-actions business-header-actions">
          <Link className="button button-secondary" href="/select-mode">
            Switch Mode
          </Link>
          <Link className="button button-primary" href="/studio">
            Open Rex Studio
          </Link>
        </div>
      </section>

      <section className="mode-select-grid business-grid" aria-label="Business templates">
        {templates.map((template) => (
          <article key={template.id} className="mode-card business-template-card card">
            <Badge className="business-template-category" variant="default">{template.category}</Badge>
            <h2>{template.title}</h2>
            <p>{template.description}</p>
            <Button variant="primary" onClick={() => handleUseTemplate(template.id)}>
              Use Template
            </Button>
          </article>
        ))}
      </section>
    </main>
  );
}
