-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: MOST EXPENSIVE — RUN LAST. For each country + year: finds songs charting in
-- N+ other countries but absent from this country's charts. Computes TrendScore
-- composite: (countries*10) + (avg_rank*5) + (new_entry_bonus*15) + (velocity*10).
-- EXEC sp_PopulateHiddenGems;
-- EXEC sp_PopulateHiddenGems @MinCountries = 5;  -- custom threshold
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_PopulateHiddenGems
    @MinCountries INT = 3
AS
BEGIN
    SET NOCOUNT ON;

    TRUNCATE TABLE HiddenGems;

    -- CTE: all songs present in a given country + year
    WITH SongsInCountry AS (
        SELECT DISTINCT
            country_id,
            YEAR(snapshot_date) AS chart_year,
            song_id
        FROM ChartEntry
        WHERE country_id IS NOT NULL
    ),
    -- CTE: all songs that meet the global presence threshold (N+ countries)
    -- and the year they achieved it
    GloballyPresent AS (
        SELECT
            song_id,
            chart_year,
            country_count
        FROM SongCountryPresence
        WHERE country_count >= @MinCountries
    ),
    -- CTE: average rank signal per song per year across all countries
    -- (lower rank number = better chart position = higher signal)
    AvgRankSignal AS (
        SELECT
            song_id,
            YEAR(snapshot_date)    AS chart_year,
            -- invert rank: position 1 gets highest signal
            AVG(CAST(201 - rank AS DECIMAL(10,4))) AS avg_rank_signal
        FROM ChartEntry
        WHERE country_id IS NOT NULL
        GROUP BY song_id, YEAR(snapshot_date)
    ),
    -- CTE: new entry bonus — 1 if song has any NEW_ENTRY trend row this year
    NewEntryBonus AS (
        SELECT
            song_id,
            YEAR(snapshot_date) AS chart_year,
            MAX(CASE WHEN trend = 'NEW_ENTRY' THEN 1 ELSE 0 END) AS has_new_entry
        FROM ChartEntry
        WHERE country_id IS NOT NULL
        GROUP BY song_id, YEAR(snapshot_date)
    ),
    -- CTE: highest trend velocity per song (max across all countries this year)
    BestVelocity AS (
        SELECT
            song_id,
            MAX(trend_velocity) AS max_velocity
        FROM TrendVelocityBySong
        GROUP BY song_id
    )
    -- Final insert: for every country × year, find globally present songs
    -- that DON'T appear in that country's SongsInCountry set
    INSERT INTO HiddenGems
        (country_id, song_id, chart_year, countries_charting, trend_score)
    SELECT
        sic_all.country_id,
        gp.song_id,
        gp.chart_year,
        gp.country_count                              AS countries_charting,
        -- TrendScore composite formula
        CAST(
            (gp.country_count           * 10.0)
          + (ISNULL(ars.avg_rank_signal,  0) *  5.0)
          + (ISNULL(neb.has_new_entry,    0) * 15.0)
          + (ISNULL(bv.max_velocity,      0) * 10.0)
        AS DECIMAL(10,4))                             AS trend_score
    FROM (
        -- All distinct country + year combinations in the dataset
        SELECT DISTINCT country_id, YEAR(snapshot_date) AS chart_year
        FROM ChartEntry
        WHERE country_id IS NOT NULL
    ) sic_all
    JOIN GloballyPresent gp
        ON gp.chart_year = sic_all.chart_year
    -- Optional joins for scoring signals (LEFT JOIN = 0 if no data)
    LEFT JOIN AvgRankSignal ars
        ON ars.song_id    = gp.song_id
       AND ars.chart_year = gp.chart_year
    LEFT JOIN NewEntryBonus neb
        ON neb.song_id    = gp.song_id
       AND neb.chart_year = gp.chart_year
    LEFT JOIN BestVelocity bv
        ON bv.song_id = gp.song_id
    -- EXCLUDE songs already charting in this country this year
    WHERE NOT EXISTS (
        SELECT 1
        FROM SongsInCountry sic
        WHERE sic.country_id  = sic_all.country_id
          AND sic.chart_year  = gp.chart_year
          AND sic.song_id     = gp.song_id
    );
END;
GO
