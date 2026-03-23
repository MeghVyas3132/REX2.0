export default function StudioSettingsPage() {
  return (
    <section className="control-header">
      <h1>Tenant Settings</h1>
      <p>Manage team access, compliance modes, spending limits, and BYOK providers.</p>
      <article className="control-card">
        <h3>Configuration groups</h3>
        <ul className="control-list">
          <li><span>Team roles and access boundaries</span><span className="control-badge">configured</span></li>
          <li><span>Compliance policy packs</span><span className="control-badge">configured</span></li>
          <li><span>BYOK for Gemini/Groq providers</span><span className="control-badge control-badge--warn">review</span></li>
          <li><span>Retention and audit export policies</span><span className="control-badge">configured</span></li>
        </ul>
      </article>
    </section>
  );
}
