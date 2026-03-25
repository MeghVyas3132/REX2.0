"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./layout-shell.css";

export type SidebarIcon =
  | "dashboard"
  | "workflows"
  | "active-workflows"
  | "current-workflow"
  | "corpora"
  | "kpi"
  | "settings"
  | "executions"
  | "company"
  | "create"
  | "templates"
  | "plugins"
  | "tenants"
  | "audit";

interface NavItem {
  href: string;
  label: string;
  icon?: SidebarIcon;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  items,
  title,
  subtitle,
  collapsed = false,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={collapsed ? "layout-sidebar layout-sidebar--collapsed" : "layout-sidebar"}
      aria-label="Primary navigation"
    >
      <div className="layout-sidebar-header">
        <div className="layout-sidebar-title-row">
          <h2 className="layout-sidebar-title">
            {collapsed ? "REX" : title}
          </h2>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="layout-sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>
        {!collapsed && subtitle ? <p className="layout-sidebar-subtitle">{subtitle}</p> : null}
      </div>

      <nav className="layout-sidebar-nav">
        {items.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={isActive(item.href) ? "layout-sidebar-link layout-sidebar-link--active" : "layout-sidebar-link"}
              title={collapsed ? item.label : undefined}
            >
              <span className="layout-sidebar-icon-wrap">
                <SidebarItemIcon icon={item.icon} />
              </span>
              {!collapsed ? <span className="layout-sidebar-label">{item.label}</span> : null}
            </Link>
            {item.children && isActive(item.href) && (
              <div className="layout-sidebar-children">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={isActive(child.href) ? "layout-sidebar-child-link layout-sidebar-child-link--active" : "layout-sidebar-child-link"}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="layout-sidebar-footer">
        <button
          type="button"
          className="layout-sidebar-logout"
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
        >
          <span className="layout-sidebar-icon-wrap">
            <LogoutIcon />
          </span>
          {!collapsed ? <span className="layout-sidebar-label">Logout</span> : null}
        </button>
      </div>
    </aside>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {collapsed ? <path d="m7 4 6 6-6 6" /> : <path d="m13 4-6 6 6 6" />}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4.5h-1.5A1.5 1.5 0 0 0 4 6v8a1.5 1.5 0 0 0 1.5 1.5H7" />
      <path d="M11 6.5 15 10l-4 3.5" />
      <path d="M15 10H8" />
    </svg>
  );
}

function SidebarItemIcon({ icon }: { icon?: SidebarIcon }) {
  switch (icon) {
    case "dashboard":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="3" width="6" height="6" rx="1.2" />
          <rect x="11.5" y="3" width="6" height="6" rx="1.2" />
          <rect x="2.5" y="11" width="6" height="6" rx="1.2" />
          <path d="M11.5 14h6" />
          <path d="M14.5 11v6" />
        </svg>
      );
    case "workflows":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
          <circle cx="4" cy="16" r="1.5" />
          <path d="M5.4 4.8 14.6 9.2" />
          <path d="M5.4 15.2 14.6 10.8" />
        </svg>
      );
    case "active-workflows":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2.5v3" />
          <path d="M3.8 6l2.1 2.1" />
          <path d="M2.5 10h3" />
          <path d="M3.8 14 5.9 11.9" />
          <path d="M10 14.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
          <path d="m12.5 12.5 4 4" />
        </svg>
      );
    case "current-workflow":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="4" cy="4" r="1.5" />
          <circle cx="16" cy="10" r="1.5" />
          <circle cx="4" cy="16" r="1.5" />
          <path d="M5.4 4.8 14.6 9.2" />
          <path d="M5.4 15.2 14.6 10.8" />
        </svg>
      );
    case "corpora":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 4.5a2 2 0 0 1 2-2h10v14.5H5a2 2 0 0 0-2 2Z" />
          <path d="M15 2.5v14.5" />
          <path d="M6.5 6.5h5" />
          <path d="M6.5 9.5h5" />
        </svg>
      );
    case "kpi":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 16.5h14" />
          <path d="M5.5 13V9" />
          <path d="M10 13V6" />
          <path d="M14.5 13v-3" />
          <path d="m4.8 7.8 4.4-2.4 2.8 1.6 3.3-2" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="2.8" />
          <path d="M10 2.5v2" />
          <path d="M10 15.5v2" />
          <path d="M2.5 10h2" />
          <path d="M15.5 10h2" />
          <path d="m4.7 4.7 1.4 1.4" />
          <path d="m13.9 13.9 1.4 1.4" />
          <path d="m15.3 4.7-1.4 1.4" />
          <path d="m6.1 13.9-1.4 1.4" />
        </svg>
      );
    case "executions":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4.5v11" />
          <path d="m15.5 10-7 4.2V5.8Z" />
        </svg>
      );
    case "company":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17.5h14" />
          <path d="M5 17.5V6.5h10v11" />
          <path d="M8 10h1" />
          <path d="M11 10h1" />
          <path d="M8 13h1" />
          <path d="M11 13h1" />
        </svg>
      );
    case "create":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 4v12" />
          <path d="M4 10h12" />
        </svg>
      );
    case "templates":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3.5h12v13H4Z" />
          <path d="M4 8h12" />
          <path d="M8 8v8" />
        </svg>
      );
    case "plugins":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3.5v4" />
          <path d="M12 3.5v4" />
          <path d="M6 7.5h8v4.5a3.5 3.5 0 1 1-8 0Z" />
          <path d="M10 12v4.5" />
        </svg>
      );
    case "tenants":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17.5h14" />
          <path d="M4 17.5V8l6-3 6 3v9.5" />
          <path d="M8 12h4" />
        </svg>
      );
    case "audit":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="12" height="14" rx="2" />
          <path d="M7 7.5h6" />
          <path d="M7 10.5h6" />
          <path d="M7 13.5h4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="6" />
        </svg>
      );
  }
}
