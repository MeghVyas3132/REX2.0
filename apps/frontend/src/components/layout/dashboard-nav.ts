type DashboardSection =
  | "workflows"
  | "active-workflows"
  | "current-workflow"
  | "corpora"
  | "kpi"
  | "templates"
  | "settings";

type DashboardNavItem = {
  label: string;
  href: string;
  active?: boolean;
  icon?: DashboardSection;
};

const BASE_NAV: Array<{ section: DashboardSection; label: string; href: string }> = [
  { section: "workflows", label: "Workflows", href: "/dashboard" },
  {
    section: "active-workflows",
    label: "Active Workflows",
    href: "/dashboard/active-workflows",
  },
  {
    section: "current-workflow",
    label: "Current Workflow",
    href: "/dashboard/current-workflow",
  },
  { section: "corpora", label: "Corpora", href: "/dashboard/corpora" },
  { section: "kpi", label: "KPI", href: "/dashboard/kpi" },
  { section: "templates", label: "Templates", href: "/dashboard/templates" },
  { section: "settings", label: "Settings", href: "/dashboard/settings" },
];

export function getDashboardNavItems(activeSection: DashboardSection): DashboardNavItem[] {
  return BASE_NAV.map((item) => ({
    label: item.label,
    href: item.href,
    active: item.section === activeSection,
    icon: item.section,
  }));
}
