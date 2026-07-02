# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

This repo has **no code yet** — only `plan.md`, the full MVP implementation plan. There are no commands to build/lint/test/run because nothing has been scaffolded. When picking up work here, consult `plan.md`'s "Build Order" section (bottom) for the intended sequence, and update this file with real commands as `package.json` scripts / tooling get added.

Do not deviate from the stack or scope decisions below without asking the user — they are explicitly confirmed, not suggestions.

## Product & Stack

Multi-tenant SaaS for gyms: gyms pay us a monthly subscription (via Stripe), each gym then manages its own members through the platform. Three roles: Platform Admin, Gym Admin, Member (no Trainer role in MVP).

Confirmed stack (fixed, do not change):
- **`apps/web`** — Next.js (App Router, plain JavaScript, Tailwind)
- **`apps/api`** — Express.js (plain JavaScript)
- **Auth** — better-auth, with its MongoDB adapter
- **DB** — MongoDB Atlas via the native `mongodb` driver (no Mongoose/ODM)
- **Billing** — Stripe Billing, gym→platform only

npm workspaces: `["apps/*", "packages/*"]`. `packages/shared` holds role/status enums used by both apps.

## Architecture

Two independent Node.js processes. `apps/web` never talks to MongoDB or Stripe directly — only to the Express API.

**No CORS / single-origin strategy**: Next.js proxies `/api/*` to Express server-side via `next.config.js` `rewrites()`. The browser only ever calls same-origin `/api/*` on the Next.js host. Express itself only needs to be additionally internet-reachable for the Stripe webhook endpoint.

**Request flow**: Browser → Next.js page → `fetch('/api/...', { credentials: 'include' })` → Next.js rewrite → Express → `requireAuth` (better-auth session → `req.authUser` with `role`+`gymId`) → `requireRole` → `scopeToGym` (tenant isolation) → `checkGymSubscriptionActive` → route handler → Mongo query scoped by `gymId`.

**Stripe flow**: Express creates Checkout/Billing Portal sessions redirecting back to Next.js; Stripe calls `POST /api/webhooks/stripe` directly (raw body, signature-verified) to update the gym's `subscription` status.

**Deployment**: `apps/web` and `apps/api` deploy as two separate Vercel projects from one repo. Express runs as Vercel serverless functions (not a persistent process), which means:
- `db/connection.js` must cache the `MongoClient` at module/global scope and reuse it across warm invocations — a fresh client per cold start would exhaust Atlas connection limits.
- `/api/webhooks/stripe` needs the raw, unparsed body for Stripe signature verification — Vercel's default body parsing must be disabled for that route.

## Multi-Tenancy Rule

Every gym-scoped collection carries `gymId`. `scopeToGym` middleware sets `req.gymId` and 403s on any mismatch with the authenticated user's `gymId` — this is the tenant-isolation guard, treat it as load-bearing. Service functions take `gymId` as a mandatory first argument as a structural safeguard against accidentally unscoped queries.

## Data Model (MongoDB, native driver)

- **`users`** — better-auth managed, extended with `role: platformAdmin|gymAdmin|member` and `gymId: ObjectId|null`.
- **`gyms`** — `name, slug (unique), ownerUserId, status: active|suspended, inviteCode, stripeCustomerId, subscription: {status, planId, stripeSubscriptionId, currentPeriodEnd}`.
- **`memberships`** — one per (gym, user): `status: active|inactive`, `paymentStatus: paid|unpaid` (manually toggled by gym admin — no member→gym payment processing in MVP).
- **`classes`** — `gymId, title, instructorName (plain text, no Trainer entity), startTime, endTime, capacity, status`.
- **`bookings`** — unique on `{gymId, classId, userId}` to prevent double-booking.
- **`checkins`** — `gymId, userId, classId (nullable), checkedInAt`.
- **`billingEvents`** — Stripe webhook audit/idempotency log, unique on `stripeEventId`.

All collections + `$jsonSchema` validators + indexes are created in one migration script: `apps/api/src/db/migrations/001-init-collections-and-indexes.js`.

## Auth Flows (better-auth)

- Mounted at `/api/auth/*`.
- **Platform Admin**: not self-service, created via `scripts/seedPlatformAdmin.js`.
- **Gym Admin**: self-service sign-up → `POST /api/gym-admin/onboarding/create-gym` promotes user + creates `gyms` doc → redirected into Stripe Checkout.
- **Member**: gym-admin-initiated invite (temp password shown on screen, no email in MVP) or self-registration at `/join/[inviteCode]`.

## Stripe Access Gating

`active`/`trialing` → full access. `past_due` → full access still (don't punish members for a gym's billing hiccup) but gym admin sees a persistent banner. `canceled` or gym `status: suspended` → gym admin restricted to billing/profile only; member endpoints 403.

## Critical Files (once scaffolded)

- `apps/api/src/auth/betterAuth.js` — auth model roles/gymId depend on this.
- `apps/api/src/middleware/scopeToGym.js` — the tenant-isolation enforcement point.
- `apps/api/src/db/migrations/001-init-collections-and-indexes.js` — collection shapes + indexes.
- `apps/api/src/routes/webhooks/stripe.routes.js` / `apps/api/src/services/stripeService.js` — billing lifecycle that gates access platform-wide.
- `apps/web/next.config.js` (rewrites) / `apps/web/src/lib/apiClient.js` — frontend↔API wiring.

## Out of Scope for MVP

Member→gym real payment processing (Stripe Connect), Trainer role, multi-admin-per-gym, transactional email/notifications, analytics/reporting, OAuth sign-in, class waitlisting. Don't build these unless the user explicitly expands scope.
