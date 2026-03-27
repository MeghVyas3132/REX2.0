type EntityHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function EntityHeader({ title, subtitle, actions }: EntityHeaderProps) {
  return (
    <header className="entity-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="entity-header-actions">{actions}</div> : null}
    </header>
  );
}
