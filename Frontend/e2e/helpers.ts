import { expect, type Page } from "@playwright/test";

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Même format que l'aria-label des jours du calendrier (ex. "3 novembre 2026")
export function calendarLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function openBookingModal(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Réserver", exact: true }).first().click();
  await expect(page.getByText("Dates du séjour")).toBeVisible();
}

// Avance le calendrier jusqu'au mois contenant `date`, puis clique le jour
export async function pickCalendarDate(page: Page, date: Date) {
  const day = page.getByRole("button", { name: calendarLabel(date), exact: true });

  for (let i = 0; i < 12 && !(await day.isVisible()); i++) {
    await page.getByRole("button", { name: "Mois suivant" }).click();
  }

  await day.click();
}
