"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

const PLATFORM_LINKS = ["Platform", "Templates", "Pricing", "Docs", "Blog"];

const FEATURE_ROWS = [
  {
    title: "REX Score Engine",
    body: "Node-level Responsible, Ethical, Explainable scoring with real-time gap detection.",
  },
  {
    title: "BYOK Vault",
    body: "Tenant-isolated encrypted key storage with validation paths across model providers.",
  },
  {
    title: "GDPR + DPDP",
    body: "Policy-aware guardrails built into workflow orchestration instead of post-run audits.",
  },
  {
    title: "80+ Node Library",
    body: "Composable triggers, logic, data, and communication nodes for production automation.",
  },
  {
    title: "Multi-tenant RBAC",
    body: "Granular workspace, role, and interface controls for admin, studio, and business users.",
  },
  {
    title: "Full Audit Trail",
    body: "Execution traces and structured logs for every step, approval, and remediation action.",
  },
];

const STORY_STEPS = [
  {
    index: "01",
    title: "Everything starts with an event.",
    body: "A webhook lands. A schedule fires. A queue fills. REX turns the signal into controlled execution.",
  },
  {
    index: "02",
    title: "Compose your logic graph.",
    body: "Drag, connect, and configure nodes with deterministic transitions and clear runtime boundaries.",
  },
  {
    index: "03",
    title: "REX flags risk before runtime.",
    body: "Each node is scored for Responsible, Ethical, and Explainable readiness against your policy profile.",
  },
  {
    index: "04",
    title: "Fix, certify, publish.",
    body: "Guardrails are inserted, scores rise, and certified workflows move into business operations.",
  },
];

const COMPLIANCE_ROWS = [
  ["GDPR", "Compliant"],
  ["DPDP India", "Compliant"],
  ["Data Residency", "Configured"],
  ["Audit Trail", "Active"],
  ["REX Certification", "14/14 workflows"],
] as const;

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="rx-landing">
      <header className={`rx-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="rx-nav__inner">
          <Link href="/" className="rx-nav__brand" aria-label="REX home">
            <span>REX</span>
            <i aria-hidden="true" />
          </Link>

          <nav className="rx-nav__links" aria-label="Primary">
            {PLATFORM_LINKS.map((item) => (
              <a
                key={item}
                href={item === "Docs" ? "/docs" : "#"}
                className="rx-nav__link"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="rx-nav__actions">
            <Link href="/login" className="rex-link-reset">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/login" className="rex-link-reset">
              <Button variant="primary" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="rx-main">
        <section className="rx-hero">
          <p className="rx-eyebrow">
            <span aria-hidden="true" />
            Responsible · Ethical · Explainable
          </p>

          <h1 className="rx-title">
            Build AI workflows
            <br />
            the world can trust.
          </h1>

          <p className="rx-subtitle">
            REX scores each automation node for compliance, flags the gaps, and applies remediations
            before risk reaches production.
          </p>

          <div className="rx-cta">
            <Link href="/login" className="rex-link-reset">
              <Button variant="primary">Start building</Button>
            </Link>
            <a href="#story" className="rex-link-reset">
              <Button variant="secondary">See how it works</Button>
            </a>
          </div>

          <div className="rx-proof" aria-label="Social proof">
            <article>
              <strong>200+</strong>
              <span>enterprises</span>
            </article>
            <article>
              <strong>GDPR + DPDP</strong>
              <span>ready by default</span>
            </article>
            <article>
              <strong>80+</strong>
              <span>workflow nodes</span>
            </article>
          </div>

          <aside className="rx-hero-preview" aria-label="Workflow preview">
            <div className="rx-preview__chip">WORKFLOW CERTIFIED</div>
            <div className="rx-preview__node-row">
              <NodeCard title="Webhook" tone="green" badge="REX ✓" />
              <NodeCard title="LLM Prompt" tone="amber" badge="REX ~" />
            </div>
            <div className="rx-preview__beam" aria-hidden="true" />
            <div className="rx-preview__node-row">
              <NodeCard title="Consent Gate" tone="green" badge="REX ✓" />
              <NodeCard title="Slack" tone="green" badge="REX ✓" />
            </div>
          </aside>
        </section>

        <section id="story" className="rx-story" aria-label="How REX works">
          {STORY_STEPS.map((step) => (
            <article key={step.index} className="rx-story__item">
              <p className="rx-story__index">{step.index}</p>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          ))}
        </section>

        <section className="rx-features" aria-label="Features">
          <header>
            <p>Platform</p>
            <h2>The platform compliance teams have been asking for.</h2>
          </header>

          <div className="rx-features__grid">
            {FEATURE_ROWS.map((item) => (
              <article key={item.title} className="rx-feature">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rx-compliance" aria-label="Compliance overview">
          <div className="rx-compliance__content">
            <p>Compliance</p>
            <h2>
              Built for GDPR.
              <br />
              Built for DPDP India.
            </h2>
            <p>
              REX was designed for regulated workloads from day one. Data residency, consent control,
              and auditable execution are built into the runtime graph.
            </p>
            <a href="/docs" className="rx-compliance__link">Read compliance docs</a>
          </div>

          <div className="rx-scorecard" role="table" aria-label="Compliance scorecard">
            {COMPLIANCE_ROWS.map(([label, value]) => (
              <div key={label} className="rx-scorecard__row" role="row">
                <span role="cell">{label}</span>
                <span role="cell" className="rx-scorecard__badge">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function NodeCard({ title, badge, tone }: { title: string; badge: string; tone: "green" | "amber" }) {
  return (
    <article className={`rx-node rx-node--${tone}`}>
      <p>{title}</p>
      <span>{badge}</span>
    </article>
  );
}
