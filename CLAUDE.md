# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start dev server (press a for Android, i for iOS, w for web)
npx expo start --android
npx expo start --ios
npx expo start --web
```

No test runner or linter is configured.

## Architecture

This is a React Native + Expo (SDK 54) app for managing an artist booth business at conventions. It uses the New Architecture (`newArchEnabled: true`). All source code is plain JavaScript (no TypeScript).

### State Management

All app state lives in a single `useReducer` in `src/context/AppContext.js`, exposed via `AppStateProvider` and the `useAppState()` hook. The state shape has three top-level keys: `inventory`, `sales`, and `events`. Data currently comes from mock data in `src/data/mockData.js` — there is no backend yet.

Reducer action types: `ADD_TO_INVENTORY`, `UPDATE_INVENTORY_ITEM`, `RESTOCK_ITEM`, `ADD_SALE`, `ADD_EVENT`, `UPDATE_EVENT`, `ADD_EVENT_EXPENSE`, `DELETE_EVENT_EXPENSE`.

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

- `src/screens/` — top-level screen components
- `src/components/` — reusable UI, organized by feature (`pos/`, `event/`, `inventory/`, `finance/`)
- `src/navigation/` — navigator definitions
- `src/context/` — global state provider
- `src/constants/` — theme tokens
- `src/data/` — mock data and category constants
- `plans/` — design and planning documents for each feature area
