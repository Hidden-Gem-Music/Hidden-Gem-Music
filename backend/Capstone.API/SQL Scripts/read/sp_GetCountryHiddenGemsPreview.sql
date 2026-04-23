-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Top 5 hidden gems teaser widget for the country profile page.
-- Ordered by TrendScore DESC. Fast read from HiddenGems table.
-- EXEC sp_GetCountryHiddenGemsPreview @CountryCode = 'US', @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetCountryHiddenGemsPreview
    @CountryCode CHAR(2),
    @Year        INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 5
        s.song_id,
        s.title                 AS song_title,
        a.name                  AS artist_name,
        alb.name                AS album_name,
        hg.countries_charting,
        hg.trend_score
    FROM HiddenGems hg
    JOIN Country c ON c.country_id = hg.country_id
    JOIN Song    s ON s.song_id    = hg.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a   ON a.artist_id  = asng.artist_id
    LEFT JOIN Album  alb ON alb.album_id = s.album_id
    WHERE c.iso_code      = @CountryCode
      AND hg.chart_year   = @Year
    ORDER BY hg.trend_score DESC;
END;
GO
