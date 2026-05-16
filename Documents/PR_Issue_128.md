# PR: Dashboard Issue 128 Frontend Fixes

## Completed In This PR

- Updated the "See where your country fits in" dropdown so it can include all countries with app data across available metadata years.
- Kept the selector wording minimal and made dropdown labels clarify whether the right-side value is an isolation score or app data without a returned score.
- Fixed spacing below the Chapter 1 Discovery Gap Distribution explanatory text.
- Made the first four Chapter 1 KPI flip cards larger and changed them from one row of four to a two-by-two layout.
- Made the `flip ↻` hint spacing consistent inside the KPI cards.
- Increased lower conclusion stat cards by about 20% and kept them in a two-by-two square card layout.
- Made section divider numbers and headers bigger.
- Added more breathing room under the Chapter 2 isolation-score explanation.
- Replaced the stacked Chapter 3 plus/minus display with one inline signed value, such as `+6 pts` or `-6 pts`.
- Removed the phrase "then a 22-month silence."
- Added real CD cover art to Chapter 4, THE CEILING, using the existing CD case component.
- Extended the peak reach Dashboard API response with `albumArtUrl` by reusing the existing Deezer enrichment service, with a known cover fallback for the current peak song.
- Renamed the Dashboard nav item to "Discovery Dashboard" and moved it directly after "Discovery Map" on web, mobile, and Welcome screen navigation.

## Clarification Needed Before Remaining Items Can Be Finished

### "Adjust wording on explanation"

Why this is not completed: the issue does not identify which explanation text should change or what replacement wording is expected.

Follow-up needed: please provide the exact current text, screenshot location, or target replacement copy.

### "Conclusion card - make KPI cards a carousel?"

Why this is not completed: the Dashboard conclusion has four stat cards, and that does not map cleanly to the existing Preview Hidden Gems carousel pattern.

Follow-up needed: please provide a screenshot or describe which conclusion cards should become a carousel and what carousel behavior is expected.

### "Add data sources to About this data"

Why this is not completed: the visible source labels need to come from the data owner so the app does not display guessed or incomplete source wording.

Follow-up needed: please provide the exact data-source names/labels that should appear in About this data.

### Dashboard naming feedback

The Dashboard route/nav label was renamed to "Discovery Dashboard" and moved directly after "Discovery Map" in the web and mobile navigation. The Welcome screen copy and buttons were updated to match. We have discussed wanting a catchier name, but have not landed on one yet, so please flag if "Discovery Dashboard" should be changed before final merge. Goal of rename was simply to not forget. 

### "Adjust isolation scores by country graph to include all countries"

Why this is not completed: the Dashboard chart is fed by `sp_GetIsolationRanking`, and that stored procedure currently uses `SELECT TOP 20`. From the issue text, this likely means the graph should include every country that has isolation-score rows, not just the top 20.

Potential SQL direction:

```sql
SELECT
    c.full_name                     AS country_name,
    c.iso_code,
    c.region,
    AVG(isc.isolation_score)        AS isolation_score,
    MAX(isc.isolation_tier)         AS isolation_tier
FROM IsolationScoreByCountry isc
JOIN Country c ON c.country_id = isc.country_id
WHERE isc.chart_year BETWEEN @YearStart AND @YearEnd
GROUP BY c.country_id, c.full_name, c.iso_code, c.region
ORDER BY AVG(isc.isolation_score) DESC;
```

## Verification

- `npm run typecheck`
- `dotnet build Capstone.API.csproj`

## Browser Checks For Reviewer

- Dashboard dropdown includes countries with app data, not only the current top-20 isolation ranking rows.
- Selecting a country with no score in the current ranking response shows app-data availability instead of a fake score.
- Chapter 1 histogram explanatory text has balanced spacing above and below.
- Chapter 1 KPI cards render as a larger two-by-two grid.
- Lower conclusion stat cards are larger and remain in a two-by-two square card layout.
- Chapter 3 signed stat reads inline as `+6 pts` or `-6 pts`.
- Chapter 4 peak reach card shows CD cover art when enrichment returns album art.
