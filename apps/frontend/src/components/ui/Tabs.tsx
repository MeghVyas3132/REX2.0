"use client";

import React, { useState, ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

type TabsProps = {
  tabs: Tab[];
  defaultTab?: string;
};

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "1rem" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: "0.75rem 1rem",
              border: "none",
              backgroundColor: "transparent",
              borderBottom: active === tab.id ? "2px solid var(--primary)" : "none",
              color: active === tab.id ? "var(--primary)" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: active === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ padding: "1rem 0" }}>
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
