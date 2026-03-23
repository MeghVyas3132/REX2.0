'use client';

import React, { useState } from 'react';
import './rex-badge.css';

export interface RexScore {
  responsible: number;
  ethical: number;
  explainable: number;
}

export interface RexBadgeProps {
  score: RexScore;
  gaps?: string[];
  onClickFix?: (gapIndex: number) => void;
  className?: string;
}

export const RexBadge = ({
  score,
  gaps = [],
  onClickFix,
  className = '',
}: RexBadgeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const totalScore = Math.round(
    (score.responsible + score.ethical + score.explainable) / 3,
  );
  const isFull = totalScore >= 70;
  const isPartial = totalScore >= 40 && totalScore < 70;

  const badgeVariant = isFull ? 'full' : isPartial ? 'partial' : 'none';

  const getScoreLevel = (value: number) => {
    if (value >= 70) return 'success';
    if (value >= 40) return 'warning';
    return 'error';
  };

  return (
    <div
      className={`rex-badge rex-badge--${badgeVariant} ${className}`.trim()}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="button"
      tabIndex={0}
    >
      <span>
        REX {isFull ? '✓' : isPartial ? '~' : '✗'}
      </span>

      <div className={`rex-tooltip ${showTooltip ? 'visible' : ''}`}>
        <div className="rex-score-row">
          <span className="rex-score-label">R</span>
          <div className="rex-progress-bar">
            <div
              className={`rex-progress-bar__fill ${getScoreLevel(score.responsible)}`}
              style={{ width: `${score.responsible}%` }}
            />
          </div>
        </div>
        <div className="rex-score-row">
          <span className="rex-score-label">E</span>
          <div className="rex-progress-bar">
            <div
              className={`rex-progress-bar__fill ${getScoreLevel(score.ethical)}`}
              style={{ width: `${score.ethical}%` }}
            />
          </div>
        </div>
        <div className="rex-score-row">
          <span className="rex-score-label">X</span>
          <div className="rex-progress-bar">
            <div
              className={`rex-progress-bar__fill ${getScoreLevel(score.explainable)}`}
              style={{ width: `${score.explainable}%` }}
            />
          </div>
        </div>
        {gaps.length > 0 && (
          <>
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
              <div className="rex-score-label" style={{ marginBottom: 'var(--space-2)' }}>
                What's missing
              </div>
              {gaps.map((gap, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-1)',
                  }}
                >
                  • {gap}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

RexBadge.displayName = 'RexBadge';
