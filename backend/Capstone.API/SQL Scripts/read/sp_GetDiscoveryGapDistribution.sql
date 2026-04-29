-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
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
        bucket_label,
        MIN(bucket_order)       AS bucket_order,
        COUNT(DISTINCT song_id) AS song_count
    FROM DiscoveryGapByDay dgd
    WHERE days_to_spread > 0
      AND EXISTS (
          SELECT 1
          FROM SongCountryPresence scp
          WHERE scp.song_id    = dgd.song_id
            AND scp.chart_year BETWEEN YEAR(@DateStart) AND YEAR(@DateEnd)
      )
    GROUP BY bucket_label
    ORDER BY MIN(bucket_order);
END;