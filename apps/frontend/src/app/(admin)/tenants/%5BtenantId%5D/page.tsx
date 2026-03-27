import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default async function AdminTenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId: rawTenantId } = await params;
  const tenantId = decodeURIComponent(rawTenantId);

  return (
    <section>
      <h1>Tenant Detail</h1>
      <p>Tenant ID: {tenantId}</p>

      <Card title="Tenant Overview">
        <p>Tenant-specific overview widgets can be rendered here.</p>
        <p>This page is reachable from the admin tenant list.</p>
        <p>
          <Link href="/tenants">Back to Tenants</Link>
        </p>
      </Card>
    </section>
  );
}
