# Architecture Decision Record
## Discovery Gap Data Quality — SP Investigation & Fixes

**Project:** HiddenGemMusic Capstone  
**Author:** Leena Komenski  
**Date:** April 29, 2026  
**Status:** Accepted  
**Track:** BDA  

---

## 1. Context

During dashboard integration testing on April 29, 2026, three data inconsistencies were identified when real SP output was wired to the Global Overlap Dashboard UI. This ADR documents the investigation findings, root causes, decisions made, and the resulting state of all affected stored procedures.

The three issues identified were:

1. `sp_GetAverageDiscoveryGap` returning 43 days while `sp_GetDiscoveryGapDistribution` showed the 0–7d bucket as by far the largest, directly contradicting each other
2. Global Reach Over Time chart values appearing inconsistent with the Global Overlap Rate KPI
3. Argentina's Hidden Gems list for 2023 being dominated by Christmas songs

---

## 2. Issue 1 — Discovery Gap: Average vs. Distribution Contradiction

### Root Cause A: Different aggregation units across SPs

`sp_GetAverageDiscoveryGap` was averaging `days_to_spread` across all song-country pair rows in `DiscoveryGapByDay`. A song that spread to 10 countries contributed 10 rows to the average — one per destination country — weighted by how far each individual country was from the origin. A song reaching 9 countries quickly but one country after 300 days pulled the average up significantly.

`sp_GetDiscoveryGapDistribution` used `COUNT(DISTINCT song_id)` per bucket, meaning each song was counted once, in the bucket of its minimum gap. This is why the two outputs contradicted each other: they were measuring fundamentally different things.

**Fix:** `sp_GetAverageDiscoveryGap` was rewritten to aggregate to one row per song first (taking `MIN(days_to_spread)`) before computing the average. Both SPs now count the same unit: one first crossing per song.

```sql
-- New SongFirstCrossing CTE in sp_GetAverageDiscoveryGap
WITH SongFirstCrossing AS (
    SELECT
        song_id,
        MIN(days_to_spread) AS days_to_spread
    FROM DiscoveryGapByDay
    WHERE days_to_spread > 0
    GROUP BY song_id
),
```

### Root Cause B: Day-zero left-censorship artifacts

After fixing Root Cause A, the average dropped to 7 days with a median of 0. A query against `DiscoveryGapByDay` revealed 55,276 out of 59,922 songs in the 0–7d bucket had `days_to_spread = 0`. These are left-censored observations: songs that were already globally popular when Dataset 2 began (October 17, 2023) appeared in dozens of countries on day 1 of the data, producing gap_days = 0. These are not real discovery events — the crossing happened before data collection began.

**Fix:** `sp_PopulateDiscoveryGapByDay` final WHERE clause changed from `gap_days >= 0` to `gap_days > 0`. The table was repopulated.

### Root Cause C: Remaining fast-crossing artifacts from DS2 boundary week

After excluding day-zero rows, the 0–7d bucket still contained ~21,936 songs. Investigation via boundary-week queries confirmed that 21,920 of those songs had their spread country's first appearance in the DS2 opening week (Oct 17–23, 2023). A filter was added to the `Origin` CTE in `sp_PopulateDiscoveryGapByDay` via a `HAVING` clause excluding songs whose global first appearance fell in either dataset's opening week.

However, after repopulation, the 0–7d bucket only dropped to 21,936 — nearly unchanged. Further investigation via a spread_year distribution query revealed:

```
spread_year   song_count
2017          6945
2018          5047
2019          2676
2020          2817
2021          2554
2023            85
2024           664
2025           281
```

The fast crossings are distributed across interior years, not concentrated at boundaries. Only 85 songs had their spread in 2023's boundary week. **The data is clean. The 0–7d bucket being the largest bar is a genuine characteristic of the data, not an artifact.**

### Decision: Accept the data as-is, update UI copy

Fast crossings are genuinely common in streaming-era music. A globally hyped song can chart in dozens of countries within days of release. The Viral 50 chart — which captures simultaneous cross-market momentum by design — is a meaningful contributor to the 0–7d bucket. No further SP filtering was applied.

The UI copy in the Discovery Gap Distribution chart was updated to reflect what the data actually shows rather than the mockup assumption that 15–30d would be the peak.

### Final KPI values after all fixes

| Metric | Before | After |
|--------|--------|-------|
| avg_gap_days | 43 | 38 |
| median_gap_days | 0 | 4 |
| sample_size | ~28,400 | 35,448 |
| 0-7d bucket | 59,922 songs | 21,936 songs |

### Interpretation of final values

The mean (38 days) and median (4 days) diverging significantly is itself a finding: crossover is bimodal. Most songs that cross any border do so within the first week. A long tail of songs that took months to travel — or barely reached a second market — pulls the mean up to 38 days. The gap between median and mean is not a data quality problem; it is the story.

---

## 3. Issue 2 — Global Reach Over Time: Values vs. Overlap Rate Tension

### Investigation

`sp_PopulateSongCountryPresence` was audited. The SP correctly uses `COUNT(DISTINCT ce.country_id)` — confirmed by `MAX(country_count)` returning 70, not inflated into the hundreds or thousands. The SP is correct.

A year-by-year sanity check revealed:

```
chart_year   avg_countries
2017         2.91
2018         3.15
2019         2.83
2020         2.88
2021         2.92
2023         2.14
2024         2.17
2025         1.96
```

The apparent tension with the 26% overlap rate (which implies most songs stay in 1 country) resolves mathematically: 74% of songs in 1 country and 26% averaging ~9 countries each produces a blended average of ~3.1, which matches the observed values. The numbers are consistent.

The drop in DS2 years (2023–2025) is explained by two factors: DS1 uses Top 200 and Viral 50 charts across 70+ countries; DS2 uses only a Top 50 chart. The smaller chart pool produces lower averages and is not directly comparable to DS1 years. Additionally, 2023 covers only Oct 17 – Dec 31 (75 days), producing a much smaller song pool than any full year.

### Decision: No SP changes. UI labeling fix only.

The SP is correct. Changes applied to the frontend only:

- 2023 x-axis label marked with asterisk and orange color
- 2023 bar visually dimmed to 45% opacity vs 75% for full years
- Tooltip for 2023 displays "2023 (Oct–Dec only)"
- Partial year legend item added
- Chart explainer text updated to note DS1 vs DS2 chart scope difference and 2023 partial year

---

## 4. Issue 3 — Argentina Hidden Gems: Christmas Song Flooding in 2023

### Root Cause

`sp_PopulateHiddenGems` assigns `chart_year` using `YEAR(snapshot_date)`. Dataset 2 begins October 17, 2023. Therefore "2023" in the HiddenGems table represents only Oct 17 – Dec 31, 2023 — 75 days of data, heavily Q4 and December. Christmas songs dominate global charts in December, they achieve high `country_count` values (meeting the `@MinCountries` threshold easily), they score well on the TrendScore formula, and Argentina did not chart them — so they flood the hidden gems list for 2023.

This is a partial-year data scope problem, not a bug in the SP logic. The SP is functioning as designed.

### Decision: Document as known limitation, apply UI labeling fix

No SP changes were made. The SP correctly reflects what the data contains. The fix is transparency in the UI:

- The year selector for Hidden Gems should display "2023 (Oct–Dec)" wherever 2023 appears as an option, so users understand they are viewing a partial and seasonally skewed slice
- The same labeling convention applies anywhere 2023 appears as a year filter across the application — Country Profile, Country Comparison, and the Globe screen
- This limitation is documented in the dashboard's About This Data section and in the QA findings log

### Broader implication

Any year filter in the application that includes 2023 is showing a Q4-only slice of DS2 data. This affects Hidden Gems scoring, Country Profile stats, Country Comparison overlap percentages, and any chart or KPI filtered to 2023. All of these should display the "(Oct–Dec)" qualifier when 2023 is selected.

---

## 5. Affected Stored Procedures — Final State

| Procedure | Changed | Nature of Change |
|-----------|---------|-----------------|
| `sp_PopulateDiscoveryGapByDay` | Yes | Final WHERE changed from `gap_days >= 0` to `gap_days > 0`. HAVING filter added to Origin CTE to exclude dataset boundary-week origins. Table repopulated. |
| `sp_GetAverageDiscoveryGap` | Yes | Rewrote Filtered CTE to aggregate to SongFirstCrossing (MIN per song) before averaging. days_to_spread filter changed to `> 0`. |
| `sp_GetDiscoveryGapDistribution` | Yes | Added date range filter via SongCountryPresence EXISTS check. Changed `days_to_spread >= 0` to `> 0`. |
| `sp_PopulateSongCountryPresence` | No | Audited and confirmed correct. No changes. |
| `sp_PopulateGlobalOverlapByYear` | No | Audited and confirmed correct. No changes. |
| `sp_PopulateHiddenGems` | No | Audited and confirmed correct. Partial-year issue is a data scope limitation, not a logic bug. |
| `sp_GetGlobalOverlapRate` | No | Not audited today. Not implicated in any of the three issues. |
| `sp_GetPeakCrossRegionalReach` | No | Not audited today. Not implicated in any of the three issues. |

---

## 6. Consequences

- `DiscoveryGapByDay` was truncated and repopulated after SP changes. All read SPs that query it now return clean data.
- The dashboard Discovery Gap Distribution histogram now shows a shape that peaks at 0–7d, which is correct and consistent with the average and median KPI values.
- The 22-month data gap (Dec 2021 – Oct 2023) and the 2023 partial year are now treated as first-class labeling concerns across the entire application, not just the dashboard.
- Any future stored procedure that uses `YEAR(snapshot_date)` to filter or group by 2023 must account for the partial-year scope.

*HiddenGemMusic Capstone | April 29, 2026*
