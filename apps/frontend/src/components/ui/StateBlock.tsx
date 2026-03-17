import type { ReactNode } from "react";
import { Card } from "./Card";

type StateTone = "loading" | "empty" | "error";

interface StateBlockProps {
  tone: StateTone;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function StateBlock({ tone, title, description, action }: StateBlockProps) {
  const toneClass =
    tone === "error"
      ? "rex-state-error"
      : tone === "loading"
        ? "rex-state-loading"
        : "rex-state-empty";

  return (
    <Card className={`rex-state-block ${toneClass}`}>
      <p className="rex-state-title">{title}</p>
      {description ? <p className="rex-state-description">{description}</p> : null}
      {action ? <div className="rex-state-action">{action}</div> : null}
    </Card>
  );
}
