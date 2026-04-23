# ADR-BACKEND-001: .NET 9 API Architecture

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski (BDA / Backend Lead)
**Date:** 2026-04-22
**Status:** Accepted

---

## Context

The capstone project requires a backend API that serves a React Native / React Native Web frontend with music discovery data sourced from two Kaggle datasets (~28M rows combined). The API must respond fast enough for interactive use despite the volume of underlying data. The backend must also be maintainable by a three-person team over a 10-week timeline.

Key constraints that shaped every decision below:

- The two datasets have a **22-month gap** (December 2021 – October 2023) that must be surfaced to the user on all time-series views.
- The largest fact table (`ChartEntry`) holds an estimated 13–16 million rows and must **never** be queried directly at API request time.
- The team is most familiar with the .NET / C# stack from coursework.
- The frontend is built in React Native, running locally on port 8081.

---

## Decisions

### 1. Framework — .NET 9 (ASP.NET Core Web API)

**Decision:** Use .NET 9 as the API framework, targeting `net9.0`.

**Rationale:**
- Matches the team's existing C# coursework experience.
- The project proposal referenced .NET 8, but the generated scaffold already targets `net9.0`, which is the current LTS-adjacent release. The newer version is used as-is.
- ASP.NET Core's built-in controller routing, model binding, and OpenAPI integration reduce boilerplate.

**Consequences:**
- All backend team members must run the .NET 9 SDK locally.
- Any deployment target (Week 9) must support .NET 9.

---

### 2. Database — Microsoft SQL Server (MSSQL)

**Decision:** Use MSSQL as the sole data store. All schema, indexes, stored procedures, and pre-computed summary tables live in a single database named `HiddenGemMusic`.

**Rationale:**
- Required for Stored Procedures with the complexity needed for pre-aggregation (see Decision 4).
- Team has MSSQL access via SQL Server Management Studio from coursework.
- Trusted Connection (Windows Auth) is used locally to avoid storing credentials.

**Connection string (Development only — never committed):**
```
Server=localhost;Database=MusicCapstone;Trusted_Connection=True;TrustServerCertificate=True;
```

`appsettings.Development.json` is added to `.gitignore` to prevent the connection string from being committed.

---

### 3. Data Access — Repository Pattern with Dapper

**Decision:** Use the Repository Pattern with one repository class per domain area. All database access goes through repositories. No raw SQL or Entity Framework in controllers or services. Dapper is used for stored procedure result mapping.

**Pattern:**
```
Controllers  →  IRepository interface  →  Repository class  →  Dapper  →  Stored Procedure  →  Pre-computed table
```

**Rationale:**
- Clean separation between the API layer and the data layer.
- Dapper maps stored procedure result sets directly to DTO classes with minimal ceremony, which is appropriate given that all queries are pre-defined stored procedures (not dynamic LINQ).
- Entity Framework Core was considered and rejected: EF's query model is a poor fit for a read-only, SP-driven architecture where the ORM would never generate queries.

**Packages required:**
```
Microsoft.Data.SqlClient

```

**Repository areas:**
| Interface | Repository | Domain |
|-----------|-----------|--------|
| `IGlobeRepository` | `GlobeRepository` | Globe summary data |
| `ICountryRepository` | `CountryRepository` | Country profile pages |
| `IHiddenGemsRepository` | `HiddenGemsRepository` | Hidden gems lists |
| `IComparisonRepository` | `ComparisonRepository` | Country comparison |
| `IDashboardRepository` | `DashboardRepository` | KPIs and trend charts |

---

### 4. No Direct ChartEntry Queries at Request Time

**Decision:** Controllers and repositories are **never** permitted to query the `ChartEntry` table (or any other raw fact table) at API request time. All read procedures query pre-computed summary tables only.

**Rationale:**
- `ChartEntry` holds an estimated 13–16 million rows. A runtime join or aggregation against it would produce response times incompatible with interactive use.
- All expensive aggregation runs once, at data load time, via population stored procedures.

**Enforcement:**
- Population stored procedures (prefixed `sp_Populate*`) are expensive and run on a schedule or manually after data ingestion. They are never called by any controller.
- Read stored procedures (prefixed `sp_Get*`) are lightweight and are the only procedures controllers ever call.
- Code review must flag any direct reference to `ChartEntry` in a repository read method.

**Pre-computed tables queried at request time:**

| Table | Feeds |
|-------|-------|
| `HiddenGems` | Hidden gems endpoints, globe summary |
| `CountryYearStats` | Country profile, comparison, globe summary |
| `SongCountryPresence` | Hidden gems filtering |
| `GlobalOverlapByYear` | Dashboard overlap trend chart |
| `DiscoveryGapByDay` | KPI 2 (avg gap days), histogram |
| `IsolationScoreByCountry` | KPI 3, isolation ranking chart |
| `PeakReachBySong` | KPI 4 (peak cross-regional reach) |
| `TrendVelocityBySong` | Trend scoring for hidden gems |

---

### 5. DTO Layer — Model Classes as Data Contracts

**Decision:** Every stored procedure result set maps to a dedicated DTO class in the `Models` folder. Controllers return DTOs directly — no domain model is exposed. DTOs are plain classes with `{ get; set; }` properties and XML doc comments.

**Rationale:**
- Keeps the API surface stable and decoupled from internal schema changes.
- Dapper maps column names to property names by convention, so DTOs must match SP output column names exactly.
- XML doc comments on all DTO properties provide inline documentation for future team members and the OpenAPI spec.

**DTO locations:**

| Folder | DTOs |
|--------|------|
| `Models/Globe/` | `CountryGlobeSummary` |
| `Models/Dashboard/` | `GlobalOverlapRateKpi`, `DiscoveryGapKpi`, `IsolationLeaderKpi`, `IsolationRankingEntry`, `GlobalTrendPoint`, `DiscoveryGapBucket`, `PeakReachKpi` |
| `Models/Country/` | `CountryProfile` |
| `Models/HiddenGems/` | `HiddenGem`, `HiddenGemResponse` |
| `Models/Comparison/` | `ComparisonResult`, `CountryComparisonSide`, `ComparisonHiddenGem` |
| `Models/Shared/` | `Song`, `SharedSong` |

---

### 6. CORS — React Native Web Frontend

**Decision:** CORS is configured in `Program.cs` to allow requests from `http://localhost:8081` (the Expo default dev server port) with any header and any HTTP method.

**Rationale:**
- The React Native Web frontend is served by Expo on port 8081 during development.
- Without CORS, all API requests from the browser-based frontend are blocked by the browser's same-origin policy.
- The policy is scoped to `localhost:8081` only — not a wildcard — to avoid unintentionally exposing the API to other origins during development.

**If the frontend port changes**, update `WithOrigins(...)` in `Program.cs` and notify the full team.

---

### 7. Globe Architecture Split — Mapbox Renders, .NET API Serves Data

**Decision:** Mapbox (web) / React Native Mapbox (mobile) handles all globe rendering and country hover cards. The .NET API handles all relational data — country detail pages, hidden gems, comparison, and dashboard KPIs.

**Mapbox tileset fields** (derived from the `Country` table + pre-computed summaries):
`country_name`, `iso_code`, `lat`, `long`, `hidden_gem_count`, `top_album_name`

**Rationale:**
- Globe dot rendering and hover animations are a visual concern, not a data concern. Mapbox handles this better than a custom rendering solution.
- Keeping relational queries in the .NET API means the tileset only needs to be regenerated when summary data changes — not on every request.

**Fallback:** If Mapbox integration causes excessive friction, switch to MapLibre. The "Discovery Globe" screen becomes "Discovery Map." The data strategy and API contracts are identical — only the frontend rendering library changes.

---

### 8. The 22-Month Data Gap — Explicit Handling Required

**Decision:** Every time-series endpoint includes an `IsGap` boolean field (mapped from `is_gap BIT` on the `GlobalOverlapByYear` table). The frontend uses this field to render a dashed line segment and `ReferenceArea` (Recharts) over the gap period.

**Gap period:** December 2021 – October 2023

**Rationale:**
- Dataset 1 ends December 2021. Dataset 2 starts October 2023. Silently connecting these two periods on a chart would imply continuous data and misrepresent the historical record.
- The gap must also be disclosed as a data disclaimer.

**Enforcement:**
- KPIs must never average values across both dataset periods without labeling them as distinct timeframes.
- The `IsGap` field on `GlobalTrendPoint` is the contract between the backend and the frontend for gap rendering — do not remove it.

---

## Consequences

- All heavy computation is isolated to SQL Server. This means the API can scale independently of data complexity, but it also means the database must be populated correctly before any endpoint returns meaningful data.
- Adding a new endpoint always requires: a new stored procedure, a new DTO, a new repository method, and a new controller action. This is intentional overhead that keeps each layer testable in isolation.
- The 22-month data gap is a permanent constraint of the source datasets and must be propagated through every time-series feature built now or in the future.

