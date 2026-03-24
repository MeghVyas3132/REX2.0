"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { AnimatedBeam, AnimatedGridPattern, AnimatedThemeToggler, Highlighter } from "@/components/magicui";

const PLATFORM_LINKS = ["Platform", "Templates", "Pricing", "Docs", "Blog"];

const CAPABILITY_RAIL = [
  { id: "hero", label: "Control" },
  { id: "story", label: "Flow" },
  { id: "showcase", label: "Use Cases" },
  { id: "trust", label: "Proof" },
  { id: "final", label: "Launch" },
];

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

const SHOWCASE_ROWS = [
  {
    title: "Healthcare Operations",
    body: "Coordinate intake, policy validation, and response workflows with explainable AI checkpoints.",
    chip: "Regulated",
  },
  {
    title: "Financial Risk Orchestration",
    body: "Route high-risk transactions through real-time guardrails and compliance scoring gates.",
    chip: "Low Latency",
  },
  {
    title: "Enterprise Service Automation",
    body: "Unify ticketing, knowledge, and approvals through deterministic execution graphs.",
    chip: "Cross-System",
  },
];

const TRUST_METRICS = [
  { value: "98.6%", label: "Policy match accuracy" },
  { value: "34ms", label: "Median scoring latency" },
  { value: "14/14", label: "Certified live workflows" },
  { value: "5.2x", label: "Faster remediation cycles" },
];

const LOGO_ROWS = [
  "Acme Health",
  "Northstar Capital",
  "Crestline Systems",
  "Vertex Logistics",
  "Aurora Insurance",
  "Helix Commerce",
  "Summit Telecom",
  "Atlas Bio",
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
  const [activeRail, setActiveRail] = useState("hero");
  const [activeStory, setActiveStory] = useState(0);
  const [graphGlow, setGraphGlow] = useState({ x: 68, y: 22 });

  const sectionIds = useMemo(() => CAPABILITY_RAIL.map((item) => item.id), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(`rx-${id}`))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveRail(visible.target.id.replace("rx-", ""));
        }
      },
      {
        threshold: [0.2, 0.45, 0.65],
        rootMargin: "-20% 0px -40% 0px",
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    const stepElements = Array.from(document.querySelectorAll<HTMLElement>("[data-story-step]"));
    if (!stepElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const idx = Number(visible.target.getAttribute("data-story-step"));
        if (!Number.isNaN(idx)) {
          setActiveStory(idx);
        }
      },
      { threshold: [0.35, 0.65], rootMargin: "-20% 0px -35% 0px" },
    );

    stepElements.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const storyProgress = `${((activeStory + 1) / STORY_STEPS.length) * 100}%`;

  return (
    <div className="rx-landing rx-landing--premium">
      <div className="rx-atmosphere" aria-hidden="true">
        <span className="rx-orb rx-orb--a" />
        <span className="rx-orb rx-orb--b" />
        <span className="rx-orb rx-orb--c" />
      </div>

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
            <AnimatedThemeToggler className="rx-nav__theme" duration={400} />
            <Link href="/login" className="rex-link-reset">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/get-started" className="rex-link-reset">
              <Button variant="primary" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="rx-main">
        <section id="rx-hero" className="rx-hero rx-phase phase-1-hero">
          <p className="rx-eyebrow">
            <span aria-hidden="true" />
            Responsible · Ethical · Explainable
          </p>

          <h1 className="rx-title">
            Build AI workflows
            <br />
            <Highlighter color="var(--blue)">the world can trust.</Highlighter>
          </h1>

          <p className="rx-subtitle">
            REX scores each automation node for compliance, flags the gaps, and applies remediations
            before risk reaches production.
          </p>

          <div className="rx-cta">
            <Link href="/get-started" className="rex-link-reset">
              <Button variant="primary">Start building</Button>
            </Link>
            <a href="#rx-story" className="rex-link-reset">
              <Button variant="secondary">Watch flow story</Button>
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

          <aside
            className="rx-hero-preview rx-workflow-visual"
            aria-label="Workflow graphic illustration"
            style={{
              ["--rx-graph-x" as string]: `${graphGlow.x}%`,
              ["--rx-graph-y" as string]: `${graphGlow.y}%`,
            }}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * 100;
              const y = ((event.clientY - rect.top) / rect.height) * 100;
              setGraphGlow({ x: Math.min(94, Math.max(6, x)), y: Math.min(92, Math.max(6, y)) });
            }}
          >
            <div className="rx-workflow-visual__grid" aria-hidden="true" />
            <AnimatedGridPattern className="rx-workflow-visual__magic-grid" numSquares={26} duration={2.7} maxOpacity={0.16} />
            <div className="rx-workflow-visual__glow" aria-hidden="true" />
            <AnimatedBeam
              className="rx-workflow-visual__magic-beam"
              d="M90 165 C 260 165, 380 165, 550 165"
              pathWidth={3}
              pathOpacity={0.35}
              duration={2.8}
            />
            <AnimatedBeam
              className="rx-workflow-visual__magic-beam"
              d="M550 165 C 680 165, 760 165, 900 165"
              pathWidth={3}
              pathOpacity={0.35}
              duration={2.2}
              delay={0.12}
            />

            <div className="rx-workflow-visual__status">WORKFLOW CERTIFIED</div>

            <div className="rx-workflow-visual__pills" aria-hidden="true">
              <span className="is-green">Trigger</span>
              <span className="is-blue">LLM</span>
              <span>Publish</span>
            </div>

            <svg className="rx-workflow-visual__links" viewBox="0 0 760 520" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="rxLineA" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(52,211,153,0.7)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0.7)" />
                </linearGradient>
                <linearGradient id="rxLineB" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.7)" />
                  <stop offset="100%" stopColor="rgba(52,211,153,0.7)" />
                </linearGradient>
              </defs>
              <path d="M70 130 C 210 130, 260 130, 360 130" stroke="url(#rxLineA)" strokeWidth="5" fill="none" />
              <path d="M370 130 C 500 130, 540 130, 670 130" stroke="url(#rxLineB)" strokeWidth="5" fill="none" />
              <path d="M150 245 C 180 280, 200 330, 210 390" stroke="url(#rxLineA)" strokeWidth="3" fill="none" opacity="0.8" />
              <path d="M470 245 C 500 280, 520 330, 545 390" stroke="url(#rxLineB)" strokeWidth="3" fill="none" opacity="0.8" />
            </svg>

            <div className="rx-workflow-visual__node-row">
              <VisualNode title="Webhook" badge="REX ✓" tone="green" floatingLabel="Policy" />
              <VisualNode title="LLM Prompt" badge="REX ~" tone="amber" floatingLabel="Guard" />
            </div>

            <div className="rx-workflow-visual__node-row">
              <VisualNode title="Consent Gate" badge="REX ✓" tone="green" />
              <VisualNode title="Slack" badge="REX ✓" tone="green" />
            </div>

            <div className="rx-workflow-visual__footer" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </aside>

          <aside className="rx-float-rail" aria-label="Capability progression">
            {CAPABILITY_RAIL.map((item, index) => (
              <a
                key={item.id}
                href={`#rx-${item.id}`}
                className={`rx-float-rail__item ${activeRail === item.id ? "is-active" : ""}`}
                aria-current={activeRail === item.id ? "step" : undefined}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.label}</strong>
              </a>
            ))}
          </aside>
        </section>

        <section className="rx-logo-wall rx-phase" aria-label="Trusted teams">
          <p>Trusted by regulated teams operating in production</p>
          <div className="rx-logo-wall__track" aria-hidden="true">
            {[...LOGO_ROWS, ...LOGO_ROWS].map((name, idx) => (
              <span key={`${name}-${idx}`}>{name}</span>
            ))}
          </div>
        </section>

        <section id="rx-story" className="rx-story rx-phase phase-2-story" aria-label="How REX works">
          <div className="rx-story-progress" aria-hidden="true">
            <strong>Workflow narrative</strong>
            <div className="rx-story-progress__bar">
              <span style={{ width: storyProgress }} />
            </div>
            <small>
              Step {activeStory + 1} / {STORY_STEPS.length}
            </small>
          </div>

          <div className="rx-story-track">
            {STORY_STEPS.map((step, index) => (
              <article
                key={step.index}
                className={`rx-story__item ${activeStory === index ? "is-active" : ""}`}
                data-story-step={index}
              >
                <p className="rx-story__index">{step.index}</p>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="rx-showcase" className="rx-showcase rx-phase phase-3-showcase" aria-label="Use case showcase">
          <header>
            <p>Showcase</p>
            <h2>Designed for teams that run mission-critical decisions.</h2>
          </header>

          <div className="rx-showcase__row" role="list">
            {SHOWCASE_ROWS.map((item) => (
              <article key={item.title} className="rx-showcase__card" role="listitem">
                <span className="rx-showcase__chip">{item.chip}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="rx-showcase__line" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="rx-features rx-phase phase-4-features" aria-label="Features">
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

        <section id="rx-trust" className="rx-trust rx-phase phase-5-trust" aria-label="Trust metrics">
          <header>
            <p>Proof</p>
            <h2>Enterprise confidence, measurable in every run.</h2>
          </header>

          <div className="rx-trust__grid" role="list">
            {TRUST_METRICS.map((item) => (
              <article key={item.label} className="rx-trust__metric" role="listitem">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="rx-compliance rx-phase phase-6-compliance" aria-label="Compliance overview">
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

        <section id="rx-final" className="rx-final-cta rx-phase phase-7-final" aria-label="Final call to action">
          <div className="rx-final-cta__content">
            <p>Control room is ready</p>
            <h2>Deploy compliant AI automation with confidence.</h2>
            <span>
              Launch your first certified workflow in minutes and scale governance without slowing execution.
            </span>
          </div>

          <div className="rx-final-cta__actions">
            <Link href="/login" className="rex-link-reset">
              <Button variant="primary">Launch REX Studio</Button>
            </Link>
            <a href="/docs" className="rex-link-reset">
              <Button variant="ghost">Read architecture docs</Button>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function VisualNode({
  title,
  badge,
  tone,
  floatingLabel,
}: {
  title: string;
  badge: string;
  tone: "green" | "amber";
  floatingLabel?: string;
}) {
  return (
    <article className={`rx-visual-node rx-visual-node--${tone}`}>
      <p className="rx-visual-node__title">{title}</p>
      <span className="rx-visual-node__badge">{badge}</span>
      {floatingLabel ? <i className="rx-visual-node__floating">{floatingLabel}</i> : null}
    </article>
  );
}
