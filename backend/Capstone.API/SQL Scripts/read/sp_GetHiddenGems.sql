-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Full paginated hidden gems list for the Hidden Gems screen.
-- Filterable by minimum country count. Pagination required.
-- EXEC sp_GetHiddenGems @CountryCode = 'US', @Year = 2021, @MinCountries = 3, @Offset = 0, @PageSize = 20;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetHiddenGems
    @CountryCode  CHAR(2),
    @Year         INT,
    @MinCountries INT  = 3,
    @Offset       INT  = 0,
    @PageSize     INT  = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.song_id,
        s.title                 AS song_title,
        a.name                  AS artist_name,
        alb.name                AS album_name,
        s.spotify_id            AS preview_url,   -- used by frontend for 30s Spotify preview
        s.is_explicit,
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
    WHERE c.iso_code           = @CountryCode
      AND hg.chart_year        = @Year
      AND hg.countries_charting >= @MinCountries
    ORDER BY hg.trend_score DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO
