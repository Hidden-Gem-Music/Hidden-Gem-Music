# Routing, State, and Navigation

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-14
**Status:** Current Routing and App-State Reference

---

## Purpose

This document records the frontend routing model, app-owned state, and navigation handoff rules.

Use this file for:

- route names and path names
- route-param behavior
- shell-owned state in `App.tsx`
- persistence keys
- navigation ownership and cross-screen handoff rules

Use `frontend-architecture.md` for structural app ownership and `screen-data-flow.md` for request/data-loading behavior.

## Route list

Current route names from `src/navigation/linking.ts`:

- `welcome`
- `discovery`
- `country`
- `hiddenGems`
- `comparisonSelect`
- `comparisonResults`
- `dashboard`
- `credits`

## Deep-link paths

Current path mapping:

- `/welcome`
- `/discovery`
- `/country`
- `/hidden-gems`
- `/compare`
- `/compare/results`
- `/dashboard`
- `/credits`

Year and country values are passed through route params where relevant.

Discovery opens to the app-owned default Discovery year, currently 2025, unless a year-sensitive downstream screen owns a stronger route param.

## Route-param rules

Current route-param behavior:

- `discovery`
  - route accepts year-shaped state historically, but the current default-load behavior is owned by the app shell so Discovery can open on the current default year without being pulled back by stale URL state

- `comparisonSelect`
  - `year`

- `comparisonResults`
  - `year`

- `country`
  - `year`
  - `country`

- `hiddenGems`
  - `year`
  - `country`

## App-owned state in `App.tsx`

The following state is owned at the app shell level rather than inside individual screens:

- `currentRoute`
- `selectedYear`
- `selectedCountryId`
- `comparisonIds`
- `loadingMessage`
- `showHiddenGemsNavIntro`
- `hiddenGemsFocusSelection`
- `searchOpen`
- `apiAvailableYears`
- `discoveryCountries`
- `discoveryCountriesByYear`

Why this is app-owned:

- route changes need shared coordination
- several screens depend on the same selected year/country
- hidden-gem routing needs cross-screen focus handoff
- comparison state spans multiple screens
- loading overlays and search are shell-level interactions

## Persisted state

Local browser persistence currently uses:

- `hidden-gem-app-state-v1`

Persisted values:

- `selectedYear`
- `selectedCountryId`
- `comparisonIds`

Persistence behavior:

- web only
- stored in `localStorage`
- used for reload recovery and session continuity

## Navigation ownership rules

Screen-local code should not invent separate routing systems.

Important navigation helpers live in `App.tsx`:

- `navigateToRoute`
- `openCountry`
- `openCountryFromDiscovery`
- `openHiddenGems`
- `openHiddenGemsForCountry`

These helpers matter because they preserve shared behavior such as:

- selected year sync
- selected country sync
- route-param consistency
- loading overlay behavior
- hidden-gem focus handoff
- welcome/popup interaction rules

Current welcome/navigation guard:

- welcome dismissal should use `navigationRef.canGoBack()` before calling `goBack`
- if the welcome screen has no back route to pop, the app should navigate to Discovery directly
- mobile welcome route buttons should guard against repeated taps during the closing transition

Current country-opening rule from Discovery on mobile:

- the first tap on a country previews/selects that country in the Discovery Map info panel
- a second tap on the same country opens the Country route
- tapping a different country should preview/select that different country first, not open it immediately

## Hidden Gems focus-selection handoff

Hidden Gems uses app-owned focus handoff so a preview click from another screen can open the full Hidden Gems screen on the intended song.

Current focus-selection payload can include:

- `countryId`
- `requestKey`
- `songTitle`
- `artist`
- `previewIndex`
- `deezerTrackId`

That payload is passed through `App.tsx` and resolved inside `HiddenGemsScreen.tsx`.

## URL sync rules

`App.tsx` keeps route params synchronized with the active year/country when navigation is ready.

Important behavior:

- year-sensitive screens keep their `year` param in sync
- country-sensitive screens keep both `year` and `country` in sync
- active-route params are updated through `CommonActions.setParams`
- Discovery default-year behavior is intentionally app-owned so initial Discovery load can use the current product default year without depending on stale route params

## Comparison state rules

Comparison mode is app-owned, not screen-owned.

Important rules:

- `comparisonIds` is capped at two countries
- invalid/stale country ids are filtered out when the available country pool changes
- the select screen chooses the ids
- the results screen consumes the ids

## Search rules

Global search is shell-owned.

Current behavior:

- search is opened and closed from the app shell/header
- search results open countries through the app-owned `onOpenCountry` path
- search should not bypass the main app navigation/state ownership rules

## Future rule

If future work changes:

- route names
- path names
- which state is app-owned
- persisted storage keys
- or Hidden Gems focus-selection behavior

then this document should be updated in the same change.
