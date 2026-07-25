// Shared by gen-blog-data.mjs and gen-projects-data.mjs — previously
// byte-identical copy-pasted helpers in both. gen-resume-source.mjs's own
// ghFile is intentionally NOT unified with these: by the time it runs, TOKEN
// is guaranteed non-null (it throws earlier otherwise), so it always sends
// Authorization unconditionally rather than the conditional header these two
// soft-fail (no-token-still-builds-from-committed-data) scripts need.
import fs from "node:fs";

export function ghHeaders(token) {
  const h = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-build" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// Fetch a repo file's raw bytes via the Contents API (works for private repos).
export async function ghFile(token, repo, filePath) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const res = await fetch(url, {
    headers: { ...ghHeaders(token), Accept: "application/vnd.github.raw" },
  });
  if (!res.ok) throw new Error(`${res.status} for ${repo}/${filePath}`);
  return Buffer.from(await res.arrayBuffer());
}

export function readExisting(outPath) {
  try {
    return JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    return [];
  }
}
