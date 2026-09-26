import { expect, test } from "@playwright/test";

// Identifiants de démo créés par le seed (Backend/prisma/seed.ts)
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "owner@auberge.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123456";

test.describe("Back-office", () => {
  test("connexion admin puis chargement du planning", async ({ page }) => {
    await page.goto("/admin");

    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);

    const planningResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/admin/planning") && response.status() === 200,
    );
    await page.getByRole("button", { name: "Se connecter" }).click();

    await planningResponse;
    await expect(
      page.getByRole("button", { name: "Se connecter" }),
    ).toBeHidden();
  });

  test("mauvais mot de passe refusé", async ({ page }) => {
    await page.goto("/admin");

    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(
      page.getByRole("button", { name: "Se connecter" }),
    ).toBeVisible();
    await expect(page.locator("form p.text-red-600")).toBeVisible();
  });
});
