# QA Log
## HiddenGemMusic Capstone

---

## 2026-05-23 — Issue 160 README Screenshots and GIF Assets

**Tester:** mp3li / Codex-assisted asset preparation
**Fix owner:** mp3li
**Branch:** `160-add-screenshots-and-gifs-for-readme-and-documentation-use`
**Scope:** README/documentation-facing screenshots, header GIF, and visual asset organization

### What was handled

This branch completed the visual asset preparation issue for future README and documentation work. The app screenshots and GIF are organized under stable documentation folders so the README, demo guide, user guide, and presentation materials can reference selected assets later without relying on timestamped or temporary capture folders.

### Assets added

- Added `Documentation/GIFs/header-app-flow.gif`.
- Added 41 screenshots under `Documentation/Screenshots/`.
- Covered the major app areas:
  - Welcome
  - Discovery Map
  - Country Profile
  - Hidden Gems
  - Comparison Mode
  - Comparison Results
  - Discovery Dashboard
  - Credits
- Included hover, selected, filtered, play-state, scrolled, and dashboard story-section screenshots where available.

### Asset organization cleanup

- Moved README/documentation-facing visual assets into `Documentation/Screenshots/` and `Documentation/GIFs/`.
- Removed the older tracked `Documents/Hidden Gem Music Web Screenshots/` files after the stable documentation folders were added.
- Kept the separate `Documents/Hidden Gem Music Web Screenshots (Pre-Presentation-Release)/` folder local/untracked.

### Not included

- No README rewrite was completed as part of this issue.
- No final "How to Use Hidden Gem Music" guide was written.
- No app code or backend behavior changed.

### Verification

- Confirmed all requested GIF source screenshots existed before generating the GIF.
- Confirmed `Documentation/GIFs/header-app-flow.gif` exists and is about 1.8 MB at 1200x676.
- Confirmed the committed asset set includes 42 tracked files under `Documentation/Screenshots/` and `Documentation/GIFs/`.

---

## 2026-05-23 — Issue 54 Documentation Header Correction

**Tester:** mp3li / Codex-assisted documentation cleanup
**Fix owner:** mp3li
**Branch:** `54-docs-readme-deployment-guide`
**Scope:** Deployment plan metadata/header wording correction

### What was handled

This branch corrected the header metadata in `Documentation/deployment-platform-selection-plan.md` so the deployment plan describes team membership and the specific deployment/integration deliverable ownership more accurately.

### Documentation corrected

- Replaced the broad owner/date header with:
  - `Team: mp3li and Leena Komenski`
  - `Plan owner: mp3li - Software Development deployment/integration deliverable`
  - `Documentation date: 2026-05-23`
- Kept the deployment decision content unchanged.
- Merged the correction back into `development`.

### Verification

- Confirmed the PR diff only changed `Documentation/deployment-platform-selection-plan.md`.
- Confirmed `54-docs-readme-deployment-guide` and `144-deployment` were updated to match the latest `origin/development` after the correction merge.

---

## 2026-05-23 — Issue 49 Deploy Cloud Platform Selection Plan and Minimal UI Fixes

**Tester:** mp3li / Codex-assisted implementation
**Fix owner:** mp3li
**Branch:** `49-deploy-cloud-platform-selection-plan`
**Scope:** Deployment platform decision documentation, Cloudflare deployment readiness config, and minimal pre-presentation UI/copy fixes

### What was handled

This branch completed the deployment platform selection plan for the capstone Software Development deployment/integration deliverable. The selected approach is a hybrid Cloudflare deployment: Cloudflare Pages hosts the Expo web frontend, Cloudflare Tunnel routes public HTTPS API traffic to the iMac-hosted .NET backend, and SQL Server remains private on the iMac/local Docker setup.

### Deployment plan documented

- Added `Documentation/deployment-platform-selection-plan.md`.
- Documented the chosen frontend URL: `https://hiddengemmusicapp.mp3li.online`.
- Documented the chosen API URL: `https://api-hiddengemmusicapp.mp3li.online`.
- Explained why the Expo web app can be deployed through static hosting while still remaining interactive through JavaScript and API calls.
- Explained why GitHub Pages was not selected even though it can host static frontend files.
- Documented Cloudflare Pages Free limits, Cloudflare Tunnel practical boundaries, and presentation readiness checks.
- Updated the shared documentation map to include the deployment decision record.

### Deployment readiness changes

- Added `npm run export:web` for the Expo web export path used by Cloudflare Pages.
- Added `hidden-gem-music-app/public/_redirects` so direct route refreshes on Cloudflare Pages serve the SPA entrypoint.
- Updated backend production CORS to allow the deployed Cloudflare Pages frontend origin.
- Added forwarded-header handling for the Cloudflare Tunnel loopback proxy path before HTTPS redirection.

### Minimal UI/copy fixes

- Removed language filters from Discovery Map's All Filters popup and Comparison Mode's Add Your Filters panel.
- Kept language display/enrichment intact in Country, Comparison, Hidden Gems, and supporting display areas.
- Updated Discovery Map Pre-Selected Filters helper copy to start with "Coming Soon".
- Reduced web-only Discovery Map Pre-Selected Filters expanded sidebar height to reduce empty space below the preset filter options.
- Updated Hidden Gems helper copy to describe Previous/Next, List View, and Play behavior.
- Marked the Comparison Mode Popularity filter label as coming soon.
- Filtered non-language placeholders out of Country/Comparison language summary text while leaving the Hidden Gems big-CD language display behavior unchanged.

### Related local artifact

- Added a local issue draft in `my txts/Issue_Add_README_Screenshots_GIFs_And_How_To_Use_Guide.md` for a future README screenshot/GIF documentation pass.
- The issue covers a README header GIF, screenshots across README sections, a "How to Use Hidden Gem Music" guide, hover/click-state screenshots, and full-screen/function visual documentation.

### Not included

- No SQL Server migration or full-cloud database deployment was attempted.
- No Cloudflare account-side setup was completed in code; Pages project, custom domains, and Tunnel setup still happen in Cloudflare.
- No generated `dist` output is committed.
- No new files were added under `Documents/`.

### Verification

- `npm run typecheck` passed.
- `dotnet build` passed.
- `npm run export:web` passed.
- Confirmed `dist/_redirects` is generated from `public/_redirects`.
- `git diff --check` passed.

---

## 2026-05-23 — Branch 57 Final Code Review Cleanup

**Tester:** mp3li / Codex-assisted cleanup
**Fix owner:** mp3li
**Branch:** `57-qa-final-code-review-cleanup`
**Scope:** Final code review cleanup only: remove dead code and ensure inline comments are complete

### What was handled

This branch completed the requested final code review cleanup pass. The scope was intentionally limited to dead-code removal and inline comment clarity so the branch does not introduce new feature work during deployment preparation.

### Dead code removed

- Removed unused frontend state, props, helper functions, imports, and pass-through values that were no longer referenced by the active screens/components.
- Removed the unused Discovery Map mobile year dropdown implementation that was not part of the current rendered flow.
- Removed unused chart color/helper code from Country Profile and Country Comparison screens after confirming it was not referenced.
- Removed unused genre-loading pass-through props after confirming the current UI does not display those loading states.
- Removed the unused backend MySQL repository stub and its unused package reference. The active backend data provider path remains SQL Server.

### Inline comments reviewed

- Reviewed comments touched by the cleanup pass for accuracy.
- Clarified the Comparison Mode genre-filter comment so it explains why genre filters are intentionally omitted for now: the current live genre data is fetched per song and is not normalized enough yet to support trustworthy comparison filtering.

### Final review follow-up fixes

- Updated country shared/unique song paging so `totalCount` returns the stored-procedure raw total instead of the partial enriched/resolved count.
- Passed abort signals through Discovery/metadata fetch helpers that already accepted a signal.
- Added safe logging around background cache writes so fire-and-forget cache failures are visible in backend logs.
- Restored Country Profile and Country Comparison song-row handoff into Hidden Gems after the cleanup pass removed the callback path. Clicking a song row again passes song title, artist, preview index, and Deezer track ID to Hidden Gems.
- Fixed Hidden Gems browser refresh behavior for URLs such as `/hidden-gems?country=iso-us&year=2025`. A valid route country/year now wins over the temporary session handoff marker, so refresh stays on the selected Hidden Gems page instead of reopening the intro popup.
- Left Discovery Map country-list behavior unchanged after a hover/list-scroll experiment proved too risky for the final branch.

### Local runbook updates

- Documented local-only `EXPO_PUBLIC_API_BASE_URL` usage for mobile/LAN testing.
- Documented the mixed local testing setup where SQL Server can run in Docker on macOS, SSMS can run through Windows 11 in Parallels, and the API/Expo app run on macOS.
- Clarified why `localhost` is not enough for phone testing in that setup and why personal LAN IPs should not be committed into source.

### Deployment reminder

- Frontend API base URL and backend CORS origins were identified as deployment-dependent configuration items.
- No deployment URL/CORS code changes were made because the deployment target is not decided yet.
- Before deployment, configure the frontend API base URL and backend allowed origins for the real deployed URLs.

### Not included

- No frontend UX changes were made.
- No database or stored-procedure changes were made.
- No API contract changes were made.
- No behavior changes were intentionally introduced beyond removing unused code paths.

### Verification

- `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` passed.
- `npm run typecheck` passed.
- `dotnet build` passed.
- `git diff --check` passed after the final follow-up fixes.
- Final cleanup scan found no actionable `TODO`, `FIXME`, `HACK`, `XXX`, `console.log`, `debugger`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `NotImplementedException`, `MySqlRepository`, or `MySqlConnector` references. The remaining `debuggerHost` text is a legitimate Expo field name, not a debugger statement.

---

## 2026-05-22 — Branch 39 End-to-End QA Flow and Frontend Follow-Through

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li for frontend follow-up; Leena Komenski for the merged Issue 147 SQL/backend correctness changes
**Branch:** `39-qa-end-to-end-flow`
**Scope:** Local SSMS follow-through for Leena's Issue 147 merge, cache clearing, Country Profile KPI copy, Discovery Map hover card sizing, header search country coverage, and full app navigation flow testing

### What was handled

This branch followed up on Leena's merged Issue 147 work. The SQL/backend stored-procedure changes are Leena's work; this branch applied the required local database steps, validated the results, cleared stale caches, and completed a small set of frontend readiness fixes.

### Database follow-through completed

- Ran the one-time `SongCountryChart` DDL/index setup in SSMS against `HiddenGemMusic`.
- Ran the affected stored-procedure definition files in SSMS:
  - `sp_PopulateSongCountryChart.sql`
  - `sp_PopulateCountryYearStats.sql`
  - `sp_PopulateTopSongByCountryYear.sql`
  - `sp_GetCountryProfile.sql`
  - `sp_GetCountrySongsPaged.sql`
  - `sp_GetCountryComparison.sql`
  - `sp_GetDiscoverPageInfo.sql`
- Ran only the affected population procedures:
  - `EXEC sp_PopulateSongCountryChart;`
  - `EXEC sp_PopulateCountryYearStats;`
  - `EXEC sp_PopulateTopSongByCountryYear;`
- Did not run the full `run-all-population.sql`.
- Cleared stale file-backed caches so old country/song data would not continue serving after the stored-procedure changes:
  - `backend/Capstone.API/Data/presentation_data_cache.json`
  - `backend/Capstone.API/Data/discovery_samples_cache.json`

### SSMS validation results

- `SongCountryChart` populated successfully with `518452` rows.
- Confirmed Andorra has `0` Top 200 rows in `SongCountryChart`.
- Confirmed Andorra returns no rows from `CountryYearStats`, which is expected because the available dataset only contains Viral 50 rows for Andorra.
- Confirmed `TopSongByCountryYear` includes `song_name` values after population.
- Confirmed population sanity outputs returned year/country coverage for populated years.

### Frontend changes completed

- Increased the desktop/web Discovery Map glassy hover blurb height so the third country hover row, `Top album`, is visible instead of clipped.
- Kept mobile Discovery Map blurb sizing unchanged by leaving the mobile-specific height/body overrides untouched.
- Updated two Country Profile KPI labels:
  - `Songs in This View` -> `Songs in Selected View`
  - `% of this view` -> `% of selected view`
- Kept `Loved in This Country` and `Loved Here and Elsewhere` unchanged because those KPI labels intentionally mirror the matching song sections lower on the page, helping users connect summary numbers to the detailed lists.
- Updated header search to use an all-years API-valid country pool instead of only the currently selected year's pool.
- Removed the search overlay's 25-result cap so the full valid country list can display.
- Preserved the corrected behavior where countries without Top 200 app data, such as Andorra, should not be selectable search results.

### KPI copy decision note

The two changed KPI labels were adjusted because they could be clarified without changing the existing information hierarchy. The wording now ties the stat to the user's active country/year selection, which is the context used to reach the page and generate the displayed stats.

From a frontend UX perspective, `Loved in This Country` and `Loved Here and Elsewhere` were kept because those KPI labels intentionally mirror the matching song sections lower on the page. Longer labels such as "total songs in this country/year" were avoided because the stat represents songs in the selected app dataset, not every song that exists for that country and year, and the cards are compact responsive UI elements across multiple layout widths. A future iteration could add longer explanatory text, but that would require broader UI changes and web/mobile QA beyond a small label update.

### End-to-end flow testing completed

- Completed a full end-to-end navigation flow test across the app.
- Verified that the main user paths route to the expected screens.
- Verified that country/year context is preserved where applicable.
- Verified that pages bring users to the intended destination screens during normal navigation.

### Verification

- `dotnet build` passed after stale cache files were cleared.
- `npm run typecheck` passed after frontend changes.

### Follow-up not included

- No change was made to the Country Profile genre source. The current `GetCountryGenreSampleAsync` behavior remains in place for deadline stability.
- No dev cache bypass setting was added.
- No additional backend ownership is claimed for Leena's Issue 147 SQL/backend implementation.

---

## 2026-05-21 — Cache Clearing Required After Every Backend or SP Change

**Tester:** Leena Komenski
**Fix owner:** ⚠️ Flagged for Eli — reviewed 2026-05-22, deferred for deadline stability
**Scope:** `FileBackedDiscoverySampleCacheService`, `FileBackedPresentationDataCacheService`, `DiscoveryController` (`IMemoryCache`)

### What was noticed

Every SP or backend code change requires manually deleting cache files and restarting the server before the effect is visible. The two-layer cache (file-backed JSON + `IMemoryCache`) is good for production performance but makes iterative QA and debugging significantly slower.

### Cache locations to clear

- `backend\Capstone.API\Data\discovery_samples_cache.json` (and `.tmp` if present)
- `backend\Capstone.API\Data\presentation_data_cache.json`
- `backend\Capstone.API\live_song_enrichment_cache\live_song_cache.json`
- In-memory cache (`IMemoryCache`) — cleared only by server restart

### Eli — dev cache bypass (deferred)

A flag (e.g. environment variable or `appsettings.Development.json` setting) that disables or shortens cache TTLs in development would make local QA much faster without affecting production behavior. Reviewed 2026-05-22 — not added, deferred for deadline stability.

---

## 2026-05-21 — Viral 50 Leaking into CountryYearStats for Top-200-Absent Countries

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_PopulateCountryYearStats.sql`

### What was noticed

Andorra's country profile KPI showed 682 total songs, 557 shared, 125 unique, 81% overlap — despite no songs ever loading in the shared or unique song lists. Andorra is the only country in the dataset with chart entries but no Top 200 data.

### Root cause

`sp_PopulateCountryYearStats` queried `ChartEntry` without filtering out Viral 50 (`chart_type_id = 2`). Countries like Andorra that have Viral 50 data but no Top 200 presence got inflated KPI numbers. The shared/unique classification comes from `SongCountryPresence` (Top 200 only), so those numbers don't describe the country's own charting behavior — they describe the global Top 200 popularity of songs that happened to trend virally there. The "unique" count in particular is meaningless: it counted songs unique to one other country's Top 200, not unique to Andorra.

`SongCountryChart` correctly excludes Viral 50, so song lists were empty — producing the visible inconsistency of a non-zero KPI with no songs displayed.

### Fix applied

Added `AND ce.chart_type_id != 2` to `SongsPerCountryYear` CTE in `sp_PopulateCountryYearStats`, consistent with `sp_PopulateSongCountryPresence` and `sp_PopulateSongCountryChart`.

### Steps to apply

1. Run updated `sp_PopulateCountryYearStats.sql` in SSMS to update the SP.
2. `EXEC sp_PopulateCountryYearStats;`
3. Delete `presentation_data_cache.json` and restart the server.

### Note on affected countries

Andorra is the only country in the dataset with chart entries but no Top 200 data — all other countries either have Top 200 data or no chart entries at all. Andorra will now show no profile data, which is correct given its data is entirely Viral 50 and cannot support the app's Discovery Gap metrics.

### ⚠️ Follow-up — verify raw data for Andorra

Check the raw Kaggle CSV for `AD` rows with `chart_type_id = 1` (Top 200). If Top 200 rows exist in the source file but aren't in the database, the data can be ingested and Andorra will work correctly. If no Top 200 rows exist in the source, the current behavior is correct and no further action is needed.

---

## 2026-05-21 — Discovery Map Genre/Language Sampling Fixes

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `CountryRepository.cs`, `sp_GetCountrySongsPaged.sql`

### What was noticed

- Discovery Map showed identical genres (e.g. Alternative, R&B, Pop) for nearly every country in every year.
- Country profile page genres did not match the genres of the country's own top songs — e.g. Australia 2023 showed "Classical" while none of its top songs were Classical.
- Some countries (Egypt, Saudi Arabia, Morocco, Andorra) showed no genre or language at all.
- Some variation in language across countries but far less than expected.

### Root causes

**1. `sp_GetCountrySongsPaged` not applied to database** — The SP was updated in this branch but not yet run in SSMS. The database still had the old query, which pulled from a global song pool with no country filter → same songs → same genres for all countries.

**2. Deezer rate limiting from parallel prefix scans** — Commit `013b796` made the three genre prefix scans run in parallel. With 16 countries requested at once, this created up to 144 concurrent Deezer calls, exceeding the 50/4.9s rate limiter and causing Egypt, Saudi Arabia, Morocco, and Andorra to return no genre or language data. The rate limiter was known to handle individual call bursts correctly — the oversight was not accounting for how parallelizing the prefix scans multiplied the burst size when many countries load simultaneously.

### Fixes applied

- **Ran `sp_GetCountrySongsPaged.sql` in SSMS** — primary fix for identical genres across all countries.
- **Reverted prefix scans to sequential** in `GetCountryGenreSampleAsync` — fixes missing genre/language data for non-Latin-alphabet countries.
- **Deezer fallback investigated, not changed** — splitting `SelectBestTrackMatch` into strict (genre sampling) and permissive (Hidden Gems) paths was prototyped and reverted. The SP fix is the root cause; the original `FirstOrDefault()` fallback is preserved.

### Steps to apply

1. Run updated `sp_GetCountrySongsPaged.sql` in SSMS (required — root cause of same-genres-everywhere).
2. Delete `backend\Capstone.API\Data\discovery_samples_cache.json` and restart the server.
3. Delete `backend\Capstone.API\live_song_enrichment_cache\live_song_cache.json` if any bad fallback matches are cached from before this fix (optional but recommended for a clean slate).

### Eli — profile page genre source: confirmed Option A (2026-05-22)

`GetCountryProfileAsync` calls `GetCountryGenreSampleAsync` (prefix-based approach) for `SampleGenres`. During this investigation an alternative was prototyped and reverted — flagged for Eli's review:

**Option A (current — confirmed):** `GetCountryGenreSampleAsync` — prefix heuristic samples from the full catalog for genre diversity. Costs extra Deezer calls on profile load; genres may not match the specific top songs shown on screen.

**Option B (prototyped, reverted):** Derive `SampleGenres` from the already-enriched `TopSharedSongs` + `TopUniqueSongs` directly. Zero extra Deezer calls; genres always match the visible songs. Risk: top shared songs are ordered by `country_count DESC` (most globally popular), so genres may skew toward mainstream Pop/R&B and miss local genres that don't chart globally.

Eli reviewed 2026-05-22 and kept Option A for deadline stability. No change made.

### How to test

1. Open Discovery Map for 2021 — confirm countries show different genres from each other.
2. Open a country profile — confirm the listed genres match those on the visible top song cards.
3. Check Egypt or Saudi Arabia — may show fewer genres than English-speaking countries due to Deezer match confidence on non-Latin titles; this is expected.

---

## 2026-05-21 — Country Profile KPI Card Label Improvements

**Tester:** mp3li
**Fix owner:** mp3li — partially addressed 2026-05-22
**Scope:** Frontend Country Detail page — KPI summary cards

### What was noticed

The KPI card labels on the country profile page don't clearly communicate what they're showing to a new viewer:

| Label | Action taken |
|---|---|
| Songs in this view | Updated to **Songs in Selected View** (2026-05-22) |
| % of this view | Updated to **% of selected view** (2026-05-22) |
| Loved in This Country | Kept — intentionally mirrors the "Loved in This Country" song section below the KPIs |
| Loved Here and Elsewhere | Kept — intentionally mirrors the "Loved Here and Elsewhere" song section below the KPIs |

### Overlap percentage card copy

`overlap_pct` = `shared_count / total_charted` — the percentage of this country's charting songs that also appeared in at least one other country's charts that year. Updated label "% of selected view" is an improvement over "% of this view" but still does not explain what the stat represents. Further copy improvement is a future iteration item — would require broader UI changes for web and mobile.

No backend changes needed — `overlap_pct` is already returned in the profile response from `CountryYearStats`.

---

## 2026-05-21 — Issue #135: 2023 Limited Data Disclaimer

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Branch:** `135-debug-add-2023-data-disclaimer-anywhere-2023-is-an-option`
**Scope:** `YearDataDisclaimer`, Discovery Map, Country Detail, Hidden Gems, Comparison Mode, Comparison View

### What was fixed

- Added a small reusable `YearDataDisclaimer` component for the 2023 limited-data notice.
- The notice renders only when the actively viewed year is `2023`.
- Added the notice to the main year-driven app views:
  - Discovery Map
  - Country Detail
  - Hidden Gems
  - Comparison Mode
  - Comparison View country panes
- Kept the copy concise: `2023 has limited data and may slightly skew results. New data coming soon.`
- Styled the notice with the app's existing gem icon, gradient, border, typography, and compact callout treatment.
- Right-aligned the notice on Discovery Map, Country Detail, Hidden Gems, and Comparison Mode.
- In Comparison View, each pane evaluates its own selected year so only panes viewing 2023 show the notice.

### How to test

1. Open Discovery Map, select 2023, and confirm the notice appears on the right side of the page.
2. Change Discovery Map to a non-2023 year and confirm the notice disappears.
3. Open Country Detail, select 2023, and confirm the notice appears below the country/year header on the right.
4. Open Hidden Gems, select 2023, and confirm the notice appears below the top blurb controls on the right.
5. Open Comparison Mode, select 2023, and confirm the notice appears below the blurb on the right.
6. Open Comparison View and set one pane to 2023; confirm the notice appears only in that pane.
7. Resize web to a narrow/mobile width and confirm the notice wraps cleanly without overlapping the year controls.

### Verification

- `npm run typecheck` passed after the Issue #135 changes.

---

## 2026-05-19 / 2026-05-21 — Wrong-Country Songs in Country Profile and Comparison Pages

**Tester:** Leena Komenski; Eli (independent confirmation for USA 2025)
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_GetCountryProfile.sql`, `sp_GetCountrySongsPaged.sql`, `sp_GetCountryComparison.sql`, `SongCountryChart` (new table), `sp_PopulateSongCountryChart.sql`, `presentation_data_cache.json`

### What was noticed

Country Profile pages for Japan (JP) and Brazil (BR) for 2020 displayed Swedish and Polish songs (Maximillian, Benjamin Ingrosso, Szpaku, TIX) as "top unique songs," with those artists listed as country favorites. Eli independently flagged that USA 2025 showed unrecognized artists in "Favorite Artists" and songs he didn't recognize in the "Loved Here" section — he noted the results appeared "more year/global SongCountryPresence based rather than explicitly songs that charted in this selected country."

### Root cause

`SongCountryPresence` tracks `(song_id, chart_year, country_count)` — a global count with no `country_id` column. There is no way to ask "did this song chart in Japan?" from that table. All three SPs used `HiddenGems` as a proxy: if a song is not in country X's HiddenGems list, treat it as charting in X. This proxy is fundamentally broken for unique songs.

`sp_PopulateHiddenGems` uses `@MinCountries = 3`, so only songs charting in 3+ countries are written to `HiddenGems`. Songs with `country_count = 1` or `2` are never in HiddenGems for any country. For the unique songs queries (`country_count = 1`), the `NOT EXISTS (HiddenGems)` clause was always true for every country — it never filtered anything. Every globally-unique regional song qualified as "unique to" any requested country.

Additionally, `sp_GetCountrySongsPaged` (the paginated "Loved Here" / "Loved Here and Elsewhere" source) had the same structural flaw in its unique branch. `sp_GetCountryComparison` RS4 and RS5 ("unique to A" / "unique to B") used the same HiddenGems anti-join pattern with the same limitation.

An earlier partial fix (2026-05-19) added a `country_id` filter to the `NOT EXISTS` clause in `sp_GetCountryProfile`, but this did not change the results — since `country_count = 1` songs are never in HiddenGems regardless, the filter was a no-op.

### Fix applied (2026-05-21)

Created `SongCountryChart (song_id, country_id, chart_year)` — a pre-computed lookup table derived from `ChartEntry` (Top 200 only, `chart_type_id != 2` for Viral 50 exclusion, consistent with `sp_PopulateSongCountryPresence`). Populated by `sp_PopulateSongCountryChart`.

Replaced the HiddenGems proxy with a direct join/exists on `SongCountryChart` in all three SPs:

```sql
-- sp_GetCountryProfile (shared and unique songs):
JOIN SongCountryChart scc
    ON scc.song_id    = scp.song_id
   AND scc.country_id = @CountryId
   AND scc.chart_year = @Year

-- sp_GetCountrySongsPaged (both branches):
AND EXISTS (
    SELECT 1 FROM SongCountryChart scc
    WHERE scc.song_id    = scp.song_id
      AND scc.country_id = @CountryId
      AND scc.chart_year = @Year
)

-- sp_GetCountryComparison RS4/RS5 (anti-join via LEFT JOIN / WHERE IS NULL):
WITH InA AS (SELECT scc.song_id FROM SongCountryChart scc WHERE scc.country_id = @CountryIdA ...)
WITH NotInB AS (SELECT scc.song_id FROM SongCountryChart scc WHERE scc.country_id = @CountryIdB ...)
```

`SongCountryChart` has a clustered PK on `(song_id, country_id, chart_year)` for song-first joins, and `IX_SongCountryChart_Country_Year` on `(country_id, chart_year)` for country-first lookups in the comparison SP CTEs.

### Steps to apply

1. In SSMS, uncomment and run the `CREATE TABLE` + `CREATE INDEX` block from `sp_PopulateSongCountryChart.sql`.
2. Run the rest of that file to create the SP, then `EXEC sp_PopulateSongCountryChart;`
3. Run `sp_GetCountryProfile.sql`, `sp_GetCountrySongsPaged.sql`, and `sp_GetCountryComparison.sql` in SSMS.
4. Delete `backend\Capstone.API\Data\presentation_data_cache.json` and restart the server.

### How to test

1. Load Japan 2020 and Brazil 2020 country profiles — unique songs and favorite artists should reflect locally charted artists.
2. Load USA 2025 — "Loved Here" and "Favorite Artists" should show recognizable US chart artists.
3. Load a comparison pair with culturally distinct countries (e.g. JP vs. BR 2020) — "unique to A" and "unique to B" lists should contain artists plausibly from those markets.
4. Spot-check a DS2 year (2024 or 2025) for a non-English-speaking country (e.g. TR, AR, KR) to confirm local artists appear.

---

## 2026-05-19 — Controller Response Caching (Comparison, Discovery, Metadata)

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `ComparisonController.cs`, `DiscoveryController.cs`, `MetadataController.cs`

### What was investigated

Network tab on the Discovery page showed `countries?year=2020` and `years` both taking ~3.78–3.79 s on cold load. Comparison page took ~20 s total for a first load despite `sp_GetCountryComparison` running near-instantly in SSMS after the performance fixes.

Three controllers had no caching at all — every request hit the database directly:

- **`DiscoveryController`** — called `GetAvailableYearsAsync` and `GetGlobeSummaryAsync` on every request with no caching. `GetGlobeSummaryAsync` returns 46.4 kB of globe summary data and was the source of the 3.79 s cold hit.
- **`MetadataController`** — `GetAvailableYears` called `GetAvailableYearsAsync` directly on every request. No caching.
- **`ComparisonController`** — `IsAvailableYearAsync` called `GetAvailableYearsAsync` on every comparison request with no cache. The comparison result itself was never cached — every `/api/comparison` hit ran the full SP.

Compare to `CountryController`, which caches available years in `IMemoryCache` (5-minute TTL) and caches full profile responses in `IPresentationDataCacheService` (file-backed, survives restarts).

### Fixes applied

**`DiscoveryController`:**
- Added `IMemoryCache` dependency.
- Available years check: `IMemoryCache.GetOrCreateAsync` with 5-minute TTL.
- Globe summary result: `IMemoryCache.GetOrCreateAsync` with 30-minute TTL keyed by year (`discovery-globe::{year}`).

**`MetadataController`:**
- Added `IMemoryCache` dependency.
- Years response: `IMemoryCache.GetOrCreateAsync` with 5-minute TTL.

**`ComparisonController`:**
- Added `IMemoryCache` and `IPresentationDataCacheService` dependencies.
- `IsAvailableYearAsync`: now uses `IMemoryCache.GetOrCreateAsync` with 5-minute TTL (same pattern as `CountryController`).
- `GetCountryComparison`: checks `IPresentationDataCacheService` before hitting the SP; writes result to file-backed cache after first load.
- `GetComparisonHiddenGems`: same file-backed cache check/write.

### Expected behavior after fix

- **Second load** of any comparison pair or discovery globe year: near-instant (file-backed cache for comparison, memory cache for globe/years).
- **First load after server restart**: `countries?year=X` and `years` still hit DB once per year per restart (~3.8 s), then serve from memory. Comparison pairs still hit DB once, then serve from file-backed cache across restarts.

### How to test

1. Restart server with a cleared `presentation_data_cache.json`.
2. Load the Discovery page — `countries?year=X` will be slow on first load; navigate away and back — should be near-instant on second load.
3. Load a comparison pair (e.g. SE/VN 2020) — first load slow; second load should be instant regardless of server restart.
4. Confirm `/api/metadata/years` returns the same data as before.

---

## 2026-05-19 — sp_GetCountryComparison Performance Analysis

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski
**Scope:** `sp_GetCountryComparison.sql`, `HiddenGems` table indexes

### What was investigated

Comparison page cold-first-load was taking ~20 seconds for uncached country pairs (e.g. SE/VN 2020). Unlike Country Profile, `ComparisonController` and `ComparisonRepository` use no presentation data cache and no Deezer enrichment — the full 20 seconds is pure DB query time for `sp_GetCountryComparison`.

### Issues identified in the SP

**1. `NOT EXISTS` correlated subqueries with likely missing index (highest impact)**

Result sets 3, 4, and 5 all use this pattern for every row scanned from `SongCountryPresence`:

```sql
AND NOT EXISTS (
    SELECT 1 FROM HiddenGems hg
    WHERE hg.country_id = @CountryIdA
      AND hg.song_id    = scp.song_id
      AND hg.chart_year = @Year
)
```

Without a composite index on `HiddenGems (country_id, chart_year, song_id)`, SQL Server scans the table for each row. Adding the index turns this into a seek.

**2. Double join to `SongCountryPresence` in result set 3**

`InA` already reads from `SongCountryPresence`, but the main SELECT joins it again to get `country_count` for `ORDER BY`. Carrying `country_count` through the CTE eliminates the second scan:

```sql
WITH InA AS (
    SELECT scp.song_id, scp.country_count  -- add country_count here
    FROM SongCountryPresence scp
    WHERE ...
)
-- then remove the second JOIN to SongCountryPresence in the SELECT
```

**3. Optional: rewrite `NOT EXISTS` as anti-join**

SQL Server usually handles these equivalently, but an explicit `LEFT JOIN / WHERE IS NULL` sometimes produces a better plan when the optimizer is uncertain about selectivity.

### Recommended fixes (in order of impact)

```sql
-- 1. Add covering index (run in SSMS)
CREATE INDEX IX_HiddenGems_Country_Year_Song
    ON HiddenGems (country_id, chart_year, song_id);

-- 2. Update the SP — carry country_count through InA CTE, drop the second SongCountryPresence join in result set 3
-- 3. Optional — rewrite NOT EXISTS as LEFT JOIN anti-join in result sets 3, 4, 5
```

### Status

All three fixes applied (2026-05-19):
- Index `IX_HiddenGems_Country_Year_Song` added to `HiddenGems`
- `country_count` carried through `InA` CTE; redundant `SongCountryPresence` join removed from result set 3
- `NOT EXISTS` rewritten as `LEFT JOIN / WHERE IS NULL` anti-join in result sets 3, 4, and 5

Index alone reduced cold-load time by ~2 s (~20 s → ~18 s). Retest with all three changes applied to confirm total improvement.

---

## 2026-05-19 — CountryRepository Parallel Deezer Enrichment
_(updated 2026-05-21 — items 3 and 4 revised; see 2026-05-21 Discovery Map Genre/Language Sampling Fixes)_

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `CountryRepository.cs`

### What was fixed

Cold-cache Country Profile page loads were taking 15–20 seconds. Unlike Comparison, Country Profile enriches song results with Deezer API data (artist images, album art, genres, preview URLs). This enrichment was sequential — each song awaited its own Deezer calls before the next one started. With ~20 songs across the shared and unique lists, each requiring up to 3 Deezer API calls (~200 ms each), the enrichment alone accounted for 8–12 seconds per request.

Four changes were made to `CountryRepository.cs`:

**1. `EnrichSongRowsAsync` — parallel enrichment**

Changed from sequential `foreach await` to `Task.WhenAll`. All songs in a list now enrich concurrently. The `DeezerSongEnrichmentService` has a built-in sliding window rate limiter (50 req / 4.9 s), but this only throttles individual calls — it does not prevent burst overload when many countries are loaded simultaneously on the Discovery Map.

**2. `GetHiddenGemsPreviewAsync` — parallel enrichment**

Changed from sequential `foreach await` to `Task.WhenAll` over all raw rows, with deduplication and limit applied in a post-filter pass over the results.

**3. `GetCountryGenreSampleAsync` — parallel prefix scans** ⚠️ reverted 2026-05-21

The three prefix scans ("B", "I", "Y") were changed to run concurrently. In practice, with 16 countries loading simultaneously on the Discovery Map, this created up to 144 burst Deezer calls, exceeding the rate limiter window and causing countries at the back of the queue to return no genre or language data. **Reverted to sequential prefix scans** in the 2026-05-21 genre sampling fix.

**4. `GetCountryProfileAsync` — parallel sub-operations**

Shared songs enrichment and unique songs enrichment run together via `Task.WhenAll`. Genre sampling was later removed from this `Task.WhenAll` (2026-05-21) — the profile now derives genres from the already-enriched top songs instead of making a separate sampling pass.

**Dead code removed**

`FindDistinctLanguageForPrefixAsync` and `FillRemainingDistinctLanguagesAsync` (~150 lines) were async duplicates of the synchronous language methods. They were never called — `GetCountryLanguageSampleAsync` uses the synchronous versions. Both deleted.

### Expected improvement

Cold-cache country profile enrichment: ~8–12 s (sequential) → ~1–2 s (parallel, rate-limited). The DB query time and any remaining Deezer bottleneck still apply — improvement is specifically to the song enrichment phase.

### How to test

1. Identify a country/year not in `presentation_data_cache.json` (e.g. a country not in Eli's warmed set).
2. Load the Country Profile page and time the first load.
3. Compare against the same country/year before this change (or against a cached country as a baseline for DB-only latency).
4. Verify genre samples, hidden gems preview, and top songs all still display correctly.
5. Check that hidden gems preview deduplication still works (no duplicate songs in the preview widget).

### Verification

- `dotnet build Capstone.API.csproj` passed with 0 C# errors.
- Correctness testing: Leena Komenski (Windows) — pending.

---

## 2026-05-19 — CountryController Validation Outside try/catch Fix

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `CountryController.cs`

### What was fixed

Three categories of issues in `CountryController.cs`:

**1. `ValidateInputsAsync` called outside try/catch**

In `GetCountryProfile`, `GetHiddenGemsPreview`, and `GetCountrySongs`, `ValidateInputsAsync` was called before the `try` block. `ValidateInputsAsync` calls `_metadataRepo.GetAvailableYearsAsync()` — a DB call. If that call threw, the exception was not caught by any handler, producing a silent (unlogged) 500 response. Moved inside the `try` block in all three methods.

**2. Year validation outside try/catch in `GetCountryGenreSamples` and `GetCountryLanguageSamples`**

These two endpoints had an inline `_memoryCache.GetOrCreateAsync` → `GetAvailableYearsAsync()` block before their `try` blocks. Same silent-500 risk. Moved inside `try`.

**3. `GetAvailableYearsAsync()` called without `CancellationToken`**

Every call to `GetAvailableYearsAsync()` throughout the controller was missing the request cancellation token. Cancelling the HTTP request would not abort the in-flight DB call.

### How it was fixed

Extracted a private `IsAvailableYearAsync(int year, CancellationToken)` helper that holds the single `IMemoryCache.GetOrCreateAsync` + `GetAvailableYearsAsync(cancellationToken)` call. `ValidateInputsAsync` now calls the helper (and also accepts a `CancellationToken`). `GetCountryGenreSamples` and `GetCountryLanguageSamples` call the helper directly inside their `try` blocks. All five action method call sites pass `cancellationToken`.

### How to test

1. Load a valid Country Profile page — should load normally.
2. Load with an invalid year (e.g. `?year=1900`) — should return 400 with a year-unavailable message.
3. Load with an invalid country code (e.g. `/api/country/ZZZ`) — should return 400 with country-code message.
4. Confirm no regressions on genre-samples and language-samples endpoints.

### Verification

- `dotnet build Capstone.API.csproj` passed with 0 C# errors.

---

## 2026-05-19 — Discovery Map Showing "No Song Data" for DS1 Years (Issue #148)

**Tester:** Eli (reviewer, PR #137 — flagged in PR review comments, not in this log)
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `148-bug-sp-unknown-song-with-unknown-album`
**Scope:** `sp_PopulateTopSongByCountryYear`, `sp_GetDiscoverPageInfo`, `TopSongByCountryYear` table, `GlobeRepository.cs`, `CountryGlobeSummary.cs`, `api.ts`, `apiMappers.ts`, `discoveryApi.ts`, `GlobeView.tsx`, `CountryCard.tsx`

### What was noticed

Eli flagged during review of PR #137 that the Discovery Map showed **"No song data for [year]"** for most countries in 2021 (and other DS1 years). The hover card and country card lines that should show the most popular song were suppressed entirely for DS1 countries.

### Root cause

The Historical Top 200 CSV (DS1) does not include album names — `DIM_Song.album_name` is `NULL` for all DS1 songs and is never written by any enrichment process. The Deezer enrichment tools (`tools/song_data_enrichment/`) produce local CSV/JSON output files; they do not write back to `DIM_Song`. The `DeezerSongEnrichmentService` calls Deezer at request time for endpoints like Country Profile and Hidden Gems, but the Discovery Map path bypasses that service entirely — it reads only from `sp_GetDiscoverPageInfo` → `TopSongByCountryYear`.

As a result, the Discovery Map hover card for DS1 years (2017–2021) has never had album data. `hasSongData = Boolean(topAlbumName?.trim() && topArtistName?.trim())` evaluated to `false` for all DS1 countries (album_name always NULL), suppressing the entire display even though song title and artist name are fully available from the CSV.

DS2 years (2023–2025) are unaffected — the Top 50 CSV includes album names, so `DIM_Song.album_name` is populated for DS2 songs and the hover card album line works correctly for those years.

The May 13 optimization (commit cc709af) did not change or worsen this behavior — the old live subquery read the same `DIM_Song.album_name = NULL` values. The bug was pre-existing for all DS1 years; Eli noticed it during the PR #137 review of the optimization. DS1 song titles (`DIM_Song.title`) and artist names (`DIM_Artist.artist_name`) are fully populated from the CSV and have always been available.

### What was fixed

**Database layer:**
- **`sp_PopulateTopSongByCountryYear`** — Added `s.title AS song_name` to `SELECT`, `GROUP BY`, and `INSERT` so the winning song title is persisted in `TopSongByCountryYear`. Added `CASE WHEN a.artist_name IS NOT NULL THEN 0 ELSE 1 END ASC` as a secondary tie-break in `ROW_NUMBER()` (defensive improvement — prefer a known-artist song at equal chart counts).
- **`sp_GetDiscoverPageInfo`** — Added `tscy.song_name AS top_song_name` to the `SELECT`.
- **`TopSongByCountryYear` table** — Requires a one-time migration before re-running the populate SP:
  ```sql
  ALTER TABLE TopSongByCountryYear ADD song_name NVARCHAR(512) NULL;
  ```

**API / C# layer:**
- **`CountryGlobeSummary.cs`** — Added `TopSongName` property.
- **`GlobeRepository.cs`** — Maps `top_song_name` → `TopSongName`.

**Frontend:**
- **`api.ts`** — Added `topSongName: string | null` to `ApiCountryGlobeSummary`.
- **`apiMappers.ts`** — Added `topSong` to `UiCountryGlobeSummary`; maps `topSongName` via `toNonEmpty`.
- **`discoveryApi.ts`** — Changed `hasSongData` to check `topSongName` + `topArtistName` (both available for DS1) instead of `topAlbumName` + `topArtistName`. Changed `topSong` to use `mapped.topSong` from the API instead of falling back to the static country cache.
- **`GlobeView.tsx`** and **`CountryCard.tsx`** — Changed display label from "Most popular album" to "Most popular song". Changed display value from `country.album` to `country.topSong`. Updated `hasNoSongData` guard to check `topSong` instead of `album`.

### How to test

1. In SSMS, run the migration: `ALTER TABLE TopSongByCountryYear ADD song_name NVARCHAR(512) NULL;`
2. Re-apply the SP definitions from the updated `.sql` files.
3. `EXEC sp_PopulateTopSongByCountryYear;` — sanity output should show rows for each available year.
4. `EXEC sp_GetDiscoverPageInfo @Year = 2021;` — confirm `top_song_name` and `top_artist_name` are non-null for major countries (US, GB, JP, AR, MX, DE).
5. In the app, select year 2021 on the Discovery Map. Country cards and hover cards that previously showed "No song data for 2021" should now show "Most popular song: X by Y."
6. Verify DS2 years (2023–2025) also still display correctly — song title + artist should show for those years too.
7. Spot-check year 2018 to confirm the fix extends to all DS1 years (66 countries have chart data for 2018).
8. Once Deezer enrichment has been run against the DB and `DIM_Song.album_name` is backfilled, re-run `EXEC sp_PopulateTopSongByCountryYear;` — the secondary album display in the hover card will populate automatically without any further code changes.

### Verification

```sql
-- Confirm song_name column was added
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TopSongByCountryYear' AND COLUMN_NAME = 'song_name';

-- Spot-check — song_name and artist_name should be non-null; album_name will be NULL until Deezer enrichment backfills DIM_Song
SELECT TOP 20 country_id, chart_year, song_name, album_name, artist_name
FROM TopSongByCountryYear
WHERE chart_year = 2021
ORDER BY country_id;

-- Check Deezer enrichment coverage — album_name NULL here means enrichment has not run yet
SELECT
    COUNT(*) AS total_ds1_songs,
    COUNT(album_name) AS enriched_with_album,
    COUNT(*) - COUNT(album_name) AS pending_enrichment
FROM DIM_Song
WHERE song_id IN (SELECT DISTINCT song_id FROM ChartEntry WHERE YEAR(snapshot_date) BETWEEN 2017 AND 2021);
```

## 2026-05-19 — Country/Comparison Slow First-Load Investigation (Mac / Docker SQL Server)

**Tester:** Leena Komenski
**Fix owner:** Pending (see long-term recommendations below)
**Scope:** Country Profile and Comparison pages, `sp_GetCountryProfile`, Docker SQL Server execution plan cache, `FileBackedPresentationDataCacheService`, `SaveAsync` blocking pattern

### What was investigated

After the `05.15_HiddenGemMusic.bak` restore, Country Profile and Comparison pages loaded unusably slowly for mp3li on Mac — several minutes per page. mp3li noted this in his timeline document immediately after the restore on May 15 and built the file-backed cache services and presentation-data warmer tools (commit `6f4b76d`) as a workaround. The loading optimization branch (`cfe2fa7`) was suspected as the cause but investigation showed otherwise.

### Root cause

**The `.bak` restore wiped mp3li's Docker SQL Server execution plan cache.**

SQL Server does not store execution plans in backup files. Plans live in-memory only and are cleared whenever a database is restored. Before the restore, mp3li's Docker SQL Server had warm, locally-compiled plans for `sp_GetCountryProfile` and related country/comparison stored procedures. Those plans had been adapted over time to his container's memory and CPU constraints.

After restoring Leena's `.bak`, SQL Server recompiled all plans from cold using the statistics embedded in the Windows backup. Statistics generated on a native Windows SQL Server machine can lead the optimizer to choose memory-intensive plans (hash joins, large sort operations) that run efficiently on a full-RAM Windows installation but exceed Docker's constrained container memory — causing those operations to spill to disk and run orders of magnitude slower.

This is why:

- The Discovery page was **fast** after the restore — `sp_GetDiscoverPageInfo` was optimized in the same branch to read from the pre-computed `TopSongByCountryYear` table, so it is near-instant regardless of plan quality.
- Country/Comparison pages were **slow** — `sp_GetCountryProfile` is a complex aggregation SP that is sensitive to plan choice and Docker memory limits on a cold compile.
- The loading optimization branch code changes themselves (parallelizing genre-sample fetching in the backend, deduplicating the `loadAvailableYears` promise in the frontend) were **not** the cause.

### Secondary issue: `SaveAsync` blocks HTTP responses

The `FileBackedPresentationDataCacheService.SaveAsync` and `FileBackedDiscoverySampleCacheService.SaveFavoriteArtistsAsync` calls in `CountryController.cs` are `await`ed before `return Ok(result)`. This means every cold-cache request waits for both file writes to complete — and those writes serialize through a `SemaphoreSlim(1, 1)` — before the client gets a response. This adds latency on top of slow DB queries rather than running in the background.

### Loading veil behavior (expected but worth noting)

The glassy section loading covers added in `6f4b76d` are each tied to an individual loading state flag (`initialLoadingProfile`, `initialLoadingUnique`, `initialLoadingShared`, `initialLoadingPreview`). The veils are semi-transparent overlays, so underlying placeholder/skeleton content is visible through them while data loads. Veils do not clear until their controlling flag is set to `false`, which only happens when the HTTP response arrives. Because `SaveAsync` is awaited before the response is sent, slow DB queries + serialized file writes on a cold Docker instance compound into minutes of total wait — all veils remain up for the full duration.

### Long-term recommendations

**1. Increase Docker Desktop memory allocation (highest impact, no code change)**

In Docker Desktop on macOS → Settings → Resources, increase the memory limit to 8 GB or more. SQL Server defaults to using up to 80% of available container memory for its buffer pool. More memory means hash joins and sort operations stay in RAM instead of spilling to disk, and cold plan compilation produces efficient plans even from cold start.

**2. Run `sp_updatestats` after every `.bak` restore**

After each database restore, run the following in SSMS before starting app work:

```sql
USE HiddenGemMusic;
EXEC sp_updatestats;
```

This rebuilds statistics from the actual data in the Docker instance rather than using the Windows-generated statistics embedded in the backup. The optimizer then compiles plans suited to the Docker environment.

**3. Fix `SaveAsync` to not block HTTP responses**

In `CountryController.cs`, fire the cache-write calls as background tasks so the response returns immediately after the DB query completes:

```csharp
// Current (blocks response until writes finish):
await _discoverySampleCache.SaveFavoriteArtistsAsync(normalizedCode, year, favoriteArtists, cancellationToken);
await _presentationDataCache.SaveAsync(cacheKey, result, cancellationToken);
return Ok(result);

// Recommended (response returns immediately; cache writes complete in background):
if (favoriteArtists.Count > 0)
    _ = _discoverySampleCache.SaveFavoriteArtistsAsync(normalizedCode, year, favoriteArtists);
_ = _presentationDataCache.SaveAsync(cacheKey, result);
return Ok(result);
```

The same pattern applies to the hidden gems preview and songs endpoints in the same file. This does not fix slow DB queries but removes the extra serialized file-write latency stacked on top of them on every cold-cache request.

### Current workaround

The presentation-data warmer scripts (`tools/presentation_data_prep.py`, `tools/fill_discovery_samples_cache.py`) pre-populate the file-backed cache JSON files before a session. With warm cache files, country and comparison profile requests return from the JSON file without hitting the database at all, which is fast regardless of Docker plan quality. Warmers should be run after any `.bak` restore and before demo or testing sessions until the Docker memory and `sp_updatestats` fixes are in place.

**Note:** The file-backed cache services and warmer tools exist solely as a workaround for the slow cold-query problem described above. If the root cause is resolved (Docker memory increased and/or `sp_updatestats` run after restores), Country and Comparison pages will load at normal speed directly from the database and the warmers become redundant. The `FileBackedPresentationDataCacheService`, `FileBackedDiscoverySampleCacheService`, and associated warmer scripts can be removed at that point.

---

## 2026-05-19 — CountryController `SaveAsync` Fire-and-Forget Fix

**Tester:** Leena Komenski, pending mp3li
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `CountryController.cs` — `GetCountryProfile`, `GetHiddenGemsPreview`, `GetCountrySongs`, `GetCountryGenreSamples`, `GetCountryLanguageSamples`

### What was fixed

Per the investigation documented above, file-backed cache writes were `await`ed before returning HTTP responses, adding serialized file-write latency on top of every cold-cache DB query. All five save calls were changed to fire-and-forget using the `_ =` discard pattern so the response returns as soon as the DB result is ready.

The `CancellationToken` parameter was also dropped from each fire-and-forget call. Passing a request-scoped token to a background write would cancel the write the moment the HTTP response completed, defeating the purpose of the background save.

Changes made in `backend/Capstone.API/Controllers/CountryController.cs`:

| Endpoint | Call changed |
|---|---|
| `GetCountryProfile` | `SaveFavoriteArtistsAsync` |
| `GetCountryProfile` | `SaveAsync` (presentation cache) |
| `GetHiddenGemsPreview` | `SaveAsync` (presentation cache) |
| `GetCountrySongs` | `SaveAsync` (presentation cache) |
| `GetCountryGenreSamples` | `SaveGenresAsync` (inside `GetOrCreateAsync` factory) |
| `GetCountryLanguageSamples` | `SaveLanguagesAsync` (inside `GetOrCreateAsync` factory) |

### How to test

**Correctness (Leena — Windows):**

Test against a country/year combination not already present in the cache (so a real DB fetch is triggered) rather than deleting the cache files — the cache files contain mp3li's warmed data and should not be cleared for this test.

1. Identify a country/year that is not in `presentation_data_cache.json` (or use a fresh branch without the cache files).
2. Open that Country Profile page — data should load normally.
3. Navigate away, then back to the same country — second load should be instant, confirming the background write succeeded and the cache was populated.
4. Confirm the JSON file now contains an entry for that country/year.

If the second load is still slow, the fire-and-forget write failed silently and needs investigation.

**Note on the warmers:** If the root cause fix (Docker memory / `sp_updatestats`) is in place before this test is run, the file-backed cache services may not be needed at all — see the note in the root cause investigation entry above.

**Performance (mp3li — Mac / Docker SQL Server):**

First load of a Country Profile or Comparison page on a cold cache should now return data as soon as the DB query completes, without the additional wait for serialized file writes on top. Compare cold first-load time before and after pulling this change.

### Verification

- `dotnet build Capstone.API.csproj` passed with 0 warnings and 0 errors.
- Correctness testing: Leena Komenski (Windows).
- Performance testing: mp3li (Mac / Docker SQL Server) — pending.

---

## 2026-05-17 — Credits Screen Content Completion

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Credits screen contribution content, pending Leena section, mp3li links, readability and link-button styling

### What was fixed

- Replaced the Credits page blurb placeholder with final page-purpose copy.
- Reworked Credits contribution rendering into structured per-person content instead of hard-coded placeholder rows.
- Completed mp3li's contribution section with detailed professional credit content.
- Kept Leena's contribution section pending without guessing her scope or preferred wording.
- Added mp3li work/social link rows.
- Kept Leena's lower link panel as a future placeholder.
- Increased Credits card and link text sizes for readability.
- Changed link button borders and states to use the app's pink accent styling.
- Removed the forced bottom whitespace in the main contribution panel.

### How to test

1. Open Credits on web.
2. Confirm there is no main contribution placeholder text such as `Insert Role` or `Insert name of thing this person did`.
3. Confirm mp3li's contribution section is detailed and readable.
4. Confirm Leena's section reads as pending and does not invent Leena's contribution content.
5. Confirm mp3li's links have resting accent styling, hover styling, press styling, and open externally.
6. Resize web to mobile width and confirm the long credit text and link rows wrap cleanly.
7. Open Credits on Expo/native mobile if available and confirm text remains readable.

### Verification

- `npm run typecheck` passed after the Credits changes.

---

## 2026-05-17 — Discovery Dashboard Mobile Adaptation Follow-Up

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Native/mobile Discovery Dashboard, compact web Dashboard behavior, Welcome routing/presentation, KPI flip-card sizing, Dashboard loading text

### What I noticed

The native/mobile Dashboard needed to match the narrow web Dashboard experience more completely. During mobile testing, several follow-up issues appeared around Welcome routing, KPI flip-card sizing, clipped large numbers, and loading copy.

### What was fixed

- Rebuilt the native/mobile Dashboard path so it includes the full Dashboard story structure instead of a simplified placeholder.
- Replaced web-only Recharts charts on native/mobile with app-owned React Native chart components.
- Preserved API-backed Dashboard data for mobile chart values.
- Added tap-selected chart states so mobile users can inspect values without hover.
- Fixed Welcome route selection so tapping Discovery Dashboard from Welcome does not briefly show Discovery Map first.
- Updated compact/native Welcome behavior so the header, breadcrumb trail, and mobile bottom nav stay visible and usable.
- Preserved wide-web Welcome behavior with the translucent overlay above the Discovery Globe.
- Added feature-specific animated loading text: `Loading Discovery Dashboard...`.
- Added right-side breathing room for large numeric Dashboard values that were clipping on mobile.
- Fixed KPI flip cards so they keep the same size before and after being flipped on native mobile and compact web widths.

### How to test

1. Open the app in Expo native mobile.
2. Open Welcome and confirm the header, breadcrumb trail, and mobile bottom nav remain visible.
3. Tap Discovery Dashboard from Welcome and confirm it does not flash Discovery Map first.
4. Confirm every Dashboard section appears on mobile: hero, selector, KPI cards, Chapters 1-4, chart cards, conclusion, and About This Data.
5. Tap KPI cards and confirm they flip without changing height.
6. Tap chart bars/rows and confirm selected-value states work.
7. Confirm large values such as percentages, point values, and ceiling country counts are not clipped.
8. Resize web to mobile width and confirm compact web KPI flip cards also keep the same height.

### Verification

- User verified the native/mobile Welcome behavior worked after the compact/native presentation fix.
- User verified the mobile Dashboard sections, chart values, selected states, and scrolling behavior.
- User verified the KPI flip-card height fix on native mobile and then requested the same compact-web fix.
- `npm run typecheck` passed after the final Dashboard/Welcome changes.

---

## 2026-05-15 — Dashboard Issue 128 Frontend Fixes and Discovery Dashboard Rename

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Dashboard country selector, KPI sizing, chapter spacing, Chapter 3 signed value, Chapter 4 peak-song art, Dashboard nav naming/order, PR handoff notes

### What I noticed

Dashboard Issue 128 contained several clear frontend polish requests plus several vague/data-owner requests. The clear frontend items were implemented in this pass. The stored-procedure/data-source/naming-clarification items were documented in the PR markdown instead of guessed.

### What was fixed

- The "See where your country fits in" dropdown now includes countries with app data across available metadata years.
- Countries with a returned isolation score show the score and label it as an isolation score.
- Countries with app data but no returned isolation score no longer show a confusing placeholder on the right side of the dropdown.
- The selected-country banner avoids fake scores when the current ranking response does not include that country.
- Chapter 1 Discovery Gap Distribution explanatory text now has better spacing below it.
- The first four Chapter 1 KPI flip cards are larger and render as a two-by-two layout.
- KPI card content typography was increased and the `flip ↻` hint placement was made consistent.
- Section divider numbers/headings were increased and given more spacing below.
- Chapter 2 isolation-score explanation spacing was increased.
- Chapter 3 now shows a single inline signed value such as `+6 pts` or `-6 pts` instead of stacked plus/minus symbols.
- The phrase "then a 22-month silence" was removed.
- Chapter 4 / THE CEILING now displays peak-song art inside the existing CD case component.
- Conclusion stat cards were enlarged while preserving a two-by-two square-card layout.

### API/model change

The Dashboard peak-reach API response now includes `albumArtUrl`.

Implementation detail:

- `DashboardRepository.GetPeakReachAsync` still calls `sp_GetPeakCrossRegionalReach`.
- The returned peak song title and artist are passed through the existing Deezer enrichment service.
- The frontend uses `albumArtUrl` in the Chapter 4 CD case.
- A known cover-art fallback is present for the current peak song so the UI does not stay blank if enrichment does not resolve art.

### Navigation/name update

- The Dashboard nav label is now `Discovery Dashboard`.
- Web header nav order is now:
  - Discovery Map
  - Discovery Dashboard
  - Comparison Mode
  - Hidden Gems
  - Credits
- Mobile bottom nav was reordered the same way.
- Welcome screen copy and buttons were updated so Discovery Dashboard appears directly after Discovery Map.
- PR handoff notes state that the team has discussed wanting a catchier name but has not settled on one yet.

### Follow-up items intentionally not completed

- "Adjust wording on explanation" needs the exact target text or replacement wording.
- "Conclusion card - make KPI cards a carousel?" needs a screenshot or expected behavior because the conclusion currently has four stat cards.
- "Add data sources to About this data" needs exact data-source labels from the data owner.
- "Adjust isolation scores by country graph to include all countries" appears to require changing `sp_GetIsolationRanking`, which currently uses `SELECT TOP 20`. The PR markdown documents a "Potential SQL direction" without changing that stored procedure in this frontend pass.

### How to test

1. Open Dashboard / Discovery Dashboard.
2. Confirm the main nav shows `Discovery Dashboard` immediately after `Discovery Map` on web.
3. Check mobile width and confirm bottom nav order matches.
4. Open Welcome and confirm its buttons put `Discovery Dashboard` after `Discovery Map`.
5. Open the Dashboard country dropdown and confirm countries with app data are present.
6. Confirm countries with scores show `%` and `isolation score`; countries without scores show no right-side placeholder.
7. Confirm Chapter 1 KPI cards are larger, two-by-two, and still flip correctly.
8. Confirm section divider spacing, Chapter 2 explanation spacing, and Chapter 3 `+/- pts` alignment.
9. Confirm Chapter 4 shows CD art for the peak song.
10. Confirm conclusion stat cards are two-by-two square cards with larger text.

### Verification

- `npm run typecheck` passed.
- `dotnet build Capstone.API.csproj` passed.
- `git diff --check` passed.

---

## 2026-05-15 — New Local DB Restore and Post-Restore UI Regression Fixes

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Local SQL Server restore, backend/browser smoke test, Discovery Map SVG fills, Hidden Gems CD/artist-image loading states

### What I noticed

Before starting Issue 128 dashboard work, Leena provided an updated database backup: `05.15_HiddenGemMusic.bak`.

The local app needed to be verified against the new DB first because the work depends on updated dashboard/country data. The local setup is Docker SQL Server on macOS with SSMS running inside Parallels Windows 11.

After restore, the backend and main app screens worked, but two frontend regressions appeared during hands-on smoke testing:

- Navigating from Dashboard to Discovery could make map country gradients disappear until a hard refresh.
- Hidden Gems loaded faster, but Favorite Artists/CD artwork could remain blank placeholder colors after the glassy loading veil cleared.

### Restore and DB verification

- Backed up the previous local `HiddenGemMusic` database first.
- Copied Leena's backup into the Docker SQL container:
  - source: `/Users/stellar/Downloads/05.15_HiddenGemMusic.bak`
  - container: `capstone-sql`
  - destination: `/var/opt/mssql/backup/05.15_HiddenGemMusic.bak`
- Used `RESTORE FILELISTONLY` and confirmed logical names:
  - `HiddenGemMusic`
  - `HiddenGemMusic_log`
- Restored over the existing local `HiddenGemMusic` database name so the app did not need a new database name or connection string.
- Confirmed restored table counts:

| Table | Count |
|---|---:|
| `dbo.Country` | 246 |
| `dbo.DIM_Song` | 240,848 |
| `dbo.DIM_Artist` | 103,015 |
| `dbo.HiddenGems` | 2,585,433 |
| `dbo.IsolationScoreByCountry` | 546 |

### Endpoint smoke test

The following browser/API checks returned JSON after restore:

- `GET /api/metadata/years`
- `GET /api/discovery/countries?year=2025`
- `GET /api/dashboard/overlap-rate?start=2017-01-01&end=2025-12-31`
- `GET /api/dashboard/isolation-leader?start=2017-01-01&end=2025-12-31`
- `GET /api/dashboard/isolation-ranking?start=2017-01-01&end=2025-12-31`
- `GET /api/dashboard/discovery-gap?start=2017-01-01&end=2025-12-31&minCountries=2`
- `GET /api/dashboard/gap-distribution?start=2017-01-01&end=2025-12-31`
- `GET /api/dashboard/peak-reach?start=2017-01-01&end=2025-12-31`
- `GET /api/dashboard/overlap-trend?start=2017-01-01&end=2025-12-31`

Frontend smoke testing confirmed:

- Dashboard loaded.
- Discovery loaded.
- Country page loaded for US / 2025.
- Hidden Gems loaded for US / 2025.
- Comparison loaded for US vs. GB / 2025.

### Follow-up items intentionally not fixed in this pass

- `dashboard/isolation-ranking` currently returns 20 countries. That lines up with the upcoming Issue 128 scope and should be handled there with approval.
- `dashboard/overlap-rate` returned a nonzero `overlapPct` with `songsIn2Plus: 0`, while `overlap-trend` returned nonzero yearly `songsIn2Plus` values. This should be investigated as a later dashboard SP/output-mapping issue.

### Bug 1 — Discovery Map gradients disappeared after route navigation

**Symptom:** After navigating Dashboard → Discovery, countries with data sometimes lost their normal gradient fills and hovered countries lost their active gradient. A hard refresh restored the correct colors.

**Root cause:** `GlobeView.tsx` used fixed SVG gradient IDs such as `map-country-data-fill` and `map-country-active-fill`. On web route transitions, SVG `url(#...)` fill references could resolve against stale or missing paint definitions.

**Fix:** `GlobeView.tsx` now generates unique SVG gradient IDs per map instance with `useId`, and country fill references use those generated IDs.

### Bug 2 — Hidden Gems art loading ended before images were ready

**Symptom:** Favorite Artists CDs could stay as blank placeholder-color cases after the glassy loading veil cleared. The screen had also lost visible per-art spinners in places where image files were still loading.

**Root cause:** Favorite Artists were tied to the hidden-gems song-list loading boolean, but Favorite Artists depend on the separate country-profile request. Also, CD image loading was not tracked independently from API data loading.

**Fixes:**

- Added a profile-specific loading state for Hidden Gems Favorite Artists.
- Kept Favorite Artists in the glassy/loading state until country profile data arrives.
- Allowed Favorite Artists to reuse artist image URLs from the loaded Hidden Gems song rows when profile rows do not include image URLs.
- Updated `CdCaseArt.tsx` so each CD keeps its spinner/dim overlay until its actual image finishes loading or errors.
- Added equivalent per-image spinner/dim handling to mini CD artwork in the Hidden Gems song list.

### How to test

1. Restore/run against the new `HiddenGemMusic` database.
2. Open Dashboard, then navigate to Discovery without hard refresh.
3. Confirm countries with data keep their normal gradient fills.
4. Hover a country with data and confirm the active gradient appears.
5. Open Hidden Gems for a country/year with artwork.
6. Confirm Favorite Artists do not drop to blank placeholders while profile data is still loading.
7. Confirm CD art areas show individual spinners/dim overlays until their own image appears.

### Verification

- `npm run typecheck` passed after the Discovery Map SVG gradient fix.
- `npm run typecheck` passed after the Hidden Gems art-loading fixes.
- User verified the Hidden Gems loading fix worked after retest.

---

## 2026-05-15 — Discovery Globe SP Optimization and Summary Table

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_GetDiscoverPageInfo`, `sp_PopulateTopSongByCountryYear`, `TopSongByCountryYear` table

### What I noticed

`sp_GetDiscoverPageInfo` was scanning `ChartEntry` live on every globe screen load to find the most frequently charted song per country per year using `ROW_NUMBER() OVER (PARTITION BY ...)`. This scan runs against a very large table and was the main reason the Discovery Globe was slow on first load, even after the genre-sampling and frontend caching fixes.

Additionally, the `WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL` filter was written for the old Mapbox globe, which needed coordinates for dot placement. The Discovery screen now uses an SVG world map that matches countries by ISO code — so the lat/long filter was incorrectly excluding any country with a valid ISO code but no stored coordinates.

### What was fixed

- Created `TopSongByCountryYear` summary table with named FK constraints:

```sql
CREATE TABLE TopSongByCountryYear (
    country_id   INT            NOT NULL,
    chart_year   INT            NOT NULL,
    song_id      INT            NOT NULL,
    album_name   NVARCHAR(512)  NULL,
    artist_name  NVARCHAR(MAX)  NULL,
    CONSTRAINT PK_TopSongByCountryYear PRIMARY KEY (country_id, chart_year),
    CONSTRAINT FK_TSCY_Country FOREIGN KEY (country_id) REFERENCES Country(country_id),
    CONSTRAINT FK_TSCY_Song    FOREIGN KEY (song_id)    REFERENCES DIM_Song(song_id)
);
```

- Created `sp_PopulateTopSongByCountryYear` — uses a named CTE (`RankedSongs`) to scan `ChartEntry` once and store the winning song per country/year. Ties broken by `song_id ASC` for determinism. Includes a sanity-check result set showing rows populated per year.
- Updated `sp_GetDiscoverPageInfo` to `LEFT JOIN TopSongByCountryYear` instead of scanning `ChartEntry` live — SP now reads only pre-computed tables (`Country`, `HiddenGems`, `TopSongByCountryYear`) and is near-instant.
- Replaced `WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL` with `WHERE c.iso_code IS NOT NULL` — correctly scoped to what the SVG map actually needs for shape matching.
- Confirmed `latitude`/`longitude` stay in the `SELECT` — the `Country` TypeScript type requires them as non-optional fields; removing them from the response would require multi-file type system changes for no rendering benefit.
- Updated documentation headers on both SPs.

### How to test

1. In SSMS, confirm the table is populated: `SELECT chart_year, COUNT(*) AS countries FROM TopSongByCountryYear GROUP BY chart_year ORDER BY chart_year;`
2. Call `GET /api/discovery/countries?year=2021` — response time should be significantly faster than before on a cold server
3. Confirm `top_album_name` and `top_artist_name` are non-null for major countries (US, GB, JP, AR, etc.)
4. Confirm countries with no song data return `null` for those fields rather than an error
5. Confirm the globe renders all expected countries — the `iso_code IS NOT NULL` filter should not drop any country that was previously visible

### Verification

- `EXEC sp_GetDiscoverPageInfo @Year = 2021;`
- `EXEC sp_PopulateTopSongByCountryYear;` — check sanity output shows expected year/country counts

---

## 2026-05-15 — Hidden Gems Direct Navigation and Code Review Follow-Up

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Hidden Gems direct/reload prompt behavior, route header/breadcrumb stability, loading overlays, country filtering, fetch retry behavior, and Welcome navigation reset

### What I noticed

After the Issue 125 branch was reviewed and tested, these remaining risks or regressions needed focus:

- Direct `/hidden-gems` navigation needed to show the country/year selection prompt when there was no confirmed country/year context.
- In-app navigation to Hidden Gems still needed to skip the prompt and open the intended country/year page.
- Hidden Gems year changes could temporarily show `Loading country...` in the header and breadcrumb.
- Returning from Hidden Gems to Country could leave the Country header/breadcrumb stuck on `Loading country...`.
- A later fallback briefly showed country codes such as `AR` instead of full names such as `Argentina`.
- Hidden Gems sections needed the same glassy/dimmed loading treatment used elsewhere.
- The global Hidden Gems loading message used feature-specific copy instead of neutral `Loading...`.
- General app country filtering was too tightly coupled to `hiddenSongs > 0`.
- Fetch retry behavior could retry abort/timeout failures and duplicate long waits.
- Clicking `Welcome` from an active page could show the Welcome modal over that page instead of returning to the normal Welcome state.

### What was fixed

- Added app-owned Hidden Gems prompt logic for direct/reload paths without complete country/year params.
- Preserved app-driven Hidden Gems handoff behavior for Country and preview-click navigation.
- Added stable country lookup fallbacks so route titles, headers, and breadcrumbs keep full country names while API country pools reload.
- Added world-map ISO fallback so API ids like `iso-ar` resolve to `Argentina` rather than flashing `AR`.
- Added glassy/dimmed `Loading...` veils to the Hidden Gems song list, now-playing panel, and favorite-artists section.
- Replaced `Loading hidden gems...` with neutral `Loading...`.
- Split general app-data country filtering from Hidden-Gems-specific hidden-gem availability filtering.
- Limited fetch retry behavior to likely transient network fetch failures, not aborts or timeouts.
- Changed Welcome navigation from header/breadcrumb clicks to reset into the normal Welcome-over-Discovery stack.

### How to test

1. Open `/hidden-gems` directly with no country/year params. The country/year intro prompt should appear.
2. From a Country page, open Hidden Gems. It should go straight to that country's Hidden Gems page.
3. Refresh after app-driven Hidden Gems handoff. The selected country/year behavior should remain correct.
4. Change the Hidden Gems year dropdown. Header, document title, and breadcrumb should keep the full country name.
5. Return from Hidden Gems to Country. Header and breadcrumb should keep the full country name and should not get stuck on `Loading country...`.
6. Test an API country id route such as `iso-ar` when available. The label should resolve to `Argentina`, not flash `AR`.
7. Confirm Hidden Gems section loading uses the dimmed/glassy `Loading...` veil.
8. Confirm Hidden Gems loading text is neutral `Loading...`.
9. Check Discovery/Country/Comparison country choices are not wrongly removed just because a country has zero hidden gems.
10. Click `Welcome` from a Country or Hidden Gems page. Welcome should return to the normal Welcome state instead of appearing over the current page.

### Verification

- `npm run typecheck -- --noEmit`

### User runtime confirmation

mp3li confirmed:

- direct Hidden Gems prompt behavior is correct
- in-app Hidden Gems navigation is correct
- reload/handoff behavior is correct
- basic backend data loading is good
- glassy Hidden Gems loading treatment is correct
- country names no longer show `Loading country...` or flash country codes
- Welcome navigation behavior is good

---

## 2026-05-15 — Project Stabilization Follow-Up

**Tester:** mp3li / Codex-assisted verification
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Generated enrichment outputs, comparison year validation, shared native button timing, local config template, and stabilization verification coverage

### What I noticed

The whole-project review found several risks that could cause future regressions even though the project built successfully:

- Full generated enrichment outputs were tracked under `tools/song_data_enrichment/output/`.
- Comparison backend year validation still used stale hard-coded `1975..2021` rules while the app year flow now supports metadata-backed years, including 2025 when present.
- Shared native `ActionButton` behavior fired actions from `onPressIn` with a timer instead of normal `Pressable onPress`.
- Local backend config was ignored correctly, but there was no committed local example file.
- Frontend package scripts did not include a dedicated typecheck command.

### What was fixed

- Untracked full generated enrichment outputs while leaving local files on disk.
- Ignored `tools/song_data_enrichment/output/` and documented that full enrichment output/state is local runtime data.
- Updated Comparison backend validation to use available years from metadata instead of stale fixed year constants.
- Kept Comparison invalid-year behavior as `400` while making support follow the dataset year source of truth.
- Restored shared native `ActionButton` actions to normal `onPress` behavior while preserving pressed styling.
- Added a committed backend local settings example with placeholder values only.
- Added a frontend `typecheck` script.
- Updated backend API documentation so Comparison year validation matches the current metadata-backed behavior.

### How to test

1. Confirm `git ls-files tools/song_data_enrichment/output` returns no tracked output files.
2. Confirm `tools/song_data_enrichment/output/` files still exist locally if they existed before the cleanup.
3. Start the backend and call `GET /api/metadata/years`; confirm the expected dataset years are returned.
4. Call `GET /api/comparison?countryA=US&countryB=CA&year=2025`; it should not be rejected because of the old 2021 maximum when 2025 is in metadata.
5. Call `GET /api/comparison?countryA=US&countryB=CA&year=2022`; it should return `400` when 2022 is not in metadata.
6. On mobile, tap shared welcome/comparison buttons and confirm pressed styling still appears and navigation/action only happens on a completed press.
7. Re-run the Discovery Map checks from the Discovery Map stabilization entry below.

### Verification

- `git diff --check`
- `npm run typecheck`
- `dotnet build`

### User runtime confirmation

After the stabilization changes, mp3li tested locally and confirmed:

- Discovery Map still opens normally and keeps 2025 behavior.
- Welcome and Comparison buttons still show pressed styling and navigate.
- Comparison year dropdown includes 2025 when metadata returns it.
- Comparison with 2025 does not fail because of the old 2021 limit.
- Generated enrichment output files still exist locally while git no longer tracks `tools/song_data_enrichment/output/`.

---

## 2026-05-14 — Discovery Map Web/Mobile Stabilization

**Tester:** mp3li
**Fix owner:** mp3li / Codex-assisted implementation
**Scope:** Discovery Map default year, web hover/list behavior, mobile map controls, mobile country taps, mobile glassy blurb, welcome navigation, and reset behavior

### What I noticed

During hands-on web and mobile review, the Discovery Map had several issues that were not captured by compile-only checks:

- Discovery opened with 2025 data but the timeline slider visually appeared to be on 2024.
- Web year changes could leave refreshing/loading UI stuck or visible after leaving Discovery.
- Web map hover highlighted the country list but did not always scroll the highlighted row into view.
- Country-list and map no-song-data messaging could disagree.
- Mobile welcome-to-Discovery could feel unresponsive before the welcome modal disappeared.
- Mobile welcome dismissal could trigger an unhandled `GO_BACK` navigation warning when there was no route to pop.
- Mobile glassy blurb helper text overlapped the `Discovery Map` heading/gem and needed to sit under the divider line.
- Mobile map arrows/zoom/reset needed visible press feedback so the user could tell taps were accepted.
- Mobile map transform-based movement made country borders blurry.
- Mobile country taps needed the required rule: first tap previews, second tap on the same country opens detail.
- No-data countries needed visible borders so continent shapes remained readable.
- Mobile reset disappeared because reset visibility was tied to brittle viewport-default detection.

### What was fixed

- Set the app-owned Discovery default year to 2025 and aligned the slider's visual state to the actual selected year.
- Kept Discovery year refresh overlays scoped to Discovery and cleared them when navigating away.
- Preserved current map viewport across year changes instead of forcing a reset.
- Improved web map/list synchronization so country hover can bring the highlighted list row into view.
- Aligned no-song-data handling between list and map card/blurb states.
- Guarded welcome dismissal with `navigationRef.canGoBack()` before calling `goBack`.
- Added a safe fallback route to Discovery when welcome has no back route.
- Added tap guards and mobile pressed styling for welcome buttons.
- Reworked mobile map blurb positioning so it sits above the map, with the map below it.
- Restored the heading divider line and placed helper/detail text under it.
- Matched mobile blurb heading/detail text scale to nearby Discovery section/list text.
- Added separate mobile blurb heights for helper mode and country-detail mode.
- Kept web blurb compact after mobile layout changes.
- Restored crisp mobile map rendering by using SVG viewBox movement instead of scaling the whole SVG view.
- Added press styling to mobile arrow, zoom, and reset controls.
- Kept reset visible on mobile and fixed reset to compare against the real default viewport.
- Implemented mobile country tap behavior so only a second tap on the same country opens the Country page.
- Kept no-data country borders visible while leaving no-data country fills empty.

### How to test

1. Open Discovery from the welcome modal on mobile. The welcome button should show pressed feedback and the modal should dismiss without a `GO_BACK` warning.
2. Confirm Discovery initializes to 2025 and the timeline/slider visually agrees with the active year.
3. On web, hover a map country and confirm the matching country in the list is highlighted and brought into view.
4. Change Discovery year on web and confirm the map does not jump back to the default viewport unless Reset is pressed.
5. On mobile, tap one country once. It should update the glassy blurb and should not open the Country page.
6. Tap a different country once. It should preview that different country, not open it.
7. Tap the same selected country again. It should open the Country page.
8. Navigate back to Discovery and confirm stale selected-country highlighting does not incorrectly carry over as a fresh tap.
9. Use arrow, zoom, and reset controls on mobile and confirm each shows visible press styling.
10. Confirm no-data countries still show borders and the map remains crisp, not blurry.
11. Confirm the mobile glassy blurb is taller for helper copy and shorter for country detail copy.

### Verification

- `npx tsc --noEmit`
- `git diff --check`

Both passed after the final reset visibility and mobile blurb height fixes.

---

## 2026-05-13 — Frontend Load Optimization (Redundant API Calls)

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `loading-optimization`
**Scope:** `discoveryApi.ts`, `dashboardApi.ts`, `countryApi.ts`

### What I noticed

Audited all API fetch functions for repeat pinging — cases where the same endpoint was being called multiple times when once was enough. Found two categories: functions with no cache at all, and a race condition in a newly-added cache.

| File | Function | Problem |
|---|---|---|
| `dashboardApi.ts` | All 7 functions | No caching — all 7 dashboard endpoints re-fired on every visit to the dashboard screen (every mount) |
| `countryApi.ts` | `loadAvailableYears` | No cache — called independently in `App.tsx`, `CountryScreen`, and `ComparisonResultsScreen`; fired on every mount of each |
| `discoveryApi.ts` | `loadDiscoveryCountries` | No module-level cache — relied entirely on `App.tsx` React state, which doesn't deduplicate concurrent calls |

### What was fixed

**`dashboardApi.ts`** — Added a `Map` cache to all 7 functions (`loadOverlapRate`, `loadDiscoveryGap`, `loadIsolationLeader`, `loadPeakReach`, `loadOverlapTrend`, `loadIsolationRanking`, `loadGapDistribution`) keyed on the date range string. First visit fetches; every subsequent visit is served from the module cache with zero network requests. Also switched from bare `fetch()` to `fetchWithTimeoutAndRetry()` to match the rest of the codebase.

**`countryApi.ts` — `loadAvailableYears`** — Replaced a result-level cache (which still had a race window where concurrent callers could each fire their own request before the first resolved) with a Promise-level cache. All concurrent callers share the same in-flight request. If the request fails, the cache clears so the next call retries.

**`discoveryApi.ts` — `loadDiscoveryCountries`** — Added a module-level result cache and in-flight Promise deduplication, both keyed on year. On a cache hit, returns instantly. If a request for the same year is already in-flight (e.g., two callers at startup), the second caller shares the existing Promise instead of firing a second request.

### How to test

1. Open the app and navigate to the Dashboard — note load time
2. Navigate away and return to the Dashboard — should render **instantly** with no network requests visible in DevTools → Network tab
3. Open DevTools → Network, filter by `/api/metadata/years` — should appear **once** total across the session regardless of how many screens call it
4. Open DevTools → Network, filter by `/api/discovery/countries` — should appear **once per year** across the session; switching years fetches once for that year, switching back is instant

### Verification

- `npm run typecheck`

---

## 2026-05-13 — Genre Sampling Sequential Bottleneck

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `loading-optimization`
**Scope:** `CountryController.cs` — `GetCountryGenreSamples` endpoint

### What I noticed

Genre samples on the Discovery globe screen were taking an extremely long time on first load. DevTools showed the `/api/country/genre-samples` request for the initial 8-country batch was the bottleneck — country page visits were much faster and frequently showed browser disk cache hits.

The backend `GetCountryGenreSamples` endpoint processed country codes in a **sequential `foreach` loop**. For each code, it checked `IMemoryCache` first, then if not cached, called `GetCountryGenreSampleAsync` which involves a DB query and Deezer API calls. Because the loop was sequential, an 8-country batch request took the **sum** of all individual resolution times — potentially 8–12 seconds on a cold cache.

The country page felt faster because it only ever requests 1 country at a time, and browser disk cache hits from previous visits made repeat requests instant. The globe fires a batch URL with all 8 codes combined (e.g. `?codes=AR,AU,BR,DE,...`) — a URL the browser has never cached — so it always paid the full sequential cost.

### What was fixed

Changed the `foreach` loop to `Task.WhenAll` so all country codes in the batch are resolved **in parallel**:

```csharp
var tasks = normalizedCodes.Select(async (countryCode) => { ... });
var results = (await Task.WhenAll(tasks)).Where(sample => sample is not null).ToList();
```

Total resolution time for a batch is now the **slowest single country** instead of the sum of all of them.

This is safe with the existing Deezer infrastructure — `DeezerSongEnrichmentService` is registered as a singleton, so the shared `SlidingWindowRateLimiter` and file cache gate apply across all parallel tasks. The `IMemoryCache` keys are per-country-code so there is no concurrent access on the same key.

### How to test

1. Hard refresh and navigate to Discovery Globe — the genre loading spinner in the sidebar should resolve noticeably faster than before
2. In DevTools → Network, find the `/api/country/genre-samples` request — check its duration on first load (cold server cache) vs before the fix
3. Confirm the fix is safe: check the backend logs — no Deezer rate limit errors (`429`) should appear during the batch request

### Verification

- `dotnet build`

---

## 2026-05-13 — Backend Error Handling

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `67-cross-check-interfaces-controllers-against-sps`
**Scope:** All 7 controllers

### What I noticed

While reviewing the AR 2023 `OperationCanceledException` error in the backend logs, I checked error handling across all controllers and found it was completely inconsistent — some had none at all.

| Controller | Problem |
|---|---|
| `DashboardController` | No try-catch, no logger — all 7 endpoints unprotected |
| `GlobeController` | No try-catch, no logger |
| `MetadataController` | No try-catch, no logger |
| `HiddenGemsController` | No try-catch, no logger, takes `CancellationToken` but never handled it |
| `CountryController` | Had SqlException + Exception on all endpoints but was missing `OperationCanceledException` on 3 of 4 endpoints |

`ComparisonController` and `DiscoveryController` were already fine.

### What was fixed

All controllers now consistently catch:
- `SqlException` → 503 with a user-facing message + error log
- `OperationCanceledException` (where a `CancellationToken` is in scope) → silent `EmptyResult()`, no log — this is normal client disconnection behavior, not an error
- `Exception` → 500 with a user-facing message + error log

Logger was injected into the four controllers that were missing it.

### How to test

1. Start the API and make a valid request to any endpoint (e.g. `GET /api/dashboard/overlap-rate?start=2017-01-01&end=2021-12-31`)
2. Navigate away immediately / cancel the request — the server log should produce **no error entry** (silent `EmptyResult`, not a stack trace)
3. To verify 503: temporarily take the DB offline and hit any endpoint — should return `503` with the user-facing message, not a 500 or unhandled exception page
4. Sanity check: every controller action is wrapped in try-catch — no unprotected endpoints

### Verification

- `dotnet build`

---

## 2026-05-13 — CancellationToken Propagation

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `67-cross-check-interfaces-controllers-against-sps`
**Scope:** All controllers, interfaces, repositories, and the SQL data layer

### What I noticed

While fixing controller error handling, I found that `CancellationToken` was being dropped before it ever reached the database. Controllers accepted the token and passed it to repositories, but `IDataRepository.GetDataAsync` / `GetDataSetsAsync` had no token parameter at all — so cancellation stopped at the repository boundary. SQL commands ran to completion even after the client disconnected.

Additionally, even in repositories that already declared a token (CountryRepository, HiddenGemsRepository), some individual `_db` call sites weren't passing it through.

| Layer | Problem |
|---|---|
| `IDataRepository` | No `CancellationToken` on any of the 3 methods — token could never reach SQL |
| `SqlServerRepository` | `OpenAsync`, `ExecuteReaderAsync`, `ReadAsync`, `IsDBNullAsync`, `NextResultAsync` all called without a token |
| `IGlobeRepository`, `IMetadataRepository` | No token on their methods |
| `IComparisonRepository` | No token on either method |
| `IDashboardRepository` | No token on any of the 7 methods |
| `CountryRepository` | Token declared on public methods but dropped when calling `_db` — 5 call sites affected |
| `HiddenGemsRepository` | Token declared but dropped at the `_db.GetDataAsync` call |
| `DashboardController`, `GlobeController`, `MetadataController`, `ComparisonController`, `DiscoveryController` | No `CancellationToken` parameter on any endpoint — token was never in scope to begin with |

### What was fixed

- Added `CancellationToken cancellationToken = default` to all 3 `IDataRepository` methods
- Updated `SqlServerRepository` to pass the token to every async DB call
- Updated `MySqlRepository` signatures to match the interface
- Added token to `IGlobeRepository`, `IMetadataRepository`, `IComparisonRepository`, and all 7 methods on `IDashboardRepository`
- Updated all repository implementations to accept and pass the token to `_db` calls
- Added `CancellationToken` parameter to all controller endpoints that were missing it — ASP.NET Core automatically binds this from `HttpContext.RequestAborted`
- Added `OperationCanceledException` catch to all newly-updated controller endpoints
- Threaded token through `DiscoveryController` to both its repo calls

Token now flows end to end: browser cancels → ASP.NET cancels token → controller → repository → `_db` → SQL command interrupted.

Without this, every cancelled request held a live SQL connection open until the query finished. On slow scans — like the genre sampling that caused the AR 2023 error — the server kept doing work and holding resources for a client that was already gone.

### How to test

1. Open SQL Server Activity Monitor or query `sys.dm_exec_requests` before and after a cancelled request
2. Hit a slow endpoint (Hidden Gems with a large dataset, or genre sampling on a country not yet cached) and navigate away immediately
3. The in-flight SQL session should disappear from `dm_exec_requests` promptly — previously it would run to completion regardless of client disconnect

### Verification

- `dotnet build`

---

## 2026-05-13 — Model Nullability Audit

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `67-cross-check-interfaces-controllers-against-sps`
**Scope:** All 20 model files across Dashboard, Comparison, Country, Globe, HiddenGems, and Shared folders

### What I noticed

Audited all models against their source stored procedures to check whether non-nullable value-type properties could actually receive NULL from the database.

| Model | Property | Was | Should Be | Reason |
|---|---|---|---|---|
| `GlobalTrendPoint` | `OverlapPct` | `decimal` | `decimal?` | Gap rows in `sp_GetGlobalOverlapTrend` return NULL for all metric columns — Recharts uses `IsGap` to skip rendering these points |
| `GlobalTrendPoint` | `AvgCountries` | `decimal` | `decimal?` | Same — gap row |
| `GlobalTrendPoint` | `TotalUniqueSongs` | `int` | `int?` | Same — gap row |
| `GlobalTrendPoint` | `SongsIn2Plus` | `int` | `int?` | Same — gap row |
| `PeakReachKpi` | `PeakDate` | `DateOnly` | `DateOnly?` | `AsDateOnly` returned `DateOnly.MinValue` for NULL, masking missing dates instead of surfacing them |

All remaining non-nullable value-type properties (`int` counts, `decimal` percentages, `double` lat/long, chart ranks) are backed by columns that are structurally guaranteed non-null by their SPs or are aggregates that always produce a value.

### What was fixed

- Made 4 metric properties on `GlobalTrendPoint` nullable (`decimal?` / `int?`)
- Made `PeakDate` on `PeakReachKpi` nullable (`DateOnly?`)
- Updated `DashboardRepository` mapping for `GlobalTrendPoint` to call `AsNullableDecimal` and `AsNullableInt`
- Updated `DashboardRepository` mapping for `PeakReachKpi` to call `AsNullableDateOnly`
- Added `AsNullableDecimal` and `AsNullableDateOnly` private helper methods to `DashboardRepository`
- Removed the old non-nullable `AsDateOnly` helper (no longer used)

### How to test

1. Call `GET /api/dashboard/overlap-trend?start=2017-01-01&end=2024-12-31` — the response should include rows where `overlapPct`, `avgCountries`, `totalUniqueSongs`, and `songsIn2Plus` are `null` (not `0`) when `isGap` is `true`
2. Verify the dashboard gap region renders as a dashed line, not a flat zero line through the data gap
3. Call `GET /api/dashboard/peak-reach?start=2017-01-01&end=2024-12-31` — `peakDate` should be `null` if the SP returns NULL, not `"0001-01-01"`

### Verification

- `dotnet build`

---

## 2026-05-13 — Bug 7: `sp_GetAverageDiscoveryGap` Imprecise Date Filter and Wrong Floor

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** `sp_GetAverageDiscoveryGap`

### What I noticed

During the SP / interface / controller cross-check pass, `sp_GetAverageDiscoveryGap` was identified as having the same class of issues as Bug 6 (gap distribution SP):

- **Date filtering via `SongCountryPresence` join** — the SP filtered by `scp.chart_year`, which records when a song was charting, not when its spread event originated. A song spreading in 2018 could appear in SCP rows for 2019 and 2020, making the join an imprecise date boundary.
- **Floor at `days_to_spread > 0`** — included day-1 entries (songs released simultaneously across markets on launch day), which are global rollouts rather than organic cross-border discovery events. Inconsistent with the population SP after its `> 1` floor update.

### What was fixed

Replaced the `SongCountryPresence` date join with `WHERE dgd.first_chart_date BETWEEN @DateStart AND @DateEnd`, matching the pattern applied to `sp_GetDiscoveryGapDistribution` in Bug 6. Floor raised from `> 0` to `> 1` for consistency with the population SP.

Note: `SongCountryPresence` is still used in the `EXISTS` clause for the `@MinCountries` filter — that use is correct and unchanged.

### How to test

1. Change the date range on the Dashboard — the Avg Discovery Gap KPI values should update to reflect only spread events originating within the selected period
2. Confirm the median and mean values are consistent with the gap distribution histogram for the same date range

### Verification

- Re-run `sp_GetAverageDiscoveryGap.sql` in SSMS. No repopulation required.

---

## 2026-05-13 — Bug 6: `sp_GetDiscoveryGapDistribution` Date Range Parameters Unused

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** `sp_GetDiscoveryGapDistribution`, `sp_PopulateDiscoveryGapByDay`, `DiscoveryGapByDay` table

### What I noticed

`@DateStart` and `@DateEnd` were declared in the SP signature and passed through from `DashboardController` → `IDashboardRepository` → the SP, but the SP body never referenced them. Every call returned the complete all-years dataset regardless of what date range the caller passed.

An initial fix using `JOIN SongCountryPresence` and filtering by `scp.chart_year` was applied but found to be semantically imprecise — `chart_year` records when a song was charting, not when the spread event originated. A song could spread in 2018 but still appear in SCP rows for 2019 and 2020.

### What was fixed

- **Schema change:** `ALTER TABLE DiscoveryGapByDay ADD first_chart_date DATE NULL` — stores the origin date of the spread event directly on the pre-computed table.
- **`sp_PopulateDiscoveryGapByDay` updated:** Added `first_chart_date` to the INSERT, populated from `origin_date` in the `Spread` CTE. Also raised the floor from `gap_days > 0` to `gap_days > 1` — day-1 entries are songs released simultaneously across markets on launch day (global rollouts, not organic cross-border discovery events).
- **`sp_GetDiscoveryGapDistribution` updated:** Removed `SongCountryPresence` join entirely. Filter is now `WHERE dgbd.first_chart_date BETWEEN @DateStart AND @DateEnd` — directly scoped to when the spread event originated.

### How to test

1. Change the date range on the Dashboard — the gap distribution histogram should update and reflect only spread events originating in the selected period
2. Selecting only DS1 years (2017–2021) should not show 2023 data

### Verification

- Run `ALTER TABLE` in SSMS, re-run `sp_PopulateDiscoveryGapByDay` to populate `first_chart_date`, then re-run the read SP.

---

## 2026-05-13 — Bug 5: `sp_GetHiddenGems` Missing `total_count` — Pagination Permanently Broken

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** `sp_GetHiddenGems`, `HiddenGemsRepository`

### What I noticed

`HiddenGemsRepository` reads `total_count` from the first result row to compute the `hasMore` flag used for infinite scroll pagination. The SP never returned this column, so `totalRawCount` always defaulted to 0 and `hasMore` was always `false`. Pagination was broken on every load regardless of filter parameters — only the first page was ever shown.

### What was fixed

Added `COUNT(1) OVER() AS total_count` to the SELECT in `sp_GetHiddenGems`, matching the pattern already used in `sp_GetCountrySongsPaged`. No repopulation required — the fix is in the read SP only.

### How to test

1. Navigate to Hidden Gems for a country with many hidden gems (e.g. US, GB)
2. Scroll to the bottom of the list — additional pages should load via infinite scroll
3. Confirm `hasMore` is `true` when more results exist and `false` only on the last page

### Verification

- Re-run `sp_GetHiddenGems.sql` in SSMS. No repopulation required.
- `dotnet build`

---

## 2026-05-08 — Viral 50 / Top 200 Chart Type Conflation

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_PopulateSongCountryPresence`, `sp_PopulateDiscoveryGapByDay`, `sp_PopulatePeakReachBySong` — all six summary tables repopulated

### What I noticed

During dashboard narrative design review, it was identified that the Top 200 and Viral 50 chart types in Dataset 1 measure fundamentally different phenomena but were being treated as equivalent charting events in all population stored procedures.

- **Top 200:** sustained listener demand — streams-based, reflects adoption
- **Viral 50:** rate-of-spread — a song can enter with minimal total streams by spreading simultaneously across markets

This affected multiple metrics: the Discovery Gap 0–7d bucket was heavily inflated by Viral 50 simultaneous-spread events, the Global Overlap Rate was inflated by Viral 50 entries, and the Peak Cross-Regional Reach winner was a Viral 50 result (70 countries — abcdefu) rather than a meaningful Top 200 adoption event.

### What was fixed

`AND ce.chart_type_id != 2` added to the `WHERE` clause of the `ChartEntry` query in three population procedures:
- `sp_PopulateSongCountryPresence` — main WHERE clause
- `sp_PopulateDiscoveryGapByDay` — FirstAppearance CTE
- `sp_PopulatePeakReachBySong` — DailyReach CTE

During repopulation, the `gap_days > 0` filter in `sp_PopulateDiscoveryGapByDay` was also found to have reverted to `>= 0` during the SP rewrite — corrected back to `> 0` and repopulated.

All six summary tables repopulated in dependency order: `sp_PopulateSongCountryPresence` → `sp_PopulateDiscoveryGapByDay` → `sp_PopulatePeakReachBySong` → `sp_PopulateGlobalOverlapByYear` → `sp_PopulateCountryYearStats` → `sp_PopulateIsolationScoreByCountry`.

Post-fix values vs. pre-fix:

| Metric | Pre-fix | Post-fix |
|---|---|---|
| Global Overlap Rate | 26% | 25% |
| Discovery Gap median | 4d | 12d |
| Discovery Gap mean | 38d | 108d |
| Peak Cross-Regional Reach | 70 countries (abcdefu) | 69 countries (STAY — The Kid LAROI) |

SP headers updated with 05/08/2026 update lines. Dashboard chart legend updated from "2017–2021 (Top 200 + Viral 50)" to "2017–2021 (Top 200 only)".

### How to test

1. Confirm Global Overlap Rate KPI shows ~25%
2. Confirm Discovery Gap KPI shows median ~12d, mean ~108d — the mean/median divergence is expected and documented
3. Confirm Peak Cross-Regional Reach winner is STAY (The Kid LAROI), not abcdefu

### Verification

- Query `SELECT COUNT(*) FROM SongCountryPresence` before and after — count should decrease after excluding Viral 50
- `EXEC sp_PopulateGlobalOverlapByYear;` — check output values match documented post-fix numbers

---

## 2026-04-29 — Bug 3: Argentina 2023 Hidden Gems — Seasonal Data Skew

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** Year selector label, Hidden Gems / Country Profile / Country Comparison / Globe filter panel

### What I noticed

Argentina's Hidden Gems list for 2023 was dominated by Christmas songs: "All I Want for Christmas Is You," "Last Christmas," "Rockin' Around the Christmas Tree," "Jingle Bell Rock," etc. Dataset 2 begins October 17, 2023 — so "2023" in the dataset means Oct 17 – Dec 31 only (75 days, heavily December). Christmas songs dominate December global charts, achieve high `country_count`, score well on TrendScore formula, and Argentina did not chart them — making them technically valid hidden gems under the SP logic, but obviously misleading to end users.

The SP is functioning correctly given the data it has. The issue is entirely a data scope limitation inherent to Dataset 2's start date.

### What was fixed

- Year selector updated to display **"2023 (Oct–Dec)"** wherever 2023 appears as a filter option — applied consistently across Hidden Gems, Country Profile, Country Comparison, and Globe screens
- Limitation documented in dashboard About This Data section

### How to test

1. Open any year selector in the app — 2023 should appear as "2023 (Oct–Dec)" not plain "2023"
2. Confirm the label appears consistently on the Hidden Gems screen, Country Profile screen, Comparison screen, and Discovery Globe year filter

### Verification

- Visual check across all year-selector UI surfaces

---

## 2026-04-29 — Bug 2: Global Reach vs. Overlap Rate Apparent Tension

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** Dashboard — Global Reach Over Time chart labels and explainer copy

### What I noticed

The Global Overlap Rate KPI showed 26% of songs appearing in 2+ countries. The Global Reach Over Time chart showed average countries per song of ~2.9–3.2 for DS1 years. These appeared inconsistent — a 26% overlap rate with most songs staying in 1 country seemed to contradict an average of ~3 countries per song.

Investigation confirmed no SP bug: the math is consistent (74% of songs × 1 country + 26% of songs × ~9 countries ≈ 3.1 average). The real issues were labeling: 2023 covers Oct–Dec only (smaller song pool, lower avg_countries) and DS2 years use Top 50 charts vs DS1's Top 200 — smaller pool produces lower averages that are not directly comparable.

### What was fixed

No SP changes. Frontend only:
- 2023 x-axis label marked with asterisk in orange
- 2023 bar dimmed to 45% opacity
- Tooltip for 2023 shows "2023 (Oct–Dec only)"
- Partial year legend item added
- Chart explainer text updated to note DS1 vs DS2 chart scope difference

### How to test

1. Open the Dashboard — 2023 bar in the Global Reach chart should appear visually dimmed with an asterisk
2. Hover the 2023 bar — tooltip should show "2023 (Oct–Dec only)"
3. Confirm a partial-year legend item is visible

### Verification

- Visual check of the Dashboard Global Reach Over Time chart

---

## 2026-04-29 — Bug 1: Discovery Gap KPI vs. Distribution Chart Contradiction

**Tester:** Leena Komenski
**Fix owner:** Leena Komenski / Claude-assisted implementation
**Scope:** `sp_PopulateDiscoveryGapByDay`, `sp_GetAverageDiscoveryGap`, `sp_GetDiscoveryGapDistribution` — table repopulated

### What I noticed

The Avg Discovery Gap KPI card showed 43 days average. The Discovery Gap Distribution histogram showed the 0–7d bucket as by far the tallest bar, with most songs appearing to cross in under a week. A mean of 43 days is not consistent with a distribution heavily weighted toward 0–7 days.

Investigation found the average SP was averaging across all song-country pair rows (one per destination country per song), while the distribution SP counted distinct songs once each — an aggregation unit mismatch. After fixing the aggregation, the new average was 7 days with median 0, still inconsistent. Direct query of `days_to_spread` distribution revealed 55,276 day-zero rows — left-censored artifacts from Dataset 2's start date (songs already globally charting when data collection began). Changing the populate SP filter from `gap_days >= 0` to `gap_days > 0` and repopulating yielded avg 38 days, median 4 days. Further boundary-week contamination analysis confirmed the fast-crossing distribution is real behavior driven by streaming-era music and Viral 50 chart dynamics, not a data artifact.

### What was fixed

- **`sp_PopulateDiscoveryGapByDay`:** changed `WHERE gap_days >= 0` to `WHERE gap_days > 0`. Added HAVING filter to Origin CTE excluding dataset opening-week origins.
- **`sp_GetAverageDiscoveryGap`:** rewrote to aggregate to `MIN(days_to_spread)` per song before averaging (previously averaging all destination-country rows).
- **`sp_GetDiscoveryGapDistribution`:** added date range filter, changed `>= 0` to `> 0`.
- Table repopulated. Final values: avg 38 days, median 4 days, sample size 35,448.
- UI copy updated in both the KPI card and the distribution chart to accurately describe the data shape and note Viral 50 contribution to the 0–7d bucket.

Post-fix bucket distribution:

| Bucket | Song count |
|---|---|
| 0–7d | 21,936 |
| 8–14d | 8,033 |
| 15–30d | 11,517 |
| 31–60d | 6,966 |
| 61–90d | 3,103 |
| 90d+ | 6,711 |

### How to test

1. Confirm Dashboard KPI shows avg ~38 days, median ~4 days
2. Confirm the distribution histogram's 0–7d bucket is the tallest, consistent with a median of 4 days
3. The mean/median divergence is expected — the KPI card flip side should explain "Why two numbers?"

### Verification

- `EXEC sp_GetAverageDiscoveryGap @DateStart = '2017-01-01', @DateEnd = '2021-12-31';`
- `EXEC sp_GetDiscoveryGapDistribution @DateStart = '2017-01-01', @DateEnd = '2021-12-31';`
- Confirm avg and histogram values are mutually consistent
