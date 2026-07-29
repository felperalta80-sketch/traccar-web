# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is **traccar-web-ubimax** — a customized fork of the Traccar web interface ([traccar.org](https://www.traccar.org)) rebranded and redesigned for UbimaxGPS. It is a React 19 SPA built with Vite. It proxies its API calls to `https://rastreo.ubimaxgps.com` in development and is also packaged as an Android app via Capacitor.

## Commands

All commands run from `traccar-web-ubimax/`:

```bash
npm start          # Dev server on :3000 (proxies /api → rastreo.ubimaxgps.com)
npm run build      # Production build → build/
npm run lint       # ESLint (zero warnings tolerance)
npm run lint:fix   # ESLint with auto-fix
```

No test suite exists — verify changes by running the app.

## Architecture

### Layers

```
Navigation.jsx          ← React Router tree (all routes, lazy-loaded)
  App.jsx               ← Authenticated shell: persistent map, BottomMenu, outlets
    main/MainPage.jsx   ← / : device list + map panel
    reports/            ← /reports/* : report pages
    settings/           ← /settings/* : config pages
    other/              ← replay, geofences, stream, etc.
    login/              ← unauthenticated pages
```

**Controllers** (renderless components mounted in `App`):
- `SocketController` — WebSocket to `/api/socket`; pushes device/position/event updates to Redux.
- `CachingController` — pre-fetches reference data (geofences, groups, drivers…) after login.
- `UpdateController` — polls for server-side updates.
- `MotionController` — drives motion state in Redux from position stream.

### State management

Redux Toolkit store (`src/store/`). Each slice mirrors a Traccar resource:

| Slice | Purpose |
|---|---|
| `session` | Server config + authenticated user |
| `devices` | Device list, selection, panel open state |
| `positions` | Latest position per device |
| `events` | Event queue for drawer |
| `geofences / groups / drivers / maintenances / calendars` | Reference data |

A `throttleMiddleware` rate-limits high-frequency position updates.

### Map

`src/map/` wraps **MapLibre GL**. Key pattern: each `Map*` component calls `useEffect` to add/remove a MapLibre layer or source and renders nothing to the DOM. `MapView` (`src/map/core/MapView.jsx`) is the single MapLibre instance; it is singleton — never mount two at once. The persistent map in `App` is shared across "shell" routes (`/`, `/reports`, `/settings`, `/account`); routes with their own map (replay, geofences) must not be shell routes.

### Theme — Ubimax design system

`src/common/theme/` defines the MUI theme:

- **Fonts**: Lato (headings, `theme.fonts.head`) · Noto Sans (body/UI, `theme.fonts.body`)
- **Brand ink**: `#1C2536` — exported as `INK` from `palette.js` and as `theme.palette.ink.main`. Use `alpha(theme.palette.ink.main, α)` for transparent variants, **never** raw `rgba(28,37,54,α)`.
- **Primary color**: server-configurable via `server.attributes.colorPrimary`; falls back to indigo.
- **Border radius**: card tiles = `9`, dialogs/sheets = `16`, pills = `999`. `theme.shape.borderRadius` = 8 (MUI default override).
- **Dimensions**: fixed widths/heights live in `theme.dimensions` (e.g. `drawerWidthDesktop: '360px'`).
- **Off-white background**: `#F0F0F0` used for BottomMenu and neutral surfaces in light mode.

### Routing and layout patterns

- `ModuleMenuLayout` — panel layout for module index pages (Settings, Reports, Account). On desktop it floats fixed over the map as a card; on mobile it takes full height.
- `MenuItem` / `MenuSection` — module list items: 34×34 tile + title (Lato bold) + subtitle. Used in Settings, Reports, Account lists.
- `BottomMenu` — 5-tab navigation (Map / List / Reports / Settings / Account). Appears floating on desktop shell routes or docked at bottom on mobile.
- `PageLayout` — used for detail/edit pages (has Back button, title, optional menu).

### Desktop vs mobile split

The breakpoint is `md` (≥ 900 px). On desktop:
- The map is **persistent** (fixed, `zIndex: 0`), panels float above it as cards.
- `BottomMenu` floats bottom-left with `boxShadow` and rounded corners.
- Module panels are fixed 360 px wide cards.

On mobile:
- Each route renders its own full-screen content.
- `BottomMenu` is a docked bottom bar.

### API integration

All API calls hit `/api/*`, which dev proxies to the Traccar backend. Use `fetchOrThrow` (`src/common/util/fetchOrThrow.js`) instead of raw `fetch` for requests that should throw on non-OK responses. The session cookie is the auth mechanism.

### Android / Capacitor

`capacitor.config.ts` points to a local dev server for live reload. The compiled web app (`build/`) is the Capacitor web dir. `NativeInterface.js` bridges native notifications and login token generation.

## Localization

Translations live in `src/resources/l10n/` and are synced via Transifex (see `.github/workflows/translation.yml`). Use the `useTranslation()` hook from `LocalizationProvider` to get the `t(key)` function — never hard-code user-visible strings. Language can be set via the `?locale=xx` query param.

## CI

Two GitHub Actions workflows run on push/PR to `master`:
- `build.yml` — `npm ci && npm run build`
- `lint.yml` — `npm ci && npm run lint`

The lint workflow enforces zero warnings (`--max-warnings 0`). Fix lint before pushing.

## Design reference docs

- `docs/estilo-ubimax.md` — full visual design system: tokens (actual vs. canonical), typography, spacing, shadows, breakpoints, card anatomy.
- `docs/estilo-ubimax-listas.md` — list/menu item styling specifics.
- `AUDITORIA-INCONSISTENCIAS-UBIMAX.md` — audit of current inconsistencies with file paths and line numbers (severity ranked 🔴🟠🟡).

## Key files

| File | Role |
|---|---|
| `src/common/theme/palette.js` | Brand colors + `INK` token |
| `src/common/theme/dimensions.js` | Layout size constants |
| `src/common/theme/components.js` | MUI component overrides |
| `src/common/components/MenuItem.jsx` | Module list item + `MenuSection` |
| `src/common/components/ModuleMenuLayout.jsx` | Module index panel wrapper |
| `src/common/components/BottomMenu.jsx` | 5-tab bottom navigation |
| `src/map/core/MapView.jsx` | Singleton MapLibre instance |
| `src/reactHelper.js` | `useCatch`, `useCatchCallback`, `useAsyncTask` hooks |
| `src/store/index.js` | Redux store assembly |
| `vite.config.js` | Dev proxy, PWA config, RTL text plugin |
