import { defineConfig, devices } from "@playwright/test";

// Tests end-to-end sur les parcours critiques (réservation, paiement Stripe test,
// contact, admin). Ils tournent contre le front ET l'API locaux : si ton
// `npm run dev` / `npm run start:dev` tournent déjà, ils sont réutilisés.
// Lancer : npm run test:e2e   (ou npm run test:e2e:ui pour les voir tourner)
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // les tests partagent la même base locale
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: [
    {
      command: "npm run start:dev",
      cwd: "../Backend",
      url: "http://localhost:3001/bookings/room-types",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
