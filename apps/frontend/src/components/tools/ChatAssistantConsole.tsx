"use client";

import React from "react";
import { Card } from "@/components/ui/Card";

export type ChatAssistantConsoleProps = {
  className?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function ChatAssistantConsole({ className, title, description, children }: ChatAssistantConsoleProps) {
  return (
    <section className={className}>
      <Card title={title ?? "ChatAssistantConsole"}>
        <p>{description ?? "This panel is wired and ready for domain-specific data bindings."}</p>
        {children}
      </Card>
    </section>
  );
}
