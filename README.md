# Reproutes Platform

Reproutes is a multi-portal field-sales platform with a shared backend:

| App | Folder | Purpose | Default port |
| --- | --- | --- | --- |
| API | `backend` | Authentication, shops, approvals, GPS and live tracking | `3001` |
| Sales | `sales` | Field salesperson web portal | `4000` |
| Manager | `manager` | Approvals, assignments and live agent tracking | `4001` |
| Factory | `factory` | Factory operations and live salesperson tracking | `4002` |
| Mobile | `mobile` | Android/iOS field-sales application | Expo |

## Requirements

- Node.js 20 or newer (`.nvmrc` is included)
- MySQL
- Optional Redis for scaled socket sessions

## First-time setup

```bash
cp backend/.env.example backend/.env
npm run install:all
```

Fill in `backend/.env` before starting the API. Never commit `.env` files or real credentials.

For map-enabled portal builds, copy the relevant portal template and add the
Google Maps key and map ID supplied by the Google Cloud project:

```bash
cp manager/.env.example manager/.env
cp factory/.env.example factory/.env
cp sales/.env.example sales/.env
```

The portals keep an OpenStreetMap fallback when Google Maps credentials are not
configured. Keep all real keys in the deployment provider's secret settings.

## Development

Run each service in its own terminal:

```bash
npm run dev:backend
npm run dev:sales
npm run dev:manager
npm run dev:factory
```

The mobile app is started with `npm run dev:mobile` after its Expo environment is configured.

## Factory Manager setup

The Factory Portal uses the existing `User` table with role `FACTORY_MANAGER`. After configuring `DATABASE_URL`, run:

```bash
npm run create:factory-manager --prefix backend
```

Database migrations live in `backend/migrations` and must be applied through the deployment migration process.

## Verification

```bash
npm run typecheck:backend
npm run typecheck:factory
npm run typecheck:manager
npm run typecheck:sales
npm run test:backend
```

Live GPS requires the agent device to grant location permission, enable GPS, and remain signed in after Punch In.
