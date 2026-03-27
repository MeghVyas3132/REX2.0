"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("AppErrorBoundary", error, info);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="page-state">
          <h2>Something went wrong.</h2>
          <p>Please refresh and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
