import { expect, test } from "@playwright/test";
import axe from "axe-core";

test("renders the authenticated gate without leaking application internals", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Vertical/);
  await expect(
    page.getByRole("heading", {
      name: /Inicia sesión para continuar|Todo el flujo en un solo lugar/,
    })
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("META_ACCESS_TOKEN");
  await expect(page.locator("body")).not.toContainText("JWT_SECRET");
});

test("has no serious automated accessibility violations on the entry state", async ({
  page,
}) => {
  await page.goto("/");
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async () =>
    (
      window as unknown as {
        axe: {
          run: () => Promise<{ violations: Array<{ impact?: string | null }> }>;
        };
      }
    ).axe.run()
  );
  expect(
    results.violations.filter(
      item => item.impact === "critical" || item.impact === "serious"
    )
  ).toEqual([]);
});

test("keeps the shell usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/schedule");
  await expect(
    page.getByRole("heading", {
      name: /Inicia sesión para continuar|Todo el flujo en un solo lugar/,
    })
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});
