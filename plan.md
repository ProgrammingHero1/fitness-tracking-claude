# Fitness Gym SaaS — MVP Implementation Plan

## Context

We're starting from an empty repo (`C:\projects\fitness-tracking-claude`, git initialized, no code yet). The goal is a multi-tenant SaaS where independent gyms sign up and pay us a monthly subscription; each gym then manages its own members through the platform. This plan covers the MVP: three roles (Platform Admin, Gym Admin, Member), gym→platform billing via Stripe, and core gym-day-to-day features (member roster, class scheduling/booking, check-in).

Confirmed stack (user-specified, not to be changed): Next.js (App Router, plain JavaScript, Tailwind), a separate Express.js backend (plain JavaScript), better-auth for authentication, MongoDB Atlas via the native `mongodb` driver (no Mongoose/ODM), Stripe Billing for gym subscriptions.

Confirmed scope decisions:
- Multi-tenancy: shared MongoDB database, every gym-scoped document carries a `gymId`, enforced via Express middleware.
- Billing: only gym→platform payments go through Stripe. Member dues are tracked as a plain data field (`paid`/`unpaid`) toggled manually by the gym admin — no real payment processing between member and gym in the MVP (documented as a future extension via Stripe Connect).
- Roles: Platform Admin, Gym Admin, Member (no Trainer role in MVP).
- Member features: view membership status, browse/book/cancel classes, check in.

## Architecture

Two independent Node.js processes:
1. **`apps/web`** — Next.js frontend (all three roles' UIs). Talks only to the Express API, never to MongoDB/Stripe directly.
2. **`apps/api`** — Express backend. Owns all business logic, MongoDB access (native driver), better-auth, and Stripe integration.

**Cross-origin/auth strategy (recommended, use in both dev and prod):** Next.js proxies `/api/*` to the Express service server-side via `next.config.js` `rewrites()`. The browser only ever calls same-origin `/api/*` on the Next.js host, so there's no cross-site cookie problem to manage, no CORS complexity, and one public origin. Express itself only needs to be additionally internet-reachable for the Stripe webhook endpoint.

**Request flow:** Browser → Next.js page → `fetch('/api/...', { credentials: 'include' })` → Next.js rewrite proxies to Express → better-auth session middleware resolves `req.authUser` (with `role` + `gymId`) → tenant-scoping middleware enforces `gymId` → route handler runs a Mongo query scoped by `gymId` → JSON back to the page.

**Stripe flow:** Express creates Checkout/Billing Portal sessions redirecting back to Next.js pages; Stripe calls `POST /api/webhooks/stripe` directly (raw body, signature-verified) to push subscription lifecycle events, which update the gym's `subscription` status in Mongo.

## Repository Structure

```
fitness-tracking-claude/
├── package.json                  # root, npm workspaces: ["apps/*", "packages/*"]
├── .gitignore
├── .env.example
├── packages/shared/               # role/status enums shared by both apps
│   └── src/{roles.js, constants.js}
├── apps/
│   ├── web/                       # Next.js (JS, App Router, Tailwind)
│   │   ├── next.config.js         # rewrites() proxy -> Express
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/{sign-in, sign-up-gym, join/[inviteCode]}/page.js
│   │       │   ├── platform-admin/{layout.js, page.js, gyms/[gymId]/page.js}
│   │       │   ├── gym-admin/{layout.js, page.js, profile, members, members/invite, classes, classes/[classId], billing}/page.js
│   │       │   └── member/{layout.js, page.js, classes, checkin}/page.js
│   │       ├── components/ui/, components/nav/
│   │       └── lib/{apiClient.js, session.js}
│   └── api/                       # Express (JS)
│       ├── package.json
│       ├── vercel.json
│       └── src/
│           ├── server.js                          # local dev entrypoint (app.listen)
│           ├── app.js                              # Express app: middleware + route mounting, exported for serverless + local
│           ├── config/
│           │   ├── env.js                          # reads/validates process.env
│           │   └── stripePlans.js                  # plan -> Stripe price ID map
│           ├── db/
│           │   ├── connection.js                   # MongoClient singleton (cached across warm invocations)
│           │   ├── validators/
│           │   │   ├── users.schema.js
│           │   │   ├── gyms.schema.js
│           │   │   ├── memberships.schema.js
│           │   │   ├── classes.schema.js
│           │   │   ├── bookings.schema.js
│           │   │   ├── checkins.schema.js
│           │   │   └── billingEvents.schema.js
│           │   └── migrations/
│           │       └── 001-init-collections-and-indexes.js
│           ├── auth/
│           │   ├── betterAuth.js                   # better-auth instance + Mongo adapter config
│           │   └── authRoutes.js                   # mounts better-auth handler at /api/auth/*
│           ├── middleware/
│           │   ├── requireAuth.js
│           │   ├── requireRole.js
│           │   ├── scopeToGym.js
│           │   ├── checkGymSubscriptionActive.js
│           │   └── errorHandler.js
│           ├── routes/
│           │   ├── platformAdmin/
│           │   │   └── gyms.routes.js
│           │   ├── gymAdmin/
│           │   │   ├── onboarding.routes.js
│           │   │   ├── profile.routes.js
│           │   │   ├── members.routes.js
│           │   │   ├── classes.routes.js
│           │   │   └── billing.routes.js
│           │   ├── member/
│           │   │   ├── status.routes.js
│           │   │   ├── classes.routes.js
│           │   │   └── checkin.routes.js
│           │   └── webhooks/
│           │       └── stripe.routes.js
│           ├── services/
│           │   ├── gymService.js
│           │   ├── membershipService.js
│           │   ├── classService.js
│           │   ├── bookingService.js
│           │   ├── checkinService.js
│           │   └── stripeService.js
│           └── scripts/
│               ├── seedPlatformAdmin.js
│               └── setupStripePlans.js
```

Env vars: `apps/api/.env` holds `MONGODB_URI` (Atlas connection string — provided by the user, never generated or committed), `MONGODB_DB_NAME`, `PORT` (local dev only), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC/PRO`, `APP_BASE_URL`. `apps/web/.env.local` holds `NEXT_PUBLIC_API_URL` (unused/empty when proxying) and the Express target URL used by `next.config.js` rewrites (`API_PROXY_TARGET` — `http://localhost:4000` in dev, the deployed API project's Vercel URL in prod).

## Deployment / Hosting

- **MongoDB**: Atlas cluster is externally managed — the user supplies `MONGODB_URI` directly; nothing in this plan provisions or manages the cluster itself.
- **Both `apps/web` and `apps/api` deploy to Vercel as two separate Vercel projects** (one repo, two projects pointing at the two subfolders). This preserves the "single public origin, no CORS" design from the Architecture section: the browser only ever talks to the `apps/web` domain; Next.js `rewrites()` forward `/api/*` to the `apps/api` project's Vercel URL (set via `API_PROXY_TARGET`) at the edge, server-side, exactly like the dev proxy — so no code difference between environments, only the env var changes.
- **Express on Vercel runs as serverless functions, not a persistent process** — this affects two things the implementer must handle explicitly:
  - *MongoDB connections*: a new `MongoClient` per cold start would exhaust Atlas connection limits under load. `db/connection.js` must cache the client on a module-level/global variable and reuse it across warm invocations (the standard "connect once, reuse on subsequent invocations" pattern for serverless + MongoDB), rather than opening a fresh connection per request.
  - *Stripe webhook raw body*: `POST /api/webhooks/stripe` needs the unparsed raw request body for signature verification. Vercel's default body handling can interfere with this — the route's function config must disable automatic body parsing (or the Express app must be structured so the raw-body middleware runs before Vercel's parser touches it), verified during Phase 4 build-out.
- Deploying Express to Vercel as a single serverless function wrapping the whole app (one catch-all `vercel.json` route into `apps/api`) is the intended approach — avoids converting every route into its own function while still running on Vercel's platform.

## Data Model (MongoDB, native driver — no Mongoose)

All gym-scoped collections carry `gymId` and are always queried with it in the filter (service functions take `gymId` as a mandatory first argument as a structural safeguard).

- **`users`** — mostly managed by better-auth's Mongo adapter; extended via `additionalFields` with `role: "platformAdmin"|"gymAdmin"|"member"` and `gymId: ObjectId|null`. Index: `{ gymId:1, role:1 }`.
- **`gyms`** — `name, slug (unique), ownerUserId, status: "active"|"suspended", timezone, inviteCode, stripeCustomerId, subscription: { status, planId, stripeSubscriptionId, currentPeriodEnd }`. Indexes: `{slug:1}` unique, `{stripeCustomerId:1}` unique-sparse, `{"subscription.status":1}`.
- **`memberships`** — one per (gym, user): `gymId, userId, planName, status: active|inactive, paymentStatus: paid|unpaid, joinedAt`. Index: `{gymId:1,userId:1}` unique.
- **`classes`** — `gymId, title, instructorName (plain text, no Trainer entity), startTime, endTime, capacity, status: scheduled|canceled, createdBy`. Index: `{gymId:1,startTime:1}`.
- **`bookings`** — `gymId, classId, userId, status: booked|canceled, bookedAt`. Index: `{gymId:1,classId:1,userId:1}` unique (prevents double-booking).
- **`checkins`** — `gymId, userId, classId (nullable), checkedInAt`. Index: `{gymId:1,userId:1,checkedInAt:-1}`.
- **`billingEvents`** — Stripe webhook audit/idempotency log: `gymId, stripeEventId (unique), type, payload, receivedAt`.

Collection creation + `$jsonSchema` validators + indexes are all set up in one migration script (`db/migrations/001-init-collections-and-indexes.js`), run once against Atlas.

## Auth & Authorization (better-auth)

- `auth/betterAuth.js`: better-auth configured with its MongoDB adapter (pointed at the same `MongoClient`/`Db` used elsewhere), `emailAndPassword` provider, `additionalFields` for `role`/`gymId`, `secret`/`baseURL` from env.
- Mounted at `/api/auth/*` in `app.js`, giving sign-up/sign-in/sign-out/get-session/reset-password for free.
- **Sign-up flows:**
  - *Platform Admin*: not self-service — created once via `scripts/seedPlatformAdmin.js`.
  - *Gym Admin*: self-service `/sign-up-gym` → better-auth sign-up → `POST /api/gym-admin/onboarding/create-gym` promotes the user to `gymAdmin` + creates the `gyms` doc → redirected into Stripe Checkout.
  - *Member*: either gym-admin-initiated invite (admin creates the user with a one-time temp password shown on screen — no email sending in MVP) or self-registration at `/join/[inviteCode]`.
- **Middleware chain** applied per route group: `requireAuth` (resolves session → `req.authUser`) → `requireRole([...])` → `scopeToGym` (sets `req.gymId`, 403s on any mismatch between a request's `gymId` and the authenticated user's `gymId` — this is the tenant-isolation guard) → `checkGymSubscriptionActive` (gates gym-admin/member access based on the gym's Stripe subscription status).

## Core API Surface (Express, base path `/api`)

- **Auth** — better-auth-managed (`/api/auth/*`).
- **Platform Admin** (`requireRole(['platformAdmin'])`): `GET /gyms`, `GET /gyms/:gymId`, `PATCH /gyms/:gymId/status` (suspend/reactivate).
- **Gym Admin onboarding**: `POST /gym-admin/onboarding/create-gym`.
- **Gym Admin** (`requireRole(['gymAdmin'])`, `scopeToGym`): profile GET/PATCH, invite-code regenerate, members list/invite/PATCH/DELETE (soft-delete), classes CRUD + cancel, billing checkout-session/portal-session/status.
- **Member** (`requireRole(['member'])`, `scopeToGym`): status, classes list/book/cancel, checkin (general + per-class), checkin history.
- **Webhooks**: `POST /webhooks/stripe` (raw body, signature-verified, no auth middleware).

## Stripe Integration

- Products/Prices for plan tiers created once (Dashboard or `scripts/setupStripePlans.js`), IDs stored in `config/stripePlans.js`.
- One Stripe Customer per gym (`gyms.stripeCustomerId`), created lazily on first checkout.
- Checkout Session for initial subscription purchase; Billing Portal Session for plan changes/cancellation/payment method updates.
- Webhook handlers (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) sync `gyms.subscription`, deduplicated via `billingEvents.stripeEventId` (unique index).
- Access gating: `active`/`trialing` → full access. `past_due` → full access still (avoids punishing members for a gym's billing hiccup) but gym admin sees a persistent banner. `canceled` or gym `status: "suspended"` → gym admin restricted to billing/profile pages only; member booking/checkin endpoints return 403.

## Frontend Notes

- `lib/apiClient.js`: thin `fetch` wrapper (`credentials: 'include'`, JSON in/out, throws on non-2xx).
- Each role's route group (`platform-admin/`, `gym-admin/`, `member/`) has a `layout.js` that checks the session (via the proxied `/api/auth/get-session`) server-side and redirects unauthenticated/wrong-role users.
- Representative page → API mappings: `gym-admin/classes` ↔ classes CRUD; `gym-admin/billing` ↔ billing status + checkout/portal buttons; `member/classes` ↔ list/book/cancel; `member/checkin` ↔ checkin endpoint.

## Build Order

1. **Scaffold** — root workspaces, `create-next-app` for `apps/web` (JS/Tailwind/App Router), manual Express scaffold for `apps/api`. Both boot independently.
2. **MongoDB foundation** — connection singleton (built with the serverless-safe cached-client pattern from day one, since production target is Vercel), `$jsonSchema` validators, migration script creating collections + indexes, run once against the user-provided Atlas URI.
3. **better-auth + platform admin seed** — wire better-auth, middleware chain, seed script; verify session flow end-to-end with a minimal protected page before building real features.
4. **Gym signup + Stripe subscription** — onboarding endpoint, Stripe Products/Prices setup, checkout/portal endpoints, webhook handler (test via `stripe listen --forward-to`), billing page, wire `checkGymSubscriptionActive` middleware early so later routes inherit gating.
5. **Gym admin: members & classes** — roster CRUD, invite flow, class CRUD + cancel-with-cascade, corresponding pages.
6. **Member portal** — status/classes/booking/checkin endpoints and pages; finish invite-code self-join.
7. **Platform admin dashboard** — gym list/detail/suspend, confirm suspension locks out the gym correctly.
8. **Polish** — central error handler, request logging, loading/empty states, README with local dev + Stripe CLI instructions, `vercel.json` + two-project Vercel deployment setup, production env var checklist.

## Future / Out of Scope for MVP

Member→gym real payment processing (Stripe Connect), Trainer role, multi-admin-per-gym, transactional email/notifications, analytics/reporting, OAuth sign-in, class waitlisting.

## Critical Files

- `apps/api/src/auth/betterAuth.js` — auth model roles/gymId depend on this.
- `apps/api/src/middleware/scopeToGym.js` — the tenant-isolation enforcement point.
- `apps/api/src/db/migrations/001-init-collections-and-indexes.js` — collection shapes + indexes.
- `apps/api/src/routes/webhooks/stripe.routes.js` / `apps/api/src/services/stripeService.js` — billing lifecycle that gates access platform-wide.
- `apps/web/next.config.js` (rewrites) / `apps/web/src/lib/apiClient.js` — frontend↔API wiring.

## Verification

- After Phase 3: sign up as a gym admin end-to-end, confirm session cookie round-trips through the Next.js proxy, confirm role/gymId show up in `get-session`.
- After Phase 4: use the Stripe CLI (`stripe trigger checkout.session.completed`, etc.) to confirm webhook handlers correctly update `gyms.subscription` and that `billingEvents` prevents duplicate processing on redelivery.
- After Phase 5/6: manually exercise the full member journey (join via invite code → view status → book a class → check in) and confirm a second gym's data never appears (create a second gym and verify cross-tenant queries return nothing).
- After Phase 7: suspend a gym as platform admin and confirm its gym admin/members are locked out immediately.
