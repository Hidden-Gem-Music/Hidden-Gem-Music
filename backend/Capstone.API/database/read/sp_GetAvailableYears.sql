-- =============================================
-- Author:      Hidden Gem Music Team
-- Create date: 04/30/2026
-- Description: Returns sorted list of chart years with available data.
-- EXEC sp_GetAvailableYears;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetAvailableYears
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT
        YEAR(snapshot_date) AS chart_year
    FROM ChartEntry
    WHERE snapshot_date IS NOT NULL
    ORDER BY chart_year ASC;
END;
GO
