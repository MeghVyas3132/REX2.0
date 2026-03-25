"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "./Sidebar";
import type { SidebarIcon } from "./Sidebar";
import "./layout-shell.css";

interface NavItem {
  href: string;
  label: string;
  icon?: SidebarIcon;
}

interface MainLayoutProps {
  children: ReactNode;
  sidebarItems: NavItem[];
  sidebarTitle: string;
  sidebarSubtitle?: string;
}

export function MainLayout({
  children,
  sidebarItems,
  sidebarTitle,
  sidebarSubtitle,
}: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isEditorRoute = useMemo(
    () => /^\/(dashboard|studio|business)\/workflows\/[^/]+$/.test(pathname || ""),
    [pathname]
  );

  const isTemplatesStandaloneRoute = useMemo(
    () => /^(\/templates(?:\/[^/]+)?|\/dashboard\/templates(?:\/[^/]+)?)$/.test(pathname || ""),
    [pathname]
  );

  const isAppShellOnlyPage = useMemo(
    () => /^\/(dashboard\/(active-workflows|corpora|kpi|settings|current-workflow)|templates(?:\/[^/]+)?)$/.test(pathname || ""),
    [pathname]
  );

  const hideOuterShell = isEditorRoute || isTemplatesStandaloneRoute || isAppShellOnlyPage;

  const activeTitle = useMemo(() => {
    const item = sidebarItems.find((navItem) => pathname?.startsWith(navItem.href));
    return item?.label ?? sidebarTitle;
  }, [pathname, sidebarItems, sidebarTitle]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="layout-shell">
      {!hideOuterShell ? (
        <Sidebar
          items={sidebarItems}
          title={sidebarTitle}
          subtitle={sidebarSubtitle}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onLogout={handleLogout}
        />
      ) : null}

      <main className="layout-shell-main">
        {!hideOuterShell ? (
          <header className="layout-shell-header">
            <h1 className="layout-shell-title">{activeTitle}</h1>
          </header>
        ) : null}

        <section className={hideOuterShell ? "layout-shell-content layout-shell-content--editor" : "layout-shell-content"}>
          {children}
        </section>
      </main>
    </div>
  );
}
