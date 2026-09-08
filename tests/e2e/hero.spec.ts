import { expect, test } from "@playwright/test";
import { batchCount, collectPageErrors, openHero, startTraining } from "./helpers";

// The alive-gate: proves the deployed bundle can actually run the hero's
// training loop — worker chunk loads, embeddings fetch, tfjs backend starts,
// batches flow. Convergence is NOT waited for here; that's hero-full.spec.ts.

test("hero training starts and batches advance", async ({ page, isMobile }) => {
  // startTraining allows 180s for the language warmup and the poll another
  // 90s — the 120s global timeout would cut those short on a slow CI runner.
  test.setTimeout(360_000);
  const errors = collectPageErrors(page);

  await openHero(page, isMobile);
  await startTraining(page);

  // Batches must actually advance — a hung worker sits at "Training" forever.
  await expect
    .poll(() => batchCount(page), { timeout: 90_000 })
    .toBeGreaterThanOrEqual(5);

  expect(errors).toEqual([]);

  // Stop the run so teardown isn't fighting a busy CPU.
  await page.locator(".vla-bar .vla-btn", { hasText: "Pause" }).click();
  await expect(page.locator(".vla-status-text")).toHaveText("Paused");
});

test("mobile demo opens and closes cleanly", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the CTA/stacked layout only exists below 1100px");

  const errors = collectPageErrors(page);
  await openHero(page, isMobile);
  await page.locator(".vla-close").click();
  await expect(page.locator(".vla-bar")).toBeHidden();
  expect(errors).toEqual([]);
});

// The write-up ↔ demo pairing (lib/content.ts DEMO_PROJECT_SLUG / DEMO_HREF).
// Both ends are hardcoded links, and on the mobile tier the target needs
// Hero.tsx's hash effect to unroll the stack — a plain anchor would land on a
// hero with no pipeline on it.
test("the mini-vla write-up's CTA lands on an open demo", async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto("/projects/mini-vla");
  await page.getByRole("link", { name: "Try the live demo" }).click();

  await expect(page).toHaveURL(/\/#demo$/);
  await expect(page.locator(".vla-bar")).toBeVisible();
  expect(errors).toEqual([]);
});

test("a cold /#demo load opens the demo", async ({ page }) => {
  const errors = collectPageErrors(page);

  await page.goto("/#demo");

  await expect(page.locator(".vla-bar")).toBeVisible();
  expect(errors).toEqual([]);
});
