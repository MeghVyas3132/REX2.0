"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

export interface AppShellNavItem {
  label: string;
  href: string;
  active?: boolean;
  icon?: AppShellNavIcon;
}

export type AppShellNavIcon =
  | "workflows"
  | "active-workflows"
  | "current-workflow"
  | "corpora"
  | "kpi"
  | "templates"
  | "settings";

interface AppShellProps {
  brand?: string;
  navItems: AppShellNavItem[];
  userName?: string;
  onSignOut?: () => void;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  brand = "REX",
  navItems,
  userName,
  onSignOut,
  title,
  subtitle,
  action,
  children,
}: AppShellProps) {
  return (
    <div className="rex-shell" style={layoutStyle}>
      <div className="rex-shell__atmo" aria-hidden="true" />
      <aside className="rex-shell__sidebar" style={sidebarStyle}>
        <div className="rex-shell__brand" style={brandStyle}>
          <BrandMark />
          <span>{brand}</span>
        </div>

        <nav className="rex-shell__nav" style={navStyle}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rex-shell__nav-item"
              aria-current={item.active ? "page" : undefined}
              style={{
                ...navItemStyle,
                ...(item.active ? navItemActiveStyle : null),
              }}
            >
              <span className="rex-shell__nav-icon" aria-hidden="true">
                <SidebarIcon name={item.icon} />
              </span>
              <span className="rex-shell__nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="rex-shell__user" style={userZoneStyle}>
          <span className="rex-shell__user-name" style={userNameStyle}>{userName || "Unknown User"}</span>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <span className="rex-shell__btn-icon" aria-hidden="true">
              <SignOutIcon />
            </span>
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="rex-shell__main page-reveal" style={mainStyle}>
        <header className="rex-shell__header" style={headerStyle}>
          <div>
            <h1 className="rex-shell__title" style={titleStyle}>{title}</h1>
            {subtitle ? <p className="rex-shell__subtitle" style={subtitleStyle}>{subtitle}</p> : null}
          </div>
          {action}
        </header>
        {children}
      </main>
    </div>
  );
}

const layoutStyle: CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  background:
    "radial-gradient(1300px 700px at 90% -20%, rgba(79,120,255,0.16), transparent 60%), var(--surface-0)",
};

const sidebarStyle: CSSProperties = {
  width: 224,
  borderRight: "1px solid var(--border-muted)",
  backgroundColor: "rgba(6, 10, 18, 0.88)",
  backdropFilter: "blur(6px)",
  padding: "16px 10px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const brandStyle: CSSProperties = {
  color: "var(--text-primary)",
  fontSize: 20,
  letterSpacing: "0.2em",
  fontWeight: 700,
  padding: "4px 8px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const navStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  flex: 1,
  border: "1px solid color-mix(in srgb, var(--border-muted) 75%, transparent)",
  borderRadius: 12,
  background: "linear-gradient(180deg, rgba(15, 24, 42, 0.44), rgba(8, 14, 26, 0.22))",
  padding: "6px",
};

const navItemStyle: CSSProperties = {
  color: "var(--text-secondary)",
  borderRadius: 9,
  padding: "8px 10px",
  fontSize: 13,
  textDecoration: "none",
  border: "1px solid transparent",
  transition: "all var(--motion-fast)",
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
};

const navItemActiveStyle: CSSProperties = {
  color: "var(--text-primary)",
  border: "1px solid color-mix(in srgb, var(--accent-500) 42%, var(--border-strong))",
  backgroundColor: "color-mix(in srgb, var(--accent-500) 16%, transparent)",
  boxShadow:
    "0 0 0 1px color-mix(in srgb, var(--accent-500) 22%, transparent), 0 6px 18px rgba(46, 122, 255, 0.16)",
};

const userZoneStyle: CSSProperties = {
  borderTop: "1px solid var(--border-muted)",
  paddingTop: 10,
  display: "grid",
  gap: 8,
};

const userNameStyle: CSSProperties = {
  color: "var(--text-tertiary)",
  fontSize: 12,
  paddingInline: 2,
};

const mainStyle: CSSProperties = {
  flex: 1,
  padding: "30px 34px",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 24,
  gap: 18,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontSize: 28,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
};

const subtitleStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--text-tertiary)",
  fontSize: 13,
  maxWidth: 760,
};

function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5h10a4.5 4.5 0 0 1 0 9H8.5" />
      <path d="M4 5.5V19" />
      <path d="M8.5 14.5 15 19" />
      <circle cx="17.5" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5h2a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 14 15.5h-2" />
      <path d="M8.5 13.5 11.5 10 8.5 6.5" />
      <path d="M11 10H3.5" />
    </svg>
  );
}

function SidebarIcon({ name }: { name?: AppShellNavIcon }) {
  switch (name) {
    case "workflows":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.5" y="3" width="6" height="6" rx="1.2" />
          <rect x="11.5" y="3" width="6" height="6" rx="1.2" />
          <rect x="2.5" y="11" width="6" height="6" rx="1.2" />
          <path d="M11.5 14h6" />
          <path d="M14.5 11v6" />
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
    case "templates":
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3.5h12v13H4Z" />
          <path d="M4 8h12" />
          <path d="M8 8v8" />
          <path d="M10.8 11h3" />
          <path d="M10.8 13.8h3" />
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
    default:
      return (
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="6" />
        </svg>
      );
  }
}
