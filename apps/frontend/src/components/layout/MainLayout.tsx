"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import "./main-layout.css";

interface NavItem {
  href: string;
  label: string;
  icon: string;
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
  return (
    <div className="main-layout">
      <Sidebar
        items={sidebarItems}
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
