-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     05/13/2026 — Wired @DateStart / @DateEnd parameters which were declared
--              but ignored. DiscoveryGapByDay has no date column, so filtering is done
--              via JOIN to SongCountryPresence on song_id, filtering by chart_year.
--              COUNT(DISTINCT song_id) prevents double-counting songs that appear in
--              SongCountryPresence across multiple years within the range.
-- Description: Feeds the Discovery Gap Distribution histogram (Recharts BarChart).
-- Returns pre-bucketed song counts. No client-side math required.
-- EXEC sp_GetDiscoveryGapDistribution @DateStart = '2017-01-01', @DateEnd = '2021-12-31';
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetDiscoveryGapDistribution
    @DateStart DATE,
    @DateEnd   DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        dgbd.bucket_label,
        MIN(dgbd.bucket_order)          AS bucket_order,
        COUNT(DISTINCT dgbd.song_id)    AS song_count
    FROM DiscoveryGapByDay dgbd
    INNER JOIN SongCountryPresence scp
        ON scp.song_id = dgbd.song_id
    WHERE dgbd.days_to_spread > 0
      AND scp.chart_year BETWEEN YEAR(@DateStart) AND YEAR(@DateEnd)
    GROUP BY dgbd.bucket_label
    ORDER BY MIN(dgbd.bucket_order);
END;
GO
