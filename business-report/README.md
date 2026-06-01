# Business Report

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** Leena Komenski
**Date:** 2026-05-19

---

## Contents

This folder contains the business report and supporting reference materials produced for the Hidden Gem Music capstone project.

- `HiddenGemMusic_BusinessReport.pdf` — the main business report document
- `BDA Reference/` — supporting materials used in the report's analysis

### BDA Reference — top-level documents

| File | Description |
|---|---|
| `Final Capstone Proposal.docx.pdf` | Original project proposal |
| `kpi-definitions.docx.pdf` | Definitions for all KPIs tracked in the report |
| `schema-adr.docx.pdf` | Architecture decision record for the original 3NF schema |
| `star_schema_adr_addendum.pdf` | ADR addendum documenting the April 2026 star schema migration |
| `HiddenGemMusic-DataDictionary.pdf` | Data dictionary — column-level definitions for all tables in the star schema |
| `Data Quality Report - Capstone Dataset 1.pdf` | Data quality findings for DS1 (Spotify Top 200 / Viral 50) |
| `Data Quality Report - Capstone Dataset 2.docx.pdf` | Data quality findings for DS2 (Top Songs in 73 Countries) |
| `EDA_Dataset1_Historical.pdf` | Exploratory data analysis — DS1 pre-ingestion |
| `EDA_Dataset1_PostIngestion.pdf` | EDA — DS1 post-ingestion validation |
| `EDA_Dataset2_PostIngestion.pdf` | EDA — DS2 post-ingestion validation |
| `EDA_Dataset2_Top50.pdf` | EDA — DS2 Top 50 slice |

### BDA Reference — Data Ingestion + Scripts

All SQL scripts target the `HiddenGemMusic` database. Run order matters; see script headers for dependencies.

#### Source datasets (CSV)

| File | Description |
|---|---|
| `dataset1_top200_viral50.csv` | Raw DS1 — Kaggle Spotify Top 200 / Viral 50 (2017–2021) — **stored externally, see Google Drive link below** |
| `dataset2_top_songs_73_countries.csv` | Raw DS2 — Kaggle Top Spotify Songs in 73 Countries (2023–2025) — **stored externally, see Google Drive link below** |
| `CountryDataset.csv` | Supplemental country reference data (ISO codes and regions) used to populate the Country dimension |

> **Note:** The two raw Kaggle dataset CSVs and both Power BI workbooks exceed GitHub's file size limit and are not tracked in this repository. They are stored externally.

#### Power BI EDA workbooks

| File | Description |
|---|---|
| `dataset1_top200_viral50_EDA.pbix` | Power BI EDA workbook for DS1 — **stored externally, see note above** |
| `dataset2_top_songs_73_countries.pbix` | Power BI EDA workbook for DS2 — **stored externally, see note above** |

#### Database creation

| File | Description |
|---|---|
| `HiddenGemMusic_DB_Creation (1).sql` | Creates the `HiddenGemMusic` database and all original 3NF tables |

#### Original ingestion scripts (3NF schema)

| File | Description |
|---|---|
| `DS1_Ingestion (2).sql` | Loads DS1 into the original 3NF schema (Song, Artist, ArtistSong, AudioFeatures, Album, ChartEntry) |
| `DS2_Ingestion.sql` | Loads DS2 into the original 3NF schema, merging on top of DS1 |

#### Star schema migration (April 2026)

| File | Description |
|---|---|
| `STAR_schema_DDL.update_0426.sql` | DDL for the star schema — replaces Song/Artist/ArtistSong/AudioFeatures/Album with DIM_Song, DIM_Artist, and Bridge_SongArtist; leaves ChartEntry and all pre-computed summary tables intact |
| `DS1_Ingestion_StarSchema_0426.sql` | Re-populates the new dimension tables from DS1 data (run after star schema DDL) |
| `DS2_Ingestion_StarSchema_0426.sql` | Merges DS2 into the star schema dimension tables (run after DS1 star schema ingestion) |
| `FK_Restores.sql` | Re-adds foreign key constraints on the pre-computed summary tables (PeakReachBySong, TrendVelocityBySong, HiddenGems, SongCountryPresence, DiscoveryGapByDay) after the schema migration |

#### Validation / diagnostic scripts

| File | Description |
|---|---|
| `Check_DS1_Staging_Status_Early.sql` | Checks whether DS1_Staging exists, its row count, indexes, and column list — used to verify ingestion state mid-process |
| `Check_Table_Rows_and_DS1Staging.sql` | Quick row-count check across Song, Artist, ArtistSong, ChartEntry, and DS1_Staging existence |
| `Update_Region_Chile.sql` | Diagnostic and fix script for NULL region rows in the Country table — identifies DS1 historical entries with missing region and confirms NULL country_id counts |
