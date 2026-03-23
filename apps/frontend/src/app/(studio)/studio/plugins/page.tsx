export default function StudioPluginsPage() {
  return (
    <section className="control-header">
      <h1>Plugin Catalogue</h1>
      <p>Enable, configure, and test tenant plugins before production execution.</p>
      <div className="control-grid">
        <article className="control-card">
          <h2>Connected</h2>
          <p className="control-kpi">14</p>
          <p>Live integrations with valid credentials and sandbox checks passing.</p>
        </article>
        <article className="control-card">
          <h2>Needs Secret</h2>
          <p className="control-kpi">2</p>
          <p>Integrations installed but blocked until credentials are supplied.</p>
        </article>
        <article className="control-card">
          <h2>Policy Locked</h2>
          <p className="control-kpi">1</p>
          <p>Restricted by tenant governance until manual admin approval.</p>
        </article>
      </div>
    </section>
  );
}
