-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
--              05/19/2026 — Performance pass: index IX_HiddenGems_Country_Year_Song
--                           added separately; country_count carried through InA CTE;
--                           NOT EXISTS rewritten as LEFT JOIN anti-join.
--              05/21/2026 — Replaced HiddenGems proxy with SongCountryChart in all
--                           result sets; RS4/RS5 use direct anti-join on SongCountryChart
--                           instead of HiddenGems membership. Requires SongCountryChart
--                           table (see sp_PopulateSongCountryChart.sql).
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
    WHERE cys.country_id = @CountryIdA
      AND cys.chart_year = @Year;

    -- ── Result Set 2: Country B Stats ───────────────────────
    SELECT
        c.iso_code, c.full_name, c.region,
        cys.total_charted, cys.shared_count, cys.unique_count, cys.overlap_pct
    FROM CountryYearStats cys
    JOIN Country c ON c.country_id = cys.country_id
    WHERE cys.country_id = @CountryIdB
      AND cys.chart_year = @Year;

    -- ── Result Set 3: Songs in BOTH countries ───────────────
    WITH InA AS (
        SELECT scc.song_id, scp.country_count
        FROM SongCountryChart scc
        JOIN SongCountryPresence scp
            ON scp.song_id    = scc.song_id
           AND scp.chart_year = @Year
        WHERE scc.country_id = @CountryIdA
          AND scc.chart_year = @Year
    ),
    InB AS (
        SELECT scc.song_id
        FROM SongCountryChart scc
        WHERE scc.country_id = @CountryIdB
          AND scc.chart_year = @Year
    )
    SELECT
        s.song_id,
        s.title             AS song_title,
        a.artist_name,
        InA.country_count   AS global_presence
    FROM InA
    JOIN InB ON InB.song_id = InA.song_id
    JOIN DIM_Song s ON s.song_id = InA.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    ORDER BY InA.country_count DESC;

    -- ── Result Set 4: Songs unique to Country A ─────────────
    WITH InA AS (
        SELECT scc.song_id
        FROM SongCountryChart scc
        WHERE scc.country_id = @CountryIdA
          AND scc.chart_year = @Year
    ),
    NotInB AS (
        SELECT scc.song_id
        FROM SongCountryChart scc
        WHERE scc.country_id = @CountryIdB
          AND scc.chart_year = @Year
    )
    SELECT TOP 20
        s.song_id,
        s.title         AS song_title,
        a.artist_name
    FROM InA
    LEFT JOIN NotInB ON NotInB.song_id = InA.song_id
    JOIN DIM_Song s ON s.song_id = InA.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE NotInB.song_id IS NULL
    ORDER BY s.title;

    -- ── Result Set 5: Songs unique to Country B ─────────────
    WITH NotInA AS (
        SELECT scc.song_id
        FROM SongCountryChart scc
        WHERE scc.country_id = @CountryIdA
          AND scc.chart_year = @Year
    ),
    InB AS (
        SELECT scc.song_id
        FROM SongCountryChart scc
        WHERE scc.country_id = @CountryIdB
          AND scc.chart_year = @Year
    )
    SELECT TOP 20
        s.song_id,
        s.title         AS song_title,
        a.artist_name
    FROM InB
    LEFT JOIN NotInA ON NotInA.song_id = InB.song_id
    JOIN DIM_Song s ON s.song_id = InB.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE NotInA.song_id IS NULL
    ORDER BY s.title;
END;
GO
