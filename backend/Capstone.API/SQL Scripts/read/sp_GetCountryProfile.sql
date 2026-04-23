-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Full summary stats for one country and year. Returns three result sets:
-- (1) KPI summary, (2) top 10 shared songs, (3) top 10 unique songs.
-- EXEC sp_GetCountryProfile @CountryCode = 'US', @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetCountryProfile
    @CountryCode CHAR(2),
    @Year        INT
AS
BEGIN
    SET NOCOUNT ON;

    -- ── Summary Stats ───────────────────────────────────────
    SELECT
        c.iso_code,
        c.full_name,
        c.region,
        cys.chart_year,
        cys.total_charted,
        cys.shared_count,
        cys.unique_count,
        cys.overlap_pct
    FROM CountryYearStats cys
    JOIN Country c ON c.country_id = cys.country_id
    WHERE c.iso_code    = @CountryCode
      AND cys.chart_year = @Year;

    -- ── Top 10 Shared Songs (charted in this country AND others) ──
    SELECT TOP 10
        s.song_id,
        s.title                 AS song_title,
        a.name                  AS artist_name,
        alb.name                AS album_name,
        scp.country_count       AS countries_charted_in
    FROM SongCountryPresence scp
    JOIN Song s    ON s.song_id    = scp.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a   ON a.artist_id  = asng.artist_id
    LEFT JOIN Album  alb ON alb.album_id = s.album_id
    WHERE scp.chart_year  = @Year
      AND scp.country_count > 1
      -- song IS charting locally = NOT a hidden gem for this country
      AND NOT EXISTS (
          SELECT 1 FROM HiddenGems hg2
          WHERE hg2.country_id  = (SELECT country_id FROM Country WHERE iso_code = @CountryCode)
            AND hg2.song_id     = scp.song_id
            AND hg2.chart_year  = @Year
      )
    ORDER BY scp.country_count DESC;

    -- ── Top 10 Unique Songs (charted ONLY in this country) ──
    SELECT TOP 10
        s.song_id,
        s.title                 AS song_title,
        a.name                  AS artist_name,
        alb.name                AS album_name
    FROM SongCountryPresence scp
    JOIN Song s    ON s.song_id    = scp.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a   ON a.artist_id  = asng.artist_id
    LEFT JOIN Album  alb ON alb.album_id = s.album_id
    WHERE scp.chart_year   = @Year
      AND scp.country_count = 1
      -- confirm this is the country in question by checking it's not a hidden gem
      -- for any other country (i.e. it only appears for this country)
      AND NOT EXISTS (
          SELECT 1 FROM HiddenGems hg3
          WHERE hg3.song_id    = scp.song_id
            AND hg3.chart_year = @Year
      )
    ORDER BY NEWID();
END;
GO
