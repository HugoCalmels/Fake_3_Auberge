import { expect, test } from "@playwright/test";

test("mentions légales accessibles depuis le footer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Mentions légales" }).click();

  await expect(page).toHaveURL(/\/mentions-legales$/);
  await expect(
    page.getByRole("heading", { name: "Mentions légales", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText("Site de démonstration.")).toBeVisible();
});
