# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role

You are a software engineer working on this codebase. Any code changes must be done with best practices in mind: sound OOP/component design, code maintainability, and readability. Prefer clear structure and separation of concerns over quick hacks, even under time pressure.

## Commands

```bash
npx expo start          # Start dev server (press a for Android, i for iOS, w for web)
npx expo start -c       # Start with cleared cache (needed after .env changes)

cd backend && ./mvnw spring-boot:run   # Run backend locally (needs local Postgres)
cd backend && ./mvnw package -DskipTests   # Build backend jar
```

No test runner or linter is configured.

## Deployment

- **API**: https://boothp.onrender.com (Render free tier, Docker, root dir `backend`; sleeps after ~15 idle min)
- **DB**: Supabase Postgres via the session pooler (port 5432 — direct connection is IPv6-only and unreachable from Render)
- Backend secrets come from Render env vars (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_SECRET`); `application.properties` holds local-dev fallbacks only
- The app reads `EXPO_PUBLIC_API_URL` from `.env` (gitignored), falling back to a LAN IP in `src/config/api.js` for local dev
- See `plans/PROJECT_STATUS.md` for current status and remaining beta work

## Architecture

This is a React Native + Expo (SDK 54) app for managing an artist booth business at conventions, backed by a Spring Boot 4 / Java 17 API in `backend/` with Postgres. The app uses the New Architecture (`newArchEnabled: true`). All frontend source is plain JavaScript (no TypeScript).

### State Management

App state lives in a `useReducer` in `src/context/AppContext.js`, exposed via `AppStateProvider` and the `useAppState()` hook. Additional contexts: `AuthContext` (JWT auth, token in expo-secure-store), `ConnectivityContext` (online/offline detection), `ThemeContext` (dark mode).

Data is **local-first**: everything is persisted in SQLite (`src/services/database.js`, repositories in `src/services/repositories/`), writes work offline via a sync queue, and `src/services/syncEngine.js` pushes queued changes (create/update/delete) to the backend on reconnect and on app foreground. When online, data also loads from the API (`src/config/api.js` for the base URL). The dashboard is fetched from the API online and computed locally from SQLite offline.

### Navigation

Bottom tab navigator (`TabNavigator.js`) with five tabs: Home, Inventory, POS, Events, More.

- **HomeStack**: Dashboard -> Finance (native stack)
- **MoreStack**: MoreMenu -> Finance, Settings, About (native stack)
- Inventory, POS, and Events are standalone screens (no nested stack)

Finance screen is reachable from both HomeStack and MoreStack.

### Theming

All colors, sizes, and shadows are centralized in `src/constants/theme.js` (`COLORS`, `SIZES`, `CARD_SHADOW`). No UI component library is used — all components are custom-styled with `StyleSheet.create`. Use these constants instead of hardcoding values.

### Data Flow

- **Income**: POS sales (`ADD_SALE`) — records items sold and decrements inventory stock
- **Expenses**: Event expenses (`ADD_EVENT_EXPENSE`) and inventory restocking costs
- **Dashboard**: Aggregates sales and event expenses to show financial summaries
- **Finance screen**: Detailed breakdown with charts, filters, and transaction history

### File Organization

- `src/screens/` — top-level screen components (incl. Login/SignUp, EventDetail)
- `src/components/` — reusable UI, organized by feature (`pos/`, `event/`, `inventory/`, `finance/`)
- `src/navigation/` — navigator definitions
- `src/context/` — providers: AppContext, AuthContext, ConnectivityContext, ThemeContext
- `src/services/` — SQLite database, repositories, sync engine, connectivity, images
- `src/config/` — API base URL
- `src/constants/` — theme tokens
- `src/data/` — category constants (mock data no longer the data source)
- `plans/` — design and planning documents for each feature area
- `backend/` — Spring Boot API (controllers, services, entities, JWT config); its own `plans/` docs
