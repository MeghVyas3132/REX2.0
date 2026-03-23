# Tour System `src/components/tour`

Guided walkthrough feature with animated spotlight overlay and keyboard navigation.

## Quick Start

### 1. Wrap your app in `TourProvider`

```tsx
// app/layout.tsx
import { TourProvider } from '@/components/tour';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TourProvider>
          {children}
        </TourProvider>
      </body>
    </html>
  );
}
```

### 2. Add `TourSpotlight` to render the overlay

```tsx
// app/layout.tsx (continued)
import { TourSpotlight } from '@/components/tour';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TourProvider>
          <TourSpotlight />
          {children}
        </TourProvider>
      </body>
    </html>
  );
}
```

### 3. Define tour steps and start the tour

```tsx
// Any component
import { useTour, type TourStep } from '@/components/tour';

export default function MyComponent() {
  const { start } = useTour();

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to REX Studio',
      description: 'Learn the basics of creating and running workflows.',
      selector: '.hero-section',
      placement: 'bottom',
    },
    {
      id: 'canvas',
      title: 'Canvas Area',
      description: 'Drag and drop nodes here to build your workflow.',
      selector: '.canvas-container',
      placement: 'right',
      action: () => {
        // Optional: Scroll to element, highlight, etc.
        console.log('Canvas step reached');
      },
    },
    {
      id: 'node-palette',
      title: 'Node Palette',
      description: 'Select from available node types on the left.',
      selector: '.node-palette',
      placement: 'right',
    },
    {
      id: 'execution',
      title: 'Execute Workflow',
      description: 'Click the play button to run your workflow.',
      selector: '.execute-button',
      placement: 'left',
      actionLabel: 'Run Now',
    },
  ];

  return (
    <button onClick={() => start(tourSteps)}>
      Start Tour
    </button>
  );
}
```

## API Reference

### `useTour()`

Hook to access tour state and controls. Must be used within `<TourProvider>`.

#### Returns

```ts
interface UseTourReturn {
  // State
  state: TourState                    // Current tour state
  currentStep: TourStep | null        // Active step or null
  progress: { current: number; total: number }

  // Controls
  start: (steps: TourStep[]) => void  // Begin tour
  next: () => void                    // Go to next step
  previous: () => void                // Go to previous step
  goToStep: (index: number) => void   // Jump to specific step
  skip: () => void                    // Exit tour
  complete: () => void                // Mark tour as complete
  
  // For advanced usage
  dispatch: React.Dispatch<TourAction>
}
```

### `TourStep` Interface

```ts
interface TourStep {
  id: string;                    // Unique identifier
  title: string;                 // Tooltip heading
  description: string;           // Tooltip body text
  selector: string;              // CSS selector for spotlight target
  placement?: 'top' | 'bottom' | 'left' | 'right';  // Tooltip position
  action?: () => void;           // Callback when step is shown
  actionLabel?: string;          // Custom label for action button
}
```

## Keyboard Navigation

- **ESC** — Exit tour
- **→** (Right Arrow) — Next step
- **←** (Left Arrow) — Previous step

## Features

✅ **Spotlight Overlay** — Animated SVG mask with pulsing glow  
✅ **Smart Tooltip** — Auto-positioned with bounds checking  
✅ **Keyboard Control** — ESC, arrow keys for navigation  
✅ **Accessibility** — ARIA attributes, focus management  
✅ **IntersectionObserver** — Tracks element position changes  
✅ **Smooth Animations** — Respects `prefers-reduced-motion`  
✅ **Dark Mode** — Automatic via CSS variables  
✅ **TypeScript** — Full type safety with interfaces  

## Styling Customization

All tour colors are defined in `src/styles/tokens.css`:

- **Background**: `var(--color-bg-surface)`
- **Text**: `var(--color-text-primary/secondary)`
- **Spotlight**: Blue `#3b82f6` with 0.5 opacity glow
- **Border**: `var(--color-border)`

Modify token values to customize appearance globally.

## Common Patterns

### Auto-start tour on first visit

```tsx
import { useTour } from '@/components/tour';
import { useEffect } from 'react';

export function TourInitializer() {
  const { start } = useTour();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('tour-completed');
    if (!hasSeenTour) {
      start(tourSteps);
    }
  }, [start]);

  return null;
}
```

### Mark tour as complete

```tsx
const { complete } = useTour();

const handleTourComplete = () => {
  localStorage.setItem('tour-completed', 'true');
  complete();
};
```

### Multi-stage tours

```tsx
const studioTour = [/* 4 steps */];
const canvasTour = [/* 3 steps */];
const advancedTour = [/* 5 steps */];

<button onClick={() => start(studioTour)}>Intro Tour</button>
<button onClick={() => start(canvasTour)}>Canvas Tour</button>
<button onClick={() => start(advancedTour)}>Advanced Tour</button>
```

## Browser Support

✅ All modern browsers (Chrome, Firefox, Safari, Edge)  
✅ Requires CSS Grid, SVG, and IntersectionObserver API  
✅ Graceful degradation for older browsers (tour state still works, just no spotlight)
