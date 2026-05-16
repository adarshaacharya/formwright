import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import CodeBlock from "@theme/CodeBlock";
import styles from "./index.module.css";

const INSTALL = `npm install formwright react-hook-form`;

const FEATURES = [
  {
    title: "Schema-driven",
    description:
      "Define fields, layout, rules, and data sources in plain TypeScript. No JSX in your form logic.",
  },
  {
    title: "Conditional logic built in",
    description:
      "Show, hide, enable, disable, and require fields based on other values or runtime context — evaluated on every change, zero boilerplate.",
  },
  {
    title: "Bring your own UI",
    description:
      "Works with shadcn/ui, Radix, Mantine, Ant Design, MUI, or your own design system. Use FormField compound parts or fieldRendererMap.",
  },
  {
    title: "React Hook Form native",
    description:
      "Built on top of RHF. All RHF features work — resolvers, watch, setValue, manual submit handling.",
  },
  {
    title: "Flexible validation",
    description:
      "Schema-driven field constraints map to RHF rules automatically. Pass a Zod or Yup resolver for cross-field validation.",
  },
  {
    title: "Extensible via plugins",
    description:
      "Add custom operators, effects, field types, and data loaders. All built-in behavior ships as plugins.",
  },
];

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className={clsx("col col--4", styles.featureCard)}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Formwright
        </Heading>
        <p className="hero__subtitle">
          Schema-driven form engine for React. Define your form once — runtime handles conditional logic, layout, validation, and data sources.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/quickstart/getting-started">
            Get started in 5 minutes
          </Link>
          <Link className={clsx("button button--outline button--secondary button--lg", styles.buttonSecondary)} to="/docs">
            Browse docs
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description="Schema-driven form engine for React — conditional logic, validation, and data sources built in.">
      <HomepageHeader />

      <main>
        {/* Install */}
        <section className={styles.installSection}>
          <div className="container">
            <div className={styles.installBlock}>
              <CodeBlock language="bash">{INSTALL}</CodeBlock>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.featuresSection}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>Why Formwright</Heading>
            <div className="row">
              {FEATURES.map((f) => (
                <Feature key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* Start here links */}
        <section className={styles.linksSection}>
          <div className="container">
            <Heading as="h2" className={styles.sectionTitle}>Start here</Heading>
            <div className="row">
              {[
                { label: "Quick Start", desc: "First form in 5 minutes", to: "/docs/quickstart/getting-started" },
                { label: "Mental Model", desc: "Schema → Runtime → Renderer", to: "/docs/concepts/mental-model" },
                { label: "Customization", desc: "BYOC — use your design system", to: "/docs/guides/customization" },
                { label: "API Reference", desc: "Full exported surface", to: "/docs/reference/schema-api" },
              ].map(({ label, desc, to }) => (
                <div key={label} className="col col--3">
                  <Link className={styles.linkCard} to={to}>
                    <strong>{label}</strong>
                    <span>{desc}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
