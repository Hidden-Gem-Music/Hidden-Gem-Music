-- =============================================
-- Author:      Leena Komenski
-- Create date: 05/21/2026
-- Description: Pre-computes which songs charted in which countries per year.
--              Used by sp_GetCountryProfile, sp_GetCountrySongsPaged, and
--              sp_GetCountryComparison to verify country-specific charting
--              without querying ChartEntry at runtime.
--              Excludes Viral 50 (chart_type_id = 2) for consistency with
--              sp_PopulateSongCountryPresence.
-- EXEC sp_PopulateSongCountryChart;
-- =============================================

-- =============================================
-- Step 1: Create table and index (run once)
-- =============================================

/*
CREATE TABLE SongCountryChart (
    song_id    INT NOT NULL,
    country_id INT NOT NULL,
    chart_year INT NOT NULL,
    CONSTRAINT PK_SongCountryChart PRIMARY KEY (song_id, country_id, chart_year),
    CONSTRAINT FK_SCC_Song    FOREIGN KEY (song_id)    REFERENCES DIM_Song(song_id),
    CONSTRAINT FK_SCC_Country FOREIGN KEY (country_id) REFERENCES Country(country_id)
);

-- Covers country-first lookups in sp_GetCountryComparison CTEs.
-- PK already covers song-first EXISTS / JOIN in profile and paged SPs.
CREATE INDEX IX_SongCountryChart_Country_Year
    ON SongCountryChart (country_id, chart_year);
*/

-- =============================================
-- Step 2: Create / update the population SP
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateSongCountryChart
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE SongCountryChart;

    INSERT INTO SongCountryChart (song_id, country_id, chart_year)
    SELECT DISTINCT
        ce.song_id,
        ce.country_id,
        YEAR(ce.snapshot_date)
    FROM ChartEntry ce
    WHERE ce.country_id IS NOT NULL
      AND ce.chart_type_id != 2;

    -- Sanity check: row counts per year
    SELECT chart_year, COUNT(*) AS song_country_pairs
    FROM SongCountryChart
    GROUP BY chart_year
    ORDER BY chart_year;
END;
GO
