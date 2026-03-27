import { cn } from "@/lib/utils/cn";

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function Card({ title, children, className }: CardProps) {
  return (
    <section className={cn("card", className)}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </section>
  );
}
