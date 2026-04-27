# GymBros MVP Hardening Build

GymBros is a mobile-first fitness MVP for intermediate lifters (ages 15–30), with a watch companion starter and a lightweight backend.

## Architecture summary

- **Monorepo (npm workspaces)**
  - `apps/mobile`: Expo + React Native + TypeScript app shell for user flows
  - `apps/api`: Express + TypeScript API with validation and conflict-safe sync strategy
  - `apps/watch-companion`: watch integration package and shared snapshot contract
  - `apps/watch-native`: native watchOS starter files
- **Data layer**
  - `apps/api/prisma/schema.prisma` + migrations power all mutable API routes with Prisma/SQLite.
- **Auth/session**
  - Social sign-in route with strict provider-token validation hooks (`/auth/social`)
  - JWT access + persisted refresh-token rotation (`/auth/refresh`)
  - Secure session persistence on device via Expo SecureStore
- **Offline/online sync**
  - AsyncStorage durable queue + background sync worker in mobile app
  - `/sync` endpoint supports conflict preview + user-directed resolution selection

## What is fully implemented vs scaffolded

### Implemented in this hardening pass
- Real token validation flow contracts for Google + Apple in API (strict mode) and refresh token rotation backed by Prisma.
- Prisma-wired API routes for auth, onboarding, nutrition, meals, workouts, calendar, sync, gyms, and watch snapshots.
- Meal photo upload storage endpoint (`POST /meals/uploads`) and VLM-ready analysis integration (`NUTRITION_VLM_API_URL`) with fallback heuristics.
- Mobile manual confirmation form for low-confidence AI meal estimates before save.
- Durable offline queue persistence in mobile (AsyncStorage) and periodic background sync worker.
- Conflict preview (`previewOnly`) and manual source selection (`resolutions`) in sync API + user-facing conflict controls in mobile.
- Expanded exercise library + routine templates by goal (`strength`, `hypertrophy`).
- Trend endpoint (`GET /calendar/trends/:userId`) and mobile trend summary for volume, 1RM, and nutrition adherence.
- Native watch app starter (`apps/watch-native`) + live workout snapshot sync path from phone (`POST /watch/snapshot`).
- CI workflow (`.github/workflows/ci.yml`) and deployment templates (`deploy/` + Dockerfile + deploy workflow template).

## Folder structure

```text
apps/
  api/
    prisma/schema.prisma
    src/
      app.ts
      routes/
      services/
      seed/
    tests/
  mobile/
    App.tsx
    src/
      api/
      context/
      screens/
  watch-companion/
    src/index.ts
  watch-native/
    GymBrosWatch/
  deploy/
    docker-compose.prod.yml
    render.yaml
```

## Prerequisites

- Node.js 20+
- npm 10+
- Expo CLI (optional globally; `npx expo` works)

## Environment variables

### Root
See `/.env.example`.

### API (`apps/api/.env.example`)
- `PORT`: API port (default 4000)
- `JWT_SECRET`: signing secret for session tokens
- `DATABASE_URL`: Prisma connection string (SQLite in scaffold)
- `GOOGLE_CLIENT_ID`: expected Google audience in strict mode
- `APPLE_SERVICE_ID`: expected Apple audience in strict mode
- `SOCIAL_TOKEN_VALIDATION_MODE`: `strict` (default) or `test`
- `NUTRITION_VLM_API_URL`: external nutrition model endpoint
- `NUTRITION_VLM_API_KEY`: optional bearer key for model endpoint
- `UPLOADS_DIR`: local folder for meal-photo uploads

### Mobile (`apps/mobile/.env.example`)
- `EXPO_PUBLIC_API_URL`: backend base URL
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: Google OAuth client ID
- `EXPO_PUBLIC_APPLE_SERVICE_ID`: Apple service identifier

### Watch starter (`apps/watch-companion/.env.example`)
- `WATCH_SYNC_INTERVAL_SECONDS`: sync polling interval

## Local setup

```bash
# 1) install dependencies
npm install

# 2) create env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/watch-companion/.env.example apps/watch-companion/.env

# 3) generate prisma client + run migrations + seed sample data
npm run prisma:generate -w apps/api
npm run prisma:migrate:deploy -w apps/api
npm run seed -w apps/api
```

## Beginner startup flow (exact steps)

```bash
# terminal A: start API
npm run dev -w apps/api

# terminal B: verify API is live + ready
curl http://localhost:4000/health
curl http://localhost:4000/ready

# terminal C: start mobile app
npm run dev -w apps/mobile
```

## Run commands

```bash
# run mobile + api together
npm run dev

# run only API
npm run dev -w apps/api

# run only mobile
npm run dev -w apps/mobile
```

## Testing commands

```bash
# backend tests (all)
npm run test

# backend tests (targeted hardening suite)
npm run test -w apps/api -- tests/auth.test.ts tests/meals.test.ts tests/sync.test.ts tests/workouts.test.ts tests/health.test.ts

# type checking
npm run typecheck

# backend build
npm run build
```

## Common troubleshooting

- **Expo cannot connect to API**
  - Ensure `EXPO_PUBLIC_API_URL` is reachable from your emulator/device.
  - For real devices, replace `localhost` with your machine LAN IP.
- **JWT errors in auth**
  - Set a long random `JWT_SECRET` in `apps/api/.env`.
- **Prisma schema not generated yet**
  - Run `npm run prisma:generate -w apps/api` then `npm run prisma:migrate:deploy -w apps/api`.
- **Port conflict on 4000**
  - Change `PORT` in `apps/api/.env`.
- **API startup fails with env validation error**
  - Ensure `apps/api/.env` has valid values for `JWT_SECRET` (16+ chars) and `DATABASE_URL`.

## CI and deployment quick notes

- CI: `.github/workflows/ci.yml` runs lint, tests, typecheck, and build on push/PR.
- Deployment templates:
  - `deploy/docker-compose.prod.yml`
  - `deploy/render.yaml`
  - `.github/workflows/deploy-template.yml`
