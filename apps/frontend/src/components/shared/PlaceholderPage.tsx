import { Card } from "@/components/ui/Card";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card title={title}>
      <p>{description}</p>
    </Card>
  );
}
