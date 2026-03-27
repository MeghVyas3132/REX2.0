"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/session-context";
import { getAppRole, type AppRole } from "@/lib/rbac/permissions";

export type NavLink = {
  href: string;
  label: string;
  roles: AppRole[];
};

export type NavSection = {
  title: string;
  links: NavLink[];
};

const navSections: NavSection[] = [
  {
    title: "Core",
    links: [
      { href: "/dashboard", label: "Dashboard", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/workflows", label: "Workflows", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/workflows/active", label: "Active Runs", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/templates", label: "Templates", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/knowledge/corpora", label: "Knowledge", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/publications", label: "Publications", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
    ],
  },
  {
    title: "Control",
    links: [
      { href: "/governance/kpi", label: "Governance", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/compliance/report", label: "Compliance", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/tenant/profile", label: "Tenant", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/tools/api-keys", label: "Tools", roles: ["super_admin", "org_admin", "org_editor", "org_viewer"] },
      { href: "/tenants", label: "Admin", roles: ["super_admin"] },
    ],
  },
];

export function getVisibleNavSections(role: AppRole | null): NavSection[] {
  if (!role) return [];
  return navSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => link.roles.includes(role)),
    }))
    .filter((section) => section.links.length > 0);
}

export function AppNav() {
  const pathname = usePathname();
  const { user } = useSession();
  const role = getAppRole(user);
  const visibleSections = getVisibleNavSections(role);

  return (
    <nav aria-label="Primary navigation">
      <h3>REX</h3>
      {visibleSections.map((section) => (
        <div key={section.title} className="nav-section">
          <p className="nav-section-title">{section.title}</p>
          <ul>
            {section.links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <li key={link.href}>
                  <Link
                    className={isActive ? "active-link" : ""}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
