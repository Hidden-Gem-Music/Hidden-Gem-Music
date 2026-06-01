USE HiddenGemMusic;
GO

-- Clarify the NULL region rows
SELECT
    c.full_name,
    c.iso_code,
    c.region,
    COUNT(*) AS chart_entries
FROM ChartEntry ce
JOIN Country c ON c.country_id = ce.country_id
WHERE ce.source = 'Historical_Top200_and_Viral50'
  AND c.region IS NULL
GROUP BY c.full_name, c.iso_code, c.region;
GO

-- Also confirm actual NULL country_id count
SELECT 'NULL country_id' AS check_name, COUNT(*) AS rows
FROM ChartEntry
WHERE source = 'Historical_Top200_and_Viral50'
  AND country_id IS NULL;
GO