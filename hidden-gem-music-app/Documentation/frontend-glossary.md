# Frontend Glossary

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-10
**Status:** Active

---

## Purpose

This file records the internal frontend vocabulary used across the app and codebase.

These are development terms, not necessarily user-facing labels. Keeping them documented makes issue handoff, review, and future implementation work clearer.

## App shell terms

### Screen scaffold

Meaning:

- the shared page shell that owns the app background, shared page padding, and responsive scroll behavior

Primary code location:

- `src/components/ScreenScaffold.tsx`

### Panel

Meaning:

- the default bounded content surface used throughout the app

Primary code location:

- `src/components/Panel.tsx`

### Secondary surface fill

Meaning:

- the layered visual fill treatment used inside some panels to create the softer, atmospheric surface treatment

Primary code location:

- `src/components/SecondarySurfaceFill.tsx`

### Loading overlay

Meaning:

- the blocking overlay used when the app needs to prevent interaction during loading or modal states

Primary code location:

- `src/components/LoadingOverlay.tsx`

## Discovery terms

### Discovery blurb

Meaning:

- the top explanatory panel on Discovery and related screens that introduces the page and its purpose

Primary code location:

- `src/components/DiscoveryBlurb.tsx`

### Discovery sidebar panels

Meaning:

- the supporting right-side Discovery controls/content areas used alongside the globe/list content

Primary code location:

- `src/components/DiscoverySidebarPanels.tsx`

### Globe view

Meaning:

- the Discovery visualization mode that presents countries through the globe/card presentation instead of list rows

Primary code location:

- `src/components/GlobeView.tsx`

### List view panel

Meaning:

- the scrollable panel structure used for the Discovery country list presentation

Primary code location:

- `src/components/ListViewPanel.tsx`

### Year slider

Meaning:

- the Discovery year timeline control

Primary code location:

- `src/components/YearSlider.tsx`

## Country and comparison terms

### Stat squares

Meaning:

- the square metric panels used in country/comparison summaries for high-level counts and overlap figures

Primary code location:

- `src/screens/CountryScreen.tsx`

### Favorite artists section

Meaning:

- the horizontal artist-preview section showing favorite artists for a country and year

Primary code location:

- `src/screens/CountryScreen.tsx`
- `src/screens/ComparisonResultsScreen.tsx`
- `src/screens/HiddenGemsScreen.tsx`

### CD carousel

Meaning:

- the album-art carousel presentation used for top songs and related previews on country/comparison pages

Primary code location:

- `src/screens/CountryScreen.tsx`
- `src/screens/ComparisonResultsScreen.tsx`

### Hidden-gem preview carousel

Meaning:

- the country-page preview strip that shows a smaller Hidden Gems subset and links into the full Hidden Gems screen

Primary code location:

- `src/screens/CountryScreen.tsx`

### Main comparison area

Meaning:

- the two-country results layout used after comparison selection

Primary code location:

- `src/screens/ComparisonResultsScreen.tsx`

## Hidden Gems terms

### Hidden song list panel

Meaning:

- the list-side panel showing the paged Hidden Gems song rows

Primary code location:

- `src/screens/HiddenGemsScreen.tsx`

### Playing side panel

Meaning:

- the main selected-song detail panel in Hidden Gems, including the large CD treatment and playback/metadata area

Primary code location:

- `src/screens/HiddenGemsScreen.tsx`

### Nav intro

Meaning:

- the introductory Hidden Gems prompt/state shown before a country/year selection has been confirmed from navigation entry

Primary code location:

- `src/screens/HiddenGemsScreen.tsx`

### Hidden Gems filters modal

Meaning:

- the Hidden Gems filter popup used for optional in-screen refinement

Primary code location:

- `src/screens/HiddenGemsScreen.tsx`

## Shared interaction terms

### Explicit indicator

Meaning:

- the `E` badge used to indicate explicit lyrics and/or explicit cover content

Primary code location:

- `src/components/ExplicitIndicator.tsx`

### App header

Meaning:

- the main top navigation/header on web layouts

Primary code location:

- `src/components/AppHeader.tsx`

### Mobile bottom nav

Meaning:

- the bottom navigation used on mobile layouts

Primary code location:

- `src/components/MobileBottomNav.tsx`

## Update rule

If the team starts using a new internal name for a reusable frontend structure, section, or interaction pattern, it should be added here once it becomes recurring project vocabulary.
