# Frontend Architecture

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-11
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

- `src/components/MobileBottomNav.tsx`
  - mobile-only bottom navigation behavior

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

## Data layer ownership

Frontend data access is intentionally separated from screen UI.

Main data-layer files:

- `src/data/apiBaseUrl.ts`
- `src/data/discoveryApi.ts`
- `src/data/countryApi.ts`
- `src/data/apiMappers.ts`

Responsibilities:

- API base URL resolution
- fetch helpers
- cache/reuse maps
- backend-response mapping into frontend-friendly shapes

## Mock/static data role

Mock/static data still exists in:

- `src/data/mockData.ts`

Current role of that file:

- fallback data
- default country/year scaffolding
- UI bootstrapping help where API data is not yet the only source of truth

It should not be treated as the long-term source of truth for live app behavior where backend data already exists.

## Documentation rule for future frontend work

If future work changes:

- the main app shell
- screen ownership rules
- route/state ownership
- core loading/overlay behavior
- or the current screen split/shared policy

then this folder should be updated as part of that work instead of leaving the architecture explanation only in PR text or private notes.
