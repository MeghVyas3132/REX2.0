"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const reveal = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const panel = {
  hidden: { opacity: 0, x: 26 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.12 },
  },
};

export default function HomePage() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [runs, setRuns] = useState(0);
  const [success, setSuccess] = useState(0);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 72;
    const tick = window.setInterval(() => {
      frame += 1;
      const ratio = Math.min(frame / totalFrames, 1);
      setRuns(Math.round(12540 * ratio));
      setSuccess(Number((99.96 * ratio).toFixed(2)));
      setLatency(Math.round(420 * ratio));

      if (frame >= totalFrames) {
        window.clearInterval(tick);
      }
    }, 18);

    return () => window.clearInterval(tick);
  }, []);

  const features = [
    {
      title: "Workflow Automation",
      description: "Build trigger-based AI pipelines with topological execution control.",
      eyebrow: "Flow Engine",
    },
    {
      title: "Guardrail Intelligence",
      description: "Validate inputs, enforce policy, and stop unsafe outputs in real time.",
      eyebrow: "Runtime Safety",
    },
    {
      title: "Execution Telemetry",
      description: "Track live execution metrics and node-level health with instant feedback.",
      eyebrow: "Ops Signal",
    },
  ];

  const lifecycle = [
    {
      title: "Ingest Trigger",
      description: "Start from webhook, schedule, or operator action with input validation.",
    },
    {
      title: "Reasoning Stage",
      description: "Route into model execution with retrieval context and policy overlays.",
    },
    {
      title: "Guardrail Pass",
      description: "Run input and output safety filters before any external side effects.",
    },
    {
      title: "Observed Output",
      description: "Emit final output and persist telemetry for compliance and diagnostics.",
    },
  ];

  const trustMarks = ["FinOps Teams", "Risk & Compliance", "AI Platform Ops", "Enterprise IT"];

  return (
    <main className="neo-landing">
      <div className="neo-landing-grid" aria-hidden="true" />
      <div className="neo-landing-glow neo-landing-glow-a" aria-hidden="true" />
      <div className="neo-landing-glow neo-landing-glow-b" aria-hidden="true" />

      <header className="neo-navbar" aria-label="Main navigation">
        <div className="neo-navbar-brand">REX</div>
        <nav className="neo-navbar-links" aria-label="Landing sections">
          <a href="#product">Product</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#docs">Docs</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="neo-navbar-actions">
          <Link className="button button-secondary" href="/login">
            Sign In
          </Link>
          <Link className="button button-gradient neo-cta-pulse" href="/register">
            Get Started
          </Link>
        </div>
      </header>

      <section id="product" className="neo-hero">
        <motion.div initial="hidden" animate="show" variants={reveal} className="neo-hero-copy">
          <p className="neo-kicker">REX AI ORCHESTRATION</p>
          <h1>
            Build and control
            <span> AI workflows visually.</span>
          </h1>
          <p>
            Design, run, and monitor AI automation with guardrails and live runtime signal.
          </p>
          <div className="neo-hero-actions">
            <Link className="button button-gradient neo-cta-pulse" href="/register">
              Get Started Free
            </Link>
            <a className="button button-ghost" href="#demo">
              View Demo
            </a>
          </div>
        </motion.div>

        <motion.aside initial="hidden" animate="show" variants={panel} className="neo-hero-console">
          <div className="neo-console-head">
            <p>Live Pipeline Preview</p>
            <span className="neo-live-pill">Active</span>
          </div>
          <div className="neo-hero-canvas" aria-label="Curved node-link automation canvas">
            <svg className="neo-hero-canvas-links" viewBox="0 0 520 220" role="presentation" focusable="false" aria-hidden="true">
              <path className="neo-bezier-path" d="M76 60 C140 60, 142 60, 206 60" />
              <path className="neo-bezier-path" d="M290 60 C342 60, 338 126, 390 126" />
              <path className="neo-bezier-path" d="M184 126 C262 126, 278 126, 356 126" />

              <circle className="neo-bezier-particle neo-particle-a" r="4" />
              <circle className="neo-bezier-particle neo-particle-b" r="4" />
              <circle className="neo-bezier-particle neo-particle-c" r="4" />
            </svg>

            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="neo-canvas-node neo-canvas-trigger">
              <p>Trigger</p>
              <strong>Webhook Event</strong>
            </motion.div>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="neo-canvas-node neo-canvas-ai">
              <p>AI Node</p>
              <strong>Reason + Retrieve</strong>
            </motion.div>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="neo-canvas-node neo-canvas-guard">
              <p>Guardrail</p>
              <strong>Policy Check</strong>
            </motion.div>
            <motion.div whileHover={{ y: -4, scale: 1.02 }} className="neo-canvas-node neo-canvas-output">
              <p>Output</p>
              <strong>Publish Response</strong>
            </motion.div>
          </div>
          <div className="neo-console-foot">Real-time orchestration with policy-aware execution.</div>
        </motion.aside>
      </section>

      <section className="neo-trust-strip" aria-label="Trust and social proof">
        <p>Trusted by teams running production AI automation</p>
        <div className="neo-trust-logos" role="list" aria-label="Customer segments">
          {trustMarks.map((mark) => (
            <span key={mark} role="listitem" className="neo-trust-chip">
              {mark}
            </span>
          ))}
        </div>
      </section>

      <motion.section
        id="docs"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="neo-live-panel"
      >
        <div className="neo-live-head">
          <p className="neo-kicker">SYSTEM STATUS</p>
          <h2>Live execution signal panel</h2>
        </div>
        <div className="neo-live-grid">
          <article className="neo-live-card">
            <p>Total Runs Today</p>
            <strong>{runs.toLocaleString()}</strong>
            <span className="neo-live-dot">+312 in last hour</span>
          </article>
          <article className="neo-live-card">
            <p>Success Rate</p>
            <strong>{success.toFixed(2)}%</strong>
            <span className="neo-live-dot">stable with guardrails</span>
          </article>
          <article className="neo-live-card">
            <p>Median Runtime</p>
            <strong>{latency}ms</strong>
            <span className="neo-live-dot">flow optimized</span>
          </article>
          <article className="neo-live-card neo-live-graph">
            <p>Activity Stream</p>
            <div className="neo-bars" aria-hidden="true">
              <span className="neo-bar" />
              <span className="neo-bar" />
              <span className="neo-bar" />
              <span className="neo-bar" />
              <span className="neo-bar" />
              <span className="neo-bar" />
            </div>
          </article>
        </div>
      </motion.section>

      <section id="use-cases" className="neo-lifecycle" aria-label="AI pipeline lifecycle">
        {lifecycle.map((step, index) => (
          <motion.article
            key={step.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.34, delay: index * 0.08 }}
            className="neo-lifecycle-step"
          >
            <span className="neo-lifecycle-index">0{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </motion.article>
        ))}
      </section>

      <section className="neo-feature-strip" aria-label="Core capabilities">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.38, delay: index * 0.08 }}
            className="neo-feature-card"
          >
            <p className="neo-feature-eyebrow">{feature.eyebrow}</p>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </motion.article>
        ))}
      </section>

      <section id="demo" className="neo-workflow" aria-label="Workflow path preview">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="neo-workflow-copy"
        >
          <p className="neo-kicker">INTERACTIVE WORKFLOW</p>
          <h2>Drag node cards and model your AI pipeline flow.</h2>
          <p>
            This visual builder simulates an automation board so users instantly see how workflow orchestration works.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="neo-workflow-line neo-workflow-board"
          ref={boardRef}
        >
          <div className="neo-workflow-connector" aria-hidden="true" />
          <motion.div drag dragConstraints={boardRef} className="neo-drag-node neo-drag-trigger" whileHover={{ scale: 1.04 }}>
            Trigger
          </motion.div>
          <motion.div drag dragConstraints={boardRef} className="neo-drag-node neo-drag-ai" whileHover={{ scale: 1.04 }}>
            AI Node
          </motion.div>
          <motion.div drag dragConstraints={boardRef} className="neo-drag-node neo-drag-guard" whileHover={{ scale: 1.04 }}>
            Guardrail
          </motion.div>
          <motion.div drag dragConstraints={boardRef} className="neo-drag-node neo-drag-output" whileHover={{ scale: 1.04 }}>
            Output
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        id="pricing"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        className="neo-final"
      >
        <h2>Launch AI automation with confidence.</h2>
        <p>Start free, ship faster, and scale with a platform built for production workflow control.</p>
        <div className="neo-hero-actions">
          <Link className="button button-gradient neo-cta-pulse" href="/register">
            Get Started Free
          </Link>
          <a className="button button-ghost" href="#demo">
            View Demo
          </a>
        </div>
      </motion.section>
    </main>
  );
}
