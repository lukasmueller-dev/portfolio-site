# Project Roadmap — portfolio-site

> Long-lived, one per repo. Planned work only: one item per task, each
> designed well enough that a session can pick it up cold, without the
> discussion that produced it. A snapshot, not a log — finished items are
> removed; their trail lives in git history and merged PRs.

_Last updated: 2026-07-23 · server (srv1841294)_

## Items

_One checkbox per task. State the goal in one line, then the design:
approach chosen, constraints, what "done" looks like, and a pointer to any
fuller rationale. Group items into tracks when order matters; tracks are
independent of each other._

- [ ] Embed the VLA demo in the mini-vla write-up instead of linking to it.
      Today `/projects/mini-vla` links to `/#demo` (the hero on the home page).
      The mobile stacked layout (`.hero.demo-open`, app/globals.css) is already
      the shape an embedded demo needs, but "stacked" is decided by a media
      query on both sides — `STACKED_MQ` in components/Hero.tsx (wire Béziers,
      task profile, CTA/✕ visibility) and `@media (max-width: 1099px)` in the
      CSS. Approach: lift stacked-ness into an explicit prop/class the media
      query also sets, hide `.hero-content` + the ✕ in embed mode, render
      `<Hero embedded />` full-bleed on the project page. Decide whether the
      embed trains the desktop 8-color profile regardless of width.
      Done when: the write-up trains a policy in place on desktop and mobile,
      the home hero is unchanged, and tests/e2e/hero.spec.ts covers both.
