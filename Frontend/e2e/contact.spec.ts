import { expect, test } from "@playwright/test";

test.describe("Formulaire de contact", () => {
  test.beforeEach(async ({ page }) => {
    // Pas de vrai email envoyé via Brevo pendant les tests
    await page.route("**/contact", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "ok" }),
      });
    });

    await page.goto("/#contact");
    // Attendre que React ait pris la main sur le formulaire avant de taper (WebKit est plus lent)
    await page.waitForLoadState("networkidle");
  });

  test("bouton désactivé tant que le formulaire est invalide", async ({
    page,
  }) => {
    const form = page.locator("#contact form");
    const submit = form.getByRole("button", { name: "Envoyer" });

    await expect(submit).toBeDisabled();
    await expect(form.getByText("10 caractères minimum")).toBeVisible();

    await form.getByPlaceholder("Votre nom").fill("Hugo");
    await form.getByPlaceholder("vous@email.fr").fill("hugo");
    await form.getByPlaceholder("Votre message").click(); // quitte le champ email

    await expect(form.getByText("Adresse email invalide")).toBeVisible();

    await form.getByPlaceholder("vous@email.fr").fill("hugo@example.com");
    await expect(form.getByText("Adresse email invalide")).toBeHidden();

    await form.getByPlaceholder("Votre message").fill("Bonjour");
    await expect(form.getByText("encore 3")).toBeVisible();
    await expect(submit).toBeDisabled();

    await form.getByPlaceholder("Votre message").fill("Bonjour, une question ?");
    await expect(submit).toBeEnabled();
  });

  test("envoi réussi", async ({ page }) => {
    const form = page.locator("#contact form");

    await form.getByPlaceholder("Votre nom").fill("Hugo");
    await form.getByPlaceholder("vous@email.fr").fill("hugo@example.com");
    await form
      .getByPlaceholder("Votre message")
      .fill("Bonjour, avez-vous de la place pour un groupe ?");
    await form.getByRole("button", { name: "Envoyer" }).click();

    await expect(form.getByText("Message envoyé avec succès")).toBeVisible();
  });
});
