type StudioSection = "settings";

type StudioNavItem = {
  label: string;
  href: string;
  active?: boolean;
  icon?: StudioSection;
};

const BASE_NAV: Array<{ section: StudioSection; label: string; href: string }> = [
  { section: "settings", label: "Settings", href: "/studio/settings" },
];

export function getStudioNavItems(activeSection: StudioSection): StudioNavItem[] {
  return BASE_NAV.map((item) => ({
    label: item.label,
    href: item.href,
    active: item.section === activeSection,
    icon: item.section,
  }));
}
