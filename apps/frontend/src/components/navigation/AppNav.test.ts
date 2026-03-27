import { describe, expect, it } from "vitest";

import { getVisibleNavSections } from "@/components/navigation/AppNav";

describe("AppNav role mapping", () => {
  it("shows admin nav only for super_admin", () => {
    const superAdminSections = getVisibleNavSections("super_admin");
    const viewerSections = getVisibleNavSections("org_viewer");

    const superAdminLinks = superAdminSections.flatMap((section) => section.links.map((link) => link.href));
    const viewerLinks = viewerSections.flatMap((section) => section.links.map((link) => link.href));

    expect(superAdminLinks).toContain("/tenants");
    expect(viewerLinks).not.toContain("/tenants");
  });

  it("returns empty nav for unauthenticated role", () => {
    expect(getVisibleNavSections(null)).toEqual([]);
  });

  it("keeps core navigation visible for org_viewer", () => {
    const sections = getVisibleNavSections("org_viewer");
    const links = sections.flatMap((section) => section.links.map((link) => link.href));

    expect(links).toContain("/dashboard");
    expect(links).toContain("/workflows");
    expect(links).toContain("/templates");
  });
});
