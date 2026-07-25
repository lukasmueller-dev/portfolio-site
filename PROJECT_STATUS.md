# Project Status — portfolio-site

> Long-lived, one per repo. The durable *current* picture of the project:
> what it is for, how it is built, what was decided, what is open. A
> snapshot, not a log — git history is the log, so finished work is removed
> rather than archived here.

_Last updated: 2026-07-25 · server (srv1841294)_

## Goal

Lukas's personal portfolio site (projects, blog, résumé), deployed to
Cloudflare Workers. Its centerpiece is a live, in-browser TensorFlow.js
behavior-cloning demo (`components/Hero.tsx`) built on the `mini-vla`
package — the site doubles as a working demonstration of the author's
robot-learning work, not just a static résumé page.

## Architecture

See `CLAUDE.md` for the full picture (build-time content fetch, the two CI
lanes, cache-busting/stale-tab reload, the Hero VLA demo's watchdog/replay
design) — that file is kept accurate and is the canonical reference; this
section stays a pointer rather than a second copy that can drift from it.

## Key decisions

- 2026-07-23 (round 1, PR #57): mini-vla version/tag mismatches are checked
  but not build-blocking — a mismatch can be harmless (verified for
  v0.7.1/0.7.0 by diffing asset trees); see `bump-mini-vla.yml`.
- 2026-07-23 (round 1, PR #57): `.env` added to `.gitignore` — was a
  supported token source but not ignored, a live-PAT-commit risk.
- 2026-07-23 (round 1, PR #57): `app/vla-debug/` (a leftover debug route)
  removed after confirming its root cause (mini-vla asset-path drift) was
  already fixed elsewhere.
- 2026-07-23 (round 1, PR #57): proposed a new codebase-review dimension,
  "silent partial-failure in build-time generation loops" — lives in the
  separate `agentic-dev-toolkit` repo, not actioned here.
- 2026-07-23 (round 2, this branch): `pauseTraining()` now clears the
  train-stall watchdog on every pause — a short pause/resume near the
  stall deadline could previously false-trip it. See
  `docs/review-round-2-findings.md` #1.
- 2026-07-23 (round 2, this branch): `gen-blog-data.mjs` now refuses to
  overwrite a non-empty `lib/posts-data.json` with an empty listing result
  (previously indistinguishable from a genuinely empty blog). See
  `docs/review-round-2-findings.md` #2.
- 2026-07-23 (round 2, this branch): confirmed with the owner —
  `bump-mini-vla.yml`'s version-consistency check stays warn-only, not
  build-blocking, permanently by design (a mismatch can be harmless, as
  already proven once). Only its PR-body wording was fixed to stop implying
  otherwise. See `docs/review-round-2-findings.md` #3.
- 2026-07-23 (round 2, this branch): `nightly-e2e-full.yml` now opens/
  updates a title-matched tracking issue on failure and closes it on the
  next green run (`issues: write` granted) — GitHub's default
  scheduled-workflow email alone was easy to miss. See
  `docs/review-round-2-findings.md` #13.
- 2026-07-23 (round 2, this branch): `hero-full.spec.ts`'s slow
  train-to-convergence run is now scoped to the `desktop` Playwright project
  only (`--project=desktop` on `npm run e2e:full` in both
  `bump-mini-vla.yml` and `nightly-e2e-full.yml`) — its 35-min timeout was
  only ever measured there; the other hero specs already cover
  mobile/webkit-mobile via `ci.yml`. See `docs/review-round-2-findings.md` #14.
- 2026-07-25 (round 3, this branch): `nightly-e2e-full.yml`'s failure-
  tracking issue mechanism (added round 2) hardened — paginated issue
  lookup, a shared `TRACKING_ISSUE_TITLE` env var instead of two
  independent literals, and a `concurrency` group to prevent duplicate
  issues from an overlapping scheduled/manual run. Unverified against a
  real GitHub Actions run (same limitation as round 2's own `--project`
  change) — worth a first-hand check on the next real failure/recovery
  cycle. See `docs/review-round-3-findings.md` #3-5.
- 2026-07-25 (round 3, this branch): fixed a real HTML attribute-injection
  gap in `lib/richtext.tsx`'s custom `figure` Markdown extension (unescaped
  `href`) and a token-mangling bug in `scripts/lib/github-token.mjs`'s
  dotfile parser (quoted value + trailing whitespace). See
  `docs/review-round-3-findings.md` #1-2.
- 2026-07-25 (round 3, this branch): `tests/unit/route-list.test.ts`
  (added round 2) doesn't validate against `app/`, the actual route source
  of truth — only cross-checks three hand-written lists against each other.
  Reported, not fixed: a real fix needs either a filesystem scan of `app/`
  or an explicit decision that the test's job is narrower than "guarantee
  no route slips through." See `docs/review-round-3-findings.md` #13.

## Roadmap

Planned work lives in `PROJECT_ROADMAP.md`, one designed item per task —
this file keeps only the pointer.

## Open questions

_Unresolved things that block or shape the work._

- ...
