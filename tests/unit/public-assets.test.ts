import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { posts, projects } from "../../lib/content";

// The gen-*-data.mjs fetchers rewrite relative README/post image paths to
// /projects/<slug>/<file> and /blog/<slug>/<file>, but they only run on
// `predev` — build, preview, deploy and CI all use the committed JSON. So the
// files those paths name must be committed under public/ too, or every one of
// those builds ships images that 404. (They were gitignored; see .gitignore.)

const PUBLIC = path.resolve(import.meta.dirname, "../../public");

function localRefs(body: string, prefix: string) {
  return [...body.matchAll(new RegExp(`\\]\\((${prefix}/[^)\\s]+)`, "g"))].map((m) => m[1]);
}

describe("committed public assets", () => {
  it("every local image a project body references exists under public/", () => {
    const refs = projects.flatMap((p) => localRefs(p.body ?? "", "/projects"));
    expect(refs.length).toBeGreaterThan(0); // guard against a vacuous pass
    for (const ref of refs) expect(fs.existsSync(path.join(PUBLIC, ref)), ref).toBe(true);
  });

  it("every local image a post body references exists under public/", () => {
    for (const ref of posts.flatMap((p) => localRefs(p.body ?? "", "/blog"))) {
      expect(fs.existsSync(path.join(PUBLIC, ref)), ref).toBe(true);
    }
  });

  it("every local link href in projects-data.json exists under public/", () => {
    for (const p of projects) {
      for (const l of p.links) {
        if (l.href.startsWith("/")) expect(fs.existsSync(path.join(PUBLIC, l.href)), l.href).toBe(true);
      }
    }
  });
});
