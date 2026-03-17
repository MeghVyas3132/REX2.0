import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: CSSProperties;
  headerRight?: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, style, headerRight, className }: CardProps) {
  return (
    <section className={className ?? "rex-card"} style={{ ...cardStyle, ...style }}>
      {title || subtitle || headerRight ? (
        <header style={headerStyle}>
          <div>
            {title ? <h3 style={titleStyle}>{title}</h3> : null}
            {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
          </div>
          {headerRight}
        </header>
      ) : null}
      {children}
    </section>
  );
}

const cardStyle: CSSProperties = {
  background: "linear-gradient(180deg, var(--surface-1), var(--surface-2))",
  border: "1px solid var(--border-muted)",
  borderRadius: 14,
  padding: 18,
  boxShadow: "var(--shadow-1)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  fontSize: 16,
  fontWeight: 600,
};

const subtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--text-tertiary)",
  fontSize: 12,
};
