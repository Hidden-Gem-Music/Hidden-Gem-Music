-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Updated:     04/26/2026 — Star schema rewrite
-- Changes:     Song → DIM_Song, ArtistSong → Bridge_SongArtist (artist_order=1),
--              Artist → DIM_Artist, Album join removed (album_name on DIM_Song)
-- Description: Full paginated hidden gems list for the Hidden Gems screen.
-- Filterable by minimum country count. Pagination required.
-- EXEC sp_GetHiddenGems @CountryCode = 'US', @Year = 2021, @MinCountries = 3, @Offset = 0, @PageSize = 20;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetHiddenGems
    @CountryCode  CHAR(2),
    @Year         INT,
    @MinCountries INT = 3,
    @Offset       INT = 0,
    @PageSize     INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.song_id,
        s.title         AS song_title,
        a.artist_name,
        s.album_name,
        s.spotify_id    AS preview_url,
        s.is_explicit,
        hg.countries_charting,
        hg.trend_score
    FROM HiddenGems hg
    JOIN Country c ON c.country_id = hg.country_id
    JOIN DIM_Song s ON s.song_id = hg.song_id
    LEFT JOIN Bridge_SongArtist bsa
        ON bsa.song_id      = s.song_id
       AND bsa.artist_order = 1
    LEFT JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
    WHERE c.iso_code            = @CountryCode
      AND hg.chart_year         = @Year
      AND hg.countries_charting >= @MinCountries
    ORDER BY hg.trend_score DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO
