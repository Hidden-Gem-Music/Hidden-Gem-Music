# Interaction, Loading, and Overlay Rules

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-10
**Status:** Current UX Behavior Rules

---

## Purpose

This document records the important shared interaction rules that now exist across the frontend.

These rules matter because many recent bugs were caused by shared shell/popup/loading behavior leaking across screens.

## Popup and overlay rule

When a popup or overlay is active:

- underlying screen content should not remain accidentally clickable
- the active popup should own the interaction
- the main nav should remain usable where that is the intended product behavior

## Welcome modal rules

Main file:

- `src/screens/WelcomeScreen.tsx`

Current rules:

- welcome preview content should not be interactable while the welcome modal is active
- welcome preview content should stay guarded during the close transition and short cooldown
- clicking outside the welcome modal should behave like the `Discovery Globe` action, not like a dangerous bare click-through
- welcome modal route buttons should close through the guarded route-transition path rather than bypassing the modal state

## Loading overlay rule

Main file:

- `src/components/LoadingOverlay.tsx`

Current rule:

- app-level loading overlays should block the active screen area
- they should not block the header/mobile nav shell unless that is explicitly intended

That is why the loading overlay is hosted in the screen-area container rather than at the very top of the full app shell.

## Search overlay rules

Main file:

- `src/components/SearchOverlay.tsx`

Current rules:

- search closes through explicit close action or backdrop click
- web search uses a backdrop so outside clicks dismiss the overlay cleanly
- search results should still route through the app-owned open-country path

## Hidden Gems intro and focus rules

Main file:

- `src/screens/HiddenGemsScreen.tsx`

Current rules:

- when the Hidden Gems nav intro is active, the underlying page frame should not stay interactable
- focus-selection handoff from other screens should resolve only when the target country actually matches the active Hidden Gems context
- page fallback should not override a stronger exact match when a stronger match is available

## Explicit badge rules

Main file:

- `src/components/ExplicitIndicator.tsx`

Current rules:

- mobile explicit badges are visual-only
- mobile explicit badges should not behave like hover/click targets
- web explicit explanation uses the browser’s native hover-title behavior instead of a custom floating tooltip

## Loading text rules

Main file:

- `src/hooks/useLoadingText.ts`

Current rules:

- loading text should remain visually stable enough that sections do not jump excessively
- shared loading text helpers should be reused instead of rebuilding one-off animated loading strings in many screens

## Discovery scroll and sidebar rules

Main files:

- `src/screens/DiscoveryScreen.tsx`
- `src/components/DiscoverySidebarPanels.tsx`

Current rules:

- popup-blocking wrappers must still allow the real Discovery scroll container to fill height correctly
- sidebar list-end prefetch should not keep firing repeatedly without leaving/re-entering the threshold
- empty Discovery lists should show an intentional loading state instead of a blank panel

## Route-leave request rule

Where signals are supported, active-screen requests should stop being driven by the screen after the user leaves it.

Important nuance:

- aborting frontend work does not mean a backend request already received by the server never finishes
- it does mean the screen should stop actively driving more unnecessary work after leave

## Future update rule

If future work changes:

- popup ownership
- overlay layering
- loading behavior
- welcome dismissal rules
- search dismissal rules
- explicit badge behavior

then this document should be updated in the same change.
