# Review round 3 — findings (2026-07-25)

Third independent, blind review of the whole repo, reviewing the exact tree
round 2 left behind plus PR #61 (`122ff43`): 6 parallel sub-reviewers
(CI issue-tracking mechanism + `--project=desktop` scoping, the Hero.tsx
watchdog fix + its e2e test, the new `scripts/lib/` shared modules +
`lib/frontmatter.ts` extractions, `tests/unit/route-list.test.ts` + the PR
#61 résumé fix, docs-vs-code drift, and a generic-core sweep of the rest of
the repo), followed by a scan-only `codebase-health` leg, merged into one
ranked list. Sub-reviewers were kept blind to rounds 1/2's own findings docs
so their results could be checked for overlap afterward — every item below
is new; nothing duplicates rounds 1/2. Baseline gate (`typecheck`, `lint`,
`test`, `next build`) was green going in and stayed green throughout; a full
`npm run e2e:build && npm run e2e` pass (61 passed, 5 skipped as designed,
across desktop/mobile/webkit-mobile) matches round 2's exact baseline and
was re-run after all fixes below.

## Status: 9 fixes landed and verified; 12 reasoned findings reported only

## Confirmed live bugs

1. **HTML attribute-injection via an unescaped `href` in the custom
   `figure` Markdown extension.** `lib/richtext.tsx`'s `figure` block
   renderer escaped `alt` and `caption` via `escapeHtml()` but interpolated
   `token.href` raw into the `<img src="...">` attribute. The tokenizer's
   href capture (`([^)\s]+)`) excludes only `)`/whitespace, not `"` — a
   source image path containing a double quote (e.g.
   `![alt](x.png"onerror="a)`) broke out of the `src` attribute and
   injected an arbitrary attribute onto the `<img>` tag. Content is
   build-time/author-controlled today, but a stray quote in a real filename
   (not just adversarial content) would have silently corrupted the
   rendered figure, and the inconsistency with the adjacent `alt`/`caption`
   escaping in the same function was a real gap.
   **Fixed:** `token.href` now goes through the same `escapeHtml()` as
   `alt`/`caption`. Added a regression test reproducing the exact injection
   string; verified it fails without the fix (reverted and re-ran) and
   passes with it.

2. **`scripts/lib/github-token.mjs`'s dotfile token parser mangled a quoted
   token followed by trailing whitespace.** The regex
   `/^\s*GITHUB_TOKEN\s*=\s*(.+)\s*$/m`'s greedy `.+` consumed trailing
   whitespace before the quote-strip step ran, so a line like
   `GITHUB_TOKEN="ghp_xxx"   ` (trailing spaces — easy to introduce via an
   editor or template) left a stray `"` attached to the token
   (`ghp_xxx"`). Reproduced directly with a scratch Node script. Effect: a
   truthy-but-invalid token — `gen-resume-source.mjs` would hard-fail with
   a confusing `401` instead of the clear "no token" message, and
   `gen-blog-data.mjs`/`gen-projects-data.mjs` would silently degrade to
   stale committed data while looking like a normal auth failure. Not
   introduced by round 2's extraction (verified via `git show` that the
   regex was copied verbatim from the pre-extraction per-script code), but
   it's now the single implementation all three fetch scripts share.
   **Fixed:** trim the captured value before stripping quotes, not after.
   Verified with the same reproduction case.

## High-impact hardening (CI failure-tracking mechanism)

Round 2's own last-minute addition — `nightly-e2e-full.yml`'s
`issues: write` + open/close-on-failure `actions/github-script` steps —
had never been read adversarially until this round. Three real gaps found:

3. **No pagination.** Both steps called `github.rest.issues.listForRepo`
   directly rather than through `github.paginate`, so only the first 30
   open issues (the API's default page size) were ever inspected. A repo
   that accumulates more than 30 open issues, with the tracking issue
   pushed off page 1, would silently duplicate-create on the next failure
   and never auto-close on the next success. Not triggered today (repo
   currently has 0 open issues), but a real latent bug in shared logic.
   **Fixed:** switched both steps to `github.paginate(...)`.

4. **Title string duplicated with no shared source of truth.** Both steps
   independently hardcoded the literal `"nightly-e2e-full is failing"` —
   currently in sync, but nothing prevents future drift (a wording tweak
   to one without the other), which would silently break the close step's
   ability to find what the open step created.
   **Fixed:** moved the title into a job-level `TRACKING_ISSUE_TITLE` env
   var both steps read from `process.env`.

5. **Race condition could create duplicate tracking issues.** The workflow
   has both `schedule` and `workflow_dispatch` triggers and no
   `concurrency:` group anywhere in the repo's workflows. An overlapping
   manual dispatch during an in-flight scheduled run (the job runs 35+
   minutes) could let both invocations' open-step see no existing issue
   and both create one.
   **Fixed:** added a workflow-level `concurrency: {group:
   nightly-e2e-full, cancel-in-progress: false}` block.
   **Caveat, flagged for the owner:** these three fixes are logic-only
   changes to workflow YAML/JS that can't be exercised against a real
   GitHub Actions run from this environment (the same limitation round 2
   noted for its own `--project=desktop` change). The YAML was validated
   for syntax and the JS mechanics reasoned through carefully (`paginate`
   and `process.env` in `github-script` are both standard, documented
   patterns), but worth a first-hand check the next time this workflow
   actually fails and recovers.

6. **`.find()` (open step) vs `.filter()` (close step) asymmetry** — if
   duplicate matching issues ever exist, the open step only comments on
   the first; the close step correctly closes all of them. Self-healing
   (the close step cleans up any duplicates), and now much less likely to
   trigger with the concurrency fix in place. **Not fixed**, left as a
   minor residual asymmetry.

**Independently re-verified, not a bug:** the `--project=desktop` scoping
on `bump-mini-vla.yml`/`nightly-e2e-full.yml`'s `npm run e2e:full --
--project=desktop` (round 2, finding #14) was empirically re-tested —
reproduced npm's `--` argument-forwarding behavior directly (with and
without the separator) and confirmed `"desktop"` is the exact Playwright
project name (`playwright.config.ts`). Confirms round 2's fix is correct;
not a new finding, no action taken.

## Test coverage / drift fixes

7. **No test coverage for PR #61's `texttt` fix, and the live-template
   regression guard's own allowlist had already gone stale.**
   `tests/unit/resume.test.ts` had zero fixture coverage for `\texttt`
   (confirmed via grep), and separately, the live-template test's leftover-
   LaTeX-command check (`/\\(textbf|href|vspace)/`) only covered 3 of the 8
   commands `stripInline()` actually strips — `texttt`, `textit`,
   `underline`, `emph`, `small`, and `scshape` could all leak through a
   bullet in the real fetched résumé with no test catching it, because the
   allowlist was a hand-maintained second copy of `stripInline()`'s own
   wrapper-command list that had drifted out of sync.
   **Fixed:** added a `\texttt{...}` case to the fixture suite (verified it
   would have caught the exact PR #61 regression), and exported
   `INLINE_WRAPPER_COMMANDS` from `lib/resume.ts` so the live-template
   guard derives its regex from the same list `stripInline()` uses,
   instead of maintaining a second copy that can drift again.

8. **`lib/frontmatter.ts` had two small, untested parsing edge cases.**
   `splitFrontmatter`'s `---` fence regex required an exact `---\n` with no
   trailing whitespace tolerance (an editor-inserted trailing space would
   silently fail to match, and the whole file — including the frontmatter
   table — would be treated as body). `parseKvLine` matched its key regex
   against the raw, untrimmed line, so an indented `  title: Foo` line
   (e.g. from an accidental paste) silently dropped as an "unknown line"
   instead of parsing.
   **Fixed:** the fence regex now tolerates `[ \t]*` after each `---`
   marker; `parseKvLine` now matches against the trimmed line. Added
   `tests/unit/frontmatter.test.ts` covering both cases plus existing
   blank/comment-line behavior (previously untested directly, only via the
   two callers' own test suites).

## Lower severity / cleanup (codebase-health leg)

9. **`ghHeaders()`/`ghFile()`/`readExisting()` were byte-identical
   copy-pasted helpers** across `gen-blog-data.mjs` and
   `gen-projects-data.mjs` (round 2 already extracted `loadToken`/
   `deriveSlug` for exactly this duplication pattern but missed these
   three). `gen-resume-source.mjs`'s own `ghFile` is a genuinely different
   third variant (always-authenticated, since `TOKEN` is guaranteed
   non-null by the time it's called) and was deliberately left alone.
   **Fixed:** extracted to `scripts/lib/github-fetch.mjs`. Verified by
   running both scripts live against the real (offline, no-token) path —
   output byte-identical to before the extraction — and via `npm test`/
   `next build`.

10. **`components/Hero.tsx` had two small duplication gaps**, found
    independently by both the adversarial-static-read agent and the
    codebase-health scan: `pauseTraining()`/`resetToIdle()` duplicated
    `clearTrainWatchdog()`'s body inline instead of calling the existing
    helper (defined later in the file but safely callable, since closures
    resolve at call time not definition time), and `pauseTraining()`/
    `resumeTraining()`/`resetToIdle()` each duplicated `setStatusBoth()`'s
    two-line body instead of calling it (it was defined but used only
    once).
    **Fixed:** replaced all four inline duplicates with calls to the
    existing helpers; moved `clearTrainWatchdog`'s definition earlier in
    the file (required by the linter's hooks rule, since two of the new
    call sites now reference it). Verified against the real bundle: full
    `npm run e2e:build && npm run e2e` pass, 61/5, identical to round 2's
    baseline — including all four `hero-watchdog.spec.ts` cases.

11. **`scripts/gen-projects-data.mjs`'s `periodKey()` sort key only
    recognized `"Ongoing"`, not the more common `"...Present"` convention**
    for an active/in-progress project period. A period string of just
    `"Present"` (no other date) would key on `Date.parse("1 Jan ")` → `NaN`
    → `0`, sorting it last instead of pinning it to the top like
    `"Ongoing"` does. Dormant today (all committed periods use "Ongoing" or
    full dated ranges), but an unmodelled-vocabulary trap for the next
    content author.
    **Fixed:** the ongoing-sentinel regex now also matches `/present/i`.

## Docs drift

12. **`CLAUDE.md` undercounted `scripts/copy-vla-assets.mjs`'s invocation
    paths.** It's documented as running on `predev`/`prebuild`/`pretest`,
    but it's also invoked a fourth way via `open-next.config.ts`'s
    `buildCommand` override — the path that actually stages assets for
    `preview`/`deploy`/`e2e:build` (none of which run `npm run build`, so
    `prebuild` never fires for them). A reader relying on the documented
    list to answer "how does the e2e job's bundle get its VLA assets"
    would have been misled.
    **Fixed:** updated the sentence to name the `open-next.config.ts` path
    alongside the three npm-script hooks.

**Investigated, not drift:** `CLAUDE.md`'s Layout section omitting
`scripts/lib/` (consistent with the section omitting every other
subdirectory, e.g. `components/hero/`, not a selective gap) and its CI
paragraph omitting the issue-tracking mechanism / `--project=desktop`
scoping (the paragraph's job is architectural intent — why two lanes exist,
why the slow specs are excluded — not operational mechanics; nothing it
currently states is false). No action needed on either.

## Reasoned, not fixed — reported for the owner

13. **`tests/unit/route-list.test.ts` (round 2's own new test) never
    validates against `app/`, the actual source of truth.** It only
    cross-checks three hand-maintained lists (`nav`, `next.config.mjs`,
    `tests/e2e/helpers.ts`) against each other via text search — a wholly
    new route added under `app/` but never touched in any of the three
    lists passes silently, since all three remain internally consistent
    about not knowing it exists. Related gaps in the same test: checks are
    one-directional (nav ⊆ config, never the reverse, so stale entries
    aren't caught); the five-route allowlist is hardcoded rather than
    derived, so it only protects the current five; and the whole approach
    is literal-text-based, so a future refactor to compute any of the
    three lists (e.g. deriving `next.config.mjs`'s `pageRoutes` from `nav`)
    would silently defeat it. A real fix needs either a filesystem scan of
    `app/` or an explicit decision that this test's job is only "keep
    three hand-lists in sync," not "guarantee no route slips through" —
    an owner-level design call, not a mechanical fix.

14. **`lib/resume.ts`'s `hrefRe`/`skillRe` use non-nesting `[^}]*`
    captures**, unlike `readArgs()` (used for `\resumeSubheading`/
    `\resumeItem`), which correctly depth-tracks braces. Nested formatting
    inside `\href{url}{\textbf{Text}}` or a Skills entry containing
    `\texttt{...}` would truncate the capture at the first inner `}` —
    it currently self-heals only because `stripInline`'s blanket
    `[{}]`-strip mops up whatever leaks through, which is fragile and
    wouldn't repair every nesting shape. No test exercises this case.
    Restructuring to a nesting-aware capture is a real change to a parser
    whose own header comment warns it's narrowly targeted to the live
    template, not general — flagged rather than changed unilaterally.

15. **`scripts/lib/slug.mjs`'s `deriveSlug()` has a few theoretical, config-
    gated edge cases**: zero path-traversal sanitization (a malformed
    `repo: "owner/../../etc"` in `config/projects.sources.json` could
    theoretically escape the intended `public/projects/<slug>` directory);
    `??` doesn't catch an explicit empty-string `"slug": ""` (falls through
    to a misleading "no repo set" error even when `repo` is set); slug
    uniqueness is checked case-sensitively in a unit test but the derived
    path is a real filesystem path (collision only on case-insensitive dev
    filesystems). All three are gated by owner-authored config, not
    attacker input, and none are live today — reported for awareness.

16. **`lib/frontmatter.ts`'s `parseAiAssisted()` fails closed on any
    unparseable value** (a typo, an empty value, a missing key), silently
    resolving to "don't show the AI-assistance disclosure" rather than
    erroring loudly — worth knowing given the flag's disclosure-policy
    meaning, though pre-existing (unchanged by round 2's extraction) and
    gated by owner-authored content, not user input.

17. **Asset filename collisions via `path.basename()`** in
    `gen-projects-data.mjs`/`gen-blog-data.mjs`: two images from different
    source subdirectories sharing a basename would silently overwrite each
    other in the shared per-slug output directory. Reasoned-but-unproven
    (no current content triggers it); a real fix means changing the asset
    path scheme, a bigger design decision than this round should make
    unilaterally.

18. **`tests/e2e/hero-watchdog.spec.ts`'s fast-forward margins are tied to
    `TRAIN_STALL_MS` only by comment**, not a shared import — a future
    retune of that constant could silently shrink the test's real-vs-stale
    deadline discrimination margin with no signal. Exporting the constant
    for the test to import is a reasonable follow-up; not done this round
    given the constant currently lives in `components/Hero.tsx`'s private
    module scope and exporting it crosses a component/test-code boundary
    worth a deliberate decision rather than a drive-by change.

19. **`listForRepo` (even paginated) also returns pull requests**, not just
    issues — a PR that happened to share the exact tracking-issue title
    would match. Extremely unlikely in practice (nobody titles a PR that);
    no fix applied.

**Independently re-verified, no action needed:**
- `components/Hero.tsx`'s `pauseTraining()` watchdog-clear fix and its
  `hero-watchdog.spec.ts` regression test (round 2, finding #1) — traced
  against the real `mini-vla` worker protocol; confirmed correct on the
  production (Worker) path, and the test genuinely discriminates
  buggy-vs-fixed behavior rather than testing something weaker.
- The build-id fetch guard next to it (round 2, finding #4's follow-on) —
  confirmed it correctly treats a malformed-but-200 response the same as
  the network/parse failures already handled nearby.

## Verification

Full baseline gate (`typecheck`, `lint`, `test`, `next build`) green before
any fix and re-confirmed green after all fixes. `npm run e2e:build && npm
run e2e` re-run after all fixes: 61 passed, 5 skipped as designed (the two
`VLA_FULL`-gated convergence specs × 3 projects, the mobile-only demo-close
test on desktop/webkit, the tokenless resume-PDF test) — identical to round
2's own baseline, confirming the `Hero.tsx` dedup cleanup didn't change
behavior. The `richtext.tsx` injection fix and the `resume.ts`/
`frontmatter.ts` edge-case fixes were each verified by reverting and
confirming the new test fails, then restoring and confirming it passes. The
`scripts/lib/github-fetch.mjs` extraction was verified by running both
`gen-blog-data.mjs` and `gen-projects-data.mjs` live (offline, no-token
path) and diffing output against the pre-extraction committed data —
byte-identical.
