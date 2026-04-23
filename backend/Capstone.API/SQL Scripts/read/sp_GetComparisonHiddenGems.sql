-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
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

    -- Songs that are hidden gems for BOTH Country A and Country B
    SELECT TOP 20
        s.song_id,
        s.title             AS song_title,
        a.name              AS artist_name,
        alb.name            AS album_name,
        hgA.countries_charting,
        hgA.trend_score
    FROM HiddenGems hgA
    JOIN HiddenGems hgB
        ON hgB.song_id    = hgA.song_id
       AND hgB.country_id = @CountryIdB
       AND hgB.chart_year = @Year
    JOIN Song s    ON s.song_id    = hgA.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a   ON a.artist_id  = asng.artist_id
    LEFT JOIN Album  alb ON alb.album_id = s.album_id
    WHERE hgA.country_id = @CountryIdA
      AND hgA.chart_year = @Year
    ORDER BY hgA.trend_score DESC;
END;
GO
