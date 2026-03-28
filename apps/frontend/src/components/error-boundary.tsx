'use client';

import React, { ReactNode } from 'react';
import { Button } from './ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches React errors and provides graceful error recovery
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Log to error tracking service in production
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Example: Sentry.captureException(error);
      console.error('Error reported:', error.message);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          }}
        >
          <h1 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>
            Something went wrong
          </h1>

          <p
            style={{
              marginBottom: '24px',
              maxWidth: '500px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6',
            }}
          >
            We encountered an unexpected error. Please try refreshing the page or
            contact support if the problem persists.
          </p>

          {process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production' && this.state.error && (
            <details
              style={{
                marginBottom: '24px',
                padding: '12px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: '8px',
                maxWidth: '600px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Error details (Development only)
              </summary>
              <code>{this.state.error.message}</code>
            </details>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button onClick={this.handleReset}>Try Again</Button>
            <Button onClick={() => window.location.href = '/'}>Go Home</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
