# Fake 3 Auberge

Application web de démonstration pour une auberge de montagne.

## Démonstration

* Site : [https://auberge-du-fauxcalm.netlify.app/](https://auberge-du-fauxcalm.netlify.app/)
* Vidéo (version béta) : [https://www.youtube.com/watch?v=chLyGFvjDDo](https://www.youtube.com/watch?v=chLyGFvjDDo)

## Stack

* Frontend : Next.js 15, React 19, TypeScript, Tailwind CSS
* Backend : NestJS 11, TypeScript, Prisma, PostgreSQL
* Paiement : Stripe
* Email : Brevo
* Outils : ESLint, Prettier, Jest

## Fonctionnalités

### Site public

* Landing page
* Réservation en ligne
* Disponibilités en temps réel
* Sélection des chambres
* Paiement Stripe
* Confirmation de réservation

### Administration

* Planning des réservations
* Gestion des chambres
* Gestion des types de chambres
* Création de réservation
* Modification de réservation
* Assignation des chambres
* Statistiques
* Journal système
* Factures PDF

## Objectif

Construire un mini PMS (Property Management System) permettant de gérer les réservations, les chambres, les paiements et l'administration d'une auberge.

Le projet couvre l'ensemble du parcours :

* réservation publique
* paiement en ligne
* gestion administrative
* planning
* facturation

## Installation

```bash
npm install
```

### Frontend

```bash
npm run dev
```

### Backend

```bash
npm run start:dev
```

### Base de données

```bash
npx prisma migrate dev
npx prisma db seed
```
