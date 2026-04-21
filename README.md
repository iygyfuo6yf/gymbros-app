# GymBros MVP Scaffold

GymBros is a mobile-first fitness MVP for intermediate lifters (ages 15–30), with a watch companion starter and a lightweight backend.

## Architecture summary

- **Monorepo (npm workspaces)**
  - `apps/mobile`: Expo + React Native + TypeScript app shell for user flows
  - `apps/api`: Express + TypeScript API with validation and conflict-safe sync strategy
  - `apps/watch-companion`: watch integration starter package and shared snapshot contract
- **Data layer**
  - `apps/api/prisma/schema.prisma` defines production DB schema for users, onboarding profiles, meals, workouts, gyms.
  - In-memory store is used in the scaffold runtime for fast local MVP iteration.
- **Auth/session**
  - Social sign-in route scaffold for Google/Apple token handoff (`/auth/social`)
  - JWT access + refresh issuance
  - Secure session persistence on device via Expo SecureStore
- **Offline/online sync**
  - Local-first logging on mobile is scaffold-ready
  - `/sync` endpoint applies **latest edit wins + safe merge** per record ID

## What is fully implemented vs scaffolded

### Fully implemented (working in scaffold)
- Backend API skeleton with routes for auth, onboarding/macros, meal AI estimate flow, workout logging/progression, calendar summary, sync conflict handling, recommended gyms.
- Input validation via `zod` and global error handling.
- Seeded exercise library, sample meals, and local/promoted gyms.
- Backend tests for macro calculation, AI low-confidence behavior, and sync merge conflict behavior.
- Mobile Expo screen scaffold covering all MVP feature areas in one flow-oriented UI.
- Watch companion starter structure with shared workout snapshot contract.

### Scaffolded (next integration step)
- Real Google and Apple OAuth token verification against provider SDK/backend validation.
- Real photo model inference pipeline (currently heuristic estimate from user hint).
- Persistent DB writes via Prisma client (schema is ready; runtime uses in-memory store in this scaffold).
- Production-grade offline queue persistence and background retry policies on mobile.
- Native watch app implementation (starter contract only in this repo).

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

### Mobile (`apps/mobile/.env.example`)
- `EXPO_PUBLIC_API_URL`: backend base URL
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: Google OAuth client ID
- `EXPO_PUBLIC_APPLE_SERVICE_ID`: Apple service identifier

### Watch starter (`apps/watch-companion/.env.example`)
- `WATCH_SYNC_INTERVAL_SECONDS`: sync polling interval

## Local setup

```bash
npm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/watch-companion/.env.example apps/watch-companion/.env
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
# backend tests
npm run test

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
  - Run `npm run prisma:generate -w apps/api`.
- **Port conflict on 4000**
  - Change `PORT` in `apps/api/.env`.

## Exact next 10 tasks

1. Replace social auth mock with real Google/Apple token validation and refresh token rotation.
2. Wire Prisma client and migrations into all API routes (replace in-memory store).
3. Add image upload storage and call a real nutrition model/VLM for photo analysis.
4. Add manual confirmation UI for low-confidence AI estimates before saving meal logs.
5. Implement robust offline queue persistence (SQLite/AsyncStorage) and background sync worker.
6. Add user-facing conflict resolution preview for edge-case sync collisions.
7. Expand exercise library and routine templates by training goal (strength/hypertrophy).
8. Add trend charts for volume, estimated 1RM, and nutrition adherence.
9. Create native watch app project and implement live workout sync from phone.
10. Add CI pipeline (lint, typecheck, tests) and production deployment templates.
