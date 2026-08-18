# Future Plans

Longer-horizon direction decisions, dated as discussed. Distinct from `FUTURE_FRONTEND.md` (mobile polish/feature ideas) — this tracks platform/architecture direction.

---

## 2026-08-18 — Web app for detailed data, phone stays the register

### Idea
Expand beyond the single mobile app: one phone continues to act as the actual cash register (the only device that records sales), and a separate web app gives access to more detailed data/info — dashboards, finance, inventory, event history — for viewing (and possibly managing) from a browser.

### Why this fits without adopting a new backend platform
The Spring Boot backend already exposes a JWT-authenticated REST API (`SaleController`, `InventoryController`, etc.) — a web app is just a second frontend consuming those same endpoints. No backend rewrite needed for this shape.

### Key constraint to design around
Phone-as-register means sales writes stay single-device, which avoids a multi-device write-conflict problem for stock decrement — that's the hard part the current local-first sync engine already handles for one writer. The open question is whether the web app is:
- **Read-only / reporting** — no conflict risk, can ship first, no changes needed to the sync engine's assumptions.
- **Read + write** (e.g. editing inventory or events from the browser) — introduces a second writer touching rows the phone also owns offline; the current sync engine assumes the phone is the single source of truth while offline, so this would need real conflict-handling design before allowing writes from web.

**Decision so far**: not yet decided whether web app writes are in scope — start with reporting/read-only, revisit write access once that's live.

### Suggested next step (not started)
Scope a v1 as read-only: dashboard, finance, inventory, event history views in a web app hitting existing API endpoints, no new backend endpoints required beyond what mobile already uses. Defer write access until the conflict question above is resolved.

---

## 2026-08-18 — Should we adopt a framework instead of building the web app (and future features) from scratch?

### Question raised
Medusa.js was evaluated as an option (see chat discussion / POS review) — it's a full headless commerce platform (own backend, own Postgres schema, own Product/Inventory/Sales-Channel modules) meant for multi-location retail chains needing shared inventory and admin tooling across channels. Verdict: **not adopted** — it would mean replacing or duplicating the Spring Boot backend and domain model that's already built and working for the single-vendor booth use case. Full reasoning in chat; not repeated here since Medusa doesn't apply to this project's shape.

### Is building the web app "from scratch" too much?
No — the expensive part of a commerce system (auth, domain model, business logic, offline sync) is already built and lives in the Spring Boot backend. The web app is comparatively thin: it's a UI layer rendering data from endpoints that already exist. This isn't "starting from zero."

### Framework options considered for the web app specifically
- **Plain React/Next.js, hand-built** — full control over design/branding to match the mobile app's theme (`src/constants/theme.js` equivalent for web), reuses nothing structurally new to learn, but every table/filter/chart view is built by hand.
- **Admin-panel generators on top of an existing REST API** (e.g. `react-admin`, AdminJS) — scaffold CRUD/table/filter views quickly against endpoints that already exist, much less code for "detailed data" browsing screens; tradeoff is less design control and another library's conventions to learn, but scoped to just the web app, not a backend replacement.
- **Low-code internal tools** (Retool, Appsmith) — fastest to stand up read-only dashboards pointed at the existing API, but doesn't produce owned/customizable source code and adds a third-party dependency for something customer-facing-adjacent.

**Leaning**: since the web app scope discussed is read-only reporting first, `react-admin`/AdminJS-style scaffolding is worth prototyping against the existing endpoints before committing to a full hand-built Next.js app — it could validate the "detailed data in browser" idea fast without a large frontend build. Full custom Next.js remains the fallback if the generated UI feels too generic once tried.

**Decision so far**: not yet decided — flagged as worth a quick prototype comparison before starting the web app for real.
