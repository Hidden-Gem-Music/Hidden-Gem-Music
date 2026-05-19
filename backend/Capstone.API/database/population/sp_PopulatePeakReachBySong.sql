-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated: 05/08/2026 -- Added AND ce.chart_type_id != 2 to DailyReach CTE to exclude
-- Viral 50 entries from peak cross-regional reach calculations
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

    WITH DailyReach AS (
        SELECT
            ce.song_id,
            ce.snapshot_date,
            COUNT(DISTINCT ce.country_id) AS country_count
        FROM ChartEntry ce
        WHERE ce.country_id IS NOT NULL
          AND ce.chart_type_id != 2
        GROUP BY ce.song_id, ce.snapshot_date
    ),
    PeakPerSong AS (
        SELECT
            song_id,
            snapshot_date AS peak_date,
            country_count AS peak_country_count,
            ROW_NUMBER() OVER (
                PARTITION BY song_id
                ORDER BY country_count DESC, snapshot_date DESC
            ) AS rn
        FROM DailyReach
    )
    INSERT INTO PeakReachBySong
        (song_id, peak_date, country_count)
    SELECT
        p.song_id,
        p.peak_date,
        p.peak_country_count AS country_count
    FROM PeakPerSong p
    WHERE p.rn = 1;
END;
GO