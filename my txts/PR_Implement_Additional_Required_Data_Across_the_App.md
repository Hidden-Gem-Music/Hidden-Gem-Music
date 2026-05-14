# Implement Additional Required Data Across the App (Except Language)

## Summary

This PR completes the app-side implementation work for **Implement Additional Required Data Across the App (Except Language)**.

Scope includes wiring the required additional song data into the real frontend/backend app flow, reusing the documented provider/integration path from the Issue 107 documentation work, and then stabilizing the live web/mobile behavior until the implemented flow was usable across the app.

This PR also includes the follow-up documentation work needed to make the current implementation, runtime workflow, tooling workflow, and frontend/backend documentation structure easier to understand and maintain.

This PR does **not** treat language as completed. Language remains the next issue, and language placeholders / coming-soon messaging were intentionally preserved where the live language implementation is still not ready.

Several reach-data fields were also safely implemented where they improved the real app flow without destabilizing the required scope.

## Important implementation context

This issue ended up being larger than just “show more data on screen.”

Once the required additional-data fields started flowing through the live app, the work expanded into a full stabilization pass because the real browser/mobile behavior exposed several connected problems:

- repeated frontend refetching / poor reuse
- Hidden Gems over-pulling and slow page loads
- preview playback behavior not feeling finished
- hidden-gem preview carousel alignment not matching the full Hidden Gems screen
- popup / overlay interaction leaks
- year-change / route-change behavior needing stricter screen-state handling
- explicit-data UI behavior needing cleanup
- several web/mobile regressions that only showed up through repeated real testing

Because of that, this PR includes both:

- the actual required-data implementation work
- and the follow-up stabilization work needed to make the completed issue behave correctly in the live app

## Work Performed

### 1) Implemented required additional data into the real app/backend flow

- Wired required additional-data handling into the live app/backend path rather than leaving it only as documentation or tool capability.
- Reused the documented provider/integration architecture already established in Issue 107.
- Kept local-only secrets/config/runtime handling out of the PR.

Required data implemented in scope:

- genre(s)
- album art URL
- artist image URL
- 30 second preview behavior

Language remains intentionally out of completion scope for this PR and stays marked as coming soon where applicable.

### 2) Added frontend-side data reuse so the app stops feeling like it is constantly repulling everything

- Added frontend in-memory reuse for:
  - Discovery year payloads
  - country profiles
  - country hidden-gem previews
  - paged Hidden Gems results
  - paged country-song results
  - Discovery genre samples
- Reused already-loaded data inside later screen flows where possible instead of immediately repinging the same information.
- Kept the distinction clear between:
  - backend/local persisted enrichment/cache behavior
  - and frontend session-memory reuse

### 3) Implemented additional-data display across the main screen flows

Discovery:

- country listings in List View now use live additional-data-backed content instead of staying at placeholder/missing behavior
- globe card content improved through real Discovery country loading and genre-sample reuse

Country Detail:

- Country Summary content tightened around live additional-data-backed song/genre context
- Favorite Artists uses artist image data
- CD carousel uses album art
- Most Loved in This Country and Loved Here and Elsewhere use album art and richer song metadata
- hidden-gem preview carousel uses real album art and corrected loading/open behavior

Comparison View:

- Country Summary sections updated to use the same richer additional-data-backed presentation model
- Favorite Artists uses artist image data
- CD carousel uses album art
- song-list sections use richer song metadata and art handling
- hidden-gem preview carousel behavior aligned more closely with the Country Detail screen

Hidden Gems:

- main selected song info uses richer live data
- list view uses album art
- Favorite Artists uses artist image data
- preview/playback behavior now uses real 30-second preview handling instead of dead or misleading UI behavior

### 4) Added safe reach-data implementation where it improved the live app

The issue allowed optional reach-data implementation if it could be added safely. This PR includes several reach-data fields where they fit cleanly into the live app:

- explicit lyrics
- explicit album-art cover flag
- album-level explicit-lyrics flag
- release date
- record type
- contributors
- artist album count
- tracklist

These reach fields were added only where the user-facing experience stayed stable enough to justify keeping them.

### 5) Improved Country and Comparison song-section behavior tied to the new data

- Removed misleading click behavior from:
  - `Most Loved in This Country`
  - `Loved Here and Elsewhere`
- Kept those sections as non-hidden-gem informational sections instead of pretending they should open a hidden-gem preview flow.
- Added richer metadata presentation including:
  - genre lists
  - record type
  - stable album/release-date presentation
- Tightened summary-section layout and reduced unnecessary dead vertical space.

### 6) Implemented Hidden Gems playback and transport behavior

- Wired real preview playback into the main Hidden Gems transport controls.
- Play/pause now controls real preview playback.
- Previous/next now move through real song selection state.
- Previous/next disable correctly at boundaries.
- Added buffering feedback so preview load moments do not feel dead or broken.
- Moved to a shared playback path so behavior stays aligned across web and mobile.

### 7) Reduced Hidden Gems over-pulling and fixed paging/count behavior

- Tightened Hidden Gems loading so the screen stops pulling more than it actually needs for the current page.
- Changed Hidden Gems behavior so it now stops after:
  - the current page
  - plus only enough extra work to know whether another page exists
- Fixed incorrect total-count behavior that had been causing obviously wrong Hidden Gems totals/pages.
- Aligned Hidden Gems paging/count behavior with the real backend result set instead of misleading first-page-only behavior.

### 8) Fixed hidden-gem preview carousel to full Hidden Gems page targeting

- Reworked the preview-to-Hidden-Gems open path so the clicked preview can resolve to the actual intended song on the full Hidden Gems screen.
- Passed stronger focus-selection data through app routing.
- Preferred stronger exact-match resolution before using index fallback.
- Added protection against cross-country / stale-selection collisions.
- Fixed duplicate-song edge cases during mobile Hidden Gems loading.

### 9) Tightened Discovery request behavior and route-sensitive loading behavior

- Stopped Discovery and related screen work from feeling like it keeps fetching forever after the user already left the screen.
- Added stricter route-gated request behavior and frontend cancellation handling.
- Restored safe country-pool behavior for other screens so Comparison / Hidden Gems do not break when Discovery is no longer the active screen.
- Removed `GLOBAL`-style country rows from the user-facing Discovery/app country pools.

### 10) Added explicit-data UI behavior and then stabilized it

- Added the explicit badge into the live app path instead of leaving explicit fields unused.
- Surfaced explicit indicators in the relevant Country / Comparison / Hidden Gems locations.
- Added explicit-data lines to the larger Hidden Gems metadata area.
- Refined the badge wording and visual behavior.
- Kept mobile explicit badges non-interactive.
- Replaced the unstable custom web hover popup with the browser’s native hover-title behavior so the explicit explanation is small, predictable, and no longer stretches across the screen.

### 11) Completed the follow-up regression elimination required to make the issue actually usable

After the initial implementation work, repeated real testing exposed several connected regressions that had to be removed before this issue could honestly be considered complete:

- popup click-through behavior under welcome / overlays
- web hover-acts-like-click behavior after dismissing welcome
- repeated `Maximum update depth exceeded` rerender behavior blocking mobile testing
- Discovery web scroll regression preventing retesting of the year timeline
- Hidden Gems mobile big-CD sizing / centering problems
- Hidden Gems mobile preview typography / explicit-badge spacing problems
- duplicate song behavior in Hidden Gems mobile flow
- explicit hover behavior that was visually wrong on web

This PR includes those stabilization fixes because they were part of the real completion work needed to bring the issue to a usable finished state.

### 12) Added and organized project documentation around the completed implementation

- Created a real frontend documentation folder under:
  - `hidden-gem-music-app/Documentation/`
- Documented the current frontend:
  - architecture
  - routing/state/navigation
  - screen data flow
  - interaction/loading/overlay rules
  - local environment expectations
  - full-stack local testing flow
  - styling rules
  - internal glossary/naming vocabulary
- Added backend API supplement documentation under:
  - `backend/Capstone.API/Documentation/apis/`
- Documented the current live backend API surface without editing the accepted existing backend ADR files.
- Added backend local run/testing documentation to clarify:
  - Local vs Development behavior
  - current run command
  - browser/API smoke-test paths
  - how backend testing fits the frontend LAN/mobile workflow
- Added a root shared documentation index under:
  - `Documentation/README.md`
- Added a root tools index under:
  - `tools/README.md`
- Updated the `mp3li_additional_data_getter_v2` README so it now matches the current three-source, five-mode runtime behavior instead of the older shorter description.
- Cleaned macOS metadata clutter and tightened ignore rules for local metadata/cache artifacts.

## Task-by-Task Status Against Issue Text

1. **Implement required additional data through the real app/backend flow**: Completed for genre, album art, artist image, and 30 second previews.
2. **Reuse cached additional data instead of repeatedly repinging providers**: Completed through frontend reuse plus the existing documented provider/integration path.
3. **Respect loading / retry / fallback / no-match behavior**: Completed in the live app flow with intentional loading-state behavior and graceful failure handling.
4. **Keep year-sensitive behavior aligned to the selected year**: Completed.
5. **Avoid excessive pulling of additional data not yet needed on screen**: Completed through tighter Hidden Gems paging behavior and route-sensitive request handling.
6. **Show required data in the relevant UI areas instead of placeholder/missing behavior**: Completed for the implemented required-data scope above.
7. **Test final behavior on browser and mobile where applicable**: Completed through repeated web/mobile testing and follow-up regression elimination.
8. **Language implementation**: Intentionally not completed here; remains the next issue.
9. **Reach data implementation where safe**: Partially completed with multiple reach-data fields included without destabilizing the required-data implementation.

## Files Changed

- `hidden-gem-music-app/App.tsx`
- `hidden-gem-music-app/src/components/DiscoverySidebarPanels.tsx`
- `hidden-gem-music-app/src/components/ExplicitIndicator.tsx`
- `hidden-gem-music-app/src/components/SearchOverlay.tsx`
- `hidden-gem-music-app/src/data/discoveryApi.ts`
- `hidden-gem-music-app/src/hooks/useLoadingText.ts`
- `hidden-gem-music-app/src/screens/ComparisonResultsScreen.tsx`
- `hidden-gem-music-app/src/screens/ComparisonSelectScreen.tsx`
- `hidden-gem-music-app/src/screens/CountryScreen.tsx`
- `hidden-gem-music-app/src/screens/DiscoveryScreen.tsx`
- `hidden-gem-music-app/src/screens/HiddenGemsScreen.tsx`
- `hidden-gem-music-app/src/screens/WelcomeScreen.tsx`
- `.gitignore`
- `Documentation/README.md`
- `backend/Capstone.API/Documentation/apis/README.md`
- `backend/Capstone.API/Documentation/apis/backend-local-run-and-testing.md`
- `backend/Capstone.API/Documentation/apis/current-backend-api-surface.md`
- `hidden-gem-music-app/Documentation/README.md`
- `hidden-gem-music-app/Documentation/frontend-architecture.md`
- `hidden-gem-music-app/Documentation/frontend-glossary.md`
- `hidden-gem-music-app/Documentation/frontend-styling-rules.md`
- `hidden-gem-music-app/Documentation/full-stack-local-testing.md`
- `hidden-gem-music-app/Documentation/interaction-loading-and-overlay-rules.md`
- `hidden-gem-music-app/Documentation/local-development-environment.md`
- `hidden-gem-music-app/Documentation/routing-state-and-navigation.md`
- `hidden-gem-music-app/Documentation/screen-data-flow.md`
- `tools/README.md`
- `tools/mp3li_additional_data_getter_v2/README.md`
- `Documents/mp3li implementation timeline document.txt`

## Testing

This work was tested through repeated real browser/mobile validation while removing the remaining known regressions.

Verified during the implementation/stabilization process:

- required-data display paths across Discovery / Country / Comparison / Hidden Gems
- Hidden Gems preview/playback behavior
- hidden-gem preview-to-full-screen targeting
- popup blocking / dismiss behavior on web and mobile
- Discovery web scroll behavior and timeline reachability
- mobile Hidden Gems layout behavior
- explicit badge behavior
- repeated year-sensitive behavior checks

Code-level verification also completed:

- `npx tsc --noEmit`
- `git diff --check`

## How to run for testing

This PR does not include sensitive local config values.

Local-only config files that should already exist on the machine:

- `backend/Capstone.API/appsettings.Local.json`
- `hidden-gem-music-app/.env.local`

Run backend:

```bash
cd "/Users/stellar/School/Music_Capstone/backend/Capstone.API" && ASPNETCORE_ENVIRONMENT=Local dotnet run --no-launch-profile --urls "http://0.0.0.0:5140"
```

Run frontend for mobile testing:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start -c --host lan
```

Run frontend for web testing:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start --web -c --host lan
```

## Documentation

- Personal implementation timeline updated in detail
- Final implementation + stabilization work recorded there as a new May 10 incident-log section
- Frontend documentation structure added in `hidden-gem-music-app/Documentation/`
- Backend API supplement/runbook documentation added in `backend/Capstone.API/Documentation/apis/`
- Root shared documentation map added in `Documentation/README.md`
- Root tools index added in `tools/README.md`

## Final state

- Required app-side implementation is complete for genre, album art, artist image, and 30 second previews
- Language remains intentionally deferred to the next issue
- Several reach-data fields are now also surfaced safely in the live app
- The issue now includes the stabilization work needed to make the implemented behavior usable across web and mobile rather than only technically present in code
