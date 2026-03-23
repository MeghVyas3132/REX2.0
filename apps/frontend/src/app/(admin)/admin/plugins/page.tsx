export default function AdminPluginsPage() {
  return (
    <section className="control-header">
      <h1>Plugin Catalogue</h1>
      <p>Manage global plugin quality gates, release channels, and visibility rules.</p>
      <div className="control-grid">
        <article className="control-card">
          <h2>Published</h2>
          <p className="control-kpi">62</p>
          <p>Catalogued integrations approved for tenant consumption.</p>
        </article>
        <article className="control-card">
          <h2>In Review</h2>
          <p className="control-kpi">4</p>
          <p>Awaiting schema validation and capability policy checks.</p>
        </article>
        <article className="control-card">
          <h2>Deprecated</h2>
          <p className="control-kpi">3</p>
          <p>Legacy adapters retained only for migration windows.</p>
        </article>
      </div>
    </section>
  );
}
