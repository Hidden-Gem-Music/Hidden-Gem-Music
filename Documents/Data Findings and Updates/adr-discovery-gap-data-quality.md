# Architecture Decision Record
## Discovery Gap Data Quality — SP Investigation & Fixes

**Project:** HiddenGemMusic Capstone  
**Author:** Leena Komenski  
**Date:** April 29, 2026 — updated May 6, 2026  
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

## 5. Issue 4 — Viral 50 / Top 200 Chart Type Conflation (May 6, 2026)

### ⚠ KNOWN LIMITATION — Flagged for future iteration

This issue was identified during dashboard design review on May 6, 2026. It does not represent a bug in any stored procedure — all SPs are functioning correctly given the data they receive. The issue is a measurement design concern with meaningful implications for interpretation.

### What the problem is

Dataset 1 contains two fundamentally different chart types mixed together in `FACT_ChartEntry`:

- **Top 200** — demand-driven. A song earns its rank by accumulating streams. Reflects sustained listener adoption.
- **Viral 50** — momentum-driven. A song enters based on rate-of-spread, not total streams. A track can appear on the Viral 50 the day it's released with almost no total plays, purely because it's being shared simultaneously across markets.

All current stored procedures that query `FACT_ChartEntry` for DS1 data treat these two chart types as equivalent "charting events." They are not equivalent. They measure different phenomena.

### Specific metrics affected

**`sp_GetAverageDiscoveryGap` and `sp_GetDiscoveryGapDistribution`**

The Viral 50 is the primary driver of the large 0–7d bucket (21,936 songs). Songs that go viral simultaneously across markets do not "discover" a new market — they explode everywhere at once by design. This compresses the measured discovery gap and causes the median (4 days) to understate the true time it takes for organic listener adoption to cross a border.

The current interpretation note ("Viral 50 chart entries capture simultaneous cross-market momentum by design") acknowledges this but does not correct for it. A Top 200-only calculation would produce a more meaningful measure of organic crossover speed.

**`sp_GetGlobalOverlapRate`**

The 26% global overlap rate is inflated by Viral 50 entries. Songs that technically appear in multiple countries' Viral 50 charts simultaneously are counted as crossover events, but this reflects sharing behavior, not listener adoption in those markets. The true adoption-based overlap rate is likely lower than 26%.

**`sp_GetPeakCrossRegionalReach`**

Peak simultaneous country reach (70 countries — abcdefu by GAYLE) is almost certainly a Viral 50 phenomenon. This is a different kind of "global reach" than sustained Top 200 charting across many markets. It is not incorrect, but the distinction is meaningful and is currently absent from all UI copy.

**`sp_GetGlobalReachOverTime`**

Average countries per charting song per year is pulled upward by Viral 50 entries. DS1 years (2.9–3.2 average) are not purely measures of sustained global adoption — they include viral spread events.

### Why this was not caught earlier

The Viral 50 contamination of discovery gap metrics was noted during the April 29 QA session (see Issue 1 resolution, Root Cause C) but was accepted as a data characteristic rather than a measurement design problem. On reflection, the distinction matters more than initially assessed — particularly for any user-facing copy that describes the discovery gap as a measure of how long music takes to "travel" between markets.

### Decision: Document and flag for future iteration

No SP changes are being made at this time. The following applies:

1. All affected metrics remain in the dashboard as-is
2. UI copy for the Discovery Gap Distribution chart and KPI Card 2 must include a visible note that Viral 50 entries compress the measured gap (already present — verify it is prominent)
3. The "About This Data" section must include the chart type conflation note (see updated copy in `dashboard-about-this-data-copy.md`)
4. This limitation is to be treated as **visible and important** — not buried in fine print

### Recommended future fix (Option 1 — low risk)

Add a `@ChartTypeFilter` parameter to `sp_GetAverageDiscoveryGap` and `sp_GetDiscoveryGapDistribution` that defaults to `NULL` (all chart types) but accepts `'Top 200'` to produce a Top 200-only calculation. This is a WHERE clause addition, not a repopulation, and does not affect any other SP or summary table.

```sql
-- Proposed addition to SongFirstCrossing CTE
WHERE days_to_spread > 0
  AND (@ChartTypeFilter IS NULL 
       OR EXISTS (
           SELECT 1 FROM FACT_ChartEntry ce
           JOIN ChartType ct ON ct.chart_type_id = ce.chart_type_id
           WHERE ce.song_id = dgd.song_id
             AND ct.name = @ChartTypeFilter
       ))
```

A chart type toggle on the Discovery Gap Distribution chart in the UI would then allow users to compare "All charts" vs "Top 200 only" — which itself tells a meaningful story about the difference between virality and adoption.

### Recommended future fix (Option 2 — more work, more insight)

Add `chart_type_breakdown` output to `sp_GetGlobalOverlapRate` and `sp_GetDiscoveryGapDistribution` — returning separate rows for Top 200, Viral 50, and Top 50 — to enable direct comparison in the UI. This is a more significant SP change but produces genuinely interesting data.

---

## 6. Affected Stored Procedures — Final State

| Procedure | Changed | Nature of Change |
|-----------|---------|-----------------|
| `sp_PopulateDiscoveryGapByDay` | Yes | Final WHERE changed from `gap_days >= 0` to `gap_days > 0`. HAVING filter added to Origin CTE to exclude dataset boundary-week origins. Table repopulated. |
| `sp_GetAverageDiscoveryGap` | Yes | Rewrote Filtered CTE to aggregate to SongFirstCrossing (MIN per song) before averaging. days_to_spread filter changed to `> 0`. |
| `sp_GetDiscoveryGapDistribution` | Yes | Added date range filter via SongCountryPresence EXISTS check. Changed `days_to_spread >= 0` to `> 0`. |
| `sp_PopulateSongCountryPresence` | No | Audited and confirmed correct. No changes. |
| `sp_PopulateGlobalOverlapByYear` | No | Audited and confirmed correct. No changes. |
| `sp_PopulateHiddenGems` | No | Audited and confirmed correct. Partial-year issue is a data scope limitation, not a logic bug. |
| `sp_GetGlobalOverlapRate` | No | Not audited April 29. Affected by Issue 4 (chart type conflation) — see above. No changes pending. |
| `sp_GetPeakCrossRegionalReach` | No | Not audited April 29. Affected by Issue 4 (likely Viral 50 result) — see above. No changes pending. |

---

## 7. Consequences

- `DiscoveryGapByDay` was truncated and repopulated after SP changes. All read SPs that query it now return clean data.
- The dashboard Discovery Gap Distribution histogram now shows a shape that peaks at 0–7d, which is correct and consistent with the average and median KPI values.
- The 22-month data gap (Dec 2021 – Oct 2023) and the 2023 partial year are now treated as first-class labeling concerns across the entire application, not just the dashboard.
- Any future stored procedure that uses `YEAR(snapshot_date)` to filter or group by 2023 must account for the partial-year scope.
- **Issue 4 (May 6, 2026):** Viral 50 / Top 200 conflation is a known, documented limitation affecting discovery gap metrics and overlap rate. No SP changes were made. UI copy and About This Data section updated to make this limitation visible. Recommended fixes documented above for a future iteration.

*HiddenGemMusic Capstone | April 29, 2026*