export default function BusinessHistoryPage() {
  return (
    <section className="control-header">
      <h1>Execution History</h1>
      <p>Trace completed and failed runs with operator identity and decision breadcrumbs.</p>
      <article className="control-card">
        <h3>Recent runs</h3>
        <ul className="control-list">
          <li>
            <span>Customer query analyser · 3m ago</span>
            <span className="control-badge">completed</span>
          </li>
          <li>
            <span>Incident triage · 15m ago</span>
            <span className="control-badge control-badge--warn">needs review</span>
          </li>
          <li>
            <span>Billing escalation flow · 47m ago</span>
            <span className="control-badge">completed</span>
          </li>
        </ul>
      </article>
    </section>
  );
}
