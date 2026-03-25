"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./sidebar.css";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
}

export function Sidebar({ items, title, subtitle }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">{title}</h2>
        {subtitle && <p className="sidebar-subtitle">{subtitle}</p>}
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <div key={item.href} className="sidebar-item-wrapper">
            <Link
              href={item.href}
              className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
            {item.children && isActive(item.href) && (
              <div className="sidebar-children">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`sidebar-child-item ${
                      isActive(child.href) ? "active" : ""
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
