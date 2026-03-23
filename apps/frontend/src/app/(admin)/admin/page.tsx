export default function AdminPage() {
  return (
    <section className="control-header">
      <h1>Global Admin Command Deck</h1>
      <p>Operate tenancy, catalogue quality, and trust posture from one control surface.</p>

      <div className="control-grid">
        <article className="control-card">
          <h2>Active Tenants</h2>
          <p className="control-kpi">128</p>
          <p>Enterprise tenants currently provisioned across all regions.</p>
        </article>
        <article className="control-card">
          <h2>Policy Violations</h2>
          <p className="control-kpi">6</p>
          <p>Open governance exceptions requiring triage in the next 24 hours.</p>
        </article>
        <article className="control-card">
          <h2>Plugin Health</h2>
          <p className="control-kpi">97.8%</p>
          <p>Catalogue availability based on execution telemetry and sandbox checks.</p>
        </article>
      </div>

      <article className="control-card">
        <h3>Today&apos;s high-priority actions</h3>
        <ul className="control-list">
          <li>
            <span>Review compliance downgrade on tenant `northstar-finance`</span>
            <span className="control-badge--error control-badge">critical</span>
          </li>
          <li>
            <span>Approve plugin version `crm.sync.v4` for staged rollout</span>
            <span className="control-badge--warn control-badge">pending</span>
          </li>
          <li>
            <span>Rotate expired service token for global audit export</span>
            <span className="control-badge">healthy</span>
          </li>
        </ul>
      </article>
    </section>
  );
}
