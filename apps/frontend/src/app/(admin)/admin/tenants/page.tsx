import Link from "next/link";

const demoTenants = [
  { id: "default", name: "Default Tenant", plan: "enterprise", status: "active" },
];

export default function AdminTenantsPage() {
  return (
    <section>
      <h1>Tenants</h1>
      <table>
        <thead>
          <tr><th>Name</th><th>Plan</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {demoTenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.plan}</td>
              <td>{tenant.status}</td>
              <td><Link href={`/admin/tenants/${tenant.id}`}>View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
