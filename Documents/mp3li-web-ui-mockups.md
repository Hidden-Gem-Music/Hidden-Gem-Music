# Hidden Gem Music
## Web UI Mockups

| Field | Details |
| --- | --- |
| Project | Hidden Gem Music Discovery Platform |
| Author | mp3li / Elias Christmas |
| Original planning date | April 15, 2026 |
| Document status | Professionalized mockup source derived from original web UI mockup notes |

---

## 1. Purpose

The web UI mockups were created to make the early product direction tangible for the team. The mockups translated the Hidden Gem Music concept into a visible interface language before the frontend screens were fully implemented.

The original mockups focused on:

- Establishing the Hidden Gem Music visual identity.
- Showing how the app could combine music, geography, and data.
- Creating a shared reference point for screen layout decisions.
- Helping the team discuss content needs for country, comparison, filter, and dashboard areas.

---

## 2. Design Context

The mockups used the working title **Hidden Gem Music** and introduced a gem motif as part of the brand language. The gem appeared in the title treatment and could also be reused as a small visual marker in the UI.

The original design was hand-drawn on iPad using Procreate and Apple Pencil. Because of that, the mockups were intended as product direction and layout guidance rather than pixel-perfect implementation files.

Important planning note:

The mockups were not intended to be final or inflexible. They were created to support team discussion and could be changed based on usability, feasibility, or teammate feedback.

---

## 3. Mockup Set

The mockup set covered the main web-facing screens planned for the app.

| Mockup | File | Purpose |
| --- | --- | --- |
| Welcome Screen | `Documents/Hidden Gem Music App Web Mockups/welcomescreen.JPG` | First product entry point and app explanation. |
| Discovery Globe / Map | `Documents/Hidden Gem Music App Web Mockups/discoveryglobe.JPG` | Primary country discovery surface. |
| Country Screen | `Documents/Hidden Gem Music App Web Mockups/countryscreen.JPG` | Country-level music discovery and stats view. |
| Hidden Gems Screen | `Documents/Hidden Gem Music App Web Mockups/hiddengemsscreen.JPG` | Country/year hidden-gem song list. |
| Comparison Mode | `Documents/Hidden Gem Music App Web Mockups/comparisonscreen.JPG` | Country selection for comparison. |
| Comparison View | `Documents/Hidden Gem Music App Web Mockups/comparisonviewscreen.JPG` | Side-by-side comparison output. |

---

## 4. Mockup Images

### Welcome Screen

![Welcome Screen](Hidden%20Gem%20Music%20App%20Web%20Mockups/welcomescreen.JPG)

### Discovery Globe / Map

![Discovery Globe](Hidden%20Gem%20Music%20App%20Web%20Mockups/discoveryglobe.JPG)

### Country Screen

![Country Screen](Hidden%20Gem%20Music%20App%20Web%20Mockups/countryscreen.JPG)

### Hidden Gems Screen

![Hidden Gems Screen](Hidden%20Gem%20Music%20App%20Web%20Mockups/hiddengemsscreen.JPG)

### Comparison Mode

![Comparison Mode](Hidden%20Gem%20Music%20App%20Web%20Mockups/comparisonscreen.JPG)

### Comparison View

![Comparison View](Hidden%20Gem%20Music%20App%20Web%20Mockups/comparisonviewscreen.JPG)

---

## 5. Design Decisions Captured by the Mockups

### Brand and Visual Identity

The mockups established the early brand direction:

- Dark interface.
- Gem visual motif.
- Music-object styling through album art and CD-case ideas.
- Distinct interface surfaces instead of generic dashboard cards.

### Discovery as the Main Experience

The Discovery Globe / Map mockup positioned global exploration as the product’s primary interaction.

The core idea was that users should understand the project by seeing music discovery geographically: which countries have music data, which countries are selected, and where hidden-gem opportunities exist.

### Country and Comparison Content

The original notes intentionally left some information areas open because the data design still needed team alignment.

Open planning questions at that stage:

- Which country-level stats should be shown first?
- Which comparison metrics should be prioritized?
- How should dashboard-style charts influence country and comparison pages?
- Which filters should be included in the filter popup/screen?

### Reusable Component Direction

The mockups assumed that the app should reuse major interface pieces across screens.

Reusable patterns included:

- Welcome-style popup/panel treatment.
- Filter popup structure.
- Shared buttons.
- Album-art/CD-case treatment.
- Consistent dark surfaces and accent colors.

---

## 6. Implementation Notes from the Original Mockup Pass

Several implementation notes from the original mockup document directly influenced the build:

- Year selection needed to exist on country and hidden-gem views.
- Changing year should trigger a loading state while data refreshes.
- Hidden Gems should be reachable from country pages.
- Country pages could show a preview of top hidden songs before linking to the full Hidden Gems screen.
- Comparison Mode should prioritize a cleaner two-country comparison, with additional-country comparison treated as a possible reach goal.
- Credits could reuse the Welcome/popup visual pattern.

---

## 7. Relationship to the Final App

The final app changed in implementation details, but the mockups remained important as the first complete visual product direction.

Ideas preserved in the final app:

- Dark music-focused interface.
- Welcome-first onboarding.
- Discovery Map as the central visual screen.
- Country Profile as a follow-up from map exploration.
- Hidden Gems as a focused song-list experience.
- Comparison Mode and Comparison View as separate stages.
- Dashboard as a broader analytics/narrative surface.
- Credits as a styled app screen rather than an afterthought.

The final source of truth for current frontend behavior is maintained in:

- `hidden-gem-music-app/Documentation/frontend-architecture.md`
- `hidden-gem-music-app/Documentation/routing-state-and-navigation.md`
- `hidden-gem-music-app/Documentation/screen-data-flow.md`
- `hidden-gem-music-app/Documentation/frontend-styling-rules.md`

The original web mockups should be read as early design evidence and product-direction artifacts, not as final implementation specifications.
