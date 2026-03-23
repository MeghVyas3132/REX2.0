'use client';

import React from 'react';
import '../layout/layout.css';

export interface LayoutProps {
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ sidebar, topbar, children, footer }, ref) => {
    return (
      <div ref={ref} className="layout">
        {sidebar && <aside className="layout__sidebar">{sidebar}</aside>}
        {topbar && <header className="layout__topbar">{topbar}</header>}
        <main className="layout__content">{children}</main>
        {footer && <footer className="layout__footer">{footer}</footer>}
      </div>
    );
  },
);

Layout.displayName = 'Layout';

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className = '', ...props }, ref) => (
    <nav ref={ref} className={`sidebar ${className}`.trim()} {...props} />
  ),
);

Sidebar.displayName = 'Sidebar';

export interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const SidebarSection = React.forwardRef<
  HTMLDivElement,
  SidebarSectionProps
>(({ label, className = '', children, ...props }, ref) => (
  <div ref={ref} className={`sidebar__section ${className}`.trim()} {...props}>
    {label && <div className="sidebar__label">{label}</div>}
    <nav className="sidebar__nav">{children}</nav>
  </div>
));

SidebarSection.displayName = 'SidebarSection';

export interface SidebarItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  active?: boolean;
}

export const SidebarItem = React.forwardRef<
  HTMLButtonElement,
  SidebarItemProps
>(({ icon, active = false, className = '', children, ...props }, ref) => (
  <button
    ref={ref}
    className={`sidebar__item ${active ? 'active' : ''} ${className}`.trim()}
    {...props}
  >
    {icon && <span className="sidebar__icon">{icon}</span>}
    {children}
  </button>
));

SidebarItem.displayName = 'SidebarItem';

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {}

export const Topbar = React.forwardRef<HTMLElement, TopbarProps>(
  ({ className = '', ...props }, ref) => (
    <header ref={ref} className={`topbar ${className}`.trim()} {...props} />
  ),
);

Topbar.displayName = 'Topbar';

export interface TopbarLeftProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TopbarLeft = React.forwardRef<HTMLDivElement, TopbarLeftProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`topbar__left ${className}`.trim()} {...props} />
  ),
);

TopbarLeft.displayName = 'TopbarLeft';

export interface TopbarRightProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TopbarRight = React.forwardRef<HTMLDivElement, TopbarRightProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`topbar__right ${className}`.trim()} {...props} />
  ),
);

TopbarRight.displayName = 'TopbarRight';
