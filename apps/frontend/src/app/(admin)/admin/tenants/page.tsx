import Link from "next/link";

const demoTenants = [
  { id: "default", name: "Default Tenant", plan: "enterprise", status: "active" },
  { id: "northstar-finance", name: "Northstar Finance", plan: "enterprise", status: "at-risk" },
  { id: "atlas-logistics", name: "Atlas Logistics", plan: "growth", status: "active" },
];

export default function AdminTenantsPage() {
  return (
    <section className="control-header">
      <h1>Tenants</h1>
      <p>Inspect plan, trust status, and route into detailed governance controls.</p>
      <div className="control-card">
        <table className="control-table">
        <thead>
          <tr><th>Name</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {demoTenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.plan}</td>
              <td>
                <span className={tenant.status === "at-risk" ? "control-badge control-badge--warn" : "control-badge"}>
                  {tenant.status}
                </span>
              </td>
              <td><Link className="control-link" href={`/admin/tenants/${tenant.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </section>
  );
}
