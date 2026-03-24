import Link from "next/link";
import { Button } from "@/components/ui";

const productPaths = [
  {
    key: "studio",
    title: "Rex Studio",
    audience: "For Developers",
    description:
      "Advanced workflow builder with full control, composable nodes, and coding-friendly tooling.",
    href: "/login",
    action: "Open Rex Studio",
    features: ["Advanced workflow canvas", "Node-level customization", "Developer dashboard + observability"],
  },
  {
    key: "business",
    title: "Rex Business",
    audience: "For Non-Technical Users",
    description:
      "Template-first automation experience with guided setup and no coding required.",
    href: "/business",
    action: "Open Rex Business",
    features: ["Pre-built automation templates", "Beginner-friendly setup", "Business dashboards and run history"],
  },
] as const;

export default function GetStartedPage() {
  return (
    <div className="rx-flow-select">
      <div className="rx-flow-select__backdrop" aria-hidden="true" />
      <main className="rx-flow-select__main page-reveal">
        <Link href="/" className="rx-flow-select__home">← Back to Landing</Link>

        <section className="rx-flow-select__header">
          <p className="rx-flow-select__kicker">Choose your experience</p>
          <h1>How do you want to use REX?</h1>
          <p>
            Pick a path based on your team and workflow style. You can switch between Rex Studio and
            Rex Business at any time.
          </p>
        </section>

        <section className="rx-flow-select__grid" aria-label="Product options">
          {productPaths.map((path, index) => (
            <article
              key={path.key}
              className={`rx-product-card rx-product-card--${path.key} stagger-in`}
              style={{ ["--stagger-delay" as string]: `${index * 90 + 80}ms` }}
            >
              <div className="rx-product-card__header">
                <p className="rx-product-card__audience">{path.audience}</p>
                <h2>{path.title}</h2>
                <p>{path.description}</p>
              </div>

              <ul className="rx-product-card__features" aria-label={`${path.title} capabilities`}>
                {path.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              <div className="rx-product-card__footer">
                <Link href={path.href} className="rex-link-reset">
                  <Button variant="primary" size="md">{path.action}</Button>
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
