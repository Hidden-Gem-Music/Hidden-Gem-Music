-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: For each song charting in 2+ countries: calculates days between first chart
-- appearance anywhere (origin) and first appearance in each subsequent country.
-- Pre-buckets into gap bands: 0-7d, 8-14d, 15-30d, 31-60d, 61-90d, 90d+.
-- EXEC sp_PopulateDiscoveryGapByDay;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateDiscoveryGapByDay
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE DiscoveryGapByDay;

    -- CTE: first chart date per song per country
    WITH FirstAppearance AS (
        SELECT
            song_id,
            country_id,
            MIN(snapshot_date) AS first_date
        FROM ChartEntry
        WHERE country_id IS NOT NULL
        GROUP BY song_id, country_id
    ),
    -- CTE: for each song, find the global first appearance (origin)
    Origin AS (
        SELECT
            song_id,
            MIN(first_date)     AS origin_date,
            MIN(country_id)     AS origin_country_id   -- arbitrary tiebreak for same-day origins
        FROM FirstAppearance
        GROUP BY song_id
    ),
    -- CTE: join origin back to all country appearances to compute spread gap
    Spread AS (
        SELECT
            fa.song_id,
            o.origin_country_id,
            fa.country_id        AS spread_country_id,
            o.origin_date,
            fa.first_date        AS spread_date,
            DATEDIFF(DAY, o.origin_date, fa.first_date) AS gap_days
        FROM FirstAppearance fa
        JOIN Origin o ON o.song_id = fa.song_id
        -- exclude the origin country itself (gap_days would be 0 for origin)
        WHERE fa.country_id <> o.origin_country_id
    )
    INSERT INTO DiscoveryGapByDay
        (song_id, origin_country_id, spread_country_id, days_to_spread, bucket_label, bucket_order)
    SELECT
        song_id,
        origin_country_id,
        spread_country_id,
        gap_days                                           AS days_to_spread,
        CASE
            WHEN gap_days <=   7 THEN N'0-7d'
            WHEN gap_days <=  14 THEN N'8-14d'
            WHEN gap_days <=  30 THEN N'15-30d'
            WHEN gap_days <=  60 THEN N'31-60d'
            WHEN gap_days <=  90 THEN N'61-90d'
            ELSE                      N'90d+'
        END                                                AS bucket_label,
        CASE
            WHEN gap_days <=   7 THEN 1
            WHEN gap_days <=  14 THEN 2
            WHEN gap_days <=  30 THEN 3
            WHEN gap_days <=  60 THEN 4
            WHEN gap_days <=  90 THEN 5
            ELSE                      6
        END                                                AS bucket_order
    FROM Spread
    WHERE gap_days >= 0;   -- exclude negative gaps (data artifacts)
END;
GO
