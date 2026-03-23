import Link from "next/link";

export default function StudioWorkflowsPage() {
  return (
    <section className="control-header">
      <h1>Studio Workflows</h1>
      <p>Open an existing workflow or jump into the advanced dashboard canvas editor.</p>
      <article className="control-card">
        <h3>Open editors</h3>
        <ul className="control-list">
          <li>
            <span>Customer Query Analyser</span>
            <span className="control-badge">ready</span>
          </li>
          <li>
            <span>Incident Triage with LLM scoring</span>
            <span className="control-badge control-badge--warn">attention</span>
          </li>
          <li>
            <span>Billing Reconciliation Loop</span>
            <span className="control-badge">ready</span>
          </li>
        </ul>
        <p><Link className="control-link" href="/dashboard/workflows">Open dashboard workflow editor</Link></p>
      </article>
    </section>
  );
}
