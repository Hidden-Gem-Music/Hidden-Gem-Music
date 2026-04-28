-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Pre-computes normalized trend velocity per song per country using a 4-snapshot
-- rolling window. DS1: normalizes MOVE_UP/DOWN/SAME/NEW_ENTRY strings. DS2: uses
-- daily_movement integers directly. Stores result as DECIMAL(10,4).
-- EXEC sp_PopulateTrendVelocityBySong;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateTrendVelocityBySong
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE TrendVelocityBySong;

    -- CTE: normalize both datasets into a single numeric signal per row
    WITH NormalizedSignals AS (
        SELECT
            ce.song_id,
            ce.country_id,
            ce.snapshot_date,
            CAST(
                CASE
                    WHEN ce.daily_movement IS NOT NULL
                        THEN CASE
                                WHEN ce.daily_movement >  10 THEN  10.0
                                WHEN ce.daily_movement < -10 THEN -10.0
                                ELSE CAST(ce.daily_movement AS FLOAT)
                             END
                    WHEN ce.trend = 'MOVE_UP'   THEN  1.0
                    WHEN ce.trend = 'MOVE_DOWN' THEN -1.0
                    WHEN ce.trend = 'NEW_ENTRY' THEN  1.0
                    ELSE 0.0
                END
            AS FLOAT) AS signal
        FROM ChartEntry ce
        WHERE ce.country_id IS NOT NULL
    ),
    -- CTE: 4-snapshot rolling average per song per country
    -- Use explicit SUM/COUNT rather than AVG() to avoid window aggregate NULL edge cases
    RollingAvg AS (
        SELECT
            song_id,
            country_id,
            snapshot_date,
            CAST(
                SUM(signal) OVER (
                    PARTITION BY song_id, country_id
                    ORDER BY snapshot_date
                    ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
                )
                /
                NULLIF(
                    COUNT(signal) OVER (
                        PARTITION BY song_id, country_id
                        ORDER BY snapshot_date
                        ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
                    ), 0
                )
            AS FLOAT) AS rolling_velocity
        FROM NormalizedSignals
    ),
    -- CTE: take the most recent snapshot's velocity as the stored value
    -- Include snapshot_date so we can derive chart_year
    Latest AS (
        SELECT
            song_id,
            country_id,
            snapshot_date,
            rolling_velocity,
            ROW_NUMBER() OVER (
                PARTITION BY song_id, country_id
                ORDER BY snapshot_date DESC
            ) AS rn
        FROM RollingAvg
    )
    INSERT INTO TrendVelocityBySong (song_id, country_id, chart_year, trend_velocity)
    SELECT
        song_id,
        country_id,
        YEAR(snapshot_date),
        -- Clamp to DECIMAL(10,4) safe range and explicit cast
        CAST(
            CASE
                WHEN rolling_velocity >  99999.9999 THEN  99999.9999
                WHEN rolling_velocity < -99999.9999 THEN -99999.9999
                ELSE ISNULL(rolling_velocity, 0.0)
            END
        AS DECIMAL(10,4))
    FROM Latest
    WHERE rn = 1;
END;
GO
