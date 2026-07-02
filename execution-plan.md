# Execution Plan — Fitness Gym SaaS MVP

Companion to `plan.md` (architecture/design source of truth — don't duplicate decisions here, just execute them). Each task below is small enough to do in one sitting and has a concrete validation step. Check the box only after validation passes, not just after writing code.

## How to use this file

1. Do the **Foundation** phase in order, top to bottom — every later track depends on it.
2. Once Foundation is fully checked off, **Tracks A/B/C/D run in parallel** — see [Parallelization](#parallelization) below for how to split them (across sessions, agents, or just your own context-switching).
3. Do **Integration & Polish** last, after all four tracks are checked off.
4. When you check a box, also jot the date/commit if useful: `- [x] F6 (2026-07-02, a1b2c3d)`.

---

## Foundation (sequential — do not parallelize)

- [x] **F1. Root workspace scaffold** (2026-07-01)
  Create root `package.json` (npm workspaces: `["apps/*","packages/*"]`), `.gitignore`, `.env.example`.
  *Validate:* `npm install` at repo root completes with no errors; `apps/`, `packages/` resolve as workspaces (`npm ls --workspaces` lists them once F3/F4 exist).

- [x] **F2. `packages/shared`** (2026-07-01)
  `src/roles.js` (role enum), `src/constants.js` (status enums: subscription status, membership status, booking status, etc.).
  *Validate:* a throwaway `node -e "require('./packages/shared/src/roles.js')"` resolves without error.

- [x] **F3. Scaffold `apps/web`** (pre-existing, confirmed 2026-07-02)
  `create-next-app` with JS, Tailwind, App Router.
  *Validate:* `npm run dev` in `apps/web` serves the default page at `localhost:3000`.

- [x] **F4. Scaffold `apps/api`** (2026-07-01)
  Minimal `app.js`/`server.js` with one `GET /api/health` route.
  *Validate:* `node src/server.js` boots; `curl localhost:4000/api/health` returns 200.

- [x] **F5. Next.js → Express proxy** (2026-07-01)
  `next.config.js` `rewrites()` forwarding `/api/*` to `API_PROXY_TARGET`.
  *Validate:* with both dev servers running, `curl localhost:3000/api/health` returns the same response as F4 (proxied, not a Next.js 404).

- [x] **F6. Mongo connection singleton** (2026-07-02)
  `db/connection.js`, cached-client pattern from day one.
  *Validate:* a throwaway script imports it, connects using the real `MONGODB_URI`, prints the resolved db name.

- [x] **F7. Validators + migration script** (2026-07-02)
  All 7 `db/validators/*.schema.js` files, `db/migrations/001-init-collections-and-indexes.js`.
  *Validate:* run the migration against Atlas; confirm via `mongosh`/Compass that all 7 collections exist with the indexes listed in `plan.md`'s Data Model section.

- [x] **F8. better-auth wiring** (2026-07-02)
  `auth/betterAuth.js` (Mongo adapter, `additionalFields` for `role`/`gymId`), mounted at `/api/auth/*`.
  *Validate:* `POST /api/auth/sign-up/email` creates a document in `users` with the expected shape.

- [x] **F9. `scripts/seedPlatformAdmin.js`** (2026-07-02)
  *Validate:* run it once; confirm a `users` doc with `role: "platformAdmin"` exists and can sign in via `/api/auth/sign-in/email`.

- [x] **F10. Middleware chain** (2026-07-02)
  `requireAuth`, `requireRole`, `scopeToGym`, `checkGymSubscriptionActive` (stub: always passes for now), `errorHandler`. Wire on one throwaway route, e.g. `GET /api/_debug/whoami`.
  *Validate:* no cookie → 401; platform-admin session cookie → 200 with `req.authUser` echoed back.

- [x] **F11. End-to-end session smoke test** (2026-07-02)
  Minimal `platform-admin` layout in `apps/web` that checks session server-side and redirects on failure.
  *Validate (matches `plan.md`'s Phase-3 verification):* sign in as platform admin in the browser, confirm the cookie round-trips through the Next.js proxy, confirm `role`/`gymId` show up correctly.

Remove the `/api/_debug/whoami` route once F11 passes.

---

## Track A — Gym Signup & Stripe Billing

- [ ] **A1.** `scripts/setupStripePlans.js` + `config/stripePlans.js`. *Validate:* run in Stripe test mode, confirm Products/Prices created, IDs recorded in config.
- [ ] **A2.** `services/gymService.js` (create/get/update-status). *Validate:* manual call creates a well-formed `gyms` doc.
- [ ] **A3.** `POST /gym-admin/onboarding/create-gym`. *Validate:* sign up a user, call onboarding, confirm promotion to `gymAdmin` + `gyms` doc created with correct `ownerUserId`.
- [ ] **A4.** `services/stripeService.js` (createCustomer, createCheckoutSession, createPortalSession).
- [ ] **A5.** Billing routes: checkout-session, portal-session, status. *Validate:* checkout-session endpoint returns a real Stripe test-mode Checkout URL.
- [ ] **A6.** Webhook route (`webhooks/stripe.routes.js`) + `billingEvents` idempotency. *Validate:* `stripe listen --forward-to localhost:4000/api/webhooks/stripe`, trigger `checkout.session.completed`, confirm `gyms.subscription` updates; re-send the same event and confirm it's a no-op (unique index on `stripeEventId`).
- [ ] **A7.** Real `checkGymSubscriptionActive` (replace F10 stub) + access-gating rules from `plan.md`. *Validate:* manually set a gym's `subscription.status` to `canceled`, confirm gym admin restricted to billing/profile, member endpoints return 403.
- [ ] **A8.** Frontend: `/sign-up-gym`, `gym-admin/billing`. *Validate:* full browser flow — sign up → Stripe Checkout (test card `4242 4242 4242 4242`) → redirected back → billing page shows active status.

## Track B — Gym Admin: Members & Classes

- [ ] **B1.** `services/membershipService.js`.
- [ ] **B2.** Members routes: list/invite/PATCH/DELETE (soft-delete). *Validate:* as gym admin, invite a member (temp password shown on screen), list shows it, PATCH toggles `paymentStatus`, DELETE soft-deletes (excluded from active roster, still in DB).
- [ ] **B3.** `services/classService.js`.
- [ ] **B4.** Classes routes: CRUD + cancel. *Validate:* create/edit/cancel a class as gym admin; capacity field enforced at the data layer.
- [ ] **B5.** Frontend: `gym-admin/members`, `gym-admin/members/invite`.
- [ ] **B6.** Frontend: `gym-admin/classes`, `gym-admin/classes/[classId]`. *Validate:* browser walkthrough — invite a member, schedule a class, edit it, cancel it.

## Track C — Member Portal

> B3/B4 (classes collection + routes) should land before C's final browser validation, since booking needs real classes to book. The backend (C1–C4) can be built in parallel against a class doc seeded directly in Mongo.

- [ ] **C1.** `services/bookingService.js` (double-booking prevented via unique index on `bookings`).
- [ ] **C2.** `services/checkinService.js`.
- [ ] **C3.** Member routes: status, classes list/book/cancel.
- [ ] **C4.** Member routes: checkin (general + per-class), checkin history. *Validate:* using a manually-seeded class doc, confirm a member user can list/book/cancel via API calls (curl/Postman is fine here).
- [ ] **C5.** Frontend: `member/classes` (browse/book/cancel).
- [ ] **C6.** Frontend: `member/checkin`.
- [ ] **C7.** `/join/[inviteCode]` self-registration page + route. *Validate (matches `plan.md`'s Phase 5/6 verification):* full member journey — join via invite code → view status → book a class → check in.

## Track D — Platform Admin Dashboard

> Fully independent of A/B/C — only needs Foundation. Good candidate to build first among the parallel tracks, or hand to a separate session/agent.

- [ ] **D1.** Platform admin routes: `GET /gyms`, `GET /gyms/:gymId`, `PATCH /gyms/:gymId/status`.
- [ ] **D2.** Frontend: `platform-admin` (gyms list, `gyms/[gymId]` detail). *Validate:* as platform admin, view the gyms list, suspend a gym, confirm that gym's admin is locked out of everything except billing/profile immediately (needs at least one gym from Track A to fully validate — use a manually-inserted `gyms` doc if Track A isn't done yet).

---

## Integration & Polish (sequential, after all four tracks are checked off)

- [ ] **I1.** Confirm every route funnels errors through `errorHandler` (no unhandled rejections).
- [ ] **I2.** Request logging middleware (e.g. morgan/pino).
- [ ] **I3.** Loading/empty states audit across all pages.
- [ ] **I4.** Cross-tenant isolation test (matches `plan.md`'s explicit verification): create two gyms with data in every collection, confirm gym A's session never sees gym B's data via any endpoint.
- [ ] **I5.** README: local dev setup, env vars, Stripe CLI instructions.
- [ ] **I6.** `vercel.json` for `apps/api` (single-function catch-all) + two-project Vercel deployment wiring.
- [ ] **I7.** Finalize `.env.example` / production env var checklist for both projects.
- [ ] **I8.** Full three-role smoke test in a deployed (or deploy-like) environment.

---

## Parallelization

Once **Foundation** is fully checked off, Tracks **A, B, D** have no dependencies on each other and can run at the same time — e.g. three parallel `Agent` calls with `isolation: "worktree"`, or three terminal sessions you context-switch between. Track **C**'s backend (C1–C4) can start in parallel too; just hold its final browser validation (C7) until B4 is done.

Suggested split for max parallelism:

```
Foundation (F1 → F11)                     [sequential, one owner]
        │
        ├── Track A (A1 → A8)             [owner 1]
        ├── Track B (B1 → B6)             [owner 2]
        ├── Track D (D1 → D2)             [owner 3, can start immediately]
        └── Track C backend (C1 → C4)     [owner 4, seed test data manually]
                    │
                    └── Track C frontend + C7 [same owner, after B4 lands]
        │
Integration & Polish (I1 → I8)            [sequential, one owner, after all tracks merge]
```

If you're driving this solo through Claude Code, a practical pattern is: finish Foundation yourself in the main session, then launch separate `Agent` calls (fresh, not forks — each track needs no memory of the others) for Tracks A/B/D with `isolation: "worktree"` so they don't collide on the same files, merging each back once its validation step passes.
