type AdminSection = "tenants" | "plugins" | "audit-log";

type AdminNavItem = {
  label: string;
  href: string;
  active?: boolean;
  icon?: AdminSection;
};

const BASE_NAV: Array<{ section: AdminSection; label: string; href: string }> = [
  { section: "tenants", label: "Tenants", href: "/admin/tenants" },
  { section: "plugins", label: "Node Registry", href: "/admin/plugins" },
  { section: "audit-log", label: "Audit Log", href: "/admin/audit-log" },
];

export function getAdminNavItems(activeSection: AdminSection): AdminNavItem[] {
  return BASE_NAV.map((item) => ({
    label: item.label,
    href: item.href,
    active: item.section === activeSection,
    icon: item.section,
  }));
}
