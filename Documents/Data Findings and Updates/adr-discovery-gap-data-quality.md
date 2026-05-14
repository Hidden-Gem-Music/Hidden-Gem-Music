# Architecture Decision Record
## Discovery Gap Data Quality — SP Investigation & Fixes

**Project:** HiddenGemMusic Capstone  
**Author:** Leena Komenski  
**Date:** April 29, 2026 — updated May 6, 2026 — updated May 8, 2026  
**Status:** Accepted  
**Track:** BDA  

---

## 1. Context

During dashboard integration testing on April 29, 2026, three data inconsistencies were 
identified when real SP output was wired to the Global Overlap Dashboard UI. A fourth 
issue was identified during dashboard design review on May 6, 2026, and resolved on 
May 8, 2026. This ADR documents the investigation findings, root causes, decisions made, 
and the resulting state of all affected stored procedures.

The four issues identified were:

1. `sp_GetAverageDiscoveryGap` returning 43 days while `sp_GetDiscoveryGapDistribution` 
   showed the 0–7d bucket as by far the largest, directly contradicting each other
2. Global Reach Over Time chart values appearing inconsistent with the Global Overlap 
   Rate KPI
3. Argentina's Hidden Gems list for 2023 being dominated by Christmas songs
4. Viral 50 and Top 200 chart types treated as equivalent charting events across all 
   population stored procedures

---

## 2. Issue 1 — Discovery Gap: Average vs. Distribution Contradiction

### Root Cause A: Different aggregation units across SPs

`sp_GetAverageDiscoveryGap` was averaging `days_to_spread` across all song-country pair 
rows in `DiscoveryGapByDay`. A song that spread to 10 countries contributed 10 rows to 
the average — one per destination country — weighted by how far each individual country 
was from the origin. A song reaching 9 countries quickly but one country after 300 days 
pulled the average up significantly.

`sp_GetDiscoveryGapDistribution` used `COUNT(DISTINCT song_id)` per bucket, meaning each 
song was counted once, in the bucket of its minimum gap. This is why the two outputs 
contradicted each other: they were measuring fundamentally different things.

**Fix:** `sp_GetAverageDiscoveryGap` was rewritten to aggregate to one row per song first 
(taking `MIN(days_to_spread)`) before computing the average. Both SPs now count the same 
unit: one first crossing per song.

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

After fixing Root Cause A, the average dropped to 7 days with a median of 0. A query 
against `DiscoveryGapByDay` revealed 55,276 out of 59,922 songs in the 0–7d bucket had 
`days_to_spread = 0`. These are left-censored observations: songs that were already 
globally popular when Dataset 2 began (October 17, 2023) appeared in dozens of countries 
on day 1 of the data, producing gap_days = 0. These are not real discovery events — the 
crossing happened before data collection began.

**Fix:** `sp_PopulateDiscoveryGapByDay` final WHERE clause changed from `gap_days >= 0` 
to `gap_days > 0`. The table was repopulated.

### Root Cause C: Remaining fast-crossing artifacts from DS2 boundary week

After excluding day-zero rows, the 0–7d bucket still contained ~21,936 songs. 
Investigation via boundary-week queries confirmed that 21,920 of those songs had their 
spread country's first appearance in the DS2 opening week (Oct 17–23, 2023). A filter 
was added to the `Origin` CTE in `sp_PopulateDiscoveryGapByDay` via a `HAVING` clause 
excluding songs whose global first appearance fell in either dataset's opening week.

However, after repopulation, the 0–7d bucket only dropped to 21,936 — nearly unchanged. 
Further investigation via a spread_year distribution query revealed:
spread_year   song_count
2017          6945
2018          5047
2019          2676
2020          2817
2021          2554
2023            85
2024           664
2025           281

The fast crossings are distributed across interior years, not concentrated at boundaries. 
Only 85 songs had their spread in 2023's boundary week. **The data is clean. The 0–7d 
bucket being the largest bar is a genuine characteristic of the data, not an artifact.**

### Decision: Accept the data as-is, update UI copy

Fast crossings are genuinely common in streaming-era music. A globally hyped song can 
chart in dozens of countries within days of release. No further SP filtering was applied.

The UI copy in the Discovery Gap Distribution chart was updated to reflect what the data 
actually shows rather than the mockup assumption that 15–30d would be the peak.

### KPI values after April 29 fixes (pre-Issue 4 fix)

| Metric | Before | After |
|--------|--------|-------|
| avg_gap_days | 43 | 38 |
| median_gap_days | 0 | 4 |
| sample_size | ~28,400 | 35,448 |
| 0-7d bucket | 59,922 songs | 21,936 songs |

---

## 3. Issue 2 — Global Reach Over Time: Values vs. Overlap Rate Tension

### Investigation

`sp_PopulateSongCountryPresence` was audited. The SP correctly uses 
`COUNT(DISTINCT ce.country_id)` — confirmed by `MAX(country_count)` returning 70, not 
inflated into the hundreds or thousands. The SP is correct.

A year-by-year sanity check revealed:
chart_year   avg_countries
2017         2.91
2018         3.15
2019         2.83
2020         2.88
2021         2.92
2023         2.14
2024         2.17
2025         1.96

The apparent tension with the 26% overlap rate resolves mathematically: 74% of songs in 
1 country and 26% averaging ~9 countries each produces a blended average of ~3.1, which 
matches the observed values. The numbers are consistent.

The drop in DS2 years is explained by two factors: DS1 uses Top 200 charts across 70+ 
countries; DS2 uses only a Top 50 chart. The smaller chart pool produces lower averages 
and is not directly comparable to DS1 years. Additionally, 2023 covers only Oct 17 – 
Dec 31 (75 days), producing a much smaller song pool than any full year.

### Decision: No SP changes. UI labeling fix only.

- 2023 x-axis label marked with asterisk and orange color
- 2023 bar visually dimmed to 45% opacity vs 75% for full years
- Tooltip for 2023 displays "2023 (Oct–Dec only)"
- Partial year legend item added
- Chart explainer text updated to note DS1 vs DS2 chart scope difference and 2023 
  partial year

---

## 4. Issue 3 — Argentina Hidden Gems: Christmas Song Flooding in 2023

### Root Cause

`sp_PopulateHiddenGems` assigns `chart_year` using `YEAR(snapshot_date)`. Dataset 2 
begins October 17, 2023. Therefore "2023" in the HiddenGems table represents only 
Oct 17 – Dec 31, 2023 — 75 days of data, heavily Q4 and December. Christmas songs 
dominate global charts in December, they achieve high `country_count` values, they score 
well on the TrendScore formula, and Argentina did not chart them — so they flood the 
hidden gems list for 2023.

This is a partial-year data scope problem, not a bug in the SP logic.

### Decision: Document as known limitation, apply UI labeling fix

No SP changes were made. The fix is transparency in the UI:

- The year selector displays "2023 (Oct–Dec)" wherever 2023 appears as an option
- The same labeling convention applies across Country Profile, Country Comparison, 
  Hidden Gems, and the Globe screen
- Limitation documented in About This Data section and QA findings log

---

## 5. Issue 4 — Viral 50 / Top 200 Chart Type Conflation

**Identified:** May 6, 2026  
**Resolved:** May 8, 2026

### What the problem was

Dataset 1 contains two fundamentally different chart types mixed together in 
`ChartEntry`:

- **Top 200** — demand-driven. A song earns its rank by accumulating streams. Reflects 
  sustained listener adoption.
- **Viral 50** — momentum-driven. A song enters based on rate-of-spread, not total 
  streams. A track can appear on the Viral 50 the day it's released with almost no total 
  plays, purely because it's being shared simultaneously across markets.

All population stored procedures that queried `ChartEntry` for DS1 data were 
treating these two chart types as equivalent charting events. They are not equivalent — 
they measure different phenomena.

### Metrics affected (pre-fix values)

| Metric | How it was affected |
|--------|-------------------|
| Discovery Gap median (4d) / mean (38d) | 0–7d bucket heavily driven by Viral 50 simultaneous-spread events, compressing measured crossover speed |
| Global Overlap Rate (26%) | Inflated by Viral 50 entries reflecting sharing behavior, not listener adoption |
| Peak Cross-Regional Reach (70 countries — abcdefu by GAYLE) | Viral 50 result — represented viral spread, not sustained Top 200 charting |
| Global Reach Over Time avg countries (2.9–3.2) | Pulled upward by Viral 50 entries throughout DS1 years |

### Fix applied — 05/08/2026

`AND ce.chart_type_id != 2` added to the `ChartEntry` query in three population 
procedures:

- `sp_PopulateSongCountryPresence` — main WHERE clause
- `sp_PopulateDiscoveryGapByDay` — FirstAppearance CTE
- `sp_PopulatePeakReachBySong` — DailyReach CTE

During repopulation, the `gap_days > 0` filter in `sp_PopulateDiscoveryGapByDay` was 
found to have reverted to `>= 0` during the SP rewrite. Corrected back to `> 0` and 
repopulated.

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
| Peak Cross-Regional Reach | 70 countries (abcdefu — GAYLE) | 69 countries (STAY — The Kid LAROI) |

The mean/median divergence (12d vs 108d) is expected and analytically meaningful — most 
crossovers happen fast, but a long tail of slow-movers pulls the mean up sharply. Both 
numbers are shown on the dashboard. The gap between them is not a data quality problem; 
it is the story.

### Documentation updates

- `dashboard-about-this-data-copy.md` — ⚠ known limitation paragraph replaced with 
  chart type scope clarification. Discovery Gap copy updated to reflect new values.
- `qa-findings-log-2026-04-29.md` — Issue 4 status updated to Resolved.
- Chart legend in section 3 of dashboard updated from "2017–2021 (Top 200 + Viral 50)" 
  to "2017–2021 (Top 200 only)"
- SP headers updated with 05/08/2026 update lines in all three modified procedures

---

## 6. Affected Stored Procedures — Final State

| Procedure | Changed | Nature of Change |
|-----------|---------|-----------------|
| `sp_PopulateDiscoveryGapByDay` | Yes | Final WHERE changed from `gap_days >= 0` to `gap_days > 0`. HAVING filter added to Origin CTE to exclude dataset boundary-week origins. `AND ce.chart_type_id != 2` added to FirstAppearance CTE. Table repopulated. |
| `sp_GetAverageDiscoveryGap` | Yes | Rewrote Filtered CTE to aggregate to SongFirstCrossing (MIN per song) before averaging. days_to_spread filter changed to `> 0`. |
| `sp_GetDiscoveryGapDistribution` | Yes | Added date range filter via SongCountryPresence EXISTS check. Changed `days_to_spread >= 0` to `> 0`. |
| `sp_PopulateSongCountryPresence` | Yes | `AND ce.chart_type_id != 2` added to main WHERE clause. Table repopulated. |
| `sp_PopulatePeakReachBySong` | Yes | `AND ce.chart_type_id != 2` added to DailyReach CTE. Table repopulated. |
| `sp_PopulateGlobalOverlapByYear` | No | Reads from SongCountryPresence — inherits clean data after repopulation. No direct changes. |
| `sp_PopulateCountryYearStats` | No | Reads from SongCountryPresence — inherits clean data after repopulation. No direct changes. |
| `sp_PopulateIsolationScoreByCountry` | No | Reads from CountryYearStats — inherits clean data after repopulation. No direct changes. |
| `sp_PopulateHiddenGems` | No | Audited and confirmed correct. Partial-year issue is a data scope limitation, not a logic bug. |

---

## 7. Consequences

- `DiscoveryGapByDay` was truncated and repopulated after SP changes. All read SPs that 
  query it now return clean data.
- The dashboard Discovery Gap Distribution histogram now shows a shape that peaks at 
  0–7d, which is correct and consistent with the average and median KPI values.
- The 22-month data gap (Dec 2021 – Oct 2023) and the 2023 partial year are treated as 
  first-class labeling concerns across the entire application, not just the dashboard.
- Any future stored procedure that uses `YEAR(snapshot_date)` to filter or group by 2023 
  must account for the partial-year scope.
- Viral 50 entries are excluded from all summary table population procedures via 
  `chart_type_id != 2`. All KPI values, overlap rates, discovery gap metrics, and peak 
  reach figures reflect Top 200 and Top 50 chart entries only. This is the correct and 
  final state of the data layer.

*HiddenGemMusic Capstone | May 8, 2026*