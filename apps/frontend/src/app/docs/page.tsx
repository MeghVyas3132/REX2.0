import Link from "next/link";
import { Button } from "@/components/ui";

export default function DocsPage() {
  return (
    <div className="lp-root docs-root">
      <div className="lp-bg-grid" aria-hidden="true" />
      <div className="lp-bg-glow lp-bg-glow--left" aria-hidden="true" />

      <header className="lp-nav-wrap">
        <nav className="lp-nav">
          <Link href="/" className="lp-brand">
            <span className="lp-brand__glyph" aria-hidden="true"><DocsGlyph /></span>
            <span>REX</span>
          </Link>
          <div className="lp-nav__actions">
            <Link href="/" className="rex-link-reset">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/login" className="rex-link-reset">
              <Button variant="primary" size="sm">Sign In</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="lp-main">
        <section className="lp-section docs-hero page-reveal">
          <p className="lp-kicker">Documentation</p>
          <h1 className="lp-title">Developer and Product Docs are on the way.</h1>
          <p className="lp-subtitle">
            We are preparing guides for workflow design, RAG configuration, governance,
            observability, and production operations.
          </p>
          <div className="docs-grid">
            <article className="docs-card">
              <h3>Platform Guides</h3>
              <p>Concepts for DAG architecture, deterministic execution, and explainability patterns.</p>
            </article>
            <article className="docs-card">
              <h3>API References</h3>
              <p>Endpoint-level docs for auth, workflows, templates, executions, and governance.</p>
            </article>
            <article className="docs-card">
              <h3>Deployment</h3>
              <p>Privacy and compliance setup guidance for enterprise-ready deployments.</p>
            </article>
          </div>
          <div className="lp-hero__actions">
            <Link href="/login" className="rex-link-reset">
              <Button variant="primary" size="lg">Start Building</Button>
            </Link>
            <Link href="/" className="rex-link-reset">
              <Button variant="secondary" size="lg">Back to Landing</Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function DocsGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h11a2 2 0 0 1 2 2v13H8a2 2 0 0 0-2 2Z" />
      <path d="M6 4v17" />
      <path d="M10 9h6" />
      <path d="M10 13h6" />
    </svg>
  );
}
