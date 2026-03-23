'use client';

import React from 'react';
import './card.css';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  interactive?: boolean;
  withHover?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      interactive = false,
      withHover = true,
      className = '',
      title,
      subtitle,
      action,
      headerRight,
      children,
      ...props
    },
    ref
  ) => {
    const interactiveClass = interactive ? 'card--interactive' : '';
    const hoverClass = !interactive && withHover ? 'card--hover' : '';

    const resolvedAction = headerRight ?? action;

    return (
      <div
        ref={ref}
        className={`card ${interactiveClass} ${hoverClass} ${className}`.trim()}
        {...props}
      >
        {(title || subtitle || resolvedAction) && (
          <div className="card__header">
            <div>
              {title ? <h3 className="card__title">{title}</h3> : null}
              {subtitle ? (
                <p style={{ margin: "6px 0 0", color: "var(--text-tertiary)", fontSize: 12 }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
            {resolvedAction ? <div>{resolvedAction}</div> : null}
          </div>
        )}
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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
