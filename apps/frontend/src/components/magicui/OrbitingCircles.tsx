"use client";

import { ReactNode } from "react";

type OrbitingCirclesProps = {
  radius?: number;
  duration?: number;
  reverse?: boolean;
  children: ReactNode;
  className?: string;
};

export function OrbitingCircles({
  radius = 80,
  duration = 20,
  reverse = false,
  children,
  className,
}: OrbitingCirclesProps) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <div
      className={`rx-orbit ${className || ""}`.trim()}
      style={{
        ["--duration" as string]: `${duration}s`,
        ["--radius" as string]: `${radius}px`,
        ["--direction" as string]: reverse ? "reverse" : "normal",
      }}
    >
      {items.map((child, index) => {
        const angle = (360 / items.length) * index;
        return (
          <div
            key={index}
            className="rx-orbit__item"
            style={{ ["--angle" as string]: `${angle}deg` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
