"use client";

type AnimatedBeamProps = {
  d: string;
  className?: string;
  gradientStartColor?: string;
  gradientStopColor?: string;
  pathColor?: string;
  pathOpacity?: number;
  pathWidth?: number;
  duration?: number;
  delay?: number;
};

export function AnimatedBeam({
  d,
  className,
  gradientStartColor = "rgba(79,142,247,0)",
  gradientStopColor = "var(--blue)",
  pathColor = "var(--canvas-edge)",
  pathOpacity = 0.5,
  pathWidth = 1.5,
  duration = 2.5,
  delay = 0,
}: AnimatedBeamProps) {
  const gradientId = `rx-beam-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg className={`rx-animated-beam ${className || ""}`.trim()} viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradientStartColor} />
          <stop offset="100%" stopColor={gradientStopColor} />
        </linearGradient>
      </defs>
      <path d={d} stroke={pathColor} strokeOpacity={pathOpacity} strokeWidth={pathWidth} fill="none" strokeLinecap="round" />
      <path
        d={d}
        stroke={`url(#${gradientId})`}
        strokeWidth={pathWidth + 0.2}
        fill="none"
        strokeLinecap="round"
        className="rx-animated-beam__flow"
        style={{
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      />
    </svg>
  );
}
