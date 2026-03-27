import React from "react";

type KeyValue = { key: string; value: React.ReactNode };

type KeyValueListProps = {
  items: KeyValue[];
};

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1rem", margin: 0, padding: 0 }}>
      {items.map((item) => (
        <React.Fragment key={item.key}>
          <dt style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.875rem" }}>{item.key}</dt>
          <dd style={{ margin: 0, fontSize: "0.875rem" }}>{item.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
