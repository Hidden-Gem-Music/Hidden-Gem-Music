# Interaction, Loading, and Overlay Rules

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
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
- clicking outside the welcome modal should behave like the `Discovery Map` action, not like a dangerous bare click-through
- welcome modal route buttons should close through the guarded route-transition path rather than bypassing the modal state
- navigating to Welcome from the header or breadcrumbs should reset to the normal Welcome-over-Discovery stack, not layer the Welcome modal over the current active page
- welcome route buttons should show visible pressed styling on mobile before route work begins
- welcome dismissal must check whether navigation can go back before calling `goBack`
- if there is no route to pop, welcome dismissal should navigate to Discovery instead of dispatching an unhandled back action
- repeated mobile taps during welcome dismissal should be ignored while the close transition is already in progress
- shared welcome/comparison `ActionButton` actions should fire from normal `Pressable onPress`; pressed styling can start on press-in, but navigation/action execution should not be driven by a press-in timer

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
- direct Hidden Gems reload/direct navigation without confirmed country/year params should show the country/year intro prompt
- app-driven Hidden Gems navigation from Country or preview flows should open the intended country/year page without showing the intro prompt
- Hidden Gems list, now-playing, and favorite-artists sections should use the shared glassy/dimmed `Loading...` veil while their data is loading
- Hidden Gems Favorite Artists must follow the country-profile request state, not only the Hidden Gems song-list request state
- CD artwork should keep an individual spinner/dim treatment until its own image file finishes loading or errors; page-level data loading finishing does not mean image loading has finished

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
- shared/app-level loading copy should stay neutral as `Loading...` unless a feature-specific message is intentionally required
- Hidden Gems should not use a separate app-wide `Loading hidden gems...` message when the screen already has section-level loading treatment

## Discovery scroll and sidebar rules

Main files:

- `src/screens/DiscoveryScreen.tsx`
- `src/components/DiscoverySidebarPanels.tsx`
- `src/components/globe/GlobeView.tsx`

Current rules:

- popup-blocking wrappers must still allow the real Discovery scroll container to fill height correctly
- sidebar list-end prefetch should not keep firing repeatedly without leaving/re-entering the threshold
- empty Discovery lists should show an intentional loading state instead of a blank panel
- the top glassy blurb on the Discovery Map is the app-owned map info panel and should stay visually separate from page-level overlays
- Discovery year-refresh loading should clear when the user leaves Discovery
- year changes should not force the map viewport back to default unless the user explicitly presses reset
- the mobile map info panel should sit above the map, not overlap the map's country shapes
- the mobile map info panel may use separate helper/detail heights because helper copy is longer than country-stat copy
- mobile reset should remain visible and use the same immediate press-feedback convention as arrow and zoom controls
- mobile map country interaction uses first tap to preview/select and second tap on the same country to open detail
- tapping a different country after a preview should preview that different country first, not open it immediately
- SVG map paint definitions must use instance-safe IDs so web route transitions do not make country gradient fills resolve against stale or missing definitions

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
