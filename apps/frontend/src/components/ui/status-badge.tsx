'use client';

import React from 'react';
import './status-badge.css';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  showDot?: boolean;
}

export const StatusBadge = ({
  variant,
  children,
  showDot = false,
}: StatusBadgeProps) => {
  const dotVariant =
    variant === 'success'
      ? 'success'
      : variant === 'warning'
        ? 'warning'
        : variant === 'error'
          ? 'error'
          : undefined;

  return (
    <span className={`status-badge status-badge--${variant}`}>
      {showDot && dotVariant && (
        <span className={`status-dot status-dot--${dotVariant}`} />
      )}
      {children}
    </span>
  );
};

StatusBadge.displayName = 'StatusBadge';

export interface StatusDotProps {
  variant: 'success' | 'warning' | 'error';
  className?: string;
}

export const StatusDot = ({ variant, className = '' }: StatusDotProps) => (
  <span className={`status-dot status-dot--${variant} ${className}`.trim()} />
);

StatusDot.displayName = 'StatusDot';
