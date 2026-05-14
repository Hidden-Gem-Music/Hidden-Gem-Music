# QA Findings Log
## Dashboard Integration Testing — April 29, 2026

**Project:** HiddenGemMusic Capstone  
**Author:** Leena Komenski  
**Session:** April 29, 2026  
**Scope:** Global Overlap Dashboard — real data hookup testing  

---

## Summary

Three data inconsistencies were identified during live dashboard integration testing on April 29, 2026. All three were investigated to root cause. Two required SP fixes and table repopulation. One was confirmed as a known data scope limitation requiring UI labeling only. No issues were found to be frontend bugs.

| # | Issue | Status | Fix Type |
|---|-------|--------|----------|
| 1 | Avg Discovery Gap KPI contradicts Distribution chart | Resolved | SP rewrite + repopulate |
| 2 | Global Reach values inconsistent with Overlap Rate KPI | Resolved | UI labeling only |
| 3 | Argentina 2023 hidden gems dominated by Christmas songs | Known limitation | UI labeling only |
| 4 | Viral 50 / Top 200 treated as equivalent charting events across all metrics | Known limitation — flagged for future iteration | UI copy + ADR documentation |

---

## Bug 1 — Discovery Gap KPI vs. Distribution Chart Contradiction

**Severity:** High — two dashboard elements directly contradicted each other  
**Status:** Resolved

### What was observed

The Avg Discovery Gap KPI card showed 43 days average. The Discovery Gap Distribution histogram showed the 0–7d bucket as by far the tallest bar, with most songs appearing to cross in under a week. A mean of 43 days is not consistent with a distribution heavily weighted toward 0–7 days.

### Investigation steps

1. Compared `sp_GetAverageDiscoveryGap` and `sp_GetDiscoveryGapDistribution` source logic side by side
2. Identified that the average SP was averaging across all song-country pair rows (one per destination country per song), while the distribution SP counted distinct songs once each
3. Fixed aggregation unit mismatch — rewrote average SP to use `MIN(days_to_spread)` per song first
4. New average after fix: 7 days, median 0 — still wrong
5. Queried `days_to_spread` distribution directly:

```
days_to_spread   song_count
0                55,276
1                 9,710
2                 6,553
...
```

6. Identified 55,276 day-zero rows as left-censored artifacts from Dataset 2 start date (Oct 17, 2023) — songs already globally charting when data began
7. Changed populate SP final filter from `gap_days >= 0` to `gap_days > 0`, repopulated
8. New average: 38 days, median 4 days — 0–7d bucket still largest at ~21,936
9. Ran boundary-week spread analysis:

```
origin_type          song_count
DS2 boundary week    21,920
interior                  1,258
```

This suggested boundary contamination — but after applying HAVING filter to Origin CTE and repopulating, the bucket barely moved.

10. Ran spread_year distribution query — confirmed fast crossings are distributed across interior years (2017–2021), not concentrated at boundaries
11. Confirmed data is clean. Fast crossings are real behavior driven by streaming-era music and Viral 50 chart dynamics.

### Resolution

- `sp_PopulateDiscoveryGapByDay`: changed `WHERE gap_days >= 0` to `WHERE gap_days > 0`. Added HAVING filter to Origin CTE excluding dataset opening-week origins.
- `sp_GetAverageDiscoveryGap`: rewrote to aggregate to `MIN(days_to_spread)` per song before averaging.
- `sp_GetDiscoveryGapDistribution`: added date range filter, changed `>= 0` to `> 0`.
- Table repopulated. Final values: avg 38 days, median 4 days, sample size 35,448.
- UI copy updated in both the KPI card and the distribution chart to accurately describe the data shape and note Viral 50 contribution to the 0–7d bucket.

### Final bucket distribution

```
bucket_label   song_count
0-7d           21,936
8-14d           8,033
15-30d         11,517
31-60d          6,966
61-90d          3,103
90d+            6,711
```

### Remaining known limitation

Day-zero rows are excluded, but days 1–6 still include some songs from Dataset 2's opening week whose crossings may not represent real discovery events. The spread_year analysis showed only 85 such songs in 2023 — small enough to accept as a known limitation rather than apply more aggressive filtering that could exclude legitimate fast crossings.

---

## Bug 2 — Global Reach Over Time Values vs. Overlap Rate Tension

**Severity:** Medium — values appeared inconsistent across dashboard cards  
**Status:** Resolved (no SP changes required)

### What was observed

The Global Overlap Rate KPI showed 26% of songs appearing in 2+ countries. The Global Reach Over Time chart showed average countries per song of ~2.9–3.2 for DS1 years. A 26% overlap rate with most songs staying in 1 country seemed inconsistent with an average of ~3 countries per song.

### Investigation steps

1. Pulled `sp_PopulateSongCountryPresence` — confirmed it uses `COUNT(DISTINCT ce.country_id)`, correct
2. Ran sanity check query — `MAX(country_count)` returned 70, confirming distinct countries not chart entries
3. Verified the math: 74% of songs × 1 country + 26% of songs × ~9 countries = ~3.1 average — consistent
4. Identified the real issues as labeling, not data:
   - 2023 covers Oct 17 – Dec 31 only (75 days), producing a smaller song pool and lower avg_countries
   - DS2 years use Top 50 charts vs DS1's Top 200 — smaller pool produces lower averages, not directly comparable

### Resolution

No SP changes. Frontend changes only:
- 2023 x-axis label marked with asterisk in orange
- 2023 bar dimmed to 45% opacity
- Tooltip for 2023 shows "2023 (Oct–Dec only)"
- Partial year legend item added
- Chart explainer text updated to note DS1 vs DS2 chart scope difference

---

## Bug 3 — Argentina 2023 Hidden Gems: Christmas Song Flooding

**Severity:** Medium — data appeared obviously wrong to end users  
**Status:** Known limitation, documented

### What was observed

Argentina's Hidden Gems list for 2023 was dominated by Christmas songs: "All I Want for Christmas Is You," "Last Christmas," "Rockin' Around the Christmas Tree," "Jingle Bell Rock," etc. This is implausible as a meaningful discovery recommendation.

### Investigation steps

1. Reviewed `sp_PopulateHiddenGems` — confirmed `chart_year` is assigned via `YEAR(snapshot_date)`
2. Identified that Dataset 2 begins October 17, 2023
3. Therefore "2023" = Oct 17 – Dec 31, 2023 only — 75 days, heavily December
4. Christmas songs dominate December global charts, achieve high `country_count`, score well on TrendScore formula, and Argentina did not chart them
5. SP logic is correct — it is accurately returning globally present songs absent from Argentina in the data it has

### Resolution

No SP changes. The SP is functioning correctly given the data it receives. Fixes applied:
- Year selector to display "2023 (Oct–Dec)" wherever 2023 appears as a filter option
- This convention applies across Hidden Gems, Country Profile, Country Comparison, and Globe screens
- Limitation documented in dashboard About This Data section

### Broader implication

Any 2023 year filter across the entire application returns a Q4-only, seasonally skewed slice. This is a data scope limitation inherent to Dataset 2's start date, not a fixable bug. All team members should apply the "(Oct–Dec)" label consistently wherever 2023 appears as a selectable year.

---

## Issue 4 — Viral 50 / Top 200 Chart Type Conflation

**Severity:** Medium — affects interpretation of multiple dashboard metrics  
**Status:** Resolved — SP fix applied 05/08/2026  
**Identified:** May 6, 2026 — dashboard design review  
**Resolved:** May 8, 2026  

### What was observed

During dashboard narrative design review, it was identified that the Top 200 and Viral 50 
chart types in Dataset 1 measure fundamentally different phenomena but were being treated 
as equivalent charting events in all population stored procedures.

- **Top 200:** sustained listener demand — streams-based, reflects adoption
- **Viral 50:** rate-of-spread — a song can enter with minimal total streams by spreading 
  simultaneously across markets

### Metrics affected (pre-fix values)

| Metric | How it was affected |
|--------|-------------------|
| Discovery Gap median (4d) / mean (38d) | 0–7d bucket heavily driven by Viral 50 simultaneous-spread events, compressing measured crossover speed |
| Global Overlap Rate (26%) | Inflated by Viral 50 entries that technically cross borders but reflect sharing behavior, not adoption |
| Peak Cross-Regional Reach (70 countries — abcdefu) | Viral 50 result — represented viral spread, not sustained Top 200 charting across 70 markets |
| Global Reach Over Time avg countries (2.9–3.2) | Pulled upward by Viral 50 entries throughout DS1 years |

### Fix applied — 05/08/2026

`AND ce.chart_type_id != 2` added to the `WHERE` clause of the `FACT_ChartEntry` query 
in three population procedures:

- `sp_PopulateSongCountryPresence` — main WHERE clause
- `sp_PopulateDiscoveryGapByDay` — FirstAppearance CTE
- `sp_PopulatePeakReachBySong` — DailyReach CTE

During repopulation, day-zero rows (left-censored artifacts) were also confirmed to still 
be present. The `gap_days > 0` filter in `sp_PopulateDiscoveryGapByDay` was verified and 
corrected — it had reverted to `>= 0` during the SP rewrite. Repopulated with `> 0` 
restored.

All six summary tables repopulated in dependency order:
1. `sp_PopulateSongCountryPresence`
2. `sp_PopulateDiscoveryGapByDay`
3. `sp_PopulatePeakReachBySong`
4. `sp_PopulateGlobalOverlapByYear`
5. `sp_PopulateCountryYearStats`
6. `sp_PopulateIsolationScoreByCountry`

### Post-fix values

| Metric | Pre-fix | Post-fix |
|--------|---------|----------|
| Global Overlap Rate | 26% | 25% |
| Discovery Gap median | 4d | 12d |
| Discovery Gap mean | 38d | 108d |
| Peak Cross-Regional Reach | 70 countries (abcdefu) | 69 countries (STAY — The Kid LAROI) |

The mean/median divergence (12d vs 108d) is expected and analytically meaningful — 
most crossovers happen fast, but a long tail of slow-movers pulls the mean up sharply. 
This is documented in the dashboard UI via the KPI card flip side ("Why two numbers?") 
and is accurate behavior, not an artifact.

### Dashboard and documentation updates

- `dashboard-about-this-data-copy.md` — ⚠ known limitation paragraph replaced with 
  chart type scope clarification note
- Chart legend in section 3 updated from "2017–2021 (Top 200 + Viral 50)" to 
  "2017–2021 (Top 200 only)"
- SP headers updated with 05/08/2026 update lines in all three modified procedures

### Connection to prior findings

The Viral 50 contribution to the 0–7d bucket was first noted during the April 29 QA 
session (Issue 1, Root Cause C decision) and accepted as a data characteristic. May 6 
review elevated this to a measurement design limitation. May 8 fix resolved it at the 
data layer.

---

## Open Items After April 29 Session

- [ ] Apply "2023 (Oct–Dec)" year selector label across all screens — Hidden Gems, 
      Country Profile, Country Comparison, Globe filter panel
- [x] Confirm `sp_GetDiscoveryGapDistribution` date range filter is correctly wired 
      from the frontend date params — resolved May 13 (see Bug 6 below)
- [ ] Issue 2 (Global Reach) frontend changes need to be verified on mobile layout 
      as well as web

---

---

# SP / Interface / Controller Cross-Check — May 13, 2026

**Branch:** `67-cross-check-interfaces-controllers-against-sps`  
**Scope:** Full audit of all stored procedures against C# interfaces, repositories, and controllers.  

---

## Summary

Two critical bugs found and fixed. Two non-bugs identified and closed. One additional data quality improvement made during fix validation.

| # | Issue | Status | Fix Type |
|---|-------|--------|----------|
| 5 | `sp_GetHiddenGems` missing `total_count` — pagination permanently broken | Resolved | SP fix |
| 6 | `sp_GetDiscoveryGapDistribution` ignoring `@DateStart`/`@DateEnd` — always returned all-years data | Resolved | SP fix + schema change + repopulate |
| 7 | `sp_GetAverageDiscoveryGap` using imprecise date filter + wrong floor — same class of issue as Bug 6 | Resolved | SP fix |
| — | `IGlobeRepository` XML doc comment references wrong SP name | Non-bug — documentation only, no runtime impact | No action |
| — | `genre` column read in `HiddenGemsRepository` — SP doesn't return it | Non-bug — `AsStringAny` returns null gracefully, Deezer enrichment populates it later | No action |

---

## Bug 5 — `sp_GetHiddenGems` Missing `total_count` Column

**Severity:** Critical — Hidden Gems pagination was permanently broken  
**Status:** Resolved

### What was observed

`HiddenGemsRepository` reads `total_count` from the first result row to compute the `hasMore` flag used for infinite scroll pagination. The SP never returned this column, so `totalRawCount` always defaulted to 0 and `hasMore` was always `false`. Pagination was broken on every load regardless of filter parameters.

### Resolution

Added `COUNT(1) OVER() AS total_count` to the SELECT in `sp_GetHiddenGems`, matching the pattern already used in `sp_GetCountrySongsPaged`. No repopulation required — the fix is in the read proc only.

**File:** `backend/Capstone.API/SQL Scripts/read/sp_GetHiddenGems.sql`  
**Deploy:** Re-run SP in SSMS.

---

## Bug 6 — `sp_GetDiscoveryGapDistribution` Date Range Parameters Unused

**Severity:** Critical — histogram always showed all-years aggregate regardless of selected date range  
**Status:** Resolved

### What was observed

`@DateStart` and `@DateEnd` were declared in the SP signature and passed through from `DashboardController` → `IDashboardRepository` → the SP, but the SP body never referenced them. Every call returned the complete all-years dataset regardless of what date range the caller passed.

### Initial fix (superseded)

Added a `JOIN SongCountryPresence ON scp.song_id = dgbd.song_id` and filtered by `scp.chart_year BETWEEN YEAR(@DateStart) AND YEAR(@DateEnd)`. This wired the parameters but was identified as semantically imprecise: `SongCountryPresence.chart_year` records when a song was charting, not when the spread event originated. A song could spread in 2018 but still appear in `SongCountryPresence` for 2019 and 2020, making the join a noisy proxy for filtering by spread timing.

### Proper fix

1. **Schema change:** `ALTER TABLE DiscoveryGapByDay ADD first_chart_date DATE NULL` — stores the origin date of the spread event directly on the pre-computed table.

2. **`sp_PopulateDiscoveryGapByDay` updated:** Added `first_chart_date` to the INSERT column list, populated from `origin_date AS first_chart_date` in the `Spread` CTE. `origin_date` was already computed (`MIN(first_date)` from `Origin` CTE) — it just wasn't being stored.

3. **Additional data quality improvement:** Floor raised from `gap_days > 0` to `gap_days > 1`. Day-1 entries represent songs released simultaneously across multiple markets on launch day — these are global rollouts, not organic cross-border discovery events. Excluding them tightens the semantic accuracy of what the histogram represents.

4. **`sp_GetDiscoveryGapDistribution` updated:** `SongCountryPresence` join removed entirely. Filter is now `WHERE dgbd.first_chart_date BETWEEN @DateStart AND @DateEnd` — directly scoped to when the spread event originated.

**Files:**
- `backend/Capstone.API/SQL Scripts/read/sp_GetDiscoveryGapDistribution.sql`
- `backend/Capstone.API/SQL Scripts/population/sp_PopulateDiscoveryGapByDay.sql`

**Deploy:** Run `ALTER TABLE` in SSMS, re-run `sp_PopulateDiscoveryGapByDay` to repopulate with `first_chart_date` stored, then re-run the read SP.

---

## Bug 7 — `sp_GetAverageDiscoveryGap` Imprecise Date Filter and Wrong Floor

**Severity:** High — KPI 2 avg/median values were not correctly scoped to the selected date range, and included day-1 global rollout entries  
**Status:** Resolved

### What was observed

During the same cross-check pass that produced Bug 6, `sp_GetAverageDiscoveryGap` was identified as having the same class of issues as the distribution SP:

1. **Date filtering via `SongCountryPresence` join** — the SP was filtering by `scp.chart_year`, which records when a song was charting, not when its spread event originated. A song spreading in 2018 could appear in SCP rows for 2019 and 2020, making the join imprecise as a date boundary.

2. **Floor at `days_to_spread > 0`** — including day-1 entries (songs released simultaneously across markets on launch day), which are global rollouts rather than organic cross-border discovery events. Inconsistent with the population proc after its `> 1` floor update.

### Resolution

Replaced `SongCountryPresence` date join with `WHERE dgd.first_chart_date BETWEEN @DateStart AND @DateEnd`, matching the pattern applied to `sp_GetDiscoveryGapDistribution` in Bug 6. Floor raised from `> 0` to `> 1` for consistency with the population proc.

Note: `SongCountryPresence` is still used in the `EXISTS` clause for the `@MinCountries` filter — that use is correct and unchanged.

**File:** `backend/Capstone.API/SQL Scripts/read/sp_GetAverageDiscoveryGap.sql`  
**Deploy:** Re-run SP in SSMS. No repopulation required.

---

*HiddenGemMusic Capstone | QA Session April 29, 2026 + Cross-Check May 13, 2026*