import dynamic from "next/dynamic";

const AdminTenantsPageClient = dynamic(
  () => import("@/components/admin/AdminTenantsPageClient").then((mod) => mod.AdminTenantsPageClient),
  {
    loading: () => <div className="page-state">Loading tenants...</div>,
  },
);

export default function AdminTenantsPage() {
  return <AdminTenantsPageClient />;
}
