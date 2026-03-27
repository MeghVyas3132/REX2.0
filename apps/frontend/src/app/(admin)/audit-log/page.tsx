import dynamic from "next/dynamic";

const AdminAuditLogPageClient = dynamic(
  () => import("@/components/admin/AdminAuditLogPageClient").then((mod) => mod.AdminAuditLogPageClient),
  {
    loading: () => <div className="page-state">Loading audit logs...</div>,
  },
);

export default function AuditLogPage() {
  return <AdminAuditLogPageClient />;
}
