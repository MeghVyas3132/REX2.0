"use client";

import React from "react";

/**
 * Accessibility Utilities
 * Provides helpers for WCAG 2.1 AA compliance
 */

/**
 * Focus management utility
 */
export const focusManagement = {
  /**
   * Set focus to element by ref
   */
  focus: (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.focus();
    }
  },

  /**
   * Trap focus within container (for modals)
   */
  trapFocus: (container: HTMLElement | null, reverse = false) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (reverse && activeElement === firstElement) {
      lastElement?.focus();
    } else if (!reverse && activeElement === lastElement) {
      firstElement?.focus();
    }
  },

  /**
   * Restore focus to element after modal closes
   */
  restoreFocus: (previousFocus: HTMLElement | null) => {
    if (previousFocus && previousFocus !== document.body) {
      previousFocus.focus();
    }
  },
};

/**
 * ARIA label helper
 */
export function createAriaLabel(
  action: string,
  resourceType?: string,
  resourceName?: string
): string {
  const parts = [action];
  if (resourceType) parts.push(resourceType);
  if (resourceName) parts.push(resourceName);
  return parts.join(" - ");
}

/**
 * Keyboard event helpers
 */
export const keyboard = {
  isEnter: (event: React.KeyboardEvent) => event.key === "Enter",
  isEscape: (event: React.KeyboardEvent) => event.key === "Escape",
  isSpace: (event: React.KeyboardEvent) => event.key === " ",
  isTab: (event: React.KeyboardEvent) => event.key === "Tab",
  isArrowUp: (event: React.KeyboardEvent) => event.key === "ArrowUp",
  isArrowDown: (event: React.KeyboardEvent) => event.key === "ArrowDown",
  isArrowLeft: (event: React.KeyboardEvent) => event.key === "ArrowLeft",
  isArrowRight: (event: React.KeyboardEvent) => event.key === "ArrowRight",
};

/**
 * Component to announce dynamic content changes to screen readers
 */
export function ScreenReaderAnnouncement({ message, live = "polite" }: { message: string; live?: "polite" | "assertive" }) {
  return (
    <div
      role="status"
      aria-live={live}
      aria-atomic="true"
      style={{
        position: "absolute",
        left: "-10000px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      {message}
    </div>
  );
}

/**
 * Hook for managing focus trap (useful for modals and drawers)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    if (containerRef.current) {
      const firstFocusable = containerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    return () => {
      focusManagement.restoreFocus(previousFocusRef.current);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for keyboard event handling
 */
export function useKeyboardEvent(
  key: string,
  callback: (event: React.KeyboardEvent) => void,
  options?: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean }
) {
  return (event: React.KeyboardEvent) => {
    if (event.key !== key) return;

    if (options?.ctrlKey && !event.ctrlKey) return;
    if (options?.shiftKey && !event.shiftKey) return;
    if (options?.altKey && !event.altKey) return;

    callback(event);
  };
}
