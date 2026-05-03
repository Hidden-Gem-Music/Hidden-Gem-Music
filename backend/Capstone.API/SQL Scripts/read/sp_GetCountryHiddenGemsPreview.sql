-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
-- Changes:     Song → DIM_Song, ArtistSong → Bridge_SongArtist (artist_order=1),
--              Artist → DIM_Artist, Album join removed (album_name on DIM_Song)
-- Description: Top 5 hidden gems teaser widget for the country profile page.
-- Ordered by TrendScore DESC. Fast read from HiddenGems table.
-- EXEC sp_GetCountryHiddenGemsPreview @CountryCode = 'US', @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetCountryHiddenGemsPreview
    @CountryCode CHAR(2),
    @Year        INT,
    @Limit       INT = 5
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Limit)
        s.song_id,
        s.title         AS song_title,
        a.artist_name,
        s.album_name,
        hg.countries_charting,
        hg.trend_score
    FROM HiddenGems hg
    JOIN Country c ON c.country_id = hg.country_id
    JOIN DIM_Song s ON s.song_id = hg.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE c.iso_code    = @CountryCode
      AND hg.chart_year = @Year
    ORDER BY hg.trend_score DESC;
END;
GO
