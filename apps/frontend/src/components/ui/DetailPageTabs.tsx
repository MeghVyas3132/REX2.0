"use client";

import React, { useState } from "react";

export type DetailPageTab = {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
  disabled?: boolean;
};

export type DetailPageTabsProps = {
  tabs: DetailPageTab[];
  defaultTab?: string;
};

export function DetailPageTabs({ tabs, defaultTab }: DetailPageTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: 0 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            disabled={tab.disabled}
            style={{
              padding: "0.75rem 1rem",
              border: "none",
              backgroundColor: activeTab === tab.id ? "var(--background)" : "transparent",
              borderBottom: activeTab === tab.id ? "2px solid var(--primary)" : "none",
              cursor: tab.disabled ? "not-allowed" : "pointer",
              opacity: tab.disabled ? 0.5 : 1,
              fontSize: "0.875rem",
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? "var(--primary)" : "var(--text-secondary)",
              transition: "all 200ms",
            }}
          >
            {tab.icon && `${tab.icon} `}
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: "1.5rem" }}>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
