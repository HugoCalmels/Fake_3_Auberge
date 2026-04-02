# Frontend

Frontend Next.js de l'auberge.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

## Structure

```txt
app/                 # routes Next tres fines
src/features/home    # landing page
src/features/booking # reservation client
src/features/admin   # interface admin
src/components       # composants partages
src/lib              # utilitaires transverses
```

## Lancement

```bash
npm install
cp .env.example .env.local
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Variable d'environnement

- `NEXT_PUBLIC_API_URL` : URL du backend, par defaut `http://localhost:3001`
