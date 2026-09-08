# Handoff — portfolio-site / feat-link-mini-vla

> The baton. Present tense only: where the work stands *now* and what the
> next session should do. Overwrite it each session — never append. History
> lives in git and rationale in commit bodies, not here. Before the task
> ends, promote anything durable (project status, repo instructions, commit
> body) and delete this file from the branch: a finished task hands
> nothing off, and merged, a leftover baton strays onto the default branch.

- **Repo:** portfolio-site
- **Branch:** `feat-link-mini-vla`
- **Worktree:** /home/lukas-mueller/git/worktrees/portfolio-site/feat-link-mini-vla
- **Last updated:** 2026-09-08 20:05 CEST · local (turing)

## State

Done and verified, uncommitted. `/projects/mini-vla` now carries a "Try the
live demo" CTA above the body pointing at `/#demo`; the hero header has
`id="demo"` and opens the stacked demo when it mounts with that hash (mobile
would otherwise land on a hero with the pipeline hidden behind its CTA).
Both link targets come from `DEMO_PROJECT_SLUG` / `DEMO_HREF` in lib/content.ts.

Green: typecheck, lint, `npm test` (10 files), `npx next build`, and
`playwright --project=mobile,desktop -g "demo|routes"` against the real
Workers bundle.

## Next action

Commit + PR. Then, optional: the write-up body in the private content repo
(`portfolio-project-content/mini-vla/README.md`) still says "You can try it
at the top of this page" — the CTA now *is* at the top of the page, so it
reads true, but "on the home page" would be plainer.

## Blockers

None.

## Gotchas (unpromoted)

`npm ci` and `next build` need writes outside this repo (`~/.npm/_cacache`,
`~/.config/.wrangler`) — a sandboxed shell fails on both; `npm ci --cache
"$TMPDIR/npm-cache"` fixes the first.
