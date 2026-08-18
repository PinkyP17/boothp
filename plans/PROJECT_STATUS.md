# Artist Booth Manager — Project Status

_Last updated: 2026-08-10. Goal: beta test at end of August 2026._

## Where we are

All core features are complete and the backend is **deployed to production**.
The remaining work for beta is distribution (EAS build) and an end-to-end
device test — not app features.

## Completed

### Frontend (all screens done)
- **Dashboard** — financial summary cards, upcoming events, recent transactions
- **Inventory** — CRUD + restock with cost tracking, images, search/filter
- **POS** — cart, price override, discounts, cash/QR payment, decrements stock
- **Events** — timeline, per-event expenses, per-event currency, event detail screen
- **Finance** — charts, income/expense filters, transaction history with payment pills
- **Auth** — login / signup wired to backend JWT
- **More** — Settings, About
- Dark theme (ThemeContext), toasts, loading states, pull-to-refresh

### Backend (Spring Boot 4 / Java 17, in `backend/`)
- JWT auth, inventory / events / sales / restock / dashboard APIs
- Postgres via JPA, global exception handling, validation

### Offline mode (Phase 9 + 13a-c, complete)
- SQLite local-first storage, sync queue with create/update/delete
- Auto-sync on reconnect and on app foreground
- Dashboard computed locally from SQLite when offline

### Deployment (done 2026-08-10)
- **API**: https://boothp.onrender.com — Render free tier, Docker runtime,
  root directory `backend`. Sleeps after ~15 idle min (~1 min cold start).
- **DB**: Supabase Postgres, connected via **session pooler, port 5432**
  (direct connection is IPv6-only — unreachable from Render; transaction
  pooler 6543 breaks JDBC).
- Secrets are Render env vars: `DATABASE_URL`, `DATABASE_USERNAME`,
  `DATABASE_PASSWORD`, `JWT_SECRET`. Values in `application.properties`
  are local-dev fallbacks only.
- Frontend reads `EXPO_PUBLIC_API_URL` from `.env` (gitignored);
  falls back to LAN IP in `src/config/api.js` for local dev.
- Gotcha hit during deploy: Hibernate `ddl-auto=update` silently failed to
  create the `users` table on first boot — created manually in Supabase SQL
  Editor. Other schema changes self-heal on restart.
- Smoke-tested: signup, login, inventory, dashboard all return correct
  responses. Test account: smoketest@example.com / test1234.

## Remaining for beta

1. **EAS build** (next up) — install/configure EAS CLI, produce Android APK
   for testers. Needs a free expo.dev account.
2. **Device test** — full convention simulation on a real phone against the
   live backend, including airplane-mode → reconnect sync cycle.
3. **Tester onboarding** — share APK link, note the free-tier cold start
   (first request of the day can take ~1 min).

## Post-beta / future
- Rotate Supabase DB password (was shared in dev chat during setup)
- Data export (CSV/PDF), multi-image per item, notifications
- Silence Spring's in-memory UserDetailsService fallback noise in logs
- Tests + linting (none configured yet)
