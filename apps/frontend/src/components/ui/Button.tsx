'use client';

import React from 'react';
import './button.css';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'compact' | 'default';
  isBlock?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      isBlock = false,
      isLoading = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) => {
    const variantClass = `btn--${variant}`;
    const sizeClass = size === 'compact' ? 'btn--compact' : '';
    const blockClass = isBlock ? 'btn--block' : '';
    const loadingClass = isLoading ? 'btn--loading' : '';

    return (
      <button
        ref={ref}
        className={`btn ${variantClass} ${sizeClass} ${blockClass} ${loadingClass} ${className}`.trim()}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className="btn__text">{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
