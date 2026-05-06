# hang. — Product & Engineering Proposal

> A campus-native social hangout app for UC Berkeley (and beyond).  
> Target platform: **iOS (Apple App Store)**  
> Development target: **Production-ready MVP**

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution](#2-solution)
3. [Competitive Landscape](#3-competitive-landscape)
4. [Differentiation](#4-differentiation)
5. [Features — MVP Scope](#5-features--mvp-scope)
6. [Visual Design & UX](#6-visual-design--ux)
7. [Technical Architecture](#7-technical-architecture)
8. [Database Schema](#8-database-schema)
9. [API Specification](#9-api-specification)
10. [Push Notifications](#10-push-notifications)
11. [Apple App Store Deployment](#11-apple-app-store-deployment)
12. [Testing Strategy](#13-testing-strategy)
13. [Repository Structure](#14-repository-structure)
14. [Development Instructions](#15-development-instructions)

---

## 1. Problem Statement

College students at UC Berkeley already have rich social lives organized around meaningful groups — dorm floors, fraternities/sororities, club teams, class study groups, and friend circles. The problem is not that these groups don't exist. The problem is that coordinating spontaneous, low-stakes hangouts within them is surprisingly broken.

The current workflow looks like this: someone wants to play pickup basketball. They open a group chat, type "anyone down for RSF at 6?", watch it get buried under memes and other conversations, repeat the message, get three "maybe" responses and one "lmk", and ultimately either show up alone or just not go. The friction isn't social — the people are willing. It's infrastructural.

**The core pain points:**
- Group chats conflate coordination with conversation, so event signals get lost
- Existing event apps (Partiful, Eventbrite) are designed for planned parties with invite lists, not spontaneous casual plans
- There is no lightweight way to broadcast a low-commitment activity to a trusted group and get a clean headcount back
- There is no persistent, organized layer sitting on top of a student's existing social graph that surfaces relevant activity

The result is that a meaningful percentage of would-be hangouts simply don't happen — not because people don't want to hang out, but because the coordination overhead exceeds the social reward for casual plans.

---

## 2. Solution

**hang.** is a mobile-first social coordination app built specifically for college campuses, starting with UC Berkeley.

The core idea is simple: you are already part of groups that matter to you. hang. lets you broadcast a plan — a pickup game, a study session, a spontaneous hang in the common room — into one or more of those groups in under 30 seconds. Everyone in the group sees it, can RSVP, and the host gets a clean headcount. That's it.

The app is deliberately minimal. It does not try to be a social network, a calendar app, or a messaging platform. It is a single-purpose coordination layer that sits on top of the social structures students already have.

**The core loop:**

```
Create event (< 30 seconds) → Group members notified instantly
→ RSVPs collected → Host sees headcount → People show up
→ Attendees become hosts in their own groups → Loop continues
```

The flywheel is the transition from attendee to host. The product is designed to make that transition feel natural and low-effort.

---

## 3. Competitive Landscape

### Partiful
**What it is:** A Gen Z party invite platform. Create a stylized event page, share a link, collect RSVPs.  
**Traction:** 500,000+ MAU as of Q1 2025, up 400% YoY. Raised $27.3M total.  
**Gap:** Link-sharing model — no persistent groups, no campus identity layer, no social graph. Designed for planned events with broad invite lists, not trusted-group spontaneous coordination. Every event starts from scratch.

### Howbout
**What it is:** A shared calendar for friend groups. Visibility into when friends are free, group scheduling.  
**Gap:** Pull-based (you open the app to check availability). General-purpose, not campus-native. No event broadcasting, no group structure tied to campus organizations. Requires manually building your social graph.

### Pulse
**What it is:** An early-stage app (launched late 2025, ~100 downloads) explicitly trying to move hangouts "beyond the group chat." Targeted at graduate cohorts in cities.  
**Gap:** Very early, not college-focused, no campus org integration, no mutual-node social constraints. City-focused rather than campus-density-focused.

### GroupMe / iMessage group chats
**What it is:** The de facto current solution for group coordination.  
**Gap:** Coordination signals get buried in conversation. No RSVP layer, no headcount, no structured event objects. Notification fatigue from non-event messages.

### Summary table

| App | Persistent groups | Campus identity | Spontaneous events | Availability push | Social graph constraints |
|---|---|---|---|---|---|
| Partiful | ✗ | ✗ | ✗ | ✗ | ✗ |
| Howbout | Partial | ✗ | ✗ | Partial | ✗ |
| Pulse | ✗ | ✗ | Partial | ✗ | ✗ |
| GroupMe | ✓ | ✗ | ✓ | ✗ | ✗ |
| **hang.** | **✓** | **✓** | **✓** | **✓ (v2)** | **✓** |

---

## 4. Differentiation

### 4.1 Group-first, not event-first
Every other app treats the event as the primary object. hang. treats the **group** as the primary object. A user's social graph is pre-structured on arrival — they join their dorm floor, their frat, their CS study group — and events are broadcasts *into* that context. This means the app has immediate value from day one without requiring the user to build a friend network.

### 4.2 Pre-structured campus social graph
Howbout and Pulse both require users to manually add friends. hang. imports real social structures that already carry meaning — Greek organizations, campus housing units, clubs, class cohorts. These aren't arbitrary labels. They are the same structures that govern students' actual social lives. This is the primary network effect moat.

### 4.3 Spontaneous broadcast model
Partiful is for planned events. hang. is optimized for the *spontaneous* end of the spectrum — the pickup game, the coffee run, the "anyone want to grab dinner" moment. The quick event creation (under 30 seconds) and the "Quick" broadcast mode (no time, no structure) are designed explicitly for this use case. Nothing in the competitive landscape handles this well.

### 4.4 Mutual-node social constraint
Events have a default cap of 10 attendees via quick-add. Beyond that, additional attendees require a mutual connection in the social graph. This is not just anti-spam — it encodes a product philosophy that the app stays intimate and trust-based. As hang. scales, events feel personal rather than public.

### 4.5 Seen-but-not-responded state
The event detail shows who has seen an event but not yet RSVPed. This is a meaningful social signal for hosts (the message landed) and a subtle, non-coercive nudge for attendees. No competitor surfaces this.

---

## 5. Features — MVP Scope

### 5.1 Authentication & Onboarding
- Phone number authentication via SMS OTP (no email/password)
- Berkeley `.edu` email verification for campus-verified badge (optional at signup, required for joining official org groups)
- Onboarding flow: verify number → set name + avatar → join official groups (search by org name) → optionally create a custom group
- Profile: name, avatar, groups, past events hosted

### 5.2 Groups
- **Official groups:** Pre-seeded with Berkeley orgs (fraternities, sororities, housing units, clubs). Join via search + request or invite code.
- **Custom groups:** Any user can create a named group and invite members by phone number or username. Examples: "Floor 3 Friends", "CS 189 Study Crew"
- Group detail: member list, active events, past events
- Group membership is the primary access control layer — you only see events from groups you belong to

### 5.3 Event Creation
Three event types, selectable at creation:

**Planned event**
- Title (required)
- Group(s) to send to (required, multi-select)
- Location (optional free text)
- Date + time (required for this type)
- Note / description (optional)

**Voting event**
- Title (required)
- Group(s) to send to (required)
- Location (optional)
- Time options: creator proposes 2–4 time slots; group members vote; creator confirms final time
- Note (optional)

**Quick / spontaneous**
- Title (required, kept short — character limit 60)
- Group(s) to send to (required)
- No time required — displays as "happening now" or "soon"
- Displayed with a "QUICK" badge in the feed

All event types share:
- RSVP: Going / Maybe / Can't
- "Seen" state tracked (push opened → marked seen)
- Quick-add cap: 10 per event via group broadcast; beyond 10 requires mutual node
- Friends-only toggle: restricts visibility within the group to members with a mutual connection to the creator

### 5.4 Feed
- Primary view on app open
- Shows events from all groups the user belongs to, reverse-chronological
- Group filter pills at top: "All" selected by default, then each group as a pill
- Each event card shows: group name, event title, time/type badge, location snippet, going-faces (avatars of attendees), RSVP count
- Featured card: most recent or most-activity event rendered as a dark hero card for visual hierarchy
- Tap card → event detail

### 5.5 Event Detail
- Dark hero header: group tag, event title, time/location chips
- RSVP row: Going / Maybe / Can't — tap to respond
- Attendee list: avatar + name + status (Going / Maybe / Seen / no response)
- "Seen" state: shown distinctly from no-response (eye icon)
- Event note (if provided)
- Single-line comment thread for coordination ("I'll be 10 min late", "bringing my roommate") — max 3 visible, expand to show all
- Share event: generates a deep link that non-members can use to request access

### 5.6 Notifications (Push — APNs)
- "X created an event in [Group]" — sent to all group members on event creation
- "X is going to [Event]" — sent to event creator when first RSVP arrives, then batched ("3 more people are going")
- "Reminder: [Event] starts in 1 hour" — sent to Going RSVPs
- Notification tap → deep link into event detail
- Per-group notification settings: All / Mentions only / Off
- Notification preferences stored per-user per-group server-side

### 5.7 Profile
- Name, avatar (upload or initials fallback)
- Groups list
- Events hosted (count + recent)
- Settings: notification preferences, account management

---

## 6. Visual Design & UX

### 6.1 Design Language

**Name:** hang.  
**Aesthetic:** Warm, refined minimal. Not a tech product — a social one. Feels like it belongs in a student's life alongside Venmo and iMessage.

**Color palette:**
```
Background:     #faf8f4   (warm off-white)
Surface:        #ffffff   (cards)
Surface alt:    #f0ede8   (inputs, chips)
Border:         #ede9e2
Text primary:   #1a1917   (near-black, warm)
Text secondary: #8a8278
Text tertiary:  #b0a89e
Accent:         #c17f3b   (burnt amber — used for CTAs, group tags, active states)
Dark surface:   #1a1917   (featured cards, event hero headers)
```

**Dark mode equivalents** (system-detected via `@media (prefers-color-scheme: dark)`):
```
Background:     #121110
Surface:        #1e1c1a
Surface alt:    #252320
Border:         #2e2b27
Text primary:   #f0ede8
Text secondary: #8a8278
Accent:         #d4924d   (slightly lighter for dark bg legibility)
```

**Typography:**
- Display / wordmark: DM Serif Display (serif, used for app logo and event titles in hero)
- Body: DM Sans (clean, readable, slightly characterful)
- Weights used: 300 (light captions), 400 (body), 500 (labels), 600 (headings, CTAs)

**Corner radii:**
- Cards: 16px
- Inputs: 10px
- Pills/chips: 20px (full round)
- Bottom sheet: 28px top corners

**Motion:**
- Sheet present: spring animation, 0.35s
- Card press: scale(0.97), 0.1s
- RSVP button state change: scale + color transition, 0.2s
- Feed load: staggered fade-in per card, 40ms delay between cards

### 6.2 Screen Inventory

The following screens constitute the MVP:

| Screen | Description |
|---|---|
| Onboarding / Auth | Phone number entry, OTP, name + avatar |
| Onboarding / Groups | Join official groups + create custom |
| Feed | Main home screen, group filter pills, event cards |
| Event Detail | Hero header, RSVP, attendee list, comment thread |
| Create Event | Bottom sheet, 3 timing modes, group multi-select |
| Groups List | All groups, member count, active event badges |
| Group Detail | Group members, events, settings |
| Profile | User info, groups, hosted events, settings |
| Notifications | Push notification preferences per group |

### 6.3 Key UX Flows

**Create event (target: under 30 seconds)**
1. Tap "+" FAB on feed
2. Bottom sheet slides up
3. Type event title
4. Select group(s) — pre-populated chips, tap to select
5. Select timing mode (Set time / Vote / Spontaneous)
6. If "Set time": pick date + time inline
7. If "Vote": add 2–4 time option slots
8. Optional: location, note
9. Tap "Send to [Group] →"
10. Sheet dismisses, feed updates, push sent to group

**RSVP flow**
1. Receive push notification
2. Tap → deep link opens event detail
3. Tap "Going" / "Maybe" / "Can't"
4. State updates instantly (optimistic UI)
5. Creator receives batched notification

**Voting event resolution**
1. Time options displayed as selectable chips on event detail
2. Members tap to vote (can select multiple)
3. Vote counts shown live
4. Creator taps "Confirm time" → selects winning slot
5. Event converts to a planned event with confirmed time
6. All Going/Maybe RSVPs receive push: "[Event] time confirmed: [time]"

---

## 7. Technical Architecture

### 7.1 Technology Stack

**Frontend (iOS)**
- **Framework:** React Native (Expo managed workflow)
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State management:** Zustand (lightweight, no boilerplate)
- **Data fetching:** TanStack Query (React Query) with optimistic updates
- **Push notifications:** Expo Notifications + APNs
- **Auth:** Custom OTP via backend + secure token storage in Expo SecureStore
- **Styling:** NativeWind (Tailwind for React Native) + custom StyleSheet for complex components

> **Rationale for React Native / Expo:** Fastest path to a production App Store submission with a single codebase. Expo's managed workflow handles the majority of native configuration, code signing, and OTA updates. When the app scales and requires native modules not available in Expo Go, ejecting to bare workflow is straightforward.

**Backend**
- **Runtime:** Node.js 20+
- **Framework:** Fastify (faster than Express, built-in TypeScript support, schema validation)
- **Language:** TypeScript
- **ORM:** Prisma (type-safe, great migration tooling, production-proven)
- **Database:** PostgreSQL 15 (via Supabase — managed Postgres with built-in auth helpers, row-level security, and realtime subscriptions)
- **Realtime:** Supabase Realtime (Postgres replication → WebSocket) for live RSVP updates and feed refresh
- **Push:** APNs via `node-apn` library
- **SMS OTP:** Twilio Verify API
- **File storage:** Supabase Storage (avatars, future: event photos)
- **Caching:** Redis (Upstash serverless Redis) for session tokens and rate limiting

**Infrastructure**
- **Backend hosting:** Railway (simple Dockerized deployments, auto-scaling, managed Postgres add-on or connect to Supabase)
- **Alternatively:** Render or Fly.io — same complexity level
- **CI/CD:** GitHub Actions
- **App distribution:** Expo EAS Build + EAS Submit for App Store

### 7.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   iOS App (Expo)                     │
│  React Native · TypeScript · TanStack Query · Zustand│
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / WSS
┌────────────────────▼────────────────────────────────┐
│              Fastify API Server                      │
│         Node.js · TypeScript · Prisma                │
│  /auth  /users  /groups  /events  /rsvp  /notifs    │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼─────┐ ┌────▼────────────────┐
│  PostgreSQL  │ │   Redis   │ │  Supabase Realtime   │
│  (Supabase) │ │ (Upstash) │ │  (live feed updates) │
└─────────────┘ └───────────┘ └─────────────────────┘
       │                              │
┌──────▼──────┐              ┌────────▼───────────────┐
│   Supabase  │              │   APNs (Apple Push)    │
│   Storage   │              │   via node-apn         │
│  (avatars)  │              └────────────────────────┘
└─────────────┘
       │
┌──────▼──────┐
│   Twilio    │
│  Verify API │
│  (SMS OTP)  │
└─────────────┘
```

---

## 8. Database Schema

All tables use UUID primary keys. Timestamps use `TIMESTAMPTZ`. Soft deletes via `deleted_at` nullable column.

```sql
-- Users
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(20) UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  username        VARCHAR(50) UNIQUE,
  avatar_url      TEXT,
  berkeley_email  VARCHAR(255) UNIQUE,        -- optional, for campus verified badge
  is_verified     BOOLEAN DEFAULT FALSE,
  push_token      TEXT,                        -- APNs device token
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Groups
CREATE TABLE groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('official', 'custom')),
  org_slug        VARCHAR(100) UNIQUE,         -- e.g. 'pks', 'unit-1-floor-3' for official groups
  invite_code     VARCHAR(12) UNIQUE NOT NULL,
  created_by      UUID REFERENCES users(id),
  avatar_url      TEXT,
  member_count    INT DEFAULT 0,               -- denormalized, updated via trigger
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Group memberships
CREATE TABLE group_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Social graph (mutual connections — used for mutual-node constraint)
CREATE TABLE user_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a          UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b          UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CHECK (user_a < user_b),                    -- enforce canonical ordering
  UNIQUE(user_a, user_b)
);

-- Events
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  location        TEXT,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('planned', 'voting', 'quick')),
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'cancelled', 'ended')),
  created_by      UUID REFERENCES users(id),
  friends_only    BOOLEAN DEFAULT FALSE,
  quick_add_cap   INT DEFAULT 10,
  confirmed_time  TIMESTAMPTZ,                -- set when type=planned or voting resolves
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Event <> Group relationship (one event can go to multiple groups)
CREATE TABLE event_groups (
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, group_id)
);

-- Time options for voting events
CREATE TABLE event_time_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  proposed_time   TIMESTAMPTZ NOT NULL,
  vote_count      INT DEFAULT 0,              -- denormalized
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Votes on time options
CREATE TABLE event_time_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_option_id  UUID REFERENCES event_time_options(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(time_option_id, user_id)
);

-- RSVPs
CREATE TABLE rsvps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL CHECK (status IN ('going', 'maybe', 'cant')),
  seen_at         TIMESTAMPTZ,                -- null = not seen, non-null = seen timestamp
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Comments on events
CREATE TABLE event_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  body            VARCHAR(280) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Notification preferences (per user per group)
CREATE TABLE notification_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,
  level           VARCHAR(20) DEFAULT 'all' CHECK (level IN ('all', 'mentions', 'off')),
  UNIQUE(user_id, group_id)
);

-- OTP sessions (short-lived)
CREATE TABLE otp_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(20) NOT NULL,
  otp_hash        VARCHAR(255) NOT NULL,      -- bcrypt hash of OTP
  expires_at      TIMESTAMPTZ NOT NULL,
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auth sessions
CREATE TABLE auth_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL,      -- SHA-256 of session token
  device_info     TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
```sql
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_event_groups_group ON event_groups(group_id);
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);
CREATE INDEX idx_event_comments_event ON event_comments(event_id);
CREATE INDEX idx_user_connections_a ON user_connections(user_a);
CREATE INDEX idx_user_connections_b ON user_connections(user_b);
CREATE INDEX idx_auth_sessions_token ON auth_sessions(token_hash);
```

---

## 9. API Specification

All endpoints are prefixed `/api/v1`. Authentication via `Authorization: Bearer <session_token>` header on protected routes.

### Authentication

```
POST   /auth/otp/send          Send OTP to phone number (Twilio)
POST   /auth/otp/verify        Verify OTP, return session token
POST   /auth/session/refresh   Refresh session token
DELETE /auth/session           Logout (invalidate token)
```

### Users

```
GET    /users/me               Get current user profile
PATCH  /users/me               Update name, avatar, push token
GET    /users/:id              Get public user profile
POST   /users/me/connections   Add a connection (mutual opt-in)
DELETE /users/me/connections/:id  Remove connection
```

### Groups

```
GET    /groups                 Get groups for current user
POST   /groups                 Create a new custom group
GET    /groups/:id             Get group detail + members
PATCH  /groups/:id             Update group (admin only)
DELETE /groups/:id             Delete group (admin only)
POST   /groups/:id/join        Join via invite code
POST   /groups/:id/leave       Leave group
GET    /groups/:id/members     List members
POST   /groups/:id/members     Invite member by phone/username
DELETE /groups/:id/members/:uid  Remove member (admin only)
GET    /groups/official/search  Search official Berkeley orgs
```

### Events

```
GET    /events                 Get feed (paginated, filtered by user groups)
POST   /events                 Create event
GET    /events/:id             Get event detail
PATCH  /events/:id             Update event (creator only)
DELETE /events/:id             Cancel event (creator only)
POST   /events/:id/rsvp        RSVP (going/maybe/cant)
PATCH  /events/:id/rsvp        Update RSVP
POST   /events/:id/seen        Mark event as seen
GET    /events/:id/rsvps       Get RSVP list with seen status
POST   /events/:id/comments    Add comment
GET    /events/:id/comments    Get comments (paginated)
DELETE /events/:id/comments/:cid  Delete own comment
POST   /events/:id/vote        Vote on a time option (voting events)
POST   /events/:id/confirm     Confirm a time option (creator, voting events)
```

### Notifications

```
GET    /notifications/preferences          Get all notification preferences
PATCH  /notifications/preferences/:groupId Update preference for a group
```

---

## 10. Push Notifications

**Provider:** Apple Push Notification service (APNs) via `node-apn`

**APNs configuration required:**
- Apple Developer account with push notification capability enabled for the app bundle ID
- APNs authentication key (`.p8` file) from Apple Developer portal
- Key ID and Team ID stored as environment variables (never committed to repo)

**Notification triggers and payloads:**

```typescript
// New event in group
{
  aps: {
    alert: { title: "hang.", body: `${creatorName} posted an event in ${groupName}` },
    badge: 1,
    sound: "default"
  },
  type: "NEW_EVENT",
  eventId: "...",
  groupId: "..."
}

// RSVP received (batched — send after first, then every 3)
{
  aps: {
    alert: { title: groupName, body: `${name} is going to ${eventTitle}` },
    sound: "default"
  },
  type: "NEW_RSVP",
  eventId: "..."
}

// Event reminder (1 hour before)
{
  aps: {
    alert: { title: "Heads up!", body: `${eventTitle} starts in 1 hour` },
    sound: "default"
  },
  type: "REMINDER",
  eventId: "..."
}

// Voting time confirmed
{
  aps: {
    alert: { title: groupName, body: `Time confirmed for ${eventTitle}: ${formattedTime}` },
    sound: "default"
  },
  type: "TIME_CONFIRMED",
  eventId: "..."
}
```

**Reminder scheduling:** Use a background job (e.g., BullMQ with Redis) that enqueues a reminder job when a planned event is created with a confirmed time. Job fires 1 hour before `confirmed_time`, sends APNs to all users with status `going` or `maybe` who have notifications enabled.

---

## 11. Apple App Store Deployment

### 11.1 Requirements Checklist

Before submitting to the App Store, the following must be completed:

**Apple Developer Account**
- [ ] Enroll in Apple Developer Program ($99/year) at developer.apple.com
- [ ] Create an App ID with bundle identifier: `com.hang.app` (or chosen identifier)
- [ ] Enable Push Notifications capability on the App ID
- [ ] Generate APNs Authentication Key (.p8) — store securely, never commit
- [ ] Create Distribution Certificate and Provisioning Profile (handled automatically by EAS)

**App Configuration (app.json / app.config.ts)**
```json
{
  "expo": {
    "name": "hang.",
    "slug": "hang-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.hang.app",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "hang. uses your photo library to set your profile picture.",
        "NSCameraUsageDescription": "hang. uses your camera to take a profile picture."
      }
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#c17f3b"
      }]
    ]
  }
}
```

**App Store Connect**
- [ ] Create new app in App Store Connect
- [ ] App name: hang.
- [ ] Bundle ID: matches above
- [ ] Prepare screenshots for all required device sizes (6.5", 5.5" required; 12.9" iPad optional)
- [ ] Write App Store description, keywords, support URL
- [ ] Age rating: 12+ (social networking)
- [ ] Privacy policy URL (required — host a simple one)

**Privacy Requirements**
- [ ] Privacy policy must cover: phone number collection, group/event data, push notifications
- [ ] App Privacy section in App Store Connect must accurately describe data collection
- [ ] Required keys in Info.plist for any permissions used

### 11.2 EAS Build & Submit

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS (generates eas.json)
eas build:configure

# Build for App Store submission (production)
eas build --platform ios --profile production

# Submit to App Store (after build completes)
eas submit --platform ios
```

**eas.json configuration:**
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### 11.3 Environment Variables

**Never commit secrets to the repository.** Use `.env` files locally and environment variable injection in CI/CD and Railway/Render.

```bash
# Backend (.env)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=...
APNS_KEY_ID=...
APNS_TEAM_ID=...
APNS_KEY_PATH=./apns-key.p8       # path to APNs .p8 key file
APNS_BUNDLE_ID=com.hang.app
JWT_SECRET=...                     # for session token signing
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
NODE_ENV=production
PORT=3000

# Frontend (.env / app.config.ts)
EXPO_PUBLIC_API_URL=https://api.hang.app
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 12. Testing Strategy

### 12.1 Backend Testing

**Framework:** Vitest + Supertest

```bash
# Unit tests
pnpm test

# Integration tests (requires test DB)
pnpm test:integration

# Coverage
pnpm test:coverage
```

**Test categories:**
- Auth flow: OTP send, verify, session management
- Group CRUD: create, join, leave, invite code validation
- Event CRUD: all three types, status transitions
- RSVP logic: optimistic updates, seen state, quick-add cap enforcement
- Mutual node constraint: verify cap logic with and without mutual connections
- Push notification dispatch: mock APNs, verify correct payloads and recipients

### 12.2 Frontend Testing

**Framework:** Jest + React Native Testing Library

```bash
pnpm test
```

**Test categories:**
- Component unit tests: Feed card, Event detail, Create sheet
- Navigation flow: auth → onboarding → feed
- Optimistic UI: RSVP state update before API confirmation
- Offline handling: queue events for retry

### 12.3 End-to-End Testing

**Framework:** Maestro (declarative mobile E2E)

```yaml
# flows/create-event.yaml
appId: com.hang.app
---
- launchApp
- tapOn: "+"
- inputText:
    id: event-title-input
    text: "Pickup basketball"
- tapOn: "Floor 3"
- tapOn: "Set a time"
- tapOn: "Send to Floor 3 →"
- assertVisible: "Pickup basketball"
```

Run: `maestro test flows/`

### 12.4 Test Database

Use a separate PostgreSQL database for tests. Prisma migrations run automatically before the test suite via `prisma migrate deploy` in the test setup script.

```bash
# Create test DB and run migrations
DATABASE_URL=postgresql://localhost/hang_test pnpm prisma migrate deploy
DATABASE_URL=postgresql://localhost/hang_test pnpm test:integration
```

---

## 13. Repository Structure

```
hang/
├── apps/
│   ├── mobile/                    # React Native (Expo) app
│   │   ├── app/                   # Expo Router screens (file-based)
│   │   │   ├── (auth)/
│   │   │   │   ├── index.tsx      # Phone number entry
│   │   │   │   ├── verify.tsx     # OTP verify
│   │   │   │   └── onboarding/
│   │   │   │       ├── profile.tsx
│   │   │   │       └── groups.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx    # Tab navigator
│   │   │   │   ├── feed.tsx       # Home feed
│   │   │   │   ├── events.tsx     # My events
│   │   │   │   ├── groups.tsx     # Groups list
│   │   │   │   └── profile.tsx    # Profile + settings
│   │   │   ├── events/
│   │   │   │   └── [id].tsx       # Event detail
│   │   │   ├── groups/
│   │   │   │   └── [id].tsx       # Group detail
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── feed/
│   │   │   │   ├── EventCard.tsx
│   │   │   │   ├── FeaturedCard.tsx
│   │   │   │   └── GroupFilterPills.tsx
│   │   │   ├── event/
│   │   │   │   ├── RsvpRow.tsx
│   │   │   │   ├── AttendeeList.tsx
│   │   │   │   ├── CommentThread.tsx
│   │   │   │   └── TimeVoting.tsx
│   │   │   ├── create/
│   │   │   │   ├── CreateEventSheet.tsx
│   │   │   │   ├── TimingToggle.tsx
│   │   │   │   └── GroupMultiSelect.tsx
│   │   │   └── ui/
│   │   │       ├── Avatar.tsx
│   │   │       ├── GoingFaces.tsx
│   │   │       ├── Badge.tsx
│   │   │       └── BottomSheet.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useFeed.ts
│   │   │   ├── useEvent.ts
│   │   │   └── useGroups.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts       # Zustand auth state
│   │   │   └── uiStore.ts         # UI state (sheet open, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts             # Axios instance + interceptors
│   │   │   ├── queryClient.ts     # TanStack Query config
│   │   │   └── notifications.ts   # Expo push registration
│   │   ├── constants/
│   │   │   ├── colors.ts          # Design tokens
│   │   │   └── typography.ts
│   │   ├── app.json
│   │   ├── eas.json
│   │   └── package.json
│   │
│   └── api/                       # Fastify backend
│       ├── src/
│       │   ├── server.ts          # Fastify app entry
│       │   ├── routes/
│       │   │   ├── auth.ts
│       │   │   ├── users.ts
│       │   │   ├── groups.ts
│       │   │   ├── events.ts
│       │   │   └── notifications.ts
│       │   ├── services/
│       │   │   ├── authService.ts
│       │   │   ├── eventService.ts
│       │   │   ├── groupService.ts
│       │   │   ├── pushService.ts    # APNs dispatch
│       │   │   └── otpService.ts     # Twilio
│       │   ├── jobs/
│       │   │   └── reminderJob.ts    # BullMQ reminder scheduler
│       │   ├── middleware/
│       │   │   ├── auth.ts           # Session token validation
│       │   │   └── rateLimit.ts
│       │   └── lib/
│       │       ├── prisma.ts
│       │       ├── redis.ts
│       │       └── apns.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                    # Shared TypeScript types
│       ├── types/
│       │   ├── user.ts
│       │   ├── group.ts
│       │   ├── event.ts
│       │   └── api.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Run tests on PR
│       └── deploy.yml             # Deploy backend on merge to main
│
├── docs/
│   ├── PROPOSAL.md                # This file
│   └── assets/
│       └── mockups/               # See note below on mockup images
│
├── .env.example                   # Template — never commit real .env
├── .gitignore
├── turbo.json                     # Turborepo monorepo config
└── package.json                   # Root workspace
```

---

## 14. Development Instructions

### Prerequisites

```bash
node >= 20.0.0
pnpm >= 9.0.0
PostgreSQL >= 15 (local) or Supabase account
Redis (local via Docker, or Upstash free tier)
Expo CLI + EAS CLI
Xcode 15+ with iOS Simulator (for iOS development)
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/hang.git
cd hang

# Install dependencies (all workspaces)
pnpm install

# Copy environment template
cp .env.example apps/api/.env
# Fill in all values in apps/api/.env

# Run database migrations
cd apps/api
pnpm prisma migrate dev

# Seed official Berkeley groups (optional)
pnpm prisma db seed

# Start backend in development
pnpm dev
# Runs on http://localhost:3000

# In a separate terminal — start the mobile app
cd apps/mobile
pnpm start
# Opens Expo DevTools — press 'i' for iOS Simulator
```

### Running Tests

```bash
# Backend unit + integration tests
cd apps/api
pnpm test

# Frontend tests
cd apps/mobile
pnpm test

# E2E (requires running app on simulator)
maestro test docs/flows/
```

### Backend Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up

# Set environment variables (one-time)
railway variables set DATABASE_URL=... TWILIO_ACCOUNT_SID=... # etc.
```

### iOS Production Build

```bash
cd apps/mobile

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store (after build)
eas submit --platform ios --latest
```

### Key Development Notes

1. **APNs in development:** Use the APNs sandbox endpoint. Set `APNS_ENV=sandbox` locally. Production builds automatically use the production endpoint.

2. **Twilio Verify in development:** Twilio provides a test phone number (+15005550006) that always returns a valid OTP for testing without consuming credits.

3. **Database migrations:** Always generate a new Prisma migration when changing the schema. Never manually edit the database in production.
   ```bash
   pnpm prisma migrate dev --name describe_change_here
   ```

4. **Realtime subscriptions:** Supabase Realtime requires row-level security (RLS) to be configured on tables. The `group_members` table gates access — users only receive realtime updates for events in groups they belong to.

5. **Production readiness checklist before first App Store submission:**
   - [ ] All environment variables set in production
   - [ ] Database migrations applied to production DB
   - [ ] APNs key configured and tested
   - [ ] Rate limiting enabled on all auth endpoints
   - [ ] Error monitoring (Sentry) integrated
   - [ ] Privacy policy URL live and linked in App Store Connect
   - [ ] At least one full E2E flow tested on a physical device

---

## Appendix: Mockup Assets

The following mockup images should be placed in `docs/assets/mockups/` in the repository. They are referenced in this proposal and can be used as pixel-accurate design references for implementation:

- `mockup-feed.png` — Home feed screen
- `mockup-create.png` — Create event bottom sheet
- `mockup-detail.png` — Event detail screen
- `mockup-groups.png` — Groups list screen

> **Note to developer:** These mockup images will be provided separately and uploaded to the repository. The visual design language (colors, typography, spacing, component patterns) is fully specified in Section 6 of this document. All mockup screens use the exact color tokens, font families, and component styles described there.

---

*hang. — built at Berkeley, for Berkeley.*  
*Proposal version: 1.0 — May 2026*
