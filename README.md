# hang.

> Campus-native social hangout app for UC Berkeley — and beyond.
> iOS-only MVP. Built with Expo + Fastify + Prisma.

---

## Demo

[![hang. demo video](https://img.youtube.com/vi/mYYbgaMDSsA/maxresdefault.jpg)](https://youtu.be/mYYbgaMDSsA)

---

## What is hang.?

hang. is a spontaneous event coordination app built for college campuses. Post a hangout plan in under 30 seconds, broadcast it to your groups (dorm floor, Greek org, club team), collect RSVPs, and get a clean headcount. No group chat noise. No Eventbrite overkill.

---

## Tech Stack

| Layer | Technology |
|---|---|
| iOS App | React Native, Expo (managed workflow), TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand + TanStack Query |
| Push | Expo Notifications + APNs |
| Backend | Fastify, TypeScript, Node.js 20 |
| ORM | Prisma 5 |
| Database | PostgreSQL 15 (Supabase or local) |
| Cache / Jobs | Redis (Upstash or local) + BullMQ |
| SMS OTP | Twilio Verify |
| Push Dispatch | node-apn (APNs) |
| Hosting | Railway (backend) + EAS (iOS builds) |
| Monorepo | Turborepo + pnpm workspaces |

---

## Repository Structure

```
hang/
├── apps/
│   ├── mobile/          # Expo React Native iOS app
│   └── api/             # Fastify REST API
├── packages/
│   └── shared/          # Shared TypeScript types
├── docs/
│   ├── Proposal.md      # Full product & engineering proposal
│   ├── assets/mockups/  # Screen design references
│   └── flows/           # Maestro E2E test flows
├── .github/workflows/   # CI (test on PR) + Deploy (Railway on main)
├── .env.example         # Environment variable template
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Prerequisites

```
node >= 20.0.0
pnpm >= 9.0.0
PostgreSQL >= 15  (local or Supabase account)
Redis             (local via Docker, or Upstash free tier)
Expo CLI + EAS CLI
Xcode 15+ with iOS Simulator (for iOS development)
```

---

## Initial Setup

### 1. Clone and install

```bash
git clone https://github.com/jananth/hang..git
cd hang.

pnpm install
```

### 2. Configure environment

```bash
cp .env.example apps/api/.env
# Open apps/api/.env and fill in all values:
# DATABASE_URL, REDIS_URL, TWILIO_*, APNS_*, JWT_SECRET, SUPABASE_*
```

Copy frontend env:
```bash
cp .env.example apps/mobile/.env
# Set EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Set up the database

```bash
# Run Prisma migrations
cd apps/api
pnpm db:migrate:dev

# Seed official Berkeley groups (optional)
pnpm db:seed
```

### 4. Start services

```bash
# Start Redis locally (if not using Upstash)
docker run -p 6379:6379 redis:7-alpine

# Terminal 1 — Start the API (http://localhost:3000)
cd apps/api
pnpm dev

# Terminal 2 — Start the Expo app
cd apps/mobile
pnpm start
# Press 'i' in the terminal to open iOS Simulator
```

---

## Running Tests

### Backend unit tests

```bash
cd apps/api
pnpm test
```

### Backend integration tests

Requires a running PostgreSQL instance. Uses a separate `hang_test` database.

```bash
# Create test DB first
createdb hang_test
DATABASE_URL=postgresql://localhost/hang_test pnpm --filter @hang/api db:migrate

# Run integration tests
cd apps/api
pnpm test:integration
```

### Backend coverage

```bash
cd apps/api
pnpm test:coverage
```

### Frontend component tests

```bash
cd apps/mobile
pnpm test
```

### End-to-end tests (Maestro)

Requires the app running on an iOS Simulator and Maestro installed:

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Run all E2E flows
maestro test docs/flows/
```

### Run all tests via Turborepo

```bash
pnpm test
```

---

## Development Notes

### APNs in development

Set `APNS_ENV=sandbox` in `apps/api/.env`. The sandbox APNs endpoint is used automatically for development builds.

### Twilio Verify test numbers

Use `+15005550006` — Twilio's magic test number that always returns a successful OTP without consuming credits.

### Database schema changes

Always create a new Prisma migration when changing the schema. Never edit the database directly in production.

```bash
cd apps/api
pnpm db:migrate:dev --name describe_the_change
```

### Realtime subscriptions (Supabase)

Supabase Realtime requires Row Level Security (RLS) to be configured. The `group_members` table is the primary access gate — users only receive realtime events for groups they belong to.

---

## Backend Deployment (Railway)

### First-time setup

```bash
npm install -g @railway/cli
railway login
railway link  # link to your Railway project
```

### Set environment variables (one-time)

```bash
railway variables set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="redis://..." \
  TWILIO_ACCOUNT_SID="..." \
  TWILIO_AUTH_TOKEN="..." \
  TWILIO_VERIFY_SERVICE_SID="..." \
  APNS_KEY_ID="..." \
  APNS_TEAM_ID="..." \
  APNS_KEY_CONTENT="$(base64 < apns-key.p8)" \
  APNS_BUNDLE_ID="com.hang.app" \
  APNS_ENV="production" \
  JWT_SECRET="..." \
  NODE_ENV="production"
```

### Deploy

```bash
railway up
```

Or push to `main` — GitHub Actions deploys automatically.

---

## iOS Production Build (App Store)

### Prerequisites

1. Enroll in Apple Developer Program ($99/year) at developer.apple.com
2. Create an App ID with bundle identifier `com.hang.app`
3. Enable **Push Notifications** capability on the App ID
4. Generate APNs Authentication Key (.p8) — store securely, never commit
5. Create an app record in App Store Connect

### Build and submit

```bash
cd apps/mobile

# Install EAS CLI
npm install -g eas-cli
eas login

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store (after build completes)
eas submit --platform ios --latest
```

### Before submitting checklist

- [ ] All environment variables set in production
- [ ] Database migrations applied to production DB
- [ ] APNs key configured and tested
- [ ] Rate limiting enabled on auth endpoints
- [ ] Privacy policy URL live and linked in App Store Connect
- [ ] App screenshots prepared for all required device sizes (6.5", 5.5")
- [ ] At least one full E2E flow tested on a physical device

---

## CI/CD

| Trigger | Workflow | Actions |
|---|---|---|
| Pull request to main | `ci.yml` | Typecheck, unit tests, integration tests, mobile component tests |
| Push to main | `deploy.yml` | Run DB migrations, deploy to Railway |

Required GitHub secrets for deployment:
- `RAILWAY_TOKEN` — Railway API token
- `DATABASE_URL` — Production database URL

---

## Design System

The visual design is fully specified in `docs/Proposal.md` Section 6. Key tokens:

| Token | Value | Usage |
|---|---|---|
| `background` | `#faf8f4` | App background (warm off-white) |
| `accent` | `#c17f3b` | CTAs, active states, group tags (burnt amber) |
| `darkSurface` | `#1a1917` | Featured cards, event hero header |
| `textPrimary` | `#1a1917` | Near-black body text |
| Display font | DM Serif Display | App wordmark, event titles in hero |
| Body font | DM Sans | All body text (weights 300–600) |

Dark mode is system-detected via `useColorScheme()`. All color tokens have dark equivalents in `apps/mobile/constants/colors.ts`.

---

## API Reference

Base URL: `https://api.hang.app/api/v1` (or `http://localhost:3000/api/v1` locally)

Auth: `Authorization: Bearer <session_token>`

| Method | Path | Description |
|---|---|---|
| POST | `/auth/otp/send` | Send OTP via Twilio |
| POST | `/auth/otp/verify` | Verify OTP, return session token |
| DELETE | `/auth/session` | Logout |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile / push token |
| GET | `/groups` | User's groups |
| POST | `/groups` | Create custom group |
| GET | `/groups/official/search` | Search official Berkeley orgs |
| POST | `/groups/:id/join` | Join via invite code |
| POST | `/groups/:id/leave` | Leave group |
| GET | `/events` | Feed (paginated, filtered by user's groups) |
| POST | `/events` | Create event (planned / voting / quick) |
| GET | `/events/:id` | Event detail (marks as seen) |
| POST | `/events/:id/rsvp` | RSVP going / maybe / cant |
| POST | `/events/:id/vote` | Vote on a time option (voting events) |
| POST | `/events/:id/confirm` | Confirm time option (creator only) |
| GET | `/events/:id/rsvps` | List RSVPs with seen status |
| GET | `/events/:id/comments` | Get comments |
| POST | `/events/:id/comments` | Add comment |
| GET | `/notifications/preferences` | Get all notification preferences |
| PATCH | `/notifications/preferences/:groupId` | Update per-group level (all/mentions/off) |

Full request/response shapes are in `docs/Proposal.md` Section 9.

---

*hang. — built at Berkeley, for Berkeley.*
