-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/23/2026
-- Description: Runs all population stored procedures in the correct
--              execution order. Run once after initial data ingestion,
--              or any time the pre-computed summary tables need to be rebuilt.
--              WARNING: Each procedure truncates its target table before inserting.
--              sp_PopulateHiddenGems is the most expensive — run last.
-- =============================================

USE HiddenGemMusic;
GO

EXEC sp_PopulateSongCountryPresence;
GO
EXEC sp_PopulateCountryYearStats;
GO
EXEC sp_PopulateGlobalOverlapByYear;
GO
EXEC sp_PopulateTrendVelocityBySong;
GO
EXEC sp_PopulateDiscoveryGapByDay;
GO
EXEC sp_PopulateIsolationScoreByCountry;
GO
EXEC sp_PopulatePeakReachBySong;
GO
EXEC sp_PopulateHiddenGems;
GO

-- Optional: run with custom minimum country threshold
-- EXEC sp_PopulateHiddenGems @MinCountries = 5;
-- GO

-- Confirm row counts after population
SELECT 'SongCountryPresence'    AS tbl, COUNT(*) AS rows FROM SongCountryPresence
UNION ALL
SELECT 'CountryYearStats',       COUNT(*) FROM CountryYearStats
UNION ALL
SELECT 'GlobalOverlapByYear',    COUNT(*) FROM GlobalOverlapByYear
UNION ALL
SELECT 'TrendVelocityBySong',    COUNT(*) FROM TrendVelocityBySong
UNION ALL
SELECT 'DiscoveryGapByDay',      COUNT(*) FROM DiscoveryGapByDay
UNION ALL
SELECT 'IsolationScoreByCountry',COUNT(*) FROM IsolationScoreByCountry
UNION ALL
SELECT 'PeakReachBySong',        COUNT(*) FROM PeakReachBySong
UNION ALL
SELECT 'HiddenGems',             COUNT(*) FROM HiddenGems;
