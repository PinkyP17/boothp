# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role

You are a software engineer working on this codebase. Any code changes must be done with best practices in mind: sound OOP/component design, code maintainability, and readability. Prefer clear structure and separation of concerns over quick hacks, even under time pressure. See `DESIGN.md` for the design principles and layering rules this project follows — read it alongside this file, not instead of it.

## Commands

```bash
npx expo start          # Start dev server (press a for Android, i for iOS, w for web)
npx expo start -c       # Start with cleared cache
```

No test runner or linter is configured.

## Architecture

This is a **local-only** React Native + Expo (SDK 54) app for managing an artist booth business at conventions. There is no backend, no auth, and no network sync — everything lives in a local SQLite database on-device. The app uses the New Architecture (`newArchEnabled: true`). All frontend source is plain JavaScript (no TypeScript).

A previous version of this app had a Spring Boot backend, JWT auth, and an offline-sync queue. That was removed in `plans/15_LOCAL_ONLY_MIGRATION.md` (2026-08-19) in favor of single-device, single-user local storage. The old backend is kept for reference only, untracked and gitignored, at `archive/backend/` — it is not part of the running app and should not be treated as live architecture.

### State Management

App state lives in a `useReducer` in `src/context/AppContext.js`, exposed via `AppStateProvider` and the `useAppState()` hook. `ThemeContext` is the only other context (dark mode).

Data is local-first and local-*only*: everything is persisted directly in SQLite (`src/services/database.js`, repositories in `src/services/repositories/`). Every context action follows the same shape — read/write SQLite synchronously (via `expo-sqlite`'s sync API), then dispatch to update in-memory state. Actions are synchronous, not async — there's no network in the loop, so don't reintroduce `await`/`async` at call sites. See `DESIGN.md`'s "Action contract" section for the full rule set (return shape, error handling).

### Navigation

Bottom tab navigator (`TabNavigator.js`) with five tabs: Home, Inventory, POS, Events, More.

- **HomeStack**: Dashboard -> Finance (native stack)
- **MoreStack**: MoreMenu -> Finance, Settings, About (native stack)
- Inventory, POS, and Events are standalone screens (no nested stack)

Finance screen is reachable from both HomeStack and MoreStack. There is no login/auth flow — the app opens straight to `TabNavigator`.

### Theming

All colors, sizes, and shadows are centralized in `src/constants/theme.js` (`COLORS`, `SIZES`, `CARD_SHADOW`). No UI component library is used — all components are custom-styled with `StyleSheet.create`. Use these constants instead of hardcoding values.

### Data Flow

- **Income**: POS sales (`ADD_SALE`) — records items sold and decrements inventory stock
- **Expenses**: Event expenses (`ADD_EVENT_EXPENSE`) and inventory restocking costs
- **Dashboard**: Computed locally from SQLite (`computeDashboard()` in `AppContext.js`) — aggregates sales, event expenses, and restocks
- **Finance screen**: Detailed breakdown with charts, filters, and transaction history

### File Organization

- `src/screens/` — top-level screen components (Dashboard, Inventory, POS, Events, EventDetail, Finance, More, Settings, About)
- `src/components/` — reusable UI, organized by feature (`pos/`, `event/`, `inventory/`, `finance/`)
- `src/navigation/` — navigator definitions
- `src/context/` — providers: `AppContext` (app state + all data actions), `ThemeContext`
- `src/services/` — SQLite database (`database.js`) and repositories (`repositories/`), plus `imageService.js`
- `src/constants/` — theme tokens (`theme.js`) and shared enums (`categories.js`)
- `plans/` — design and planning documents for each feature area
- `archive/backend/` — old Spring Boot API, kept for reference, not part of the running app

## Known issues / in-progress cleanup

Tracked in `DESIGN.md`'s "Open questions" and the review notes below `plans/15_LOCAL_ONLY_MIGRATION.md`. Notably: `database.js` and the repositories still carry a vestigial `local_id` dual-key scheme left over from the old sync-with-server design, which is now dead weight now that there's no server to reconcile against — don't extend that pattern in new code.
