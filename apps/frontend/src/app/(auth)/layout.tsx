import { RequireGuest } from "@/lib/rbac/guards";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireGuest>
      <main className="center-page">{children}</main>
    </RequireGuest>
  );
}
