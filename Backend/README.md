# Backend

API NestJS de l'auberge.

## Stack

- NestJS
- Prisma
- PostgreSQL
- JWT pour l'auth admin
- Jest pour les tests unitaires

## Structure

```txt
src/modules/auth
src/modules/bookings
src/modules/admin
src/prisma
prisma/schema.prisma
prisma/seed.ts
```

## Lancement

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run start:dev
```

API disponible sur `http://localhost:3001`.

## Variables d'environnement

- `DATABASE_URL`
- `JWT_SECRET`

## Commandes utiles

```bash
npm run lint
npm run build
npm run test
npm run db:push
npm run db:seed
npm run db:studio
```

Compte admin de demo :

- email: `owner@auberge.com`
- mot de passe: `admin123456`
