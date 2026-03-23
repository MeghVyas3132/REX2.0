import React from "react";

export type TourStepId =
  | "idle"
  | "welcome"
  | "palette_intro"
  | "waiting_trigger_drop"
  | "waiting_llm_drop"
  | "waiting_connection"
  | "rex_attention"
  | "waiting_fix_click"
  | "certified"
  | "complete";

export type TourAdvanceMode = "click" | "action";
export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  id: TourStepId;
  title: string;
  description: string;
  selector?: string;
  placement?: TourPlacement;
  advanceMode: TourAdvanceMode;
  showBackdrop?: boolean;
  ctaLabel?: string;
}

export interface TourMachineState {
  isActive: boolean;
  currentStep: TourStepId;
  isCompleted: boolean;
  isSkipped: boolean;
}

export type TourMachineEvent =
  | { type: "START" }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "SKIP" }
  | { type: "COMPLETE" }
  | { type: "NODE_DROPPED"; nodeSlug: string }
  | { type: "CONNECTION_MADE"; fromNodeType: string; toNodeType: string }
  | { type: "REX_FIX_CLICKED" }
  | { type: "REX_CERTIFIED" }
  | { type: "RESET" };

export interface TourSnapshot {
  currentStep: TourStepId;
  isCompleted: boolean;
  isSkipped: boolean;
}

export interface UseTourReturn {
  state: TourMachineState;
  dispatch: React.Dispatch<TourMachineEvent>;
  start: () => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  complete: () => void;
  restart: () => void;
  currentStep: TourStep;
  progress: { current: number; total: number };
}
