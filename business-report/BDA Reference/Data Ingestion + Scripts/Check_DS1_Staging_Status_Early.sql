USE HiddenGemMusic;
GO

SELECT 'ChartEntry' AS tbl, COUNT(*) AS rows FROM ChartEntry
UNION ALL
SELECT 'DS1_Staging exists',
    CASE WHEN OBJECT_ID('DS1_Staging') IS NOT NULL THEN 1 ELSE 0 END;

-- Check which indexes exist on DS1_Staging
IF OBJECT_ID('DS1_Staging') IS NOT NULL
BEGIN
    SELECT name AS index_name
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('DS1_Staging')
      AND name IS NOT NULL;
END

-- Check which columns exist on DS1_Staging
IF OBJECT_ID('DS1_Staging') IS NOT NULL
BEGIN
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'DS1_Staging'
    ORDER BY ORDINAL_POSITION;
END
GO