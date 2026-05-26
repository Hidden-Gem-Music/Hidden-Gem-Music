# Frontend Architecture

## Production Mobile-Web Mode Selection Update (May 25, 2026)

Production smoke testing showed that the web build could be opened from a phone browser while still using several web-runtime interface paths. That created a mismatch with the mobile experience tested through Expo/native, especially around the Welcome/access flow and Discovery Map interaction.

The current production-readiness fix adds a first-step Desktop/Mobile question before the access-code screen. This is intentionally temporary: it gives reviewers and testers a functional, visually usable mobile-browser path for the deployed capstone app, while preserving the desktop web experience for desktop users.

Current behavior:

- Desktop mode keeps the wide web presentation and hover-first map behavior.
- Mobile mode routes phone-browser users through mobile experience decisions for Welcome/access presentation, app chrome, Discovery Map interaction, mobile controls, and selected mobile layout paths.
- The production access code remains `COMMENCEMENT`.

Future direction:

- Remove the manual Desktop/Mobile question.
- Replace it with a more reliable automatic strategy that accounts for viewport size, pointer behavior, touch capability, and production browser behavior.
- Resolve the remaining mobile-browser spacing bug between the Discovery Map section and the Pre-Selected Filters section.

---

This document covers the frontend scaffold deliverables for issue #5:

- navigation structure
- folder architecture
- dark mode base stylesheet
- component architecture

The frontend is split by platform responsibility:

- web behavior is handled in web-facing files
- mobile behavior is handled in native-facing files
- platform detection uses React Native file resolution, such as `GlobeView.web.tsx` and `GlobeView.native.tsx`

## 1. Navigation Structure

The current app uses a simple manual navigation scaffold in `App.tsx`.

Current setup:

- `App.tsx` stores the active route in state
- the route type is defined in `src/types/navigation.ts`
- `App.tsx` conditionally renders the matching screen for the current route
- navigation actions are passed down to screens and shared components through props

Current route list:

- `welcome`
- `discovery`
- `country`
- `hiddenGems`
- `comparisonSelect`
- `comparisonResults`
- `dashboard`
- `credits`
- `search`

Web support:

- on web, the current route is synced to the URL hash
- this allows browser navigation without adding a full routing library yet

Main navigation entry points:

- `AppHeader` handles top navigation and search access
- screen buttons can move users between major screens
- breadcrumbs in `App.tsx` provide basic route context and back-navigation behavior

## 2. Folder Architecture

The frontend app lives in `hidden-gem-music-app/`.

Main structure:

- `App.tsx`
  Top-level app shell. Loads fonts, stores shared state, and chooses which screen to render.
- `src/screens/`
  Route-level screen files such as `WelcomeScreen`, `DiscoveryScreen`, and `DashboardScreen`.
- `src/components/`
  Reusable UI pieces such as headers, panels, overlays, cards, and shared controls.
- `src/components/globe/`
  Globe-specific components, including separate platform files for web and native behavior.
- `src/theme/`
  Shared style values for colors, spacing, and typography.
- `src/types/`
  Shared TypeScript types for navigation and content models.
- `src/data/`
  Mock data used while frontend features are being built.
- `src/config/`
  Configuration files such as map-related setup.
- `src/assets/`
  Fonts and image assets.

This folder layout separates:

- app shell logic
- screen-level views
- reusable components
- feature-specific components
- shared styling
- shared types and config

## 3. Dark Mode Base Stylesheet

The current dark mode base is implemented through the shared theme files in `src/theme/`.

Files:

- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`

These files act as the base style system for the app.

What they provide:

- `colors.ts`
  Shared dark-mode colors for background, panels, text, accents, borders, buttons, scrollbars, and navigation gradients.
- `spacing.ts`
  Shared spacing values such as `xs`, `sm`, `md`, `lg`, `xl`, and `xxl`.
- `typography.ts`
  Shared font family names used across the app.

This means the base stylesheet is not one single file. Instead, it is a shared theme layer that components import as needed.

Examples:

- `colors.background` sets the main app background
- `colors.panel` and `colors.panelAlt` define dark surface styles
- `colors.text` and `colors.textStrong` define readable text colors for the dark theme
- `typefaces.display`, `typefaces.condensed`, and `typefaces.body` define shared typography choices

## 4. Component Architecture

The current component architecture is organized into clear layers.

### App Shell

- `App.tsx` is the app shell
- it owns shared state such as route, selected year, selected country, comparison selection, loading state, and search state
- it passes data and actions down into screens

### Screens

- files in `src/screens/` represent full route-level views
- screens assemble reusable components into complete pages
- screens handle layout and route-specific interactions

Examples:

- `WelcomeScreen`
- `DiscoveryScreen`
- `CountryScreen`
- `HiddenGemsScreen`
- `ComparisonSelectScreen`
- `ComparisonResultsScreen`
- `DashboardScreen`
- `CreditsScreen`

### Shared Components

- files in `src/components/` are reusable UI building blocks
- they are meant to be used by more than one screen where possible

Examples:

- `AppHeader`
- `ScreenScaffold`
- `Panel`
- `ActionButton`
- `CountryCard`
- `FilterBar`
- `YearSlider`
- `SearchOverlay`
- `LoadingOverlay`

### Feature-Specific Components

- `src/components/globe/` contains components that belong specifically to the globe feature
- this keeps globe logic separate from the general shared UI layer

Examples:

- `GlobePanel.tsx`
- `GlobeView.web.tsx`
- `GlobeView.native.tsx`

Platform split:

- `GlobeView.web.tsx` contains the web globe experience
- `GlobeView.native.tsx` is the native/mobile version and staging point for the final native globe implementation

## Summary

Issue #5 is currently represented in the codebase by:

- a manual navigation structure in `App.tsx` and `src/types/navigation.ts`
- a defined folder architecture under `src/`
- a shared dark mode base style layer in `src/theme/`
- a component architecture split between app shell, screens, shared components, and feature-specific components

This structure provides the current React Native project scaffold for continued frontend development across both web and mobile work.
