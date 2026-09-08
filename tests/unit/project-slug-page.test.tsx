import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "../../lib/content";

// The hero and the mini-vla write-up point at each other, and BOTH ends are
// hardcoded (DEMO_PROJECT_SLUG / DEMO_HREF in lib/content.ts). The hero's end
// is covered by tests/e2e/hero.spec.ts walking the real page; this covers the
// write-up's end without depending on whatever lib/projects-data.json holds.

const FIXTURE_PROJECTS: Project[] = [
  {
    slug: "mini-vla",
    title: "mini-vla",
    venue: "Open Source",
    blurb: "The demo project.",
    tags: ["VLM"],
    links: [{ label: "Code", href: "https://github.com/x/mini-vla" }],
    body: "Body text.",
  },
  {
    slug: "other-project",
    title: "Other",
    venue: "Open Source",
    blurb: "No demo here.",
    tags: [],
    links: [],
  },
];

vi.mock("@/lib/content", () => ({
  projects: FIXTURE_PROJECTS,
  getProject: (slug: string) => FIXTURE_PROJECTS.find((p) => p.slug === slug),
  profile: { name: "Test Name" },
  externalLinkProps: () => ({}),
  DEMO_PROJECT_SLUG: "mini-vla",
  DEMO_HREF: "/#demo",
}));

// Every href in the tree, without a DOM — same structural-assertion style as
// blog-slug-page.test.tsx (nested function components are never executed).
function hrefs(node: unknown): string[] {
  if (node == null || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(hrefs);
  const el = node as ReactElement<{ children?: unknown; href?: string }>;
  const own = typeof el.props?.href === "string" ? [el.props.href] : [];
  return [...own, ...hrefs(el.props?.children)];
}

describe("app/projects/[slug]/page.tsx", () => {
  it("links the demo project back to the hero demo", async () => {
    const { default: ProjectPage } = await import("@/app/projects/[slug]/page");
    const el = await ProjectPage({ params: Promise.resolve({ slug: "mini-vla" }) });
    expect(hrefs(el)).toContain("/#demo");
  });

  it("leaves every other project without a demo link", async () => {
    const { default: ProjectPage } = await import("@/app/projects/[slug]/page");
    const el = await ProjectPage({
      params: Promise.resolve({ slug: "other-project" }),
    });
    expect(hrefs(el)).not.toContain("/#demo");
  });
});
