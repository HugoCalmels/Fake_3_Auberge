# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A demo mini-PMS (Property Management System) for a mountain hostel ("Auberge du Montcalm"): public booking site with real-time availability, Stripe payment, and an admin back-office (planning, rooms, invoicing, stats, system log). Two independent apps in one repo, each with its own `package.json`, `node_modules`, and `.env`:

- `Frontend/` — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- `Backend/` — NestJS 11, TypeScript, Prisma 7, PostgreSQL, Stripe, Brevo (email)

Deployed via Netlify (`netlify.toml` at repo root builds `Frontend` with `@netlify/plugin-nextjs`). There is no root-level `package.json` — always `cd` into `Frontend` or `Backend` before running npm commands.

## Commands

### Backend (`Backend/`)

```bash
npm run start:dev       # dev server w/ watch, http://localhost:3001
npm run build            # nest build
npm run lint              # eslint --fix on src/apps/libs/test
npm run format             # prettier --write

npm run test                # jest unit tests (*.spec.ts, colocated with source)
npm run test -- <pattern>    # run a single spec, e.g. npm run test -- bookings.service
npm run test:watch
npm run test:cov
npm run test:e2e            # jest --config ./test/jest-e2e.json

npm run db:push          # prisma db push (schema -> DB, no migration files)
npm run db:seed          # tsx prisma/seed.ts
npm run db:studio
```

Required env (`Backend/.env`, see `.env.example`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_ORIGIN`. Payment/email features additionally need `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, and Brevo credentials (check `mailer.service.ts` for exact names) — these aren't in `.env.example` but are read via `process.env` and will throw at construction time if missing.

Demo admin login: `owner@auberge.com` / `admin123456` (from seed).

### Frontend (`Frontend/`)

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
```

Env: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

### Running both together

Start `Backend` (`npm run start:dev`) and `Frontend` (`npm run dev`) in separate terminals; the frontend calls the backend via `NEXT_PUBLIC_API_URL`.

## Architecture

### Backend — NestJS modules (`Backend/src/modules/*`)

Each feature is a self-contained Nest module (`*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`). Registered together in `src/app.module.ts`:

- **`auth`** — Admin login only (no public user accounts). JWT-based (`@nestjs/passport` + `passport-jwt`), guarded routes use `JwtAuthGuard` (`jwt-auth.guard.ts`). Config helpers (`getJwtSecret`, `getJwtExpiresIn`, `getFrontendOrigin`) in `auth.config.ts` throw if required env vars are missing — don't add defaults there without checking why they're absent. `login-attempt.service.ts` handles brute-force throttling.
- **`bookings`** — Public availability search and booking creation. Availability is computed by querying `Room`s whose `bookings` have no overlapping date range in status `pending|confirmed|checked_in` (see `getAvailability` in `bookings.service.ts`) — pending bookings hold inventory just like confirmed ones. `createPendingWebsiteBooking` creates bookings in `pending`/`unpaid` state prior to payment.
- **`payments`** — All Stripe integration. Supports two flows: Checkout Session (`booking-checkout`) and embedded PaymentIntent (`booking-payment-intent`, card only — PayPal via PaymentIntent is not yet wired). `POST /payments/stripe/webhook` handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired`; requires `rawBody` (enabled globally in `main.ts`'s `NestFactory.create`) to verify the Stripe signature. Confirmation logic is idempotent — checks `paymentStatus: paid` before re-processing, since both the webhook and the frontend's manual `/confirm` polling can call it. On successful payment: booking(s) flip to `confirmed`/`paid`, an `Invoice` is generated, a PDF is rendered (`invoices/invoice-pdf.service.ts`), and confirmation emails go to guest + admin (`mailer` module, Brevo). `pending-bookings-cleanup.service.ts` sweeps stale pending/unpaid bookings.
- **`admin`** — Back-office CRUD for bookings/rooms/room types, protected by `JwtAuthGuard`.
- **`invoices`** — Invoice records + PDF generation (`pdfkit`).
- **`stats`** — Admin dashboard statistics.
- **`system-logs`** — Append-only audit log (`SystemLog` model) for booking lifecycle events (`website_booking_validated`, `admin_booking_created`, `booking_check_in`, etc.) — write through `SystemLogsService.create`, don't insert directly via Prisma.
- **`contact`** — Public contact form, emails via `mailer`.
- **`mailer`** — Brevo email sending, used by `payments` and `contact`.
- **`prisma`** — `PrismaService`/`PrismaModule` wrapping the generated Prisma Client.

Prisma client is generated to `Backend/src/generated/prisma` (not the default `node_modules/.prisma`) — import types/enums from `../../generated/prisma/client`, not `@prisma/client`. Schema at `Backend/prisma/schema.prisma`; `prisma.config.ts` (both at repo root of `Backend/` and inside `prisma/`) points Prisma at `DATABASE_URL`. There are no migration files in this project — schema changes go through `db:push`, not `prisma migrate`.

Global request pipeline (`main.ts`): CORS restricted to `FRONTEND_ORIGIN`/localhost with credentials, `ValidationPipe({ whitelist: true, transform: true })` applied globally — DTOs must declare every accepted field with `class-validator` decorators or it gets stripped.

### Frontend — feature-sliced (`Frontend/src`)

```
app/                     # Next App Router — routes only, delegate to src/features
src/features/home/       # landing page (api/, components/, pages/)
src/features/booking/    # public booking flow (api/, components/, hooks/, lib/)
src/features/admin/      # admin back-office (api/, components/, hooks/, lib/, pages/)
src/components/          # shared components (layout/)
src/lib/api/client.ts    # getApiUrl() + parseApiError() — shared fetch helpers
```

Route files under `app/` stay thin; real logic/UI lives in the matching `src/features/*` slice. Each feature owns its own `api/` (fetch calls via `getApiUrl` from `src/lib/api/client.ts`), `hooks/`, and `lib/`. When adding a booking- or admin-related feature, check whether it belongs inside the existing `booking`/`admin` slice before creating shared code.

### Cross-cutting: booking lifecycle

`Room` → `Booking` (many bookings per room over time, no direct date overlap while active) → `Invoice` (one per `bookingGroupId`, generated after payment). Booking status flow: `pending` (created pre-payment, holds inventory) → `confirmed` (payment succeeded) → `checked_in` → `checked_out` / `no_show` / `cancelled`. `bookingGroupId` links multiple `Booking` rows created in a single checkout (multi-room reservations) — invoices and confirmation emails operate on the whole group, not a single booking. When touching payment or booking-status logic, preserve the idempotency checks (`paymentStatus: paid` guards) since Stripe can deliver webhooks more than once and the frontend also polls a manual confirm endpoint.
