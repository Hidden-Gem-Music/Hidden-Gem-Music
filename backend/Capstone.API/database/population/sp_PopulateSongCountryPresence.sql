-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated: 05/08/2026 -- Added AND ce.chart_type_id != 2 to exclude Viral 50 entries
-- from country presence calculations
-- Description: For each song and year, counts how many distinct countries it charted in.
-- Foundation of Hidden Gems logic and the minimum country count filter.
-- EXEC sp_PopulateSongCountryPresence;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateSongCountryPresence
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE SongCountryPresence;

    INSERT INTO SongCountryPresence (song_id, chart_year, country_count)
    SELECT
        ce.song_id,
        YEAR(ce.snapshot_date)        AS chart_year,
        COUNT(DISTINCT ce.country_id) AS country_count
    FROM ChartEntry ce
    WHERE ce.country_id IS NOT NULL
      AND ce.chart_type_id != 2
    GROUP BY
        ce.song_id,
        YEAR(ce.snapshot_date);
END;
GO