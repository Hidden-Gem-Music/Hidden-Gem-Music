-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: KPI 4: highest number of countries a single song simultaneously charted in
-- at any point in the date range. Result displayed in a Vinyl card component.
-- EXEC sp_GetPeakCrossRegionalReach @DateStart = '2017-01-01', @DateEnd = '2021-12-31';
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetPeakCrossRegionalReach
    @DateStart DATE,
    @DateEnd   DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP 1
        prs.country_count       AS peak_country_count,
        s.title                 AS song_title,
        a.name                  AS artist_name,
        prs.peak_date,
        s.spotify_id            AS preview_url,
        s.is_explicit,
        alb.name                AS album_name
    FROM PeakReachBySong prs
    JOIN Song s ON s.song_id = prs.song_id
    LEFT JOIN ArtistSong asng
        ON asng.song_id    = s.song_id
       AND asng.is_primary = 1
    LEFT JOIN Artist a   ON a.artist_id  = asng.artist_id
    LEFT JOIN Album  alb ON alb.album_id = s.album_id
    WHERE prs.peak_date BETWEEN @DateStart AND @DateEnd
    ORDER BY prs.country_count DESC, prs.peak_date DESC;
END;
GO
