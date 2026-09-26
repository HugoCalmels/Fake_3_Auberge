import { expect, test } from "@playwright/test";
import {
  addDays,
  calendarLabel,
  openBookingModal,
  pickCalendarDate,
  watchCspViolations,
} from "./helpers";

test.describe("Réservation", () => {
  test("les dates passées ne sont pas sélectionnables", async ({ page }) => {
    await openBookingModal(page);

    const today = new Date();
    const yesterday = addDays(today, -1);

    // Le 1er du mois, la veille n'est pas forcément affichée : on vérifie alors le mois précédent
    if (yesterday.getMonth() !== today.getMonth()) {
      await page.getByRole("button", { name: "Mois précédent" }).click();
    }

    await expect(
      page.getByRole("button", { name: calendarLabel(yesterday), exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: calendarLabel(today), exact: true }),
    ).toBeEnabled();
  });

  test("réservation complète payée avec la carte de test Stripe", async ({
    page,
  }) => {
    // Dates lointaines et aléatoires pour ne pas épuiser le stock d'un test à l'autre
    const offset = 60 + Math.floor(Math.random() * 200);
    const checkIn = addDays(new Date(), offset);
    const checkOut = addDays(checkIn, 2);
    const cspViolations = watchCspViolations(page);

    await openBookingModal(page);
    await pickCalendarDate(page, checkIn);
    await pickCalendarDate(page, checkOut);
    await page.getByRole("button", { name: "Continuer" }).click();

    await page.getByRole("button", { name: "Ajouter" }).first().click();
    await page.getByRole("button", { name: "Continuer" }).click();

    const modal = page.getByRole("dialog");
    await modal.getByLabel("Nom complet").fill("Test E2E");
    await modal.getByLabel("Email", { exact: true }).fill("e2e@example.com");

    // Rien n'est présélectionné : le client doit choisir la carte
    const cardOption = modal.getByRole("radio", { name: "Carte bancaire" });
    await expect(cardOption).toHaveAttribute("aria-checked", "false");
    await cardOption.click();
    await expect(cardOption).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Aucun débit réel")).toBeVisible();

    // Chaque champ Stripe est une iframe placée juste sous notre libellé
    const stripeInput = (label: string, inputName: string) =>
      modal
        .getByText(label, { exact: true })
        .locator("xpath=following-sibling::div[1]//iframe")
        .contentFrame()
        .locator(`input[name="${inputName}"]`);

    await stripeInput("Numéro de carte", "cardnumber").fill("4242424242424242");
    await stripeInput("Expiration", "exp-date").fill("12 / 34");
    await stripeInput("CVC", "cvc").fill("123");

    await page.getByRole("button", { name: "Payer" }).click();

    await expect(page.getByText("Paiement reçu")).toBeVisible({
      timeout: 45_000,
    });
    expect(cspViolations).toEqual([]);
  });
});
