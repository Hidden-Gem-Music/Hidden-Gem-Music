## Implement Language Data Across the App

_This issue would complete the language-specific additional-data workflow across Hidden Gem Music by using mp3li Additional Data Getter v2, validated Genius lyrics URLs, automated lyric-language detection, and app integration that can work in an initial file-backed iteration or later through a database-backed endpoint if that becomes available._


### Required language-related work that needs to be completed for 200,000+ songs:

1. Match and store as many valid Genius lyrics URLs as possible using mp3li Additional Data Getter v2
2. Pull lyrics from the validated Genius URLs for songs where a usable match exists
3. Run the pulled lyrics through an automated language-detection workflow to determine each song's language(s)
4. Export the resulting language dataset into CSV, JSON, and TXT files with identical underlying content, formatted appropriately for each file type
5. Wire language data into the app so the relevant UI locations can actually display language information
6. Add a Lyrics button for songs that have a valid Genius lyrics URL, opening the Genius lyrics page for that song

### Reach work that may optionally also be completed if possible / in future iterations:

1. Move the finalized language dataset into the database instead of relying on file-backed integration
2. Add a dedicated backend endpoint for language data if the database-backed version is completed
3. Expand language handling beyond a first-pass single detected language if multi-language detection proves stable enough
4. Improve confidence handling or fallback handling for songs with ambiguous or mixed-language lyrics


### How language data will be implemented:

- Summary: Use mp3li Additional Data Getter v2 to resolve as many valid Genius lyrics URLs as possible, then use those validated lyrics sources to pull lyrics, detect language, and provide language data for app use.
- Genius matching should continue to use the established v2 workflow, including validated URL matching rather than trusting constructed URLs without page verification.
- After a valid Genius lyrics URL is confirmed for a song, the lyrics should be pulled from that URL and passed into an automated language-identification process rather than being manually labeled.
- Language output should be written into CSV, JSON, and TXT files containing the same records and values, with only the file formatting differing by output type.
- The initial implementation may use that organized local language dataset as the language source for app integration if that is the most stable first iteration.
- As a stretch or later iteration, the same language data may be loaded into the database and served through a dedicated backend endpoint instead.
- Songs that have a valid Genius lyrics URL should expose a Lyrics button in the app that opens that Genius page.

### How language data should behave during implementation:

- Existing validated Genius matches should be reused instead of being needlessly re-matched from scratch.
- Songs without a valid Genius lyrics URL should fail gracefully rather than blocking the rest of the language workflow.
- Songs whose lyrics cannot be pulled successfully should be skipped cleanly and documented in output/state rather than breaking the run.
- Language detection should only run on successfully retrieved lyrics content.
- If language data is still loading in the app, intentional loading states should be shown instead of blank gaps wherever possible.
- Language handling should stay aligned with the app's chunked/paged behavior so the app does not try to load excessive language data that is not yet needed on screen.
- Year-sensitive UI should still update correctly when the selected year changes, even if the language source itself is song-level rather than year-specific.

### Data and implementation handling expectations:

- Language data should not remain only as a standalone tool artifact if it is needed by the live app; it should be wired into the app/backend flow for actual use.
- The v2 Genius workflow, matching rules, retry behavior, skip behavior, and validated URL handling should be treated as the source of truth for the language collection path.
- Any local runtime state, caches, outputs, or credentials used during language collection should remain organized and should not be committed if they are meant to stay local-only.
- CSV, JSON, and TXT outputs should remain synchronized in content so they represent the same language dataset across formats.
- If the database-backed stretch version is pursued later, it should preserve the already-collected language results rather than requiring the whole workflow to be redone from scratch.

### Where language data needs to be shown on screen:

1. *Discovery Globe screen:*

- Filters pop-up -- languages

2. *Country Detail screen:*

- Country Summary Section -- Genre + Language Mix
- Country Name's Language(s) in Music

3. *Comparison Mode screen:*

- Filters -- languages

4. *Comparison View screen:*

- Country Summary Section -- Genre + Language Mix
- Country Name's Language(s) in Music

5. *Hidden Gems screen:*

- Info for the main selected gem song -- language
- Lyrics button for songs with a valid Genius lyrics URL


### What defines this issue as done:

- A stable Genius-based language collection workflow exists in mp3li Additional Data Getter v2.
- Valid Genius lyrics URLs are matched and stored for as many songs as possible without breaking the existing v2 workflow.
- Lyrics are successfully pulled from matched Genius URLs and passed through automated language detection.
- Language data is exported to CSV, JSON, and TXT with identical underlying content.
- The app can reference that language dataset in a working first iteration, even if the database-backed version is not yet complete.
- A Lyrics button exists for songs that have a valid Genius lyrics URL and opens that lyrics page.
- Language data is shown in the relevant UI locations instead of placeholder-only language content where this issue is meant to replace it.
- Missing-match, missing-lyrics, and detection-failure cases are handled gracefully without breaking the workflow or the app.
- Final behavior is tested in browser and mobile where applicable.

### Optional stretch completion if possible:

- Move the finalized language dataset into the database.
- Add a dedicated backend endpoint for language data and switch the app to use that endpoint.
- Improve language detection coverage or confidence handling for songs with mixed or ambiguous lyric language.
- Expand the app's language-related UI behavior once the first iteration is stable.
