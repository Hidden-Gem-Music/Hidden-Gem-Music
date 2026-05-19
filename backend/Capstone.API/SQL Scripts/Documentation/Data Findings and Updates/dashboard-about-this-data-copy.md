# Dashboard — About This Data (In-App Copy)

**Reference document for the methodology card at the bottom of the Global Overlap Dashboard.**  
Last updated: May 8, 2026

> **Reference status:** This document is a content tracker, not a live feed. Everything listed under "Current approved copy" below should be displayed on the frontend dashboard. Use this document to verify that all copy is implemented in the app — if a section is missing from the UI, it needs to be added.

---

## Current approved copy

The following text is what should appear in the About This Data section on the dashboard.
Update this document whenever in-app copy changes.

---

All metrics on this dashboard are derived from two Kaggle datasets: Spotify Historical 
Charts (2017–2021) covering the Top 200 and Viral 50 across 70+ countries, and Top 
Spotify Songs in 73 Countries (2023–2025) covering daily Top 50 charts. Combined, these 
datasets represent approximately 28 million chart entries.

**Popularity metrics cannot be compared across datasets.** Dataset 1 uses raw stream 
counts; Dataset 2 uses Spotify's proprietary 0–100 popularity score. These are stored 
separately and never merged.

**The 22-month data gap (Dec 2021 – Oct 2023)** is a known limitation. No data exists 
for this period. Trend lines are broken — not interpolated — across this gap, and every 
time-series visualization on this page marks it explicitly.

**2023 data covers October 17 – December 31 only.** Dataset 2 begins mid-October 2023, 
meaning any metric filtered to 2023 reflects a partial year that is heavily weighted 
toward Q4 and December. This affects Hidden Gems rankings, Country Profile stats, and 
any chart or KPI scoped to 2023. The year selector displays "2023 (Oct–Dec)" wherever 
this applies.

**Chart scope differs between datasets.** Dataset 1 draws from the Top 200 only — up to 
200 songs per country per snapshot. Dataset 2 draws from the Top 50 only — 50 songs per 
country per day. Averages and counts for 2023–2025 are not directly comparable to 
2017–2021 values for this reason.

**Chart type scope — Viral 50 excluded from all metrics.** Dataset 1 contains two chart 
types: Top 200 (sustained listener demand, streams-based) and Viral 50 (rate-of-spread, 
not stream volume). All metrics on this dashboard — discovery gap, global overlap rate, 
peak reach, and average countries per song — are calculated from Top 200 and Top 50 
entries only. Viral 50 entries are excluded at the data layer.

**Discovery Gap values reflect organic crossover only.** The median (12 days) and mean 
(108 days) diverge significantly because crossover is not evenly distributed: most songs 
that cross any border do so within the first two weeks, but a long tail of songs that 
took months to travel — or barely reached a second market — pulls the mean up sharply. 
Both numbers are shown on the dashboard because neither alone tells the full story. Songs 
that never crossed any border are excluded from this calculation entirely.

KPI calculations run in pre-computed SQL summary tables server-side and are never derived 
live from the raw 28M-row fact table. This ensures response times remain fast regardless 
of filter state.

---

## Change log

| Date | Change | Author |
|------|--------|--------|
| May 8, 2026 | Viral 50 exclusion implemented — sp_PopulateSongCountryPresence, sp_PopulateDiscoveryGapByDay, sp_PopulatePeakReachBySong updated. Known limitation note replaced with scope clarification. Discovery Gap copy updated to reflect new values (median 12d, mean 108d) and remove Viral 50 reference. Chart scope note updated to reflect Top 200 only for DS1. Footer date updated. | Leena |
| May 6, 2026 | Added Viral 50 / Top 200 conflation known limitation — flagged for future iteration | Leena |
| April 29, 2026 | Added 2023 partial year disclaimer | Leena |
| April 29, 2026 | Added chart scope difference note (Top 200 vs Top 50) | Leena |
| April 29, 2026 | Updated Discovery Gap interpretation to reflect real data shape (bimodal, Viral 50 note) | Leena |
| April 12, 2026 | Initial version — data gap and dataset difference disclaimers | Leena |

*HiddenGemMusic Capstone | May 8, 2026*