# Frontend Documentation

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Active

---

This folder documents the current frontend architecture, state ownership, screen data flow, interaction rules, styling conventions, naming vocabulary, and local run workflow for `hidden-gem-music-app`.

## How this documentation set is organized

The files in this folder are separated by responsibility:

- `frontend-architecture.md`
  - structural ownership and major frontend seams
- `routing-state-and-navigation.md`
  - route names, params, app-owned state, and navigation handoff
- `screen-data-flow.md`
  - which screens call which frontend data helpers and how live data is reused
- `interaction-loading-and-overlay-rules.md`
  - shared interaction, popup, loading, and overlay behavior rules
- `local-development-environment.md`
  - setup, local config, verification commands, and backend + frontend + phone/web runbook
- `frontend-styling-rules.md`
  - visual-system and interaction-styling conventions

The goal is to avoid repeating the same content across multiple files. If a topic already has a source-of-truth document here, other docs should reference it rather than restate it in full.

## Files in this folder

- `frontend-architecture.md`
  - app shell structure
  - shared-screen ownership rules
  - component/layout responsibilities
  - theme and file-organization overview

- `routing-state-and-navigation.md`
  - route list
  - deep-link paths
  - app-owned state in `App.tsx`
  - URL sync, local storage, and navigation handoff rules

- `screen-data-flow.md`
  - frontend API entrypoints
  - per-screen fetch flow
  - cache/reuse behavior
  - additional-data integration points

- `interaction-loading-and-overlay-rules.md`
  - popup/overlay behavior
  - loading-state rules
  - search/welcome/Discovery/Hidden Gems interaction rules
  - explicit badge behavior

- `local-development-environment.md`
  - local-only config expectations
  - frontend setup/tooling expectations
  - API base URL behavior
  - frontend verification expectations
  - combined backend + frontend local run workflow
  - LAN/phone testing flow
  - why `--host lan` is used
  - API base URL and Mac LAN IP troubleshooting
  - practical smoke-test steps for web and mobile

- `frontend-styling-rules.md`
  - theme ownership
  - typography and surface rules
  - spacing, responsive, Discovery Map blurb, and interaction styling conventions

## Shared vocabulary

These are development terms, not necessarily user-facing labels.

- Screen scaffold: shared page shell for background, padding, and responsive scroll behavior. Code: `src/components/ScreenScaffold.tsx`.
- Panel: default bounded content surface. Code: `src/components/Panel.tsx`.
- Secondary surface fill: layered visual fill used inside atmospheric panels. Code: `src/components/SecondarySurfaceFill.tsx`.
- Loading overlay: blocking overlay used while the app prevents interaction during loading or modal states. Code: `src/components/LoadingOverlay.tsx`.
- Discovery blurb: top explanatory panel on Discovery and related screens. Code: `src/components/DiscoveryBlurb.tsx`.
- Discovery sidebar panels: Discovery controls/content areas used alongside map/list content. Code: `src/components/DiscoverySidebarPanels.tsx`.
- Map view: Discovery visualization mode using the app-owned map instead of list rows. Code still lives under the historical `src/components/globe/` folder.
- Map info blurb: glassy blurb inside the Discovery Map that shows helper copy by default and country detail text after map interaction.
- Shared action button: app-styled route/action button used by welcome and comparison flows. It keeps mobile pressed styling but should fire actions through normal `Pressable onPress`.
- List view panel: scrollable Discovery country list structure.
- Year slider: Discovery year timeline control. Code: `src/components/YearSlider.tsx`.
- Stat squares: square metric panels used in country/comparison summaries.
- Favorite artists section: horizontal artist-preview section used on country, comparison, and Hidden Gems screens.
- CD carousel: album-art carousel presentation used for top songs and related previews.
- Hidden-gem preview carousel: country-page preview strip that links into full Hidden Gems.
- Hidden song list panel: paged Hidden Gems song-row list.
- Playing side panel: main selected-song detail panel in Hidden Gems.
- Nav intro: introductory Hidden Gems prompt/state shown before a country/year selection is confirmed.
- Explicit indicator: `E` badge for explicit lyrics or cover content. Code: `src/components/ExplicitIndicator.tsx`.
- App header: top navigation/header on web layouts. Code: `src/components/AppHeader.tsx`.
- Mobile bottom nav: bottom navigation on mobile layouts. Code: `src/components/MobileBottomNav.tsx`.

## Scope note

This folder is for shared project/frontend documentation.
