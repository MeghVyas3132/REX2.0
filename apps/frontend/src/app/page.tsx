import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      title: "Workflow Automation",
      description: "Design DAG-based automations with reusable nodes, branching logic, and governed execution paths.",
      icon: "WF",
    },
    {
      title: "Guardrails",
      description: "Enforce input/output controls, policy checks, and runtime safety constraints across every execution.",
      icon: "GR",
    },
    {
      title: "KPI Insights",
      description: "Track throughput, latency, and quality signals with operational visibility built for AI systems.",
      icon: "KP",
    },
    {
      title: "Governance",
      description: "Apply role-aware access, workspace controls, and audit-friendly operations from one control plane.",
      icon: "GV",
    },
  ];

  const testimonials = [
    {
      quote:
        "REX helped us move from prompt experiments to governed production workflows with measurable stability.",
      author: "Platform Engineering Lead",
      org: "Enterprise SaaS",
    },
    {
      quote:
        "The workflow-first model made AI operations understandable for product, security, and ops teams together.",
      author: "Director of Automation",
      org: "Digital Commerce Group",
    },
    {
      quote:
        "We replaced scattered scripts with one execution layer and immediately improved auditability and speed.",
      author: "Head of Data Systems",
      org: "FinTech Platform",
    },
  ];

  return (
    <main className="landing-shell">
      <div className="landing-bg" aria-hidden="true" />

      <section className="landing-hero landing-reveal">
        <p className="landing-eyebrow">Rex AI Automation Platform</p>
        <h1>Build, Govern, and Scale AI Workflows with Confidence</h1>
        <p className="landing-subtext">
          Orchestrate production-grade automation through visual workflows, runtime guardrails, and operational intelligence.
        </p>
        <div className="landing-hero-actions">
          <Link className="button button-primary landing-cta-primary" href="/select-mode">
            Start Building
          </Link>
          <Link className="button button-secondary landing-cta-secondary" href="/login">
            Try Now
          </Link>
        </div>
      </section>

      <section className="landing-workflow landing-reveal">
        <div className="landing-section-head">
          <p className="landing-section-label">Interactive Workflow Preview</p>
          <h2>From trigger to governed execution in one visual flow</h2>
        </div>
        <div className="workflow-preview" role="img" aria-label="Mock workflow preview">
          <div className="workflow-node workflow-node-trigger">Trigger</div>
          <div className="workflow-edge" />
          <div className="workflow-node workflow-node-llm">AI Node</div>
          <div className="workflow-edge" />
          <div className="workflow-node workflow-node-guard">Guardrail</div>
          <div className="workflow-edge" />
          <div className="workflow-node workflow-node-output">Output</div>
        </div>
      </section>

      <section className="landing-features landing-reveal">
        <div className="landing-section-head">
          <p className="landing-section-label">Core Capabilities</p>
          <h2>Everything you need to operate AI workflows at production scale</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="landing-feature-card">
              <span className="landing-feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-trust landing-reveal">
        <div className="landing-section-head">
          <p className="landing-section-label">Trust & Outcomes</p>
          <h2>Teams use REX to turn experimentation into reliable operations</h2>
        </div>
        <div className="landing-testimonial-grid">
          {testimonials.map((item) => (
            <article key={`${item.author}-${item.org}`} className="landing-testimonial-card">
              <p className="landing-testimonial-quote">"{item.quote}"</p>
              <p className="landing-testimonial-meta">
                {item.author} · {item.org}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta landing-reveal">
        <h2>Ready to operationalize your AI workflows?</h2>
        <p>Choose your mode and launch with a platform built for reliability, governance, and speed.</p>
        <div className="landing-hero-actions">
          <Link className="button button-primary landing-cta-primary" href="/select-mode">
            Enter Platform
          </Link>
          <Link className="button button-secondary landing-cta-secondary" href="/register">
            Create Account
          </Link>
        </div>
      </section>
    </main>
  );
}
