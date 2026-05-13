# Bug Fixes Log
## HiddenGemMusic Capstone

---

## 2026-05-13 — SP / Interface / Controller Cross-Check
**Branch:** `127-debug-sp-repository-bugs`
**Scope:** Cross-check of stored procedures against C# interfaces, repositories, and controllers.

---

### Fix 1 — `sp_GetHiddenGems` missing `total_count` output column

**File:** `backend/Capstone.API/SQL Scripts/read/sp_GetHiddenGems.sql`
**Severity:** Critical

`HiddenGemsRepository` reads `total_count` from the first result row to compute the `hasMore` flag for pagination. The SP never returned this column, causing `totalRawCount` to always default to 0 and `hasMore` to always be `false`. Pagination and infinite scroll were permanently broken.

**Fix:** Added `COUNT(1) OVER() AS total_count` to the SELECT statement, matching the pattern already used in `sp_GetCountrySongsPaged`.

**Deploy:** Re-run `sp_GetHiddenGems.sql` in SSMS. No repopulation required.

---

### Fix 2 — `sp_GetDiscoveryGapDistribution` ignoring `@DateStart` / `@DateEnd` parameters

**File:** `backend/Capstone.API/SQL Scripts/read/sp_GetDiscoveryGapDistribution.sql`
**Severity:** Critical

The SP declared `@DateStart` and `@DateEnd` parameters but never used them in the WHERE clause. The query returned the full all-years dataset regardless of the date range passed by the caller. The Discovery Gap Distribution histogram on the dashboard would always show aggregate data across all years.

`DiscoveryGapByDay` stores no date column, so filtering was added via `INNER JOIN SongCountryPresence ON song_id`, filtering by `chart_year BETWEEN YEAR(@DateStart) AND YEAR(@DateEnd)`. `COUNT(DISTINCT song_id)` prevents double-counting songs that appear across multiple years within the range. Also corrected `days_to_spread >= 0` to `> 0` for consistency with population SP filtering.

**Deploy:** Re-run `sp_GetDiscoveryGapDistribution.sql` in SSMS. No repopulation required.

---

### Non-bugs identified (no fix required)

| Item | Detail |
|---|---|
| `IGlobeRepository` XML doc comment | Says `sp_GetGlobeSummary` — actual SP is `sp_GetDiscoverPageInfo`. Documentation only, no runtime impact. |
| `genre` column read in `HiddenGemsRepository` | SP doesn't return `genre`, but `AsStringAny` returns null gracefully. Deezer enrichment populates it later. No runtime impact. |
