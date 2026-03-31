"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant = "default" | "success" | "warning" | "danger";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: React.ReactNode;
};

export function Badge({ variant = "default", children, className, ...props }: BadgeProps) {
  const variantClass = `badge-${variant}`;

  return (
    <span {...props} className={cn("badge", variantClass, className)}>
      {children}
    </span>
  );
}
