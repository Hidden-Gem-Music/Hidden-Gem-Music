-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: For each song: finds the snapshot_date on which it charted in the most
-- countries simultaneously. Stores peak country count, song_id, and peak date.
-- EXEC sp_PopulatePeakReachBySong;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulatePeakReachBySong
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE PeakReachBySong;

    -- CTE: for every song + date, count distinct countries simultaneously charting
    WITH DailyReach AS (
        SELECT
            song_id,
            snapshot_date,
            COUNT(DISTINCT country_id) AS country_count
        FROM ChartEntry
        WHERE country_id IS NOT NULL
        GROUP BY song_id, snapshot_date
    ),
    -- CTE: per song, identify the date with the highest simultaneous reach
    PeakPerSong AS (
        SELECT
            song_id,
            snapshot_date   AS peak_date,
            country_count   AS peak_country_count,
            ROW_NUMBER() OVER (
                PARTITION BY song_id
                ORDER BY country_count DESC, snapshot_date DESC  -- tiebreak: most recent
            ) AS rn
        FROM DailyReach
    )
    INSERT INTO PeakReachBySong
        (song_id, peak_date, country_count)
    SELECT
        p.song_id,
        p.peak_date,
        p.peak_country_count    AS country_count
    FROM PeakPerSong p
    WHERE p.rn = 1;
END;
GO
