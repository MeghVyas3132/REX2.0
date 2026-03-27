import dynamic from "next/dynamic";

const AdminPluginsPageClient = dynamic(
  () => import("@/components/admin/AdminPluginsPageClient").then((mod) => mod.AdminPluginsPageClient),
  {
    loading: () => <div className="page-state">Loading plugins...</div>,
  },
);

export default function PluginsPage() {
  return <AdminPluginsPageClient />;
}
