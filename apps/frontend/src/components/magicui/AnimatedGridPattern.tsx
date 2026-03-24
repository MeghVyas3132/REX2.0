"use client";

import { CSSProperties, useMemo } from "react";

type AnimatedGridPatternProps = {
  numSquares?: number;
  maxOpacity?: number;
  duration?: number;
  className?: string;
};

export function AnimatedGridPattern({
  numSquares = 45,
  maxOpacity = 0.35,
  duration = 3,
  className,
}: AnimatedGridPatternProps) {
  const squares = useMemo(() => {
    return Array.from({ length: numSquares }, (_, index) => ({
      id: index,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * duration,
      opacity: Math.max(0.08, Math.random() * maxOpacity),
    }));
  }, [numSquares, maxOpacity, duration]);

  return (
    <div className={`rx-animated-grid ${className || ""}`.trim()} aria-hidden="true">
      {squares.map((square) => (
        <span
          key={square.id}
          className="rx-animated-grid__square"
          style={
            {
              left: `${square.x}%`,
              top: `${square.y}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${square.delay}s`,
              opacity: square.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
