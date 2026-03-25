type BusinessSection = "workflows";

type BusinessNavItem = {
  label: string;
  href: string;
  active?: boolean;
  icon?: BusinessSection;
};

const BASE_NAV: Array<{ section: BusinessSection; label: string; href: string }> = [
  { section: "workflows", label: "Available Workflows", href: "/business/workflows" },
];

export function getBusinessNavItems(activeSection: BusinessSection): BusinessNavItem[] {
  return BASE_NAV.map((item) => ({
    label: item.label,
    href: item.href,
    active: item.section === activeSection,
    icon: item.section,
  }));
}
