USE HiddenGemMusic;
GO

SELECT 'Song'       AS tbl, COUNT(*) AS rows FROM Song
UNION ALL
SELECT 'Artist'     AS tbl, COUNT(*) AS rows FROM Artist
UNION ALL
SELECT 'ArtistSong' AS tbl, COUNT(*) AS rows FROM ArtistSong
UNION ALL
SELECT 'ChartEntry' AS tbl, COUNT(*) AS rows FROM ChartEntry
UNION ALL
SELECT 'DS1_Staging exists' AS tbl,
    CASE WHEN OBJECT_ID('DS1_Staging') IS NOT NULL THEN 1 ELSE 0 END AS rows;
GO