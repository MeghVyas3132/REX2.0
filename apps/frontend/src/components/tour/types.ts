import React from 'react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  selector: string; // CSS selector for the element
  placement?: 'top' | 'bottom' | 'left' | 'right'; // Tooltip placement
  action?: () => void; // Optional callback when step is shown
  actionLabel?: string; // Custom label for action button
}

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  isCompleted: boolean;
}

export type TourAction =
  | { type: 'START'; payload: TourStep[] }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'SKIP' }
  | { type: 'COMPLETE' };

export interface UseTourReturn {
  state: TourState;
  dispatch: React.Dispatch<TourAction>;
  start: (steps: TourStep[]) => void;
  next: () => void;
  previous: () => void;
  goToStep: (index: number) => void;
  skip: () => void;
  complete: () => void;
  currentStep: TourStep | null;
  progress: { current: number; total: number };
}
