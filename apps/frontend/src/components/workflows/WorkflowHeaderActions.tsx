"use client";

import React from "react";
import { ActionButtonGroup, type ActionGroup } from "@/components/ui/ActionButtonGroup";

export type WorkflowHeaderActionsProps = {
  onNew?: () => void | Promise<void>;
  onImport?: () => void | Promise<void>;
  onExport?: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
};

export function WorkflowHeaderActions({
  onNew,
  onImport,
  onExport,
  isLoading = false,
  className,
}: WorkflowHeaderActionsProps) {
  const actions: ActionGroup[] = [
    ...(onNew
      ? [
          {
            label: "New Workflow",
            icon: "➕",
            onClick: onNew,
            variant: "primary" as const,
          },
        ]
      : []),
    ...(onImport
      ? [
          {
            label: "Import",
            icon: "📥",
            onClick: onImport,
            variant: "secondary" as const,
          },
        ]
      : []),
    ...(onExport
      ? [
          {
            label: "Export",
            icon: "📤",
            onClick: onExport,
            variant: "secondary" as const,
          },
        ]
      : []),
  ];

  if (actions.length === 0) return null;

  return (
    <section className={className ? `workflow-header-actions ${className}` : "workflow-header-actions"}>
      <ActionButtonGroup className="workflow-header-actions-group" actions={actions} isLoading={isLoading} />
    </section>
  );
}
