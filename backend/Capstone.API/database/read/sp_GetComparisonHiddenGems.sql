-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
-- Changes:     Song → DIM_Song, ArtistSong → Bridge_SongArtist (artist_order=1),
--              Artist → DIM_Artist, Album join removed (album_name on DIM_Song)
-- Description: Songs trending in surrounding regions but absent from BOTH selected countries.
-- Most powerful data point on the comparison page.
-- EXEC sp_GetComparisonHiddenGems @CountryCodeA = 'US', @CountryCodeB = 'GB', @Year = 2021;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetComparisonHiddenGems
    @CountryCodeA CHAR(2),
    @CountryCodeB CHAR(2),
    @Year         INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CountryIdA INT = (SELECT country_id FROM Country WHERE iso_code = @CountryCodeA);
    DECLARE @CountryIdB INT = (SELECT country_id FROM Country WHERE iso_code = @CountryCodeB);

    SELECT TOP 20
        s.song_id,
        s.title             AS song_title,
        a.artist_name,
        s.album_name,
        hgA.countries_charting,
        hgA.trend_score
    FROM HiddenGems hgA
    JOIN HiddenGems hgB
        ON hgB.song_id    = hgA.song_id
       AND hgB.country_id = @CountryIdB
       AND hgB.chart_year = @Year
    JOIN DIM_Song s ON s.song_id = hgA.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE hgA.country_id = @CountryIdA
      AND hgA.chart_year = @Year
    ORDER BY hgA.trend_score DESC;
END;
GO
