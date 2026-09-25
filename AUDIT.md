# Audit du repo — Fake_3_Auberge

Audit statique (lecture de code, pas de test d'intrusion actif) du Backend (NestJS/Prisma/PostgreSQL/Stripe) et du Frontend (Next.js). Aucune correction appliquée — ce document sert à mesurer l'ampleur avant de prioriser.

Légende : **Critique** = exploitable directement, impact fort (accès non autorisé à des données/actions admin, perte financière) · **Majeur** = risque réel mais avec précondition ou impact limité · **Mineur** = dette/hygiène, à corriger sans urgence.

## Résumé

| Catégorie | Critique | Majeur | Mineur |
|---|---|---|---|
| Sécurité | 3 | 3 | 4 |
| Fiabilité | 0 | 2 | 2 |
| Qualité de code | 0 | 2 | 6 |

---

## 1. Sécurité

### Critique

- **`Backend/src/modules/stats/stats.controller.ts`** — `StatsController` (route `admin/stats`) n'a **aucun `@UseGuards(JwtAuthGuard)`**, contrairement à `AdminController` sur le même préfixe `/admin`. N'importe qui peut appeler `GET /admin/stats` sans token et récupérer le chiffre d'affaires, le taux d'occupation et les prévisions de l'auberge.
- **`Backend/src/modules/system-logs/system-logs.controller.ts`** — `SystemLogsController` (route `admin/system-logs`) n'a pas non plus de guard JWT : le journal d'audit complet (créations/modifications/annulations de réservations, emails clients, montants) est lisible publiquement via `GET /admin/system-logs`.
- **`Backend/src/modules/invoices/invoices.controller.ts`** — `InvoicesController` (route `admin/invoices/bookings/:bookingId/pdf`) n'a pas de guard JWT : n'importe qui connaissant ou devinant un `bookingId` peut télécharger la facture PDF (nom, email, montant) d'un client sans authentification.

### Majeur

- **`Backend/prisma/seed.ts`** (+ `README.md`) — Le compte admin de démo (`owner@auberge.com` / `admin123456`) est créé par le seed et documenté en clair dans le README. Si ce seed est celui utilisé sur l'instance déployée publiquement (cf. lien de démo du README), ces identifiants triviaux donnent un accès admin complet à quiconque lit le README.
- **`Backend/src/modules/payments/payments.controller.ts`** — Les endpoints publics `POST /payments/booking-payment-intent/confirm` et `/cancel` n'exigent que le `paymentIntentId` en body, sans vérifier qu'il appartient à l'appelant (pas de guard, pas de lien avec une session). Toute personne obtenant un `paymentIntentId` d'un tiers (log, extension navigateur, etc.) peut déclencher l'annulation de sa réservation via `cancelBookingPaymentIntent`.
- **`Backend/src/modules/admin/admin.controller.ts`** — L'upload d'image (`POST admin/room-types/upload-image`) valide le type de fichier uniquement via le `mimetype` envoyé par le client (`fileFilter`) alors que l'extension du fichier stocké est dérivée du nom de fichier fourni par le client (`extname(file.originalname)`). Un `mimetype` falsifié combiné à un nom de fichier arbitraire permet de stocker un fichier avec l'extension de son choix dans `public/rooms`, servi statiquement par l'app.

### Mineur

- **`Frontend/src/features/admin/lib/admin-auth.ts`** — Le token JWT admin est stocké dans `localStorage` plutôt que dans un cookie `httpOnly`. Toute future faille XSS dans le frontend permettrait d'exfiltrer le token et d'usurper une session admin.
- **`Backend/src/main.ts`** — La liste CORS ajoute systématiquement `http://localhost:3000` et `http://127.0.0.1:3000` en plus de `FRONTEND_ORIGIN`, y compris pour un déploiement de production, ce qui élargit inutilement la surface d'origine autorisée.
- **`Backend/src/modules/contact/contact.controller.ts`, `Backend/src/modules/bookings/bookings.controller.ts`** — Aucune limitation de débit sur le formulaire de contact, la recherche de disponibilité ou la création de réservation (seul `/auth/login` est protégé par `LoginAttemptService`) : ces endpoints publics sont exposés au spam/à l'abus (envoi massif d'emails via Brevo, création de réservations `pending` bloquant l'inventaire).
- **`Backend/src/modules/auth/login-attempt.service.ts`** — Le anti-brute-force repose sur une `Map` en mémoire du process Node : un simple redémarrage du serveur (déploiement, crash) ou un scaling multi-instance réinitialise/contourne totalement le compteur de tentatives.

---

## 2. Fiabilité

### Majeur

- **`Backend/src/modules/admin/admin.service.ts`** (méthode `updateBooking`) + **`Backend/src/modules/admin/dto/update-admin-booking.dto.ts`** — Le service caste `dto` en `UpdateAdminBookingDto & { guestName?: string; guestEmail?: string }` pour lire `guestName`/`guestEmail`, mais ces champs ne sont **pas déclarés** dans le DTO. Comme `ValidationPipe` est configuré avec `whitelist: true` (`main.ts`), ces champs sont silencieusement supprimés du body avant d'atteindre le service : la fonctionnalité « modifier le nom/email du client » du panel admin ne fait donc jamais rien, sans erreur remontée.
- **`Backend/src/modules/bookings/bookings.service.ts`** (`createPendingWebsiteBooking`) et **`Backend/src/modules/admin/admin.service.ts`** (`createBooking`) — L'allocation de chambre suit un schéma « lire les chambres disponibles puis créer la réservation » dans une transaction Prisma, mais sans verrouillage (`SELECT ... FOR UPDATE`) ni contrainte d'unicité empêchant le chevauchement de dates sur une même chambre. Sous l'isolation par défaut de PostgreSQL (Read Committed), deux requêtes concurrentes peuvent lire la même chambre comme disponible et la réserver toutes les deux (race condition / double-booking).

### Mineur

- **`Backend/src/modules/payments/payments.service.ts`** (`cancelBookingPaymentIntent`) — `this.stripe.paymentIntents.cancel(paymentIntentId).catch(() => null)` avale silencieusement **toute** erreur Stripe (y compris une erreur réseau/API, pas seulement « déjà annulé »), puis la réservation est quand même marquée `cancelled` en base : possibilité de désynchronisation entre l'état Stripe réel et l'état stocké en DB.
- **`Backend/src/modules/payments/pending-bookings-cleanup.service.ts`** — Le nettoyage des réservations `pending` expirées tourne via `setInterval` dans le process de l'app, sans verrou distribué. En cas de scaling horizontal (plusieurs instances backend), le job tourne en double/triple sans coordination.

---

## 3. Qualité de code

### Majeur

- **`Backend/src/modules/bookings/bookings.service.ts`** (`createPendingWebsiteBooking`) vs **`Backend/src/modules/admin/admin.service.ts`** (`createBooking`) — Environ 150 lignes quasi identiques (regroupement des sélections par type de chambre, allocation des chambres disponibles, validation des formules repas, calcul des prix) sont dupliquées entre les deux services au lieu d'être factorisées, ce qui double le risque de divergence lors d'un futur correctif (ex : le bugfix de la race condition ci-dessus devra être appliqué deux fois).
- **`Backend/src/modules/bookings/dto/create-booking.dto.ts`, `Backend/src/modules/payments/dto/create-booking-checkout.dto.ts`, `Backend/src/modules/payments/dto/create-booking-payment-intent.dto.ts`** — Trois jeux de DTO `class-validator` quasi identiques (dont les sous-DTO `*SelectionDto`) existent pour la même forme de payload « réservation », ce qui multiplie les endroits à maintenir en cas de changement de règle de validation.

### Mineur

- **`Backend/src/modules/payments/payments.service.ts`** — Le client Stripe est typé `private readonly stripe: any`, et la plupart des objets manipulés (`paymentIntent: any`, `event: any`, `session: any`) sont non typés, ce qui annule le bénéfice du typage TypeScript sur toute la logique de paiement (le module le plus sensible du repo).
- **`Backend/src/modules/admin/admin.utils.ts`** — `mapAdminBooking(booking: any)` n'utilise pas le type `AdminBookingWithRelations` défini juste au-dessus dans le même fichier, qui semble avoir été prévu pour cet usage.
- **`Backend/src/modules/payments/payments.service.ts`** — `getBookingIdsFromMetadata` et `getBookingIdsFromSession` dupliquent la même logique de parsing (`split(',').map(trim).filter(Boolean)`).
- **`Backend/src/modules/bookings/dto/update-booking.dto.ts`** — `UpdateBookingDto` (`PartialType(CreateBookingDto)`) n'est importé nulle part ailleurs dans le code : code mort.
- **`Backend/test/jest-e2e.json`** — Une config e2e existe mais `Backend/test/` ne contient aucun fichier `*.e2e-spec.ts` : `npm run test:e2e` ne fait rien. Par ailleurs, seuls 4 fichiers `*.spec.ts` existent au total (`admin.utils`, `bookings.service`, `payments.service`, `pending-bookings-cleanup.service`) : `AdminService`, `AuthService`, `InvoicesService`, `ContactService`, `StatsService`, `MailerService` et tous les contrôleurs n'ont aucun test.
- **`Backend/src/modules/admin/admin.controller.ts`, `Backend/src/modules/bookings/bookings.controller.ts`, `Backend/src/modules/stats/stats.controller.ts`** — Style incohérent (guillemets simples vs doubles selon les fichiers, indentation manquante sur certains blocs comme `admin.controller.ts:64-106`), signe que `npm run format`/`lint` n'est pas systématiquement exécuté avant commit.

---

## Notes de méthode

- `.env` (Backend) contient des clés Stripe/Brevo/JWT réelles mais **n'est pas suivi par git** (absent de l'historique, correctement ignoré) — non listé comme fuite, mais à garder hors du repo en permanence.
- Aucune injection SQL trouvée : tout l'accès base de données passe par Prisma Client (requêtes paramétrées), aucun `$queryRaw`/`$executeRaw` dans le code applicatif.
- Les emails (confirmation, contact) échappent correctement le HTML (`escapeHtml`) avant interpolation — pas d'injection HTML/email trouvée.
- Le prix des réservations est toujours recalculé côté serveur à partir de `RoomType.basePrice`/`MealPlan.*Price` ; le frontend ne peut pas influencer le montant facturé.
