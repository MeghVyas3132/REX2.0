"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import {
  TourMachineEvent,
  TourMachineState,
  TourSnapshot,
  TourStep,
  TourStepId,
  UseTourReturn,
} from "./types";

const TOUR_COMPLETED_KEY = "rex_tour_completed";
const TOUR_STATE_KEY = "rex_tour_state";

const STEP_ORDER: TourStepId[] = [
  "welcome",
  "palette_intro",
  "waiting_trigger_drop",
  "waiting_llm_drop",
  "waiting_connection",
  "rex_attention",
  "waiting_fix_click",
  "certified",
];

const STEP_INDEX = new Map<TourStepId, number>(STEP_ORDER.map((id, index) => [id, index]));

export const TOUR_STEPS: Record<TourStepId, TourStep> = {
  idle: {
    id: "idle",
    title: "",
    description: "",
    advanceMode: "click",
  },
  welcome: {
    id: "welcome",
    title: "Welcome to REX Studio",
    description:
      "This is your workflow canvas. Drag nodes from the left, connect them, and REX will tell you if they are trustworthy.",
    selector: "[data-tour='canvas']",
    placement: "bottom",
    advanceMode: "click",
    showBackdrop: true,
    ctaLabel: "Get started",
  },
  palette_intro: {
    id: "palette_intro",
    title: "Your node library",
    description:
      "Every integration lives here. Drag any node onto the canvas to add it to your workflow graph.",
    selector: "[data-tour='node-palette']",
    placement: "right",
    advanceMode: "click",
    showBackdrop: true,
    ctaLabel: "Got it",
  },
  waiting_trigger_drop: {
    id: "waiting_trigger_drop",
    title: "Drag your first node",
    description: "Drag the Webhook Trigger node onto the canvas.",
    selector: "[data-tour='node-trigger']",
    placement: "right",
    advanceMode: "action",
    showBackdrop: false,
  },
  waiting_llm_drop: {
    id: "waiting_llm_drop",
    title: "Add an AI node",
    description: "Now drag the LLM Prompt node onto the canvas.",
    selector: "[data-tour='node-llm']",
    placement: "right",
    advanceMode: "action",
    showBackdrop: false,
  },
  waiting_connection: {
    id: "waiting_connection",
    title: "Connect the nodes",
    description: "Drag from the right handle of Webhook to the left handle of LLM Prompt.",
    selector: "[data-tour='node-output-handle']",
    placement: "bottom",
    advanceMode: "action",
    showBackdrop: false,
  },
  rex_attention: {
    id: "rex_attention",
    title: "REX found a gap",
    description:
      "That amber badge means this node needs attention. REX scored a compliance gap before execution.",
    selector: "[data-tour='rex-badge']",
    placement: "right",
    advanceMode: "click",
    showBackdrop: true,
    ctaLabel: "See the fix",
  },
  waiting_fix_click: {
    id: "waiting_fix_click",
    title: "One click to fix",
    description:
      "Open the REX tab and click Fix. REX will insert a Consent Gate and raise the score.",
    selector: "[data-tour='rex-fix-button']",
    placement: "left",
    advanceMode: "action",
    showBackdrop: true,
  },
  certified: {
    id: "certified",
    title: "Workflow certified.",
    description:
      "Every node passed. This workflow is ready to run and ready to defend in a compliance audit.",
    selector: "[data-tour='canvas']",
    placement: "top",
    advanceMode: "click",
    showBackdrop: true,
    ctaLabel: "View your workflow",
  },
  complete: {
    id: "complete",
    title: "",
    description: "",
    advanceMode: "click",
  },
};

const initialState: TourMachineState = {
  isActive: false,
  currentStep: "idle",
  isCompleted: false,
  isSkipped: false,
};

function nextStep(step: TourStepId): TourStepId {
  const index = STEP_INDEX.get(step);
  if (index === undefined) return step;
  const next = STEP_ORDER[index + 1];
  return next ?? "complete";
}

function previousStep(step: TourStepId): TourStepId {
  const index = STEP_INDEX.get(step);
  if (index === undefined) return step;
  const prev = STEP_ORDER[index - 1];
  return prev ?? step;
}

function reducer(state: TourMachineState, event: TourMachineEvent): TourMachineState {
  switch (event.type) {
    case "START": {
      return {
        isActive: true,
        currentStep: state.currentStep === "idle" || state.currentStep === "complete" ? "welcome" : state.currentStep,
        isCompleted: false,
        isSkipped: false,
      };
    }
    case "NEXT": {
      if (!state.isActive) return state;
      const next = nextStep(state.currentStep);
      if (next === "complete") {
        return {
          isActive: false,
          currentStep: "complete",
          isCompleted: true,
          isSkipped: false,
        };
      }
      return { ...state, currentStep: next };
    }
    case "PREVIOUS": {
      if (!state.isActive) return state;
      return { ...state, currentStep: previousStep(state.currentStep) };
    }
    case "SKIP": {
      return {
        isActive: false,
        currentStep: "complete",
        isCompleted: true,
        isSkipped: true,
      };
    }
    case "COMPLETE": {
      return {
        isActive: false,
        currentStep: "complete",
        isCompleted: true,
        isSkipped: false,
      };
    }
    case "RESET": {
      return initialState;
    }
    case "NODE_DROPPED": {
      if (state.currentStep === "waiting_trigger_drop" && event.nodeSlug === "trigger") {
        return { ...state, currentStep: "waiting_llm_drop" };
      }
      if (state.currentStep === "waiting_llm_drop" && event.nodeSlug === "llm") {
        return { ...state, currentStep: "waiting_connection" };
      }
      return state;
    }
    case "CONNECTION_MADE": {
      if (
        state.currentStep === "waiting_connection" &&
        event.fromNodeType === "trigger" &&
        event.toNodeType === "llm"
      ) {
        return { ...state, currentStep: "rex_attention" };
      }
      return state;
    }
    case "REX_FIX_CLICKED": {
      if (state.currentStep === "waiting_fix_click") {
        return { ...state, currentStep: "certified" };
      }
      return state;
    }
    case "REX_CERTIFIED": {
      if (state.currentStep === "certified") {
        return {
          isActive: false,
          currentStep: "complete",
          isCompleted: true,
          isSkipped: false,
        };
      }
      return state;
    }
    default:
      return state;
  }
}

const TourContext = createContext<UseTourReturn | undefined>(undefined);

function readSnapshot(): TourSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOUR_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TourSnapshot;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: TourSnapshot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOUR_STATE_KEY, JSON.stringify(snapshot));
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (): TourMachineState => {
    if (typeof window === "undefined") return initialState;
    const completed = window.localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
    const snapshot = readSnapshot();

    if (completed) {
      return {
        isActive: false,
        currentStep: "complete",
        isCompleted: true,
        isSkipped: snapshot?.isSkipped ?? false,
      };
    }

    if (snapshot && snapshot.currentStep !== "complete") {
      const restoredStep: TourStepId = snapshot.currentStep;
      return {
        isActive: true,
        currentStep: restoredStep,
        isCompleted: false,
        isSkipped: false,
      };
    }

    return initialState;
  });

  useEffect(() => {
    writeSnapshot({
      currentStep: state.currentStep,
      isCompleted: state.isCompleted,
      isSkipped: state.isSkipped,
    });

    if (state.isCompleted) {
      window.localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    }
  }, [state]);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const previous = useCallback(() => dispatch({ type: "PREVIOUS" }), []);
  const skip = useCallback(() => dispatch({ type: "SKIP" }), []);
  const complete = useCallback(() => dispatch({ type: "COMPLETE" }), []);

  const restart = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOUR_COMPLETED_KEY);
      window.localStorage.removeItem(TOUR_STATE_KEY);
    }
    dispatch({ type: "RESET" });
    dispatch({ type: "START" });
  }, []);

  const currentStep = useMemo(() => TOUR_STEPS[state.currentStep], [state.currentStep]);

  const progress = useMemo(() => {
    const index = STEP_INDEX.get(state.currentStep);
    return {
      current: index === undefined ? STEP_ORDER.length : index + 1,
      total: STEP_ORDER.length,
    };
  }, [state.currentStep]);

  const value: UseTourReturn = {
    state,
    dispatch,
    start,
    next,
    previous,
    skip,
    complete,
    restart,
    currentStep,
    progress,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): UseTourReturn => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within TourProvider");
  }
  return context;
};
