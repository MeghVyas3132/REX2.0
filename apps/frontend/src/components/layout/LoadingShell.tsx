'use client';

/**
 * Loading Shell Component
 * Displays while authenticating before showing actual app shell
 */
export function LoadingShell() {
  return (
    <main className="center-page">
      <div className="loading-shell-stack">
        <div className="loading-shell-spinner" aria-hidden="true" />
        <p>Verifying your session...</p>
      </div>
    </main>
  );
}
