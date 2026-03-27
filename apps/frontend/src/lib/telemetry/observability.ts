"use client";

import React from "react";

/**
 * Observability System - Telemetry and Analytics
 * Captures user actions, page views, errors, and performance metrics
 */

export type TelemetryEventType =
  | "page_view"
  | "action_click"
  | "action_submit"
  | "mutation_start"
  | "mutation_success"
  | "mutation_error"
  | "query_error"
  | "permission_denied"
  | "component_error";

export type TelemetryEvent = {
  type: TelemetryEventType;
  timestamp: number;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  action?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
};

class TelemetryService {
  private listeners: ((event: TelemetryEvent) => void)[] = [];
  private enabled = true;

  /**
   * Register a listener for all telemetry events
   * Use for sending to analytics backend (Segment, Mixpanel, etc.)
   */
  subscribe(callback: (event: TelemetryEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Emit a telemetry event
   */
  emit(event: Omit<TelemetryEvent, "timestamp">): void {
    if (!this.enabled) return;

    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.listeners.forEach((listener) => {
      try {
        listener(fullEvent);
      } catch (err) {
        console.error("Telemetry listener error:", err);
      }
    });

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Telemetry:", fullEvent);
    }
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata?: Record<string, unknown>): void {
    this.emit({
      type: "page_view",
      action: page,
      metadata,
    });
  }

  /**
   * Track user action (click, submit, etc.)
   */
  trackAction(action: string, resourceType?: string, resourceId?: string, metadata?: Record<string, unknown>): void {
    this.emit({
      type: "action_click",
      action,
      resourceType,
      resourceId,
      metadata,
    });
  }

  /**
   * Track form submission
   */
  trackSubmit(action: string, resourceType: string, metadata?: Record<string, unknown>): void {
    this.emit({
      type: "action_submit",
      action,
      resourceType,
      metadata,
    });
  }

  /**
   * Track mutation (API call)
   */
  trackMutationStart(action: string, resourceType: string): number {
    const startTime = Date.now();
    this.emit({
      type: "mutation_start",
      action,
      resourceType,
    });
    return startTime;
  }

  trackMutationSuccess(action: string, resourceType: string, startTime: number, metadata?: Record<string, unknown>): void {
    this.emit({
      type: "mutation_success",
      action,
      resourceType,
      duration: Date.now() - startTime,
      metadata,
    });
  }

  trackMutationError(action: string, resourceType: string, startTime: number, error: string): void {
    this.emit({
      type: "mutation_error",
      action,
      resourceType,
      duration: Date.now() - startTime,
      error,
    });
  }

  /**
   * Track query error
   */
  trackQueryError(resourceType: string, error: string): void {
    this.emit({
      type: "query_error",
      resourceType,
      error,
    });
  }

  /**
   * Track permission denied
   */
  trackPermissionDenied(action: string, resourceType: string): void {
    this.emit({
      type: "permission_denied",
      action,
      resourceType,
    });
  }

  /**
   * Track component error
   */
  trackComponentError(component: string, error: string): void {
    this.emit({
      type: "component_error",
      action: component,
      error,
    });
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

/**
 * Hook for tracking page views
 */
export function useTelemetryPageView(page: string, metadata?: Record<string, unknown>): void {
  React.useEffect(() => {
    telemetry.trackPageView(page, metadata);
  }, [page, metadata]);
}

/**
 * Hook for tracking actions with automatic duration
 */
export function useTelemetryMutation(action: string, resourceType: string) {
  return {
    start: () => telemetry.trackMutationStart(action, resourceType),
    success: (startTime: number, metadata?: Record<string, unknown>) =>
      telemetry.trackMutationSuccess(action, resourceType, startTime, metadata),
    error: (startTime: number, error: string) =>
      telemetry.trackMutationError(action, resourceType, startTime, error),
  };
}
