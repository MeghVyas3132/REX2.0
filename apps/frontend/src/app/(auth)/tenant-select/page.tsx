"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const demoTenants = [
  { id: "default", name: "Default Tenant", access: "both" as const },
  { id: "business", name: "Business Tenant", access: "business" as const },
  { id: "studio", name: "Studio Tenant", access: "studio" as const },
];

export default function TenantSelectPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState(demoTenants[0]?.id ?? "");

  const onContinue = () => {
    if (!tenantId) return;
    const selected = demoTenants.find((tenant) => tenant.id === tenantId);
    if (!selected) return;

    if (selected.access === "business") {
      router.push("/business");
      return;
    }
    router.push("/studio");
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 520, border: "1px solid #ddd", borderRadius: 16, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Select your tenant</h1>
        <p style={{ color: "#666" }}>Pick the organization context for this session.</p>
        <select
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 10, marginBottom: 16 }}
        >
          {demoTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <button onClick={onContinue} style={{ width: "100%", padding: 12, borderRadius: 10 }}>
          Continue
        </button>
      </section>
    </main>
  );
}
