# Dashboard — About This Data (In-App Copy)

**Reference document for the methodology card at the bottom of the Global Overlap Dashboard.**  
Last updated: April 29, 2026

---

## Current approved copy

The following text is what should appear in the About This Data section on the dashboard. Update this document whenever in-app copy changes.

---

All metrics on this dashboard are derived from two Kaggle datasets: Spotify Historical Charts (2017–2021) covering the Top 200 and Viral 50 across 70+ countries, and Top Spotify Songs in 73 Countries (2023–2025) covering daily Top 50 charts. Combined, these datasets represent approximately 28 million chart entries.

**Popularity metrics cannot be compared across datasets.** Dataset 1 uses raw stream counts; Dataset 2 uses Spotify's proprietary 0–100 popularity score. These are stored separately and never merged.

**The 22-month data gap (Dec 2021 – Oct 2023)** is a known limitation. No data exists for this period. Trend lines are broken — not interpolated — across this gap, and every time-series visualization on this page marks it explicitly.

**2023 data covers October 17 – December 31 only.** Dataset 2 begins mid-October 2023, meaning any metric filtered to 2023 reflects a partial year that is heavily weighted toward Q4 and December. This affects Hidden Gems rankings, Country Profile stats, and any chart or KPI scoped to 2023. The year selector displays "2023 (Oct–Dec)" wherever this applies.

**Chart scope differs between datasets.** Dataset 1 draws from the Top 200 and Viral 50 — up to 250 songs per country per snapshot. Dataset 2 draws from the Top 50 only — 50 songs per country per day. Averages and counts for 2023–2025 are not directly comparable to 2017–2021 values for this reason.

**Discovery Gap values reflect first crossings only.** The average (38 days) and median (4 days) diverge significantly because crossover is bimodal: most songs that cross any border do so within the first week, driven in part by Viral 50 chart entries which capture simultaneous cross-market momentum by design. A long tail of songs that took months to travel — or barely reached a second market — pulls the mean up to 38 days. Songs that never crossed any border are excluded from the discovery gap calculation entirely.

KPI calculations run in pre-computed SQL summary tables server-side and are never derived live from the raw 28M-row fact table. This ensures response times remain fast regardless of filter state.

---

## Change log

| Date | Change | Author |
|------|--------|--------|
| April 29, 2026 | Added 2023 partial year disclaimer | Leena |
| April 29, 2026 | Added chart scope difference note (Top 200 vs Top 50) | Leena |
| April 29, 2026 | Updated Discovery Gap interpretation to reflect real data shape (bimodal, Viral 50 note) | Leena |
| April 12, 2026 | Initial version — data gap and dataset difference disclaimers | Leena |

*HiddenGemMusic Capstone | April 29, 2026*
