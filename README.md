# Fake 3 Auberge

Application web de demonstration pour une auberge de montagne avec reservation en ligne cote client et espace admin cote gestion.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: NestJS 11, TypeScript, Prisma, PostgreSQL
- Outils: ESLint, Prettier, Jest

## Objectif

Le projet vise a proposer une experience simple pour :

- consulter l'auberge et ses services
- verifier les disponibilites
- creer une reservation
- gerer les chambres, types de chambres, reservations et planning depuis un espace admin

## Captures

Les captures seront ajoutees quand les parcours de demo seront completement figes.

Captures a prevoir pour la mise en public :

- page d'accueil
- modal de reservation
- vue admin planning
- vue admin reservations

## Architecture

```txt
Fake_3_Auberge/
  Frontend/
    app/                    # routes Next.js tres fines
    src/features/           # logique par domaine: home, booking, admin
    src/components/         # composants partages
    src/lib/                # utilitaires transverses

  Backend/
    src/modules/auth        # login admin + JWT
    src/modules/bookings    # disponibilites + creation de reservations
    src/modules/admin       # CRUD admin + planning
    src/prisma              # acces base de donnees
    prisma/                 # schema et seed
```

## Etat du projet

Deja en place :

- landing page et sections de presentation
- flow de reservation cote client
- verification des disponibilites
- creation de reservation cote API
- espace admin avec authentification
- gestion des chambres, room types, reservations et planning
- base Prisma avec seed de demo

En cours / a finir :

- finition de certains parcours admin
- polissage UX sur quelques composants lourds
- captures GitHub
- quelques tests metier supplementaires

## Lancer le projet

Prerequis :

- Node.js 20+
- PostgreSQL local

### 1. Backend

```bash
cd Backend
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run start:dev
```

API disponible sur `http://localhost:3001`.

Compte admin de demo apres seed :

- email: `owner@auberge.com`
- mot de passe: `admin123456`

### 2. Frontend

```bash
cd Frontend
npm install
cp .env.example .env.local
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Variables d'environnement

Frontend :

- `NEXT_PUBLIC_API_URL` : URL du backend

Backend :

- `DATABASE_URL` : connexion PostgreSQL
- `JWT_SECRET` : secret JWT pour l'espace admin

## Commandes utiles

Frontend :

```bash
npm run dev
npm run lint
npm run build
```

Backend :

```bash
npm run start:dev
npm run lint
npm run build
npm run test
npm run db:push
npm run db:seed
npm run db:studio
```

## Notes de publication

Le repo est pense comme un projet portfolio en cours de finalisation : l'objectif est de montrer une base propre, lisible et maintenable plutot qu'un produit deja deploye en production.
