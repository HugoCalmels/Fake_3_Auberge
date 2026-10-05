# Auberge du Fauxcalm

Mini PMS pour une auberge de montagne : site public, réservation avec paiement en ligne, back-office.
Démo, faux client.

[Site](https://auberge-du-fauxcalm.netlify.app/) · [Captures et présentation](https://hugo-calmels.fr/fr/sites-web/site-dynamique-avance)

## Fonctionnalités

- Réservation en ligne, disponibilités en temps réel
- Paiement Stripe, facture PDF et e-mail de confirmation
- Back-office : planning, réservations, chambres, statistiques, journal

## Stack

- Front : Next.js 16, React 19, TypeScript, Tailwind CSS 4 — Netlify
- API : NestJS 11, Prisma 7, PostgreSQL — VPS, Docker, Caddy
- Stripe, Brevo, pdfkit
- Jest, Playwright, GitHub Actions

## Lancer en local

API (`Backend/`, port 3001) :

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

Front (`Frontend/`, port 3000) :

```bash
npm install
npm run dev
```

Variables d'environnement : voir `Backend/.env.example`.
