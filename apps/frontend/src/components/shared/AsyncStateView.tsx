import { Card } from "@/components/ui/Card";

type AsyncStateViewProps = {
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
};

export function AsyncStateView({
  loading,
  error,
  isEmpty,
  emptyTitle = "No data yet",
  emptyDescription = "There is nothing to show for this view.",
  children,
}: AsyncStateViewProps) {
  if (loading) {
    return <div className="page-state">Loading...</div>;
  }

  if (error) {
    return (
      <Card title="Request failed">
        <p className="error-text">{error}</p>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card title={emptyTitle}>
        <p>{emptyDescription}</p>
      </Card>
    );
  }

  return <>{children}</>;
}
