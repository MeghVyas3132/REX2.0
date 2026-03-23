'use client';

import React from 'react';
import './canvas-node.css';
import { RexBadge, type RexScore } from './rex-badge';

export type NodeCategory = 'ai-llm' | 'data' | 'trigger' | 'logic' | 'communication' | 'compliance' | 'business';

export interface CanvasNodeProps {
  id: string;
  name: string;
  category: NodeCategory;
  icon: React.ReactNode;
  config?: string;
  status?: 'idle' | 'running' | 'error' | 'success';
  rexScore?: RexScore;
  isSelected?: boolean;
  isNew?: boolean;
  onRexBadgeClick?: () => void;
  className?: string;
}

export const CanvasNode = React.forwardRef<HTMLDivElement, CanvasNodeProps>(
  (
    {
      id,
      name,
      category,
      icon,
      config,
      status = 'idle',
      rexScore,
      isSelected = false,
      isNew = false,
      onRexBadgeClick,
      className = '',
    },
    ref,
  ) => {
    const selectedClass = isSelected ? 'canvas-node--selected' : '';
    const runningClass = status === 'running' ? 'canvas-node--running' : '';
    const errorClass = status === 'error' ? 'canvas-node--error' : '';
    const newClass = isNew ? 'new' : '';

    const statusDotVariant =
      status === 'success'
        ? 'success'
        : status === 'error'
          ? 'error'
          : 'success';

    return (
      <div
        ref={ref}
        className={`canvas-node ${selectedClass} ${runningClass} ${errorClass} ${newClass} ${className}`.trim()}
        data-node-id={id}
      >
        <div className="canvas-node__header">
          <div className={`canvas-node__icon ${category}`}>
            {icon}
          </div>
          <h4 className="canvas-node__name" title={name}>
            {name}
          </h4>
          {rexScore && (
            <button
              onClick={onRexBadgeClick}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label={`REX score for ${name}`}
            >
              <RexBadge score={rexScore} />
            </button>
          )}
        </div>

        {config && <div className="canvas-node__config">{config}</div>}

        {status !== 'idle' && (
          <div className="canvas-node__status">
            <span className="canvas-node__status-dot" style={{
              backgroundColor:
                status === 'success'
                  ? 'var(--color-green-500)'
                  : status === 'error'
                    ? 'var(--color-red-500)'
                    : 'var(--color-amber-500)',
            }} />
            <span>
              {status === 'success'
                ? 'Success'
                : status === 'error'
                  ? 'Error'
                  : 'Running'}
            </span>
          </div>
        )}
      </div>
    );
  },
);

CanvasNode.displayName = 'CanvasNode';
