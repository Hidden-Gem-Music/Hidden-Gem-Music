-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Side-by-side KPIs and song lists for two countries. Returns five result sets:
-- (1) Country A stats, (2) Country B stats, (3) shared songs,
-- (4) unique to A, (5) unique to B.
-- EXEC sp_GetCountryComparison @CountryCodeA = 'US', @CountryCodeB = 'GB', @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetCountryComparison
    @CountryCodeA CHAR(2),
    @CountryCodeB CHAR(2),
    @Year         INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CountryIdA INT = (SELECT country_id FROM Country WHERE iso_code = @CountryCodeA);
    DECLARE @CountryIdB INT = (SELECT country_id FROM Country WHERE iso_code = @CountryCodeB);

    -- ── Result Set 1: Country A Stats ───────────────────────
    SELECT
        c.iso_code, c.full_name, c.region,
        cys.total_charted, cys.shared_count, cys.unique_count, cys.overlap_pct
    FROM CountryYearStats cys
    JOIN Country c ON c.country_id = cys.country_id
    WHERE cys.country_id  = @CountryIdA
      AND cys.chart_year  = @Year;

    -- ── Result Set 2: Country B Stats ───────────────────────
    SELECT
        c.iso_code, c.full_name, c.region,
        cys.total_charted, cys.shared_count, cys.unique_count, cys.overlap_pct
    FROM CountryYearStats cys
    JOIN Country c ON c.country_id = cys.country_id
    WHERE cys.country_id  = @CountryIdB
      AND cys.chart_year  = @Year;

    -- CTE: songs in Country A this year (not hidden gems for A = charting in A)
    -- We infer presence from HiddenGems absence:
    --   song IS in country X this year <=> NOT in HiddenGems for country X this year
    -- Use SongCountryPresence as the universe, HiddenGems as the exclusion filter.

    -- ── Result Set 3: Songs in BOTH countries ───────────────
    WITH InA AS (
        SELECT scp.song_id
        FROM SongCountryPresence scp
        WHERE scp.chart_year = @Year
          AND NOT EXISTS (
              SELECT 1 FROM HiddenGems hg
              WHERE hg.country_id = @CountryIdA
                AND hg.song_id    = scp.song_id
                AND hg.chart_year = @Year
          )
    ),
    InB AS (
        SELECT scp.song_id
        FROM SongCountryPresence scp
        WHERE scp.chart_year = @Year
          AND NOT EXISTS (
              SELECT 1 FROM HiddenGems hg
              WHERE hg.country_id = @CountryIdB
                AND hg.song_id    = scp.song_id
                AND hg.chart_year = @Year
          )
    )
    SELECT
        s.song_id,
        s.title             AS song_title,
        a.name              AS artist_name,
        scp.country_count   AS global_presence
    FROM InA
    JOIN InB   ON InB.song_id   = InA.song_id
    JOIN Song s ON s.song_id    = InA.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a ON a.artist_id = asng.artist_id
    JOIN SongCountryPresence scp
        ON scp.song_id    = InA.song_id
       AND scp.chart_year = @Year
    ORDER BY scp.country_count DESC;

    -- ── Result Set 4: Songs unique to Country A ─────────────
    WITH InA AS (
        SELECT scp.song_id
        FROM SongCountryPresence scp
        WHERE scp.chart_year = @Year
          AND NOT EXISTS (
              SELECT 1 FROM HiddenGems hg
              WHERE hg.country_id = @CountryIdA
                AND hg.song_id    = scp.song_id
                AND hg.chart_year = @Year
          )
    ),
    NotInB AS (
        SELECT song_id
        FROM HiddenGems
        WHERE country_id = @CountryIdB
          AND chart_year = @Year
    )
    SELECT TOP 20
        s.song_id,
        s.title         AS song_title,
        a.name          AS artist_name
    FROM InA
    JOIN NotInB ON NotInB.song_id = InA.song_id
    JOIN Song s ON s.song_id      = InA.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a ON a.artist_id = asng.artist_id
    ORDER BY s.title;

    -- ── Result Set 5: Songs unique to Country B ─────────────
    WITH NotInA AS (
        SELECT song_id
        FROM HiddenGems
        WHERE country_id = @CountryIdA
          AND chart_year = @Year
    ),
    InB AS (
        SELECT scp.song_id
        FROM SongCountryPresence scp
        WHERE scp.chart_year = @Year
          AND NOT EXISTS (
              SELECT 1 FROM HiddenGems hg
              WHERE hg.country_id = @CountryIdB
                AND hg.song_id    = scp.song_id
                AND hg.chart_year = @Year
          )
    )
    SELECT TOP 20
        s.song_id,
        s.title         AS song_title,
        a.name          AS artist_name
    FROM InB
    JOIN NotInA ON NotInA.song_id = InB.song_id
    JOIN Song s ON s.song_id      = InB.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a ON a.artist_id = asng.artist_id
    ORDER BY s.title;
END;
GO
