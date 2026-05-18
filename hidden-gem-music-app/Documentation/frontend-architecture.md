# Frontend Architecture

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Current Working Frontend Architecture

---

## Purpose

This document explains how the current `hidden-gem-music-app` frontend is structured and which files own the major parts of the app.

## High-level architecture

The frontend is a React Native / React Native Web Expo app.

Current architecture direction:

- one shared app shell
- one shared navigation tree
- shared `Screen.tsx` ownership by default
- responsive behavior handled inside shared screens/components
- minimal split-screen exceptions only where there is a real technical reason

## Main app shell

Primary app shell file:

- `App.tsx`

`App.tsx` owns:

- route bootstrapping
- `NavigationContainer`
- screen registration
- selected year
- selected country
- comparison selection state
- discovery-year data reuse
- app-level loading overlay behavior
- hidden-gem focus-selection handoff
- search overlay open/close state
- persisted app state

## Main shell components

Key shared shell components:

- `src/components/AppHeader.tsx`
  - top nav
  - breadcrumb trail
  - search trigger
  - search overlay host
  - current web nav order: Discovery Map, Discovery Dashboard, Comparison Mode, Hidden Gems, Credits

- `src/components/MobileBottomNav.tsx`
  - mobile-only bottom navigation behavior
  - current mobile nav order mirrors web: Discovery Map, Discovery Dashboard, Compare, Hidden Gems, Credits

- `src/components/ScreenScaffold.tsx`
  - shared background
  - shared page padding
  - shared web scroll handling
  - shared scrollbar styling

- `src/components/LoadingOverlay.tsx`
  - screen-area loading blocker
  - used for app-level loading messages without blocking the nav shell

- `src/components/SearchOverlay.tsx`
  - global country search UI
  - closes through explicit close action or backdrop click

## Screen ownership

Main screen files:

- `src/screens/WelcomeScreen.tsx`
- `src/screens/DiscoveryScreen.tsx`
- `src/screens/CountryScreen.tsx`
- `src/screens/HiddenGemsScreen.tsx`
- `src/screens/ComparisonSelectScreen.tsx`
- `src/screens/ComparisonResultsScreen.tsx`
- `src/screens/CreditsScreen.tsx`
- `src/screens/DashboardScreen.tsx`
- `src/screens/DashboardScreen.web.tsx`

Current ownership rule:

- shared screens are preferred
- responsiveness should be handled inside the shared screen where possible
- separate web/mobile screen files should not be added casually

Current exception:

- Dashboard still has a web-specific file because the web dashboard uses `recharts`
- The Dashboard user-facing label is `Discovery Dashboard`; the route key remains `dashboard`.
- `src/screens/DashboardScreen.tsx` owns the native/mobile Dashboard implementation and uses app-owned React Native chart components instead of Recharts.
- `src/screens/DashboardScreen.web.tsx` owns the desktop/web Dashboard implementation and still uses Recharts.
- Compact web widths may share some mobile behavior expectations, such as stable KPI flip-card sizing and compact Welcome shell behavior, but the desktop web Dashboard file remains the web chart owner.

## Shared layout and visual language

Shared visual primitives are mostly in:

- `src/components/Panel.tsx`
- `src/components/SecondarySurfaceFill.tsx`
- `src/components/CdCaseArt.tsx`
- `src/components/GemIcon.tsx`
- `src/components/YearSlider.tsx`

Theme ownership lives in:

- `src/theme/colors.ts`
- `src/theme/typography.ts`

Fonts are loaded in:

- `App.tsx`

## Shared map ownership

The Discovery and Comparison map surface is intentionally kept behind the shared globe/map seam:

- `src/components/globe/GlobePanel.tsx`
- `src/components/globe/GlobeView.tsx`

Current ownership rule:

- screen files own filter state, selected-country state, and route actions
- `GlobePanel.tsx` owns the framed map slot and shared map-area action button treatment
- `GlobeView.tsx` owns the actual custom world-map rendering and map interaction behavior
- generated geometry lives in `src/assets/maps/worldMap50m.ts`
- the generation script lives in `tools/generate_world_map_assets.mjs`

This keeps the map implementation swappable without forcing a full screen split.

Current PR-readiness note:

- the app-owned map path is functionally implemented for the current Discovery and Comparison screen flows
- Discovery Map behavior has been hands-on tested on web/mobile by mp3li after the stabilization pass
- remaining work is edge-case testing rather than known missing map implementation

The live frontend does not call an external map provider. Country geometry comes from the checked-in generated asset:

- source pipeline: Natural Earth 50m country boundaries through `tools/generate_world_map_assets.mjs`
- runtime asset: `src/assets/maps/worldMap50m.ts`
- runtime rendering: `GlobeView.tsx` reads the generated flat-map path data directly

Current asset contents include:

- country reference metadata
- continent grouping metadata
- generated flat-map path data
- projection metadata

Country placement and data availability still come from the frontend/backend `Country` model rather than from a live map service.

Current Discovery-specific map ownership details:

- `App.tsx` owns the default Discovery year, currently 2025, and Discovery year-data reuse
- `DiscoveryScreen.tsx` owns filter/list layout and passes active/broader country pools into the map seam
- `GlobeView.tsx` owns map viewport reset, mobile arrow/zoom/reset controls, and first-tap/second-tap mobile country behavior
- the map info blurb is part of the map seam, not a separate screen-level overlay
- mobile and web share the same renderer path with responsive behavior instead of separate screen implementations

Current Discovery interaction rules:

- web hover updates the map info blurb and synchronizes the country list
- web click opens the country flow
- mobile first tap previews/selects a country
- mobile second tap on the same country opens the Country route
- mobile arrow, zoom, and reset controls are explicit controls, not hidden gestures
- mobile reset remains visible for discoverability

Current Discovery visual/data rules:

- Discovery default year is 2025
- countries with data stay visually distinct from countries without data
- countries without data keep visible boundary lines so geography remains readable
- the map info blurb uses helper mode for instructional copy and detail mode for country stats
- map-panel song data should follow the same data-quality rules as the country list

## Navigation and deep-link ownership

Navigation wiring is centralized in:

- `App.tsx`
- `src/navigation/linking.ts`
- `src/types/navigation.ts`

This keeps:

- route registration
- deep-link path mapping
- route-param generation
- persisted route state

in one app-owned seam instead of scattering them across screens.

Current naming/order rule:

- `Discovery Dashboard` should appear directly after `Discovery Map` in both web and mobile navigation.
- Welcome screen action buttons should follow the same order.
- The team has discussed wanting a catchier dashboard name, but `Discovery Dashboard` is the current applied label until a replacement is chosen.

Current Welcome presentation rule:

- Wide web keeps the Welcome screen as a translucent modal over the Discovery Globe.
- Native/mobile and compact widths use an in-screen Welcome presentation so the header, breadcrumb trail, and mobile bottom nav remain visible and usable.
- Welcome route buttons should reset directly to the chosen route instead of briefly returning through Discovery first.

## Data layer ownership

Frontend data access is intentionally separated from screen UI.

Main data-layer files:

- `src/data/apiBaseUrl.ts`
- `src/data/discoveryApi.ts`
- `src/data/countryApi.ts`
- `src/data/apiMappers.ts`
- `src/data/fetchWithTimeout.ts`
- `src/data/countryDisplay.ts`

Responsibilities:

- API base URL resolution
- fetch helpers
- cache/reuse maps
- backend-response mapping into frontend-friendly shapes
- shared country-display filtering rules
- stable request timeout/retry behavior

## Mock/static data role

Mock/static data still exists in:

- `src/data/mockData.ts`
- `src/assets/maps/worldMap50m.ts`

Current role of that file:

- fallback data
- default country/year scaffolding
- UI bootstrapping help where API data is not yet the only source of truth
- ISO country-name lookup for stable route/header/breadcrumb labels during API reload gaps

It should not be treated as the long-term source of truth for live app behavior where backend data already exists.

## Documentation rule for future frontend work

If future work changes:

- the main app shell
- screen ownership rules
- route/state ownership
- core loading/overlay behavior
- or the current screen split/shared policy

then this folder should be updated as part of that work instead of leaving the architecture explanation only in PR text or private notes.
