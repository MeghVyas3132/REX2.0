'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTour } from './tour-context';
import './tour-spotlight.css';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TourSpotlight: React.FC = () => {
  const pathname = usePathname();
  const { state, currentStep, next, previous, skip, complete, progress } = useTour();
  const [position, setPosition] = useState<Position | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const [targetFound, setTargetFound] = useState(true);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isActive || !currentStep.selector) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStep.selector as string);
      if (!element) {
        setTargetFound(false);
        setPosition(null);
        return;
      }
      setTargetFound(true);

      const rect = element.getBoundingClientRect();
      setPosition({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      });

      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();

    // Use IntersectionObserver for element tracking
    const observer = new IntersectionObserver(updatePosition, { threshold: 0 });

    const element = document.querySelector(currentStep.selector as string);
    if (element) observer.observe(element);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [state.isActive, currentStep.selector]);

  useEffect(() => {
    if (!position || !targetFound) return;

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
  }, [position, currentStep.placement, targetFound]);

  useEffect(() => {
    if (!state.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      if (e.key === 'ArrowRight' && currentStep.advanceMode === 'click') next();
      if (e.key === 'ArrowLeft') previous();
      if (e.key === 'Enter' && state.currentStep === 'certified') complete();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isActive, currentStep.advanceMode, state.currentStep, next, previous, skip, complete]);

  const isWorkflowRoute =
    pathname.startsWith('/dashboard/workflows') || pathname.startsWith('/studio/workflows');

  if (!state.isActive || !isWorkflowRoute) return null;

  const hasSpotlight = Boolean(position && targetFound && currentStep.selector);
  const isLastStep = state.currentStep === 'certified';
  const hole = hasSpotlight
    ? {
        left: Math.max(0, position!.x - 8),
        top: Math.max(0, position!.y - 8),
        width: position!.width + 16,
        height: position!.height + 16,
      }
    : null;

  return (
    <div ref={spotlightRef} className="tour-spotlight">
      {currentStep.showBackdrop && <div className="tour-spotlight__backdrop" />}
      {hole && (
        <>
          <div className="tour-spotlight__cutout" style={hole} />
          <div className="tour-spotlight__ring" style={hole} />
        </>
      )}

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
        {!targetFound && currentStep.selector && (
          <p className="tour-tooltip__hint">Waiting for this section to appear.</p>
        )}
        {currentStep.advanceMode === 'action' && (
          <p className="tour-tooltip__hint">Complete the action on canvas to continue.</p>
        )}

        <div className="tour-tooltip__footer">
          <span className="tour-tooltip__progress">
            {progress.current} / {progress.total}
          </span>

          <div className="tour-tooltip__controls">
            <button
              className="tour-tooltip__button"
              onClick={previous}
              disabled={progress.current <= 1}
              aria-label="Previous step"
            >
              Back
            </button>

            {!isLastStep ? (
              <button
                className="tour-tooltip__button tour-tooltip__button--primary"
                onClick={() => {
                  if (currentStep.advanceMode === 'click') next();
                }}
                disabled={currentStep.advanceMode === 'action'}
                aria-label="Next step"
              >
                {currentStep.ctaLabel || 'Next'}
              </button>
            ) : (
              <button
                className="tour-tooltip__button tour-tooltip__button--primary"
                onClick={complete}
                aria-label="Complete tour"
              >
                {currentStep.ctaLabel || 'Done'}
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
