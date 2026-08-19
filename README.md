# BoothP - Artist Booth Manager

A mobile app for artists to manage their booth business at conventions. Track inventory, process sales, manage events, and monitor finances all in one place.

Built with **React Native + Expo (SDK 54)**. Local-only — all data lives in an on-device SQLite database, no backend or account required.

## Features

- **Dashboard** - Financial summaries and overview of your booth business
- **Inventory** - Track products, stock levels, categories, and item images
- **Point of Sale** - Process sales at conventions and automatically update inventory
- **Events** - Manage conventions/events, track event-specific expenses and revenue
- **Finance** - Detailed breakdowns with charts, filters, and transaction history

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Run it

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start
```

Press `a` for Android, `i` for iOS, or `w` for web.

## Project Structure

```
├── src/
│   ├── screens/          # Top-level screen components
│   ├── components/       # Reusable UI (pos/, event/, inventory/, finance/)
│   ├── navigation/       # Navigator definitions (tabs, stacks)
│   ├── context/          # Global state (AppContext, ThemeContext)
│   ├── services/         # SQLite database + repositories
│   └── constants/        # Theme tokens and shared enums (categories)
├── archive/backend/      # Old Spring Boot API, kept for reference only, not run
├── assets/               # App icons and splash screen
└── plans/                # Design and planning documents
```

## Tech Stack

- React Native 0.81 (New Architecture enabled)
- Expo SDK 54
- React Navigation (bottom tabs + native stacks)
- expo-sqlite for local persistence
- react-native-chart-kit / react-native-svg for charts
- expo-image-picker for item photos

## License

Licensed under the [PolyForm Noncommercial 1.0.0](./LICENSE). You're free to use, modify, and share this software for any noncommercial purpose. Commercial use is not permitted.
