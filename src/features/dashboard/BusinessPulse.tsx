import styles from "./BusinessPulse.module.css";

type PulseItem = {
  label: string;
  value: number | string;
  detail: string;
  tone?: "default" | "attention" | "positive";
};

export function BusinessPulse({
  eyebrow = "Business pulse",
  title,
  description,
  items,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  items: PulseItem[];
}) {
  return (
    <section className={styles.pulse} aria-labelledby="business-pulse-title">
      <div className={styles.lead}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id="business-pulse-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
      <dl className={styles.metrics}>
        {items.map((item) => (
          <div
            key={item.label}
            className={`${styles.metric} ${
              item.tone === "attention"
                ? styles.attention
                : item.tone === "positive"
                  ? styles.positive
                  : ""
            }`}
          >
            <dt>{item.label}</dt>
            <dd data-workspace-number>{item.value}</dd>
            <p>{item.detail}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}