# Implement Interactive Map Across Web and Mobile

## Summary

This PR replaces the placeholder globe rendering in Discovery and Comparison with a real app-owned interactive globe that works in browser and the Expo app JavaScript flow.

Scope includes:

- replacing the placeholder globe area with a real country-boundary map
- wiring the map into the existing Discovery and Comparison screen flows without rewriting those screens
- adding the supporting geometry asset pipeline
- documenting the new map feature
- adding the issue/PR/timeline companion artifacts requested for this work

This PR intentionally does **not** add a live external map provider, WebView-based map, or native-map-only dependency path.

## Work Performed

### 1) Added an app-owned world-geometry asset pipeline

- Added `react-native-svg` for app-owned SVG map rendering.
- Added geometry/source helper packages used to generate the checked-in world asset.
- Added `tools/generate_world_map_assets.mjs`.
- Added the generated geometry asset at:
  - `hidden-gem-music-app/src/assets/maps/worldMap50m.ts`
- Used real 50m world-country geometry to create:
  - country path data
  - continent outline path data
  - projection metadata

### 2) Moved map placement onto real coordinates

- Added `lat` and `long` to the shared frontend `Country` model.
- Added coordinate values to the current mock-country seed data.
- Wired backend Discovery `lat` / `long` values into the frontend country mapping flow.
- Shifted the map implementation away from placeholder percentage marker positioning and onto projected geographic coordinates.

### 3) Replaced the placeholder globe renderer with a custom interactive globe

- Replaced the old decorative placeholder globe implementation inside `GlobeView.tsx`.
- Added:
  - real country lines
  - continent lines
  - orthographic globe projection
  - atmospheric dark visual styling
  - drag/rotate behavior
  - zoom behavior
  - reset-view behavior
- Kept the map app-owned and provider-free at runtime.

### 4) Added interactive marker and card behavior

- Kept gem markers as the branded interaction point.
- Added attached cards that emerge from the gem corner while keeping the gem visually on top.
- Added web hover-preview behavior.
- Added mobile tap-first card behavior.
- Kept the card field set aligned with the current globe-card information model.

### 5) Wired the map into Discovery without rewriting the screen

- Kept `DiscoveryScreen.tsx` as the owner of filter/sort/year/selection logic.
- Replaced only the map area through the existing shared globe/map seam.
- Passed both:
  - the active filtered country set
  - and the broader Discovery country pool
- This keeps nonmatching countries dim but visible while preserving Discovery's current surrounding layout and state model.

### 6) Wired the map into Comparison without rewriting the screen

- Kept `ComparisonSelectScreen.tsx` as the owner of comparison filter/selection behavior.
- Replaced only the map area through the shared globe/map seam.
- Passed both:
  - the active filtered comparison set
  - and the broader comparison country pool
- Added two distinct selected-country visual states so country A and country B stay clear.

### 7) Added companion documentation and writing artifacts

- Added issue draft:
  - `my txts/Issue_Implement_Interactive_Map_Across_Web_and_Mobile.md`
- Added frontend feature documentation:
  - `hidden-gem-music-app/Documentation/custom-interactive-world-map.md`
- Updated:
  - `hidden-gem-music-app/Documentation/README.md`
  - `hidden-gem-music-app/Documentation/frontend-architecture.md`
  - `hidden-gem-music-app/Documentation/screen-data-flow.md`
- Updated the personal implementation timeline with a detailed work log for this map feature:
  - `Documents/mp3li implementation timeline document.txt`

## Task-by-Task Status Against Issue Text

1. **Replace the placeholder globe area with a real interactive map in Discovery**: Completed.
2. **Replace the placeholder globe area with a real interactive map in Comparison Mode**: Completed.
3. **Support interactive map behavior on web and mobile flows**: Completed in the shared JavaScript implementation path.
4. **Support drag/rotate and zoom behavior**: Completed.
5. **Show country cards through map interaction**: Completed.
6. **Keep map behavior tied into current screen flows instead of rebuilding the screens**: Completed.
7. **Keep the feature usable for browser and Expo-based mobile workflow**: Completed at the JavaScript/bundling level.
8. **Document the feature and create the requested issue/timeline/PR artifacts**: Completed.

## Files Changed

- `hidden-gem-music-app/package.json`
- `hidden-gem-music-app/package-lock.json`
- `hidden-gem-music-app/src/types/content.ts`
- `hidden-gem-music-app/src/data/mockData.ts`
- `hidden-gem-music-app/src/data/discoveryApi.ts`
- `hidden-gem-music-app/src/components/globe/GlobePanel.tsx`
- `hidden-gem-music-app/src/components/globe/GlobeView.tsx`
- `hidden-gem-music-app/src/screens/DiscoveryScreen.tsx`
- `hidden-gem-music-app/src/screens/ComparisonSelectScreen.tsx`
- `hidden-gem-music-app/src/assets/maps/worldMap50m.ts`
- `tools/generate_world_map_assets.mjs`
- `hidden-gem-music-app/Documentation/custom-interactive-world-map.md`
- `hidden-gem-music-app/Documentation/README.md`
- `hidden-gem-music-app/Documentation/frontend-architecture.md`
- `hidden-gem-music-app/Documentation/screen-data-flow.md`
- `my txts/Issue_Implement_Interactive_Map_Across_Web_and_Mobile.md`
- `Documents/mp3li implementation timeline document.txt`

## Verification

Build/code verification completed:

- `npx tsc --noEmit`
- `npx expo export --platform web`
- `npx expo export --platform ios`

What those checks confirmed:

- the new geometry asset compiles cleanly
- the custom map renderer resolves in the web bundle
- the custom map renderer resolves in the iOS JavaScript bundle
- the Discovery and Comparison integrations compile against the updated country model and globe-panel seam

Important verification note:

- This implementation pass verified TypeScript correctness and successful web/iOS JavaScript bundling.
- Full live browser interaction review and live Expo Go touch review were not performed directly in this terminal-only environment, so final visual/touch confirmation of the draggable globe should still be done in the running app.
