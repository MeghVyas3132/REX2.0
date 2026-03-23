import Link from "next/link";

export default function BusinessPage() {
  return (
    <section className="control-header">
      <h1>Business Operations</h1>
      <p>Run approved automations with clear trust signals and step-level visibility.</p>
      <div className="control-grid">
        <article className="control-card">
          <h2>Executions Today</h2>
          <p className="control-kpi">412</p>
          <p>Across customer support, claims triage, and billing workflows.</p>
        </article>
        <article className="control-card">
          <h2>Success Rate</h2>
          <p className="control-kpi">98.2%</p>
          <p>Includes automatic retries and policy-level fallback paths.</p>
        </article>
        <article className="control-card">
          <h2>Certified Runs</h2>
          <p className="control-kpi">100%</p>
          <p>All active templates passed REX guardrails before publishing.</p>
        </article>
      </div>
      <article className="control-card">
        <h3>Quick actions</h3>
        <ul className="control-list">
          <li>
            <span>Run a published workflow</span>
            <Link className="control-link" href="/business/workflows">Open</Link>
          </li>
          <li>
            <span>Review execution history</span>
            <Link className="control-link" href="/business/history">View log</Link>
          </li>
        </ul>
      </article>
    </section>
  );
}
