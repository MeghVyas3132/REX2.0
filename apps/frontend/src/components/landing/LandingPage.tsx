"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import {
  FloatingOrbs,
  AnimatedFeatureCard,
  AnimatedMetric,
  HoverGlowCard,
  RevealOnScroll,
  GradientText,
} from "./animations";
import "./premium-animations.css";

const VALUES = [
  {
    title: "Deterministic Execution",
    description: "Predictable DAG runs with clear control over every transition and retry.",
    icon: <DeterministicIcon />,
  },
  {
    title: "Explainable AI",
    description: "Trace every decision path with inspectable node inputs and outputs.",
    icon: <ExplainableIcon />,
  },
  {
    title: "Privacy First",
    description: "GDPR-aligned architecture with secure boundaries for enterprise AI teams.",
    icon: <PrivacyIcon />,
  },
];

const FEATURES = [
  {
    title: "Visual Workflow Builder",
    description: "Design workflows using drag-and-drop nodes.",
    icon: <BuilderIcon />,
  },
  {
    title: "Knowledge-Aware AI (RAG)",
    description: "Ingest and retrieve knowledge seamlessly.",
    icon: <RagIcon />,
  },
  {
    title: "Execution Observability",
    description: "Track every step with logs and outputs.",
    icon: <ObservabilityIcon />,
  },
  {
    title: "Enterprise Control",
    description: "Secure, auditable, and production-ready.",
    icon: <EnterpriseIcon />,
  },
];

const WHY_REX = [
  "Deterministic workflows, not black-box behavior",
  "Built-in RAG pipelines for knowledge-grounded responses",
  "Full execution visibility with logs, step outputs, and retries",
  "GDPR-aligned architecture with privacy-first design",
  "Designed for developers, AI teams, and non-technical operators",
];

const STEPS = [
  { title: "Create Workflow", subtitle: "Map your DAG visually with reusable node primitives.", icon: <StepCreateIcon /> },
  { title: "Add Knowledge", subtitle: "Attach corpora and retrieval nodes to ground model responses.", icon: <StepKnowledgeIcon /> },
  { title: "Run and Monitor", subtitle: "Execute with deterministic control and inspect every run in detail.", icon: <StepRunIcon /> },
];

const TRUST_LOGOS = ["Aether Labs", "Northstar Fintech", "NeuronOps", "Atlas Health", "Bluegrid Systems"];

const TESTIMONIALS = [
  {
    quote: "REX gave us deterministic AI behavior with enterprise-grade observability across every run.",
    author: "Sana Malik",
    role: "Head of AI Platform, Northstar Fintech",
  },
  {
    quote: "Our product and ops teams can collaborate in one visual graph without losing technical control.",
    author: "Daniel Pereira",
    role: "Director of Automation, Atlas Health",
  },
];

const HERO_PILLS = ["Deterministic DAG", "RAG Native", "Audit Trail"]; 

const TRACE_STEPS = [
  { step: "Input Classifier", status: "ok", latency: "42ms" },
  { step: "Retriever Node", status: "ok", latency: "118ms" },
  { step: "LLM Deterministic", status: "ok", latency: "390ms" },
  { step: "Policy Guard", status: "ok", latency: "54ms" },
];

const SIGNATURE_METRICS = [
  { label: "Workflow Reliability", value: "99.95%", hint: "deterministic execution" },
  { label: "Traceable Steps", value: "100%", hint: "input/output observability" },
  { label: "Compliance Readiness", value: "GDPR", hint: "privacy-first architecture" },
];

const EXECUTION_TIMELINE = [
  { label: "Trigger", detail: "Ticket Created" },
  { label: "Retriever", detail: "Top-k Context" },
  { label: "LLM", detail: "Deterministic Prompt" },
  { label: "Policy", detail: "Compliance Guard" },
  { label: "Action", detail: "Route to Team" },
];

const USE_CASES = [
  {
    key: "support",
    label: "Support",
    title: "AI-Assisted Support Triage",
    description: "Classify inbound tickets, retrieve knowledge snippets, and route escalations with deterministic branching.",
    bullets: [
      "RAG-backed answer suggestion and ticket tagging",
      "Confidence-based escalation to human agents",
      "End-to-end audit trail for regulated support flows",
    ],
    metric: "32% faster first-response time",
  },
  {
    key: "ops",
    label: "Ops",
    title: "Operational Incident Automation",
    description: "Detect anomalies, run remediation workflows, and log every action for compliance and postmortems.",
    bullets: [
      "Deterministic response playbooks with retries",
      "Multi-step approvals for high-impact actions",
      "Structured execution logs for incident reviews",
    ],
    metric: "48% reduction in manual incident toil",
  },
  {
    key: "product",
    label: "Product",
    title: "Product Feedback Intelligence",
    description: "Aggregate feedback, extract signals with explainable AI, and sync insights to product planning cycles.",
    bullets: [
      "Automated clustering with transparent reasoning",
      "Knowledge retrieval from release notes and docs",
      "Traceable workflows from insight to backlog",
    ],
    metric: "2x faster insight-to-backlog cycle",
  },
  {
    key: "ai-team",
    label: "AI Team",
    title: "Model Ops and Governance",
    description: "Build governed AI pipelines with observability, versioned prompts, and privacy-first data boundaries.",
    bullets: [
      "Node-level metrics and output inspection",
      "Policy-aware orchestration for enterprise controls",
      "GDPR-aligned architecture for sensitive domains",
    ],
    metric: "Audit-ready workflows by default",
  },
] as const;

type UseCaseKey = (typeof USE_CASES)[number]["key"];

export function LandingPage() {
  const [activeUseCase, setActiveUseCase] = useState<UseCaseKey>("support");
  const [isUseCasePaused, setIsUseCasePaused] = useState(false);
  const heroVisualRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".lp-reveal"));
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isUseCasePaused) return;
    const timer = window.setInterval(() => {
      setActiveUseCase((prev) => {
        const index = USE_CASES.findIndex((item) => item.key === prev);
        const next = (index + 1) % USE_CASES.length;
        return USE_CASES[next]?.key ?? USE_CASES[0].key;
      });
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isUseCasePaused]);

  const selectedUseCase = USE_CASES.find((item) => item.key === activeUseCase) ?? USE_CASES[0];

  function handleBeamMove(event: React.MouseEvent<HTMLDivElement>) {
    const target = heroVisualRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const tiltX = ((x - 50) / 50) * 2.2;
    const tiltY = ((y - 50) / 50) * -2.2;
    target.style.setProperty("--beam-x", `${Math.max(0, Math.min(100, x))}%`);
    target.style.setProperty("--beam-y", `${Math.max(0, Math.min(100, y))}%`);
    target.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    target.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
  }

  function handleBeamLeave() {
    const target = heroVisualRef.current;
    if (!target) return;
    target.style.setProperty("--beam-x", "68%");
    target.style.setProperty("--beam-y", "24%");
    target.style.setProperty("--tilt-x", "0deg");
    target.style.setProperty("--tilt-y", "0deg");
  }

  function handleUseCaseTabsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = USE_CASES.findIndex((item) => item.key === activeUseCase);
    if (currentIndex < 0) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % USE_CASES.length;
      const nextKey = USE_CASES[nextIndex]?.key ?? USE_CASES[0].key;
      setActiveUseCase(nextKey);
      tabRefs.current[nextIndex]?.focus();
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + USE_CASES.length) % USE_CASES.length;
      const prevKey = USE_CASES[prevIndex]?.key ?? USE_CASES[0].key;
      setActiveUseCase(prevKey);
      tabRefs.current[prevIndex]?.focus();
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveUseCase(USE_CASES[0].key);
      tabRefs.current[0]?.focus();
    }

    if (event.key === "End") {
      event.preventDefault();
      const lastIndex = USE_CASES.length - 1;
      setActiveUseCase(USE_CASES[lastIndex]?.key ?? USE_CASES[0].key);
      tabRefs.current[lastIndex]?.focus();
    }
  }

  return (
    <div className="lp-root">
      <FloatingOrbs />
      <div className="lp-bg-grid" aria-hidden="true" />
      <div className="lp-bg-glow lp-bg-glow--left" aria-hidden="true" />
      <div className="lp-bg-glow lp-bg-glow--right" aria-hidden="true" />

      <header className="lp-nav-wrap">
        <nav className="lp-nav">
          <Link href="/" className="lp-brand">
            <span className="lp-brand__glyph lp-brand__glyph--intro" aria-hidden="true"><BrandGlyph /></span>
            <span>REX</span>
          </Link>

          <div className="lp-nav__links">
            <a href="#features">Features</a>
            <a href="#how">How it Works</a>
            <a href="#why">Why REX</a>
            <Link href="/docs">Docs</Link>
          </div>

          <div className="lp-nav__actions">
            <Link href="/login" className="rex-link-reset">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login" className="rex-link-reset">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="lp-main">
        <section className="lp-section lp-hero">
          <div className="lp-hero__content lp-reveal is-visible">
            <p className="lp-kicker">Responsible, Ethical and Explainable AI Workflow Automation Platform</p>
            <h1 className="lp-title">Build AI workflows <GradientText>you can trust.</GradientText></h1>
            <p className="lp-subtitle">
              Design, run, and monitor knowledge-driven AI pipelines with full control,
              traceability, and privacy.
            </p>
            <div className="lp-hero__pills" aria-label="Platform highlights">
              {HERO_PILLS.map((pill) => (
                <span key={pill} className="lp-hero__pill">{pill}</span>
              ))}
            </div>
            <div className="lp-hero__actions">
              <Link href="/login" className="rex-link-reset">
                <Button variant="primary" size="lg">Start Building</Button>
              </Link>
              <a href="#features" className="rex-link-reset">
                <Button variant="secondary" size="lg">Explore Workflows</Button>
              </a>
            </div>
          </div>

          <div
            ref={heroVisualRef}
            className="lp-hero__visual lp-reveal is-visible"
            style={{ transitionDelay: "110ms" }}
            onMouseMove={handleBeamMove}
            onMouseLeave={handleBeamLeave}
          >
            <div className="lp-canvas-card">
              <div className="lp-cursor-beam" aria-hidden="true" />
              <WorkflowPreviewInteractive />
              <div className="lp-live-trace" aria-label="Live run trace preview">
                <p className="lp-live-trace__title">Live Run Trace</p>
                <div className="lp-live-trace__rows">
                  {TRACE_STEPS.map((row) => (
                    <div key={row.step} className="lp-live-trace__row">
                      <span className="lp-live-trace__state" aria-hidden="true" />
                      <span className="lp-live-trace__step">{row.step}</span>
                      <span className="lp-live-trace__latency">{row.latency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-signature lp-reveal" aria-label="Signature platform outcomes">
          {SIGNATURE_METRICS.map((item, index) => (
            <AnimatedMetric
              key={item.label}
              value={item.value}
              label={item.label}
              hint={item.hint}
              index={index}
            />
          ))}
        </section>

        <section className="lp-section lp-timeline lp-reveal" aria-label="Execution timeline preview">
          <p className="lp-timeline__label">Execution Timeline</p>
          <div className="lp-timeline__track" role="list">
            {EXECUTION_TIMELINE.map((item, index) => (
              <article key={item.label} role="listitem" className="lp-timeline__item" style={{ transitionDelay: `${index * 60}ms` } as React.CSSProperties}>
                <span className="lp-timeline__dot" aria-hidden="true" />
                <p className="lp-timeline__title">{item.label}</p>
                <p className="lp-timeline__detail">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-values" aria-label="Core values">
          {VALUES.map((item, index) => (
            <RevealOnScroll key={item.title} delay={index * 0.1}>
              <HoverGlowCard className="lp-value-card">
                <span className="lp-icon-chip" aria-hidden="true">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </HoverGlowCard>
            </RevealOnScroll>
          ))}
        </section>

        <section className="lp-section lp-proof lp-reveal" aria-label="Trusted organizations">
          <p className="lp-proof__label">Trusted by teams building responsible AI products</p>
          <div className="lp-proof__logos">
            {TRUST_LOGOS.map((logo) => (
              <span key={logo} className="lp-proof__logo">{logo}</span>
            ))}
          </div>
          <div className="lp-testimonials">
            {TESTIMONIALS.map((item, index) => (
              <article
                key={item.author}
                className="lp-testimonial lp-reveal"
                style={{ transitionDelay: `${80 + index * 70}ms` } as React.CSSProperties}
              >
                <p className="lp-testimonial__quote">"{item.quote}"</p>
                <p className="lp-testimonial__author">{item.author}</p>
                <p className="lp-testimonial__role">{item.role}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="lp-section lp-reveal">
          <SectionTitle
            eyebrow="Features"
            title="Everything you need to productionize AI workflows"
            subtitle="From workflow design to governance, REX combines deterministic execution, RAG, and observability in one platform."
          />

          <div className="lp-feature-grid">
            {FEATURES.map((feature, index) => (
              <AnimatedFeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </section>

        <section id="use-cases" className="lp-section lp-reveal">
          <SectionTitle
            eyebrow="Use Cases"
            title="One platform for cross-functional AI automation"
            subtitle="Switch context by team and see how REX adapts without sacrificing governance."
          />

          <div
            className="lp-usecases"
            onMouseEnter={() => setIsUseCasePaused(true)}
            onMouseLeave={() => setIsUseCasePaused(false)}
            onFocusCapture={() => setIsUseCasePaused(true)}
            onBlurCapture={(event) => {
              const nextFocus = event.relatedTarget;
              if (!nextFocus || !event.currentTarget.contains(nextFocus as Node)) {
                setIsUseCasePaused(false);
              }
            }}
          >
            <div
              className="lp-usecases__tabs"
              role="tablist"
              aria-label="Customer use cases"
              onKeyDown={handleUseCaseTabsKeyDown}
            >
              {USE_CASES.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  id={`lp-tab-${item.key}`}
                  aria-controls={`lp-panel-${item.key}`}
                  aria-selected={item.key === activeUseCase}
                  tabIndex={item.key === activeUseCase ? 0 : -1}
                  className={`lp-usecases__tab${item.key === activeUseCase ? " is-active" : ""}`}
                  onClick={() => setActiveUseCase(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <article
              key={selectedUseCase.key}
              id={`lp-panel-${selectedUseCase.key}`}
              className="lp-usecases__panel lp-usecases__panel--animated"
              role="tabpanel"
              aria-live="polite"
              aria-labelledby={`lp-tab-${selectedUseCase.key}`}
            >
              <p className="lp-usecases__metric">{selectedUseCase.metric}</p>
              <h3>{selectedUseCase.title}</h3>
              <p>{selectedUseCase.description}</p>
              <ul>
                {selectedUseCase.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="lp-usecases__mock" aria-hidden="true">
                <div className="lp-usecases__mock-card lp-usecases__mock-card--light">
                  <p>{selectedUseCase.label} Workspace</p>
                  <span className="lp-usecases__mock-line" />
                  <span className="lp-usecases__mock-line short" />
                  <span className="lp-usecases__mock-chip">Review Queue</span>
                </div>
                <div className="lp-usecases__mock-card lp-usecases__mock-card--dark">
                  <p>REX Run Monitor</p>
                  <span className="lp-usecases__mock-line" />
                  <span className="lp-usecases__mock-line short" />
                  <span className="lp-usecases__mock-chip">Latency Profile</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section id="how" className="lp-section lp-reveal">
          <SectionTitle
            eyebrow="How It Works"
            title="Go from concept to controlled execution in three steps"
            subtitle="A simple flow for both technical and non-technical teams."
          />

          <div className="lp-steps">
            {STEPS.map((step, index) => (
              <article key={step.title} className="lp-step lp-reveal" style={{ transitionDelay: `${index * 70}ms` } as React.CSSProperties}>
                <span className="lp-step__index">0{index + 1}</span>
                <span className="lp-icon-chip" aria-hidden="true">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.subtitle}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="why" className="lp-section lp-why lp-reveal">
          <div className="lp-why__left">
            <SectionTitle
              eyebrow="Why REX"
              title="A trustworthy foundation for enterprise AI automation"
              subtitle="Built to make AI workflows explainable, auditable, and controllable at scale."
            />
            <ul className="lp-why-list">
              {WHY_REX.map((item) => (
                <li key={item}>
                  <span className="lp-why-list__dot" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-why__right">
            <div className="lp-trust-card lp-reveal" style={{ transitionDelay: "110ms" }}>
              <h4>Built for Responsible AI</h4>
              <p>REX gives your team deterministic behavior, compliance confidence, and run-level explainability from day one.</p>
              <div className="lp-trust-card__meta">
                <span>GDPR Aligned</span>
                <span>Audit Ready</span>
                <span>Explainable by Design</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-final-cta lp-reveal">
          <h2>Start building responsible AI workflows today.</h2>
          <p>Launch your first trusted workflow in minutes with full control and observability.</p>
          <Link href="/login" className="rex-link-reset">
            <Button variant="primary" size="lg">Get Started</Button>
          </Link>
        </section>
      </main>
    </div>
  );
}

function WorkflowPreviewInteractive() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [coreNode, setCoreNode] = useState({ x: 214, y: 148 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);

  function toSvgPoint(event: React.PointerEvent<SVGSVGElement | SVGGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return point.matrixTransform(ctm.inverse());
  }

  function onDragStart(event: React.PointerEvent<SVGGElement>) {
    const point = toSvgPoint(event);
    if (!point) return;
    draggingRef.current = true;
    dragOffsetRef.current = { x: point.x - coreNode.x, y: point.y - coreNode.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDragMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!draggingRef.current) return;
    const point = toSvgPoint(event);
    if (!point) return;
    const nextX = Math.max(160, Math.min(250, point.x - dragOffsetRef.current.x));
    const nextY = Math.max(114, Math.min(194, point.y - dragOffsetRef.current.y));
    setCoreNode({ x: nextX, y: nextY });
  }

  function onDragEnd(event: React.PointerEvent<SVGSVGElement | SVGGElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (event.currentTarget instanceof SVGElement && event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const coreCenterX = coreNode.x + 82;
  const coreCenterY = coreNode.y + 46;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 560 360"
      width="100%"
      height="100%"
      className="lp-workflow-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onPointerMove={onDragMove}
      onPointerUp={onDragEnd}
      onPointerLeave={onDragEnd}
    >
      <rect x="30" y="42" width="150" height="78" rx="14" className="lp-node lp-node--input" />
      <text x="50" y="73" className="lp-node-label-muted">Source</text>
      <text x="50" y="95" className="lp-node-label">User Query</text>

      <rect x="400" y="48" width="132" height="74" rx="14" className="lp-node lp-node--rag" />
      <text x="420" y="78" className="lp-node-label-muted">Knowledge</text>
      <text x="420" y="99" className="lp-node-label">RAG Index</text>

      <rect x="400" y="252" width="132" height="74" rx="14" className="lp-node lp-node--obs" />
      <text x="420" y="282" className="lp-node-label-muted">Observability</text>
      <text x="420" y="303" className="lp-node-label">Run Logs</text>

      <path d={`M180 82 C230 82 ${coreNode.x - 34} ${coreNode.y + 22} ${coreNode.x} ${coreNode.y + 34}`} className="lp-edge" />
      <path d={`M${coreNode.x + 164} ${coreCenterY - 12} C410 180 ${coreNode.x + 154} 100 400 86`} className="lp-edge" />
      <path d={`M${coreNode.x + 164} ${coreCenterY + 14} C410 220 ${coreNode.x + 150} 274 400 289`} className="lp-edge" />

      <g
        className="lp-draggable-node"
        onPointerDown={onDragStart}
        onPointerUp={onDragEnd}
        role="button"
        tabIndex={0}
        aria-label="Drag the deterministic model node"
      >
        <rect x={coreNode.x} y={coreNode.y} width="164" height="92" rx="16" className="lp-node lp-node--core" />
        <text x={coreNode.x + 24} y={coreNode.y + 35} className="lp-node-label-muted">Model</text>
        <text x={coreNode.x + 24} y={coreNode.y + 62} className="lp-node-label">Deterministic LLM</text>
      </g>

      <rect x="218" y="264" width="134" height="32" rx="10" className="lp-drag-hint" />
      <text x="234" y="285" className="lp-drag-hint__text">Drag model node to simulate control</text>

      <circle cx={coreNode.x} cy={coreNode.y + 34} r="5" className="lp-dot" />
      <circle cx="400" cy="86" r="5" className="lp-dot" />
      <circle cx="400" cy="289" r="5" className="lp-dot" />
      <circle cx={coreCenterX} cy={coreCenterY} r="4" className="lp-dot lp-dot--pulse" />
    </svg>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="lp-section-title">
      <p className="lp-section-title__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </header>
  );
}

function BrandGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5h10a4.5 4.5 0 0 1 0 9H8.5" />
      <path d="M4 5.5V19" />
      <path d="M8.5 14.5 15 19" />
      <circle cx="17.5" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DeterministicIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6.5h14" />
      <path d="M3 10h14" />
      <path d="M3 13.5h14" />
      <circle cx="7" cy="10" r="1.6" />
    </svg>
  );
}

function ExplainableIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.8 2.2" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2.7 4 5.2v4.9c0 3.6 2.3 5.9 6 7.3 3.7-1.4 6-3.7 6-7.3V5.2L10 2.7Z" />
      <path d="m7.4 10.1 1.9 1.9 3.3-3.3" />
    </svg>
  );
}

function BuilderIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3" width="6" height="6" rx="1.2" />
      <rect x="11.5" y="3" width="6" height="6" rx="1.2" />
      <rect x="2.5" y="11" width="6" height="6" rx="1.2" />
      <path d="M11.5 14h6" />
      <path d="M14.5 11v6" />
    </svg>
  );
}

function RagIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5a2 2 0 0 1 2-2h10v14.5H5a2 2 0 0 0-2 2Z" />
      <path d="M15 2.5v14.5" />
      <path d="M6.5 6.5h5" />
      <path d="M6.5 9.5h5" />
    </svg>
  );
}

function ObservabilityIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16.5h14" />
      <path d="M5.5 13V9" />
      <path d="M10 13V6" />
      <path d="M14.5 13v-3" />
      <path d="m4.8 7.8 4.4-2.4 2.8 1.6 3.3-2" />
    </svg>
  );
}

function EnterpriseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M6.5 7h7" />
      <path d="M6.5 10h7" />
      <path d="M6.5 13h4" />
    </svg>
  );
}

function StepCreateIcon() {
  return <BuilderIcon />;
}

function StepKnowledgeIcon() {
  return <RagIcon />;
}

function StepRunIcon() {
  return <ObservabilityIcon />;
}
