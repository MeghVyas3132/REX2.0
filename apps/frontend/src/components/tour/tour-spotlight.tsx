'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTour } from './tour-context';
import './tour-spotlight.css';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TourSpotlight: React.FC = () => {
  const { state, currentStep, next, previous, skip } = useTour();
  const [position, setPosition] = useState<Position | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const [isExiting] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Track element position changes
  useEffect(() => {
    if (!state.isActive || !currentStep) return;

    const updatePosition = () => {
      const element = document.querySelector(currentStep.selector);
      if (!element) {
        console.warn(`Tour element not found: ${currentStep.selector}`);
        return;
      }

      const rect = element.getBoundingClientRect();
      setPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();

    // Use IntersectionObserver for element tracking
    const observer = new IntersectionObserver(updatePosition, {
      threshold: 0,
    });

    const element = document.querySelector(currentStep.selector);
    if (element) observer.observe(element);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [state.isActive, currentStep]);

  // Calculate tooltip position
  useEffect(() => {
    if (!position) return;

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 160;
    const placement = currentStep?.placement || 'bottom';

    let left = 0;
    let top = 0;

    switch (placement) {
      case 'top':
        left = position.x + position.width / 2 - tooltipWidth / 2;
        top = position.y - tooltipHeight - padding;
        break;
      case 'bottom':
        left = position.x + position.width / 2 - tooltipWidth / 2;
        top = position.y + position.height + padding;
        break;
      case 'left':
        left = position.x - tooltipWidth - padding;
        top = position.y + position.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        left = position.x + position.width + padding;
        top = position.y + position.height / 2 - tooltipHeight / 2;
        break;
    }

    // Keep tooltip in bounds
    const buffer = 16;
    if (left < buffer) left = buffer;
    if (left + tooltipWidth > window.innerWidth - buffer) {
      left = window.innerWidth - tooltipWidth - buffer;
    }
    if (top < buffer) top = buffer;
    if (top + tooltipHeight > window.innerHeight - buffer) {
      top = window.innerHeight - tooltipHeight - buffer;
    }

    setTooltipPos({ left, top });
  }, [position, currentStep?.placement]);

  // Keyboard navigation
  useEffect(() => {
    if (!state.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') previous();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, next, previous, skip]);

  // Execute step action
  useEffect(() => {
    if (currentStep?.action) {
      currentStep.action();
    }
  }, [currentStep]);

  if (!state.isActive || !currentStep || !position) return null;

  const isLastStep = state.currentStepIndex === state.steps.length - 1;
  const radius = Math.max(position.width, position.height) / 2 + 8;
  const cx = position.x + position.width / 2;
  const cy = position.y + position.height / 2;

  return (
    <div
      ref={spotlightRef}
      className={`tour-spotlight ${isExiting ? 'tour-spotlight--hidden' : ''}`.trim()}
    >
      {/* SVG Spotlight Mask */}
      <svg className="tour-spotlight__svg" role="none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx={cx} cy={cy} r={radius} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="black"
          fillOpacity="0.5"
          mask="url(#tour-spotlight-mask)"
        />
        <circle
          className="tour-spotlight__circle"
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth="2"
        />
      </svg>

      {/* Tooltip */}
      <div
        className={`tour-tooltip tour-tooltip--${currentStep.placement || 'bottom'}`.trim()}
        style={{
          left: `${tooltipPos.left}px`,
          top: `${tooltipPos.top}px`,
        }}
        role="dialog"
        aria-label={currentStep.title}
      >
        <h3 className="tour-tooltip__title">{currentStep.title}</h3>
        <p className="tour-tooltip__description">{currentStep.description}</p>

        <div className="tour-tooltip__footer">
          <span className="tour-tooltip__progress">
            {state.currentStepIndex + 1} / {state.steps.length}
          </span>

          <div className="tour-tooltip__controls">
            <button
              className="tour-tooltip__button"
              onClick={previous}
              disabled={state.currentStepIndex === 0}
              aria-label="Previous step"
            >
              Back
            </button>

            {!isLastStep ? (
              <button
                className="tour-tooltip__button tour-tooltip__button--primary"
                onClick={next}
                aria-label="Next step"
              >
                Next
              </button>
            ) : (
              <button
                className="tour-tooltip__button tour-tooltip__button--primary"
                onClick={next}
                aria-label="Complete tour"
              >
                Done
              </button>
            )}

            <button
              className="tour-tooltip__button"
              onClick={skip}
              aria-label="Skip tour"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

TourSpotlight.displayName = 'TourSpotlight';
