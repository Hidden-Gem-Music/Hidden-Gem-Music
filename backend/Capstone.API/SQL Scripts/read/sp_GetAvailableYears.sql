-- =============================================
-- Author:      Leena Komenski
-- Create date: 04/28/2026
-- Description: Returns every distinct chart year present in the HiddenGems table,
--              ordered newest-first. Used to populate year dropdowns in the frontend.
-- EXEC sp_GetAvailableYears;
-- =============================================

USE HiddenGemMusic;
GO

CREATE OR ALTER PROCEDURE sp_GetAvailableYears
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT chart_year AS year
    FROM HiddenGems
    ORDER BY chart_year DESC;
END;
GO
