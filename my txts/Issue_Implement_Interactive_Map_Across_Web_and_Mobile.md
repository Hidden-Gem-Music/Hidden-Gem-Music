## Implement Interactive Map Across Web and Mobile

_This issue would replace the current placeholder globe area with a real interactive map experience that works across both web and mobile, while keeping the Hidden Gem Music app flow centered on country discovery, comparison selection, and country-specific information cards._

### Required map behavior that needs to be completed:

1. Show a real interactive world map in the current Discovery Globe area
2. Show the same overall map feature in the current Comparison Mode area
3. Allow users to interact with the map on both web and mobile
4. Allow users to drag/pan the map and zoom in/out
5. Show country information cards directly from map interaction
6. Keep map interaction tied into the app's current country-selection and navigation flows
7. Keep the feature usable in both browser and Expo-based mobile testing

### Required end results for the Discovery map experience:

- Discovery should no longer use the current placeholder globe rendering.
- Users should be able to interact with a real map surface rather than only a decorative placeholder.
- The map should still support country-specific discovery behavior through map interaction.
- Hover or tap interaction should reveal country-specific cards with the relevant Discovery information.
- Discovery filters should visibly affect which countries are emphasized on the map.
- Countries that do not currently match the active filter state should still remain visually understandable where appropriate rather than turning the map into a blank surface.
- Selecting or opening a country through the map should stay aligned with the Discovery screen's current country behavior.

### Required end results for the Comparison map experience:

- Comparison Mode should use the same overall map feature instead of the current placeholder globe treatment.
- Users should be able to use the map as part of selecting which countries they want to compare.
- Comparison filters should affect which countries are emphasized or available on the map.
- The map should make it visually clear when one country has been selected versus when two countries have been selected.
- Map interaction should stay aligned with the Comparison screen's current selection rules instead of becoming a disconnected visual element.

### How the interactive map should behave:

- The map must work in web and mobile flows, not only one platform.
- The map must support direct user interaction rather than acting as a static background.
- Users should be able to drag or pan the map.
- Users should be able to zoom in and out.
- Country cards should appear through map interaction rather than being limited to the side list.
- The overall experience should still feel intentionally styled for Hidden Gem Music rather than looking like a generic default map embed.
- Mobile interaction should remain touch-friendly and should not depend on desktop-only behavior.

### UI and integration expectations:

- The new map feature should replace the current placeholder globe area without requiring the surrounding Discovery and Comparison screen structure to be thrown away.
- Existing screen-level filter/state logic should remain connected to the new map behavior rather than being rebuilt separately.
- Current country information already used in the app should continue to feed the cards and interaction flow.
- The new map should fit visually inside the app's current design language instead of feeling like a separate disconnected tool.

### Where this map work needs to apply:

1. *Discovery Globe screen:*

- Main map/globe area
- Country interaction cards
- Visual response to Discovery filtering

2. *Comparison Mode screen:*

- Main map/globe area
- Country selection behavior
- Visual response to Comparison filtering

### What defines this issue as done:

- Discovery uses a real interactive map instead of the placeholder globe.
- Comparison Mode uses a real interactive map instead of the placeholder globe.
- The map works in browser and mobile flows.
- The map supports pan/drag and zoom interaction.
- Country cards are shown through map interaction in the relevant screen flow.
- Discovery filters visibly affect the map state.
- Comparison filters visibly affect the map state.
- Comparison selections are visually understandable on the map.
- The integrated behavior is tested in browser and mobile where applicable.

### Optional stretch completion if possible:

1. Add stronger visual polish to the map presentation beyond the first stable implementation
2. Add richer selection or emphasis treatment that improves visual clarity without destabilizing the core feature
3. Prepare the map foundation so future animated or movement-based music-spread visualizations can later be added on top of it
