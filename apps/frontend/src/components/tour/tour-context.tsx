'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { TourState, TourAction, TourStep, UseTourReturn } from './types';

// Initial state
const initialState: TourState = {
  isActive: false,
  currentStepIndex: 0,
  steps: [],
  isCompleted: false,
};

// Reducer
function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        isActive: true,
        currentStepIndex: 0,
        steps: action.payload,
        isCompleted: false,
      };

    case 'NEXT':
      if (state.currentStepIndex < state.steps.length - 1) {
        return {
          ...state,
          currentStepIndex: state.currentStepIndex + 1,
        };
      }
      return {
        ...state,
        isActive: false,
        isCompleted: true,
      };

    case 'PREVIOUS':
      if (state.currentStepIndex > 0) {
        return {
          ...state,
          currentStepIndex: state.currentStepIndex - 1,
        };
      }
      return state;

    case 'GO_TO_STEP':
      if (action.payload >= 0 && action.payload < state.steps.length) {
        return {
          ...state,
          currentStepIndex: action.payload,
        };
      }
      return state;

    case 'SKIP':
    case 'COMPLETE':
      return {
        ...state,
        isActive: false,
        isCompleted: true,
      };

    default:
      return state;
  }
}

// Context
const TourContext = createContext<UseTourReturn | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  const start = useCallback((steps: TourStep[]) => {
    dispatch({ type: 'START', payload: steps });
  }, []);

  const next = useCallback(() => {
    dispatch({ type: 'NEXT' });
  }, []);

  const previous = useCallback(() => {
    dispatch({ type: 'PREVIOUS' });
  }, []);

  const goToStep = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: index });
  }, []);

  const skip = useCallback(() => {
    dispatch({ type: 'SKIP' });
  }, []);

  const complete = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
  }, []);

  const currentStep = state.steps[state.currentStepIndex] || null;
  const progress = {
    current: state.currentStepIndex + 1,
    total: state.steps.length,
  };

  const value: UseTourReturn = {
    state,
    dispatch,
    start,
    next,
    previous,
    goToStep,
    skip,
    complete,
    currentStep,
    progress,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): UseTourReturn => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
};
