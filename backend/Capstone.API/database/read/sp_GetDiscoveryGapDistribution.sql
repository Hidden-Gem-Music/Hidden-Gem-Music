-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     05/13/2026 — Replaced SongCountryPresence join (imprecise proxy)
--              with direct filter on DiscoveryGapByDay.first_chart_date.
--              Filter now correctly scopes to when the spread event originated,
--              not when the song happened to be charting within the date range.
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
        MIN(dgbd.bucket_order)       AS bucket_order,
        COUNT(DISTINCT dgbd.song_id) AS song_count
    FROM DiscoveryGapByDay dgbd
    WHERE dgbd.first_chart_date BETWEEN @DateStart AND @DateEnd
    GROUP BY dgbd.bucket_label
    ORDER BY MIN(dgbd.bucket_order);
END;
GO