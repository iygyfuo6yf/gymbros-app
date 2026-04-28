# GymBros MVP Hardening Build

GymBros is a mobile-first fitness MVP for intermediate lifters (ages 15–30), with a watch companion starter and a lightweight backend.

## UX rationale and design decisions

### Inspiration patterns

This UI/UX enhancement pass drew inspiration from best-in-class fitness apps while remaining fully original:

| Pattern source | What we borrowed (concept only) | Where applied |
|---|---|---|
| **Nike Training Club** | Hero brand area at sign-in; motivational tagline; value-proposition summary | `AuthScreen` hero section |
| **Strong app** | Stepper controls for reps/weight (+/− buttons); per-set history rows inline with the logger | `WorkoutScreen` set params + set history |
| **Fitbod** | Quick-select exercise chips above the custom input; colour-coded active state | `WorkoutScreen` quick exercise picker |
| **MyFitnessPal** | Quick-add meal shortcuts; macro preview pills before confirmation | `MealTrackerScreen` quick add + confirm flow |
| **Whoop / Athlytic** | Stat cards with accent-coloured top borders; a dedicated adherence progress bar | `CalendarScreen` stat cards + adherence bar |

### Screen-by-screen rationale

#### Sign In (`AuthScreen`)
- **Before**: plain title + form. **After**: logo mark, 3xl brand wordmark, tagline, feature pills.
- **Why**: first screen sets tone; brand confidence reduces drop-off before any interaction.

#### Goals / Onboarding (`OnboardingScreen`)
- **Before**: 3 numeric fields only. **After**: goal-type 2×2 grid (Build Strength / Gain Muscle / Lose Fat / Stay Fit) + activity-level radio list + body stats.
- **Why**: choice architecture — showing preset options (inspired by apps like Caliber) reduces blank-page anxiety and makes the goal feel personalised immediately.

#### Workout Logging (`WorkoutScreen`)
- **Before**: one text input + fixed chip display + one button. **After**: quick exercise shortcut chips → custom ID fallback; `−/+` stepper for reps and weight; running per-session set history rows with estimated 1RM.
- **Why**: reduces mental overhead; steppers prevent typos; inline history removes the need to navigate away to see what you've done.

#### Meal Tracking (`MealTrackerScreen`)
- **Before**: single text input + analyze button. **After**: quick-add pill row (4 common meals), description input below, macro preview pills (kcal / protein / carbs / fat) in the low-confidence confirmation card.
- **Why**: most users log similar meals repeatedly; shortcuts cut 2–3 taps from the most common path. Macro pills give instant visual feedback before confirming.

#### Progress / Calendar (`CalendarScreen`)
- **Before**: single-line text summary strings. **After**: three accent-bordered stat cards (streak / workouts / meals); trend snapshot with three metrics side-by-side; colour-coded nutrition adherence bar (green ≥80%, amber ≥50%, red <50%).
- **Why**: numbers in cards are far more scannable than embedded text; colour semantics communicate goal attainment at a glance.

#### Gyms (`GymsScreen`)
- **Before**: load-on-demand button; rating number badge. **After**: auto-load on mount; rank badge (#1, #2 …); featured badge with warm background; 5-star visual rating; chevron affordance suggesting tappability.
- **Why**: gym discovery is a browse experience — auto-loading and visual affordances match that mental model.

#### App header (`App.tsx`)
- **Before**: plain text wordmark. **After**: small logo-mark (💪 in rounded square) + bold wordmark side-by-side; gym button shows active state with primary border when selected.
- **Why**: brand mark makes the app feel polished; active state communicates current mode without a separate tab bar.

### New shared component

| Component | Purpose |
|---|---|
| `SectionHeader` | Screen-level title + subtitle with enforced letter-spacing and `accessibilityRole="header"` for VoiceOver/TalkBack navigation |

## UI flow and design system

### Guided step-by-step user journey

The mobile app surfaces a clear, linear onboarding flow with a visible progress indicator in the header:

```
Sign In → Goals → Meals → Workout → Progress
```

Each screen advances automatically when its primary action completes (e.g. sign-in success advances to Goals; saving targets advances to Meals). A **Skip →** button lets users jump ahead without completing the current step. A **← Back** button and a header back chevron allow backwards navigation. A 🏋️ gym browser tab is accessible from any step via the header icon.

### Design token system (`apps/mobile/src/theme/index.ts`)

All visual primitives are defined as named tokens:

| Category | Tokens |
|---|---|
| **Colors** | `bg`, `surface`, `surface2`, `border`, `primary`/`primaryDark`/`primaryLight`, `secondary`, `text`/`textSecondary`/`textMuted`/`textDisabled`/`textInverse`, semantic: `success`/`warning`/`error`/`info` with matching `*Bg` and `*Text` variants |
| **Typography** | `size`: xs (11) → sm (13) → md (15) → lg (17) → xl (20) → 2xl (24) → 3xl (28) → 4xl (34); `weight`: regular/medium/semibold/bold/extrabold; `lineHeight`: tight/normal/relaxed |
| **Spacing** | 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px) |
| **Radius** | sm (4), md (8), lg (12), xl (16), full (9999) |
| **Shadows** | sm / md / lg (elevation + cross-platform shadow props) |
| **Tap target** | `minTapTarget = 44` (WCAG minimum) |

### Reusable UI components (`apps/mobile/src/components/`)

| Component | Purpose |
|---|---|
| `Button` | Primary / secondary / danger / ghost / outline variants; loading + disabled states; accessibility role/label/state wired |
| `Card` | Surface container with default / elevated / flat variants and sm/md/lg/none padding |
| `Input` | Labeled `TextInput` with inline validation, helper text, error text, and accessibility hints |
| `ProgressSteps` | Horizontal step progress bar with filled dots for completed steps, active ring for current step, and a progress bar fill |
| `SectionHeader` | Screen-level title + subtitle block with `accessibilityRole="header"` |
| `StatusMessage` | Inline success / error / warning / info feedback with semantic colors and `accessibilityLiveRegion` |

### Accessibility improvements

- All interactive elements have `accessible`, `accessibilityRole`, and `accessibilityLabel` props.
- Minimum tap target size (44 px) enforced on all buttons and interactive chips.
- `accessibilityState` (disabled, busy, checked, selected) forwarded on all toggleable elements.
- StatusMessage uses `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.
- Input errors use `accessibilityLiveRegion="polite"` for assistive technology announcements.
- `SectionHeader` uses `accessibilityRole="header"` for screen reader section navigation.
- High-contrast semantic colors used throughout (primary green on dark backgrounds).

### Forms UX

- Inline validation on blur for Onboarding fields (age, weight, height) with friendly error messages.
- All submit buttons show a loading spinner and prevent duplicate submits via a `loading` guard.
- Disabled states (e.g. "Sign in first") explained with helper text.
- Confirm-meal flow in MealTrackerScreen uses macro-preview pills + labeled inputs and a Discard option.

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
