-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
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
        YEAR(ce.snapshot_date)      AS chart_year,
        COUNT(DISTINCT ce.country_id) AS country_count
    FROM ChartEntry ce
    WHERE ce.country_id IS NOT NULL       -- exclude Global Top 50 rows
    GROUP BY
        ce.song_id,
        YEAR(ce.snapshot_date);
END;
GO
