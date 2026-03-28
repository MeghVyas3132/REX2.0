'use client';

import { AppShell } from '@/components/layout/AppShell';

/**
 * Loading Shell Component
 * Displays while authenticating before showing actual app shell
 */
export function LoadingShell() {
  return (
    <AppShell
      brand="REX"
      title="Loading"
      subtitle="Authenticating..."
      navItems={[]}
      userName=""
      onSignOut={() => {}}
    >
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {/* Animated loading spinner */}
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-border)',
              borderTop: '3px solid var(--accent-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ fontSize: '14px' }}>Verifying your session...</p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}
