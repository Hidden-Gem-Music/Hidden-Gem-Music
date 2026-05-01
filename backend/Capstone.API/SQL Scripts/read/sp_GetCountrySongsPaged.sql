-- =============================================
-- Author:      Hidden Gem Music Team
-- Create date: 05/01/2026
-- Description: Returns paginated shared/unique songs for a country-year view.
-- EXEC sp_GetCountrySongsPaged @CountryCode='US', @Year=2023, @ListType='shared', @Offset=0, @PageSize=50;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetCountrySongsPaged
    @CountryCode CHAR(2),
    @Year        INT,
    @ListType    NVARCHAR(16),
    @Offset      INT = 0,
    @PageSize    INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CountryId INT = (
        SELECT country_id
        FROM Country
        WHERE iso_code = @CountryCode
    );

    ;WITH Filtered AS (
        SELECT
            s.song_id,
            s.title AS song_title,
            a.artist_name,
            s.album_name,
            scp.country_count
        FROM SongCountryPresence scp
        JOIN DIM_Song s
            ON s.song_id = scp.song_id
        LEFT JOIN Bridge_SongArtist bsa
            ON bsa.song_id = s.song_id
           AND bsa.artist_order = 1
        LEFT JOIN DIM_Artist a
            ON a.artist_id = bsa.artist_id
        WHERE scp.chart_year = @Year
          AND (
                (@ListType = 'shared'
                 AND scp.country_count > 1
                 AND NOT EXISTS (
                    SELECT 1
                    FROM HiddenGems hg
                    WHERE hg.country_id = @CountryId
                      AND hg.song_id = scp.song_id
                      AND hg.chart_year = @Year
                 ))
                OR
                (@ListType = 'unique'
                 AND scp.country_count = 1
                 AND NOT EXISTS (
                    SELECT 1
                    FROM HiddenGems hg
                    WHERE hg.song_id = scp.song_id
                      AND hg.chart_year = @Year
                 ))
              )
    )
    SELECT
        song_title,
        artist_name,
        album_name,
        COUNT(1) OVER() AS total_count
    FROM Filtered
    ORDER BY
        CASE WHEN @ListType = 'shared' THEN country_count END DESC,
        song_title ASC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO
