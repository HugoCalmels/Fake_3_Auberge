import { expect, test } from "@playwright/test";

test("page d'accueil : sections et hébergements chargés depuis l'API", async ({
  page,
}) => {
  const roomTypes = page.waitForResponse(
    (response) =>
      response.url().includes("/bookings/room-types") && response.ok(),
  );

  await page.goto("/");
  await roomTypes;

  await expect(page.getByRole("link", { name: "Infos/contact" }).first()).toBeAttached();
  await expect(page.locator("#hebergement")).toBeVisible();
  await expect(page.locator("#contact")).toBeAttached();
  await expect(page.getByText("Failed to fetch")).toHaveCount(0);
});
