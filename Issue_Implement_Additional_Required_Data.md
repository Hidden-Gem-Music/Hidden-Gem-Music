## Implement Additional Required Data Across the App

_This issue would complete the required implementation work to actually pull, handle, and show the required additional song data across Hidden Gem Music, using the documented provider routes and project integration path already established. Reach data implementation is optional and may be included only if time and stability allow._


### Required additional data that needs to be implemented for 200,000+ songs:

1. Genre(s) of each song
2. Language(s) in each song
3. Album art URL for each song
4. Artist image URL for each song
5. 30 second previews for each song

### Reach data that may optionally also be implemented if possible / in future iterations:

1. If each song has explicit lyrics or not
2. If every album art has an explicit cover or not
3. Whether the album as a whole contains explicit lyrics
4. Release date
5. Lyrics URL
6. Record type: album, EP, etc
7. Contributors: list of contributors on the album
8. The number of each artist's albums


### How the required additional data will be implemented:

- Summary: Use the documented provider routes and the project’s current additional-data architecture to actually implement the required data in the live app flow.
- Required data should be pulled through the app/backend integration path rather than left only as documentation or separate tool capability.
- Existing documented provider behavior, matching rules, cache behavior, preview-expiry handling, and fallback behavior should be used as the implementation basis.
- Required data should be wired into the actual UI locations where placeholder data or missing data still exists.
- The implementation should favor stable, responsive user-facing behavior and should avoid blank sections wherever loading states can be shown instead.
- Rate limits, retries, cache usage, expiry handling, and no-match handling need to be respected during implementation so the app remains usable while data is being pulled.

### How required data should behave during implementation:

- Cached additional data should be reused instead of repeatedly re-pinging providers.
- Preview URLs should only be reused until their expiration and should be refreshed when expired.
- If a provider cannot resolve a usable match for a song or artist, the app should fail gracefully rather than showing broken content.
- If data is still loading, the UI should use intentional loading states instead of empty gaps wherever possible.
- Loading behavior should stay aligned with the app’s chunked/paged list behavior so the app does not try to pull excessive additional data that is not yet needed on screen.
- Year-sensitive data must respect the selected year and update correctly when the selected year changes.

### Data and implementation handling expectations:

- Required data should be implemented through the actual app/backend path, not left only in standalone tool outputs.
- Existing provider docs and project integration docs should be treated as the source of truth for endpoint behavior and limitations.
- Any secrets, tokens, or credentials must continue to stay local/private and must not be committed.
- Any cache/output behavior used during implementation should remain organized and should not break the app’s current local-only handling of secret/config/runtime state.
- Reach data may be implemented only if it can be added without destabilizing the required-data implementation.

### Where required additional data needs to be shown on screen, replacing placeholder data or missing data:

1. *Discovery Globe screen:*

- The country listings in the List View
- The cards in the Globe View
- Filters pop-up

2. *Country Detail screen:*

- Country Summary Section -- both the General Description and the Genre + Language Mix
- Country Name's Favorite Artists In Year Section -- needs Artist Image
- Country Name's Loved Genres
- Country Name's Language(s) in Music
- CD Carousel -- needs album art
- Most Loved in This Country and Loved Here and Elsewhere -- needs album art
- Hidden gem preview carousel -- needs album art, preview behavior, and correct loading behavior

3. *Comparison Mode screen:*

- Filters -- genres and languages

4. *Comparison View screen:*

- Country Summary Section -- both the General Description and the Genre + Language Mix
- Country Name's Favorite Artists In Year Section -- needs Artist Image
- Country Name's Loved Genres
- Country Name's Language(s) in Music
- CD Carousel -- needs album art
- Most Loved in This Country and Loved Here and Elsewhere -- needs album art
- Hidden gem preview carousel -- needs album art, preview behavior, and correct loading behavior

5. *Hidden Gems screen:*

- Info for the main selected gem song -- needs genre, language, album art
- Songs in list view -- needs album art
- Country Name's Favorite Artists In Year Section -- needs Artist Image
- Preview/playback behavior -- needs functional 30 second preview handling


### What defines this issue as done:

- All required additional data is functionally implemented in the app/backend flow.
- Required data is shown in the relevant UI locations instead of placeholder or missing content.
- Genre(s), language(s), album art, artist image, and 30 second previews all work in the app where required by issue scope.
- Loading, cache, retry, fallback, and expiry behavior are stable enough for normal app use.
- Year changes correctly refresh year-sensitive additional data.
- No-match and missing-data cases are handled gracefully without breaking the UI.
- The final implemented behavior is tested in browser and mobile where applicable.

### Optional stretch completion if possible:

- Implement some or all reach data fields without destabilizing the required-data implementation.
- Add any reach data that can be safely shown in the UI now while keeping the required-data implementation as the main priority.
