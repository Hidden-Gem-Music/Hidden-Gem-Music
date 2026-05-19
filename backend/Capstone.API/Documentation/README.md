# Backend Documentation

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski
**Date:** 2026-05-19
**Status:** Active

---

## Purpose

This folder contains backend architecture documentation for the HiddenGemMusic .NET 9 API.

It is split into two layers:

- **ADRs (this folder)** — accepted architecture decisions, kept as historical records. These reflect the decisions made at the time they were written and are not updated to track implementation drift. They document *why* the architecture is shaped the way it is.
- **`apis/`** — live documentation for the current backend API surface, external provider integrations, and local development workflow. This is the actively maintained layer.

---

## Architecture Decision Records

### `ADR-BACKEND-001-API-Architecture.md`
**Date:** 2026-04-22 | **Status:** Accepted

Framework, database, and foundational architecture decisions:

- .NET 9 / ASP.NET Core Web API
- MSSQL as the sole data store (`HiddenGemMusic` database)
- Repository pattern with Dapper — no Entity Framework
- No direct `ChartEntry` queries at request time — all reads go through pre-computed summary tables
- DTO layer: plain classes with XML doc comments, one DTO per SP result set
- CORS configuration for the React Native / Expo frontend
- Globe architecture split (Mapbox renders, .NET API serves data)
- 22-month data gap handling via `IsGap` field on all time-series endpoints

---

### `ADR-BACKEND-002-Routes-Controllers-DTOs.md`
**Date:** 2026-04-22 | **Status:** Accepted

Concrete implementation of the full API surface at time of writing:

- All 13 endpoints across 5 controllers (Globe, Country, HiddenGems, Comparison, Dashboard)
- Repository and infrastructure layer wiring (`IDataRepository`, domain repositories, DI registrations)
- SP parameter bindings and expected output column names for every stored procedure
- Full DTO inventory (16 DTOs across 6 model namespaces)
- Behavioural conventions: country code normalization, 404 vs. empty list rules, pagination, date parameter handling
- SP cross-check checklist (completed May 2026)

> **Note:** ADRs are intentionally kept as historical records. For the current live API surface, see `apis/README.md`.

---

## Live Documentation

Current API surface, provider integration, and local development documentation lives in:

- `apis/`

See `apis/README.md` for an index of everything in that folder.
