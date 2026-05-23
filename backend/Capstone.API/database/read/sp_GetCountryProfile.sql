-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
-- Changes:     Song → DIM_Song, ArtistSong → Bridge_SongArtist (artist_order=1),
--              Artist → DIM_Artist, Album join removed (album_name on DIM_Song)
-- Updated:     05/19/2026 — Bug fix: added country_id filter to unique songs NOT EXISTS
-- Updated:     05/21/2026 — Replaced HiddenGems proxy with SongCountryChart join for both
--              shared and unique songs; added @CountryId variable; requires SongCountryChart
--              table (see sp_PopulateSongCountryChart.sql)
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

    DECLARE @CountryId INT = (SELECT country_id FROM Country WHERE iso_code = @CountryCode);

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
    WHERE c.iso_code     = @CountryCode
      AND cys.chart_year = @Year;

    -- ── Top 10 Shared Songs ──────────────────────────────────
    SELECT TOP 10
        s.song_id,
        s.title             AS song_title,
        a.artist_name,
        s.album_name,
        scp.country_count   AS countries_charted_in
    FROM SongCountryPresence scp
    JOIN SongCountryChart scc
        ON scc.song_id    = scp.song_id
       AND scc.country_id = @CountryId
       AND scc.chart_year = @Year
    JOIN DIM_Song s ON s.song_id = scp.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE scp.chart_year  = @Year
      AND scp.country_count > 1
    ORDER BY scp.country_count DESC;

    -- ── Top 10 Unique Songs ──────────────────────────────────
    SELECT TOP 10
        s.song_id,
        s.title         AS song_title,
        a.artist_name,
        s.album_name
    FROM SongCountryPresence scp
    JOIN SongCountryChart scc
        ON scc.song_id    = scp.song_id
       AND scc.country_id = @CountryId
       AND scc.chart_year = @Year
    JOIN DIM_Song s ON s.song_id = scp.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE scp.chart_year    = @Year
      AND scp.country_count = 1
    ORDER BY NEWID();
END;
GO
