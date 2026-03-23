export default function StudioPage() {
  return (
    <section className="control-header">
      <h1>Studio Dashboard</h1>
      <p>Design automation graphs, pressure-test trust posture, and ship certified workflows.</p>
      <div className="control-grid">
        <article className="control-card">
          <h2>Draft Workflows</h2>
          <p className="control-kpi">18</p>
          <p>In-progress DAGs across product, support, and internal ops teams.</p>
        </article>
        <article className="control-card">
          <h2>Average Trust</h2>
          <p className="control-kpi">88</p>
          <p>Trust score after automatic REX scoring and remediation suggestions.</p>
        </article>
        <article className="control-card">
          <h2>Pending Publish</h2>
          <p className="control-kpi">5</p>
          <p>Awaiting final owner approval and execution dry-run evidence.</p>
        </article>
      </div>
    </section>
  );
}
