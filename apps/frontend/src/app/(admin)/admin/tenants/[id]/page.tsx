export default function AdminTenantDetailPage() {
  return (
    <section className="control-header">
      <h1>Tenant Detail</h1>
      <p>Overview, users, plugins, billing posture, and compliance evidence timeline.</p>
      <div className="control-grid">
        <article className="control-card">
          <h2>Plan</h2>
          <p className="control-kpi">Enterprise</p>
          <p>Renews in 41 days with dedicated policy packs enabled.</p>
        </article>
        <article className="control-card">
          <h2>Trust Score</h2>
          <p className="control-kpi">91</p>
          <p>Stable across last seven days, with one pending remediation step.</p>
        </article>
        <article className="control-card">
          <h2>Active Users</h2>
          <p className="control-kpi">34</p>
          <p>3 admins, 9 builders, 22 business operators.</p>
        </article>
      </div>
    </section>
  );
}
