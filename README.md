# Spendt

Fast, minimalist personal finance tracking. Log expenses and income, watch monthly budgets, and review spending insights — all stored locally in your browser or on-device.

**Live demo:** [praneth2580.github.io/SpendIt](https://praneth2580.github.io/SpendIt)

## Features

- **Dashboard** — net worth, monthly budget progress, category breakdown, recent transactions
- **Transactions** — searchable history of income and expenses
- **Insights** — monthly income, net savings, spending vs. last month, top categories
- **Quick add** — fast expense/income entry; supports PWA shortcuts and share-target prefill
- **Categories & accounts** — manage budgets, icons, and balances from Settings
- **Themes** — dark, light, or system preference
- **PWA** — installable, offline-capable, auto-updating service worker
- **Android (native)** — optional UPI/bank SMS auto-import with configurable extraction rules (confirm or auto-apply)

## Tech stack

| Layer | Tools |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS, Lucide icons |
| Build | Vite 8, `vite-plugin-pwa` |
| State | Redux Toolkit |
| Storage | IndexedDB via `idb` (no backend required) |
| Mobile | Capacitor 8 (Android & iOS) |
| Native Android | Custom `UpiSms` Capacitor plugin for SMS parsing |

## Requirements

- **Node.js** ≥ 20 for web development (`package.json`); **Node 22** recommended for Capacitor CLI (see `.nvmrc`)
- **Android SDK** — only if building/running the Android app (`ANDROID_HOME` or `~/Android/Sdk`)

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

### Production build

```bash
npm run build
npm run preview   # serve dist/ locally
```

### Lint

```bash
npm run lint
```

## Deploy to GitHub Pages

The app is published under the `SpendIt` repo name with a subpath base:

```bash
npm run deploy
```

This runs `build:ghpages`, prepares assets, and pushes `dist/` to the `gh-pages` branch. The homepage is configured in `package.json` as `https://praneth2580.github.io/SpendIt`.

## Native apps (Capacitor)

Sync the web build into native projects:

```bash
npm run cap:sync
```

### Android

Optional: copy `.env.capacitor.example` to `.env.capacitor.local` and set `ANDROID_HOME` if it is not auto-detected.

```bash
npm run cap:android          # build + run on device/emulator
npm run cap:android:apk      # debug APK in android/app/build/outputs/apk/debug/
npm run cap:android:install  # install existing APK
npm run cap:android:devices  # list adb devices
```

Capacitor scripts use `scripts/cap.sh`, which switches to Node 22 via nvm when needed.

### iOS

```bash
npm run cap:ios
```

Requires Xcode and CocoaPods on macOS.

### SMS import (Android only)

In **Settings**, enable SMS auto-import and grant the SMS permission. Parsed messages can open a confirmation sheet or save automatically, depending on import mode. Customize parsing in **Settings → Extraction rules** (sender/body patterns, default category/account, note templates).

## Project structure

```
src/
  pages/           # Dashboard, Transactions, Stats, Settings, Quick add
  components/      # Layout, nav, forms, finance cards, PWA banner
  store/           # Redux slice and types
  lib/             # IndexedDB, aggregates, theme, UPI/SMS helpers
  hooks/           # Theme, native back button, UPI SMS listener
  plugins/upi-sms/ # Capacitor plugin (web stub + native bridge)
android/           # Capacitor Android project + UpiSms Java plugin
scripts/           # cap.sh, android-cli.sh, prepare-gh-pages.mjs
stitch_screens/    # Design references (HTML/PNG)
```

## Routes

| Path | Screen |
| --- | --- |
| `/` | Dashboard |
| `/transactions` | Transaction list |
| `/stats` | Insights |
| `/add`, `/add-expense` | Quick add sheet |
| `/settings` | Preferences, categories, accounts |
| `/settings/extraction-rules` | SMS parsing rules (Android) |

## Data & privacy

All financial data lives in **IndexedDB** on the device. Nothing is sent to a server by default. Clearing app data in Settings wipes the local database and re-seeds demo content.

## License

Private project — see repository owner for usage terms.
