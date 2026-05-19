# SQL Scripts

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski
**Date:** 2026-05-19
**Status:** Active

---

> **Contributor documentation.** This folder and its contents are intended for developers and contributors working on the HiddenGemMusic backend. It is not relevant to end users of the app.

This folder contains all MSSQL stored procedures for the HiddenGemMusic database, along with their documentation. Stored procedures are split into two categories — **population** (expensive, run once after ingestion) and **read** (lightweight, called at request time).

## Documentation

- `Documentation/stored-procedures-reference.md` — comprehensive stored procedure reference: all population and read SPs, execution order, parameter signatures, output columns, confirmed row counts, and known quirks
- `Documentation/sp-build-notes.md` — build and troubleshooting notes from stored procedure development and the star schema migration (April–May 2026)
- `Documentation/Data Findings and Updates/` — BDA architecture decision record, dashboard data methodology copy, and historical QA findings log. See `Documentation/Data Findings and Updates/README.md` for the full index.

## Scripts

- `run-all-population.sql` — run this once after initial data ingestion to populate all summary tables
- `population/` — individual population stored procedures
- `read/` — individual read stored procedures
