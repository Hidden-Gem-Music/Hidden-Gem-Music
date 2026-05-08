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

## Issue 4 — Viral 50 / Top 200 Chart Type Conflation (May 6, 2026)

**Severity:** Medium — affects interpretation of multiple dashboard metrics  
**Status:** Known limitation, documented. Flagged for future iteration.  
**Session:** May 6, 2026 — identified during dashboard design review

### What was observed

During dashboard narrative design review, it was identified that the Top 200 and Viral 50 chart types in Dataset 1 measure fundamentally different phenomena but are treated as equivalent charting events in all current stored procedures.

- **Top 200:** sustained listener demand — streams-based, reflects adoption
- **Viral 50:** rate-of-spread — a song can enter with minimal total streams by spreading simultaneously across markets

### Metrics affected

| Metric | How it's affected |
|--------|------------------|
| Discovery Gap mean (38d) / median (4d) | 0–7d bucket driven in part by Viral 50 simultaneous-spread events, compressing measured crossover speed |
| Global Overlap Rate (26%) | Inflated by Viral 50 entries that technically cross borders but reflect sharing behavior, not adoption |
| Peak Cross-Regional Reach (70 countries — abcdefu) | Almost certainly a Viral 50 result; represents viral spread, not sustained Top 200 charting across 70 markets |
| Global Reach Over Time avg countries (2.9–3.2) | Pulled upward by Viral 50 entries throughout DS1 years |

### Why no SP changes were made

All SPs are functioning correctly given the data they receive. This is a measurement design concern, not a logic bug. Fixing it requires either a `@ChartTypeFilter` parameter addition to the gap SPs (low risk, WHERE clause only) or a full chart-type breakdown output (higher effort). Neither is being pursued at this time given project timeline.

### Resolution

- No SP changes
- ADR updated with full analysis and recommended future fixes (`adr-discovery-gap-data-quality.md` Issue 4)
- `dashboard-about-this-data-copy.md` updated with a prominent ⚠ known limitation entry
- This QA log updated

### Connection to prior findings

The Viral 50 contribution to the 0–7d bucket was first noted during the April 29 QA session (Issue 1, Root Cause C decision) and accepted as a data characteristic. May 6 review elevated this from "data characteristic" to "measurement design limitation" given its impact on multiple metrics and user interpretation.

---

## Queries Used During Investigation

All diagnostic queries used during this session are preserved here for reference.

```sql
-- Bucket distribution check
SELECT bucket_label, COUNT(DISTINCT song_id) AS song_count
FROM DiscoveryGapByDay
GROUP BY bucket_label, bucket_order
ORDER BY bucket_order;

-- Day-level breakdown within 0-7d
SELECT days_to_spread, COUNT(DISTINCT song_id) AS song_count
FROM DiscoveryGapByDay
WHERE days_to_spread BETWEEN 0 AND 7
GROUP BY days_to_spread
ORDER BY days_to_spread;

-- Boundary week contamination check (spread side)
SELECT COUNT(DISTINCT dgd.song_id) AS song_count
FROM DiscoveryGapByDay dgd
JOIN ChartEntry ce_spread
    ON ce_spread.song_id    = dgd.song_id
   AND ce_spread.country_id = dgd.spread_country_id
WHERE dgd.days_to_spread BETWEEN 1 AND 7
  AND ce_spread.snapshot_date BETWEEN '2023-10-17' AND '2023-10-23';
-- Result: 9 — not the source of contamination

-- Spread year distribution for fast crossings
SELECT YEAR(dgd_spread.spread_first) AS spread_year, COUNT(DISTINCT dgd.song_id) AS song_count
FROM DiscoveryGapByDay dgd
JOIN (
    SELECT song_id, country_id, MIN(snapshot_date) AS spread_first
    FROM ChartEntry WHERE country_id IS NOT NULL
    GROUP BY song_id, country_id
) dgd_spread ON dgd_spread.song_id = dgd.song_id AND dgd_spread.country_id = dgd.spread_country_id
WHERE dgd.days_to_spread BETWEEN 1 AND 6
GROUP BY YEAR(dgd_spread.spread_first)
ORDER BY YEAR(dgd_spread.spread_first);

-- SongCountryPresence sanity check
SELECT chart_year, COUNT(*) AS total_song_year_rows,
    AVG(CAST(country_count AS DECIMAL(10,4))) AS avg_countries,
    MIN(country_count) AS min_countries, MAX(country_count) AS max_countries
FROM SongCountryPresence
GROUP BY chart_year ORDER BY chart_year;

-- DiscoveryGapByDay table structure check
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'DiscoveryGapByDay' ORDER BY ORDINAL_POSITION;
```

---

## Open Items After This Session

- [ ] Apply "2023 (Oct–Dec)" year selector label across all screens — Hidden Gems, Country Profile, Country Comparison, Globe filter panel
- [ ] Confirm `sp_GetDiscoveryGapDistribution` date range filter is correctly wired from the frontend date params
- [ ] Issue 2 (Global Reach) frontend changes need to be verified on mobile layout as well as web
- [ ] **Issue 4 — Future iteration:** Add `@ChartTypeFilter` parameter to `sp_GetAverageDiscoveryGap` and `sp_GetDiscoveryGapDistribution` to enable Top 200-only calculation. See ADR Issue 4 for recommended SQL pattern.
- [ ] **Issue 4 — Future iteration:** Consider chart type toggle on Discovery Gap Distribution chart in UI (All charts / Top 200 only / Viral 50 only) to make the Viral 50 vs adoption distinction visible and explorable.

*HiddenGemMusic Capstone | QA Session April 29, 2026*