"use client";

import { AnimatedBeam, AnimatedGridPattern } from "@/components/magicui";

type WorkflowEntryVisualProps = {
  className?: string;
  compact?: boolean;
};

export function WorkflowEntryVisual({ className, compact = false }: WorkflowEntryVisualProps) {
  return (
    <div className={`wf-entry-visual ${compact ? "wf-entry-visual--compact" : ""} ${className || ""}`.trim()} aria-hidden="true">
      <div className="wf-entry-visual__grid" />
      <AnimatedGridPattern className="wf-entry-visual__magic-grid" numSquares={compact ? 18 : 26} duration={2.6} maxOpacity={0.16} />
      <AnimatedBeam className="wf-entry-visual__magic-beam" d="M90 135 C 235 135, 325 135, 485 135" pathWidth={2.6} pathOpacity={0.34} duration={2.7} />
      <AnimatedBeam className="wf-entry-visual__magic-beam" d="M490 135 C 620 135, 705 135, 865 135" pathWidth={2.6} pathOpacity={0.34} duration={2.2} delay={0.16} />

      <div className="wf-entry-visual__status">WORKFLOW CERTIFIED</div>

      <div className="wf-entry-visual__pills">
        <span className="is-green">Trigger</span>
        <span className="is-blue">LLM</span>
        <span>Publish</span>
      </div>

      <div className="wf-entry-visual__nodes">
        <article className="wf-entry-node wf-entry-node--green">
          <p>Webhook</p>
          <span>REX ✓</span>
        </article>
        <article className="wf-entry-node wf-entry-node--amber">
          <p>Policy Gate</p>
          <span>REX ~</span>
        </article>
        <article className="wf-entry-node wf-entry-node--green">
          <p>Consent</p>
          <span>REX ✓</span>
        </article>
        <article className="wf-entry-node wf-entry-node--green">
          <p>Output</p>
          <span>REX ✓</span>
        </article>
      </div>
    </div>
  );
}
