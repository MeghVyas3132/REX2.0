'use client';

import React from 'react';
import './card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  withHover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, withHover = true, className = '', children, ...props }, ref) => {
    const interactiveClass = interactive ? 'card--interactive' : '';
    const hoverClass = !interactive && withHover ? 'card--hover' : '';

    return (
      <div
        ref={ref}
        className={`card ${interactiveClass} ${hoverClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, action, className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`card__header ${className}`.trim()} {...props}>
        {title && <h3 className="card__title">{title}</h3>}
        {children}
        {action && <div>{action}</div>}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`card__body ${className}`.trim()} {...props} />
  ),
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`card__footer ${className}`.trim()} {...props} />
  ),
);

CardFooter.displayName = 'CardFooter';

const subtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--text-tertiary)",
  fontSize: 12,
};
