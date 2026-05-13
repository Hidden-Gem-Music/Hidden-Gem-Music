-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     05/08/2026 — Excluded Viral 50 (chart_type_id != 2)
--              05/13/2026 — Added first_chart_date column to support accurate
--              date range filtering in read proc. Raised floor from gap_days > 0
--              to gap_days > 1 to exclude global rollout entries (songs released
--              simultaneously across markets on launch day are not organic spread).
-- Description: For each song charting in 2+ countries: calculates days between first chart
-- appearance anywhere (origin) and first appearance in each subsequent country.
-- Pre-buckets into gap bands: 1-7d, 8-14d, 15-30d, 31-60d, 61-90d, 90d+.
-- EXEC sp_PopulateDiscoveryGapByDay;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateDiscoveryGapByDay
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE DiscoveryGapByDay;

    WITH FirstAppearance AS (
        SELECT
            ce.song_id,
            ce.country_id,
            MIN(ce.snapshot_date) AS first_date
        FROM ChartEntry ce
        WHERE ce.country_id IS NOT NULL
          AND ce.chart_type_id != 2
        GROUP BY ce.song_id, ce.country_id
    ),
    Origin AS (
        SELECT
            song_id,
            MIN(first_date)   AS origin_date,
            MIN(country_id)   AS origin_country_id
        FROM FirstAppearance
        GROUP BY song_id
    ),
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
        WHERE fa.country_id <> o.origin_country_id
    )
    INSERT INTO DiscoveryGapByDay
        (song_id, origin_country_id, spread_country_id, days_to_spread, bucket_label, bucket_order, first_chart_date)
    SELECT
        song_id,
        origin_country_id,
        spread_country_id,
        gap_days AS days_to_spread,
        CASE
            WHEN gap_days <=  7  THEN N'1-7d'
            WHEN gap_days <=  14 THEN N'8-14d'
            WHEN gap_days <=  30 THEN N'15-30d'
            WHEN gap_days <=  60 THEN N'31-60d'
            WHEN gap_days <=  90 THEN N'61-90d'
            ELSE                      N'90d+'
        END AS bucket_label,
        CASE
            WHEN gap_days <=  7  THEN 1
            WHEN gap_days <=  14 THEN 2
            WHEN gap_days <=  30 THEN 3
            WHEN gap_days <=  60 THEN 4
            WHEN gap_days <=  90 THEN 5
            ELSE                      6
        END AS bucket_order,
        origin_date AS first_chart_date
    FROM Spread
    WHERE gap_days > 1;
END;
GO