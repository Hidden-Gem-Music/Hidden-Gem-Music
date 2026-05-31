# Hidden Gem Music
## Capstone Project UI Plan

| Field | Details |
| --- | --- |
| Project | Hidden Gem Music Discovery Platform |
| Author | mp3li / Elias Christmas |
| Original planning date | April 2026 |
| Document status | Professionalized planning source derived from original UI plan notes |

---

## 1. UI Planning Objective

The UI plan defines the first complete screen map, navigation model, visual asset direction, and reusable interface patterns for Hidden Gem Music. The original goal was to make the app understandable across web and mobile while giving the product a distinct music-focused identity instead of a generic dashboard layout.

The plan centers on three product needs:

- Give users a clear entry point into the app.
- Make country-level music discovery feel visual, interactive, and global.
- Reuse a consistent design system across Discovery, Country, Hidden Gems, Comparison, Dashboard, and Credits screens.

---

## 2. Planned Screen Inventory

The original screen plan identified nine major screens:

| # | Screen | Purpose |
| --- | --- | --- |
| 1 | Welcome Screen | Introduce the app, its purpose, and the main navigation options. |
| 2 | Discovery Globe Screen | Let users explore countries through the primary world discovery surface. |
| 3 | Discovery Globe Filters Screen | Provide filtering and discovery-control options for the globe/map experience. |
| 4 | Comparison Mode Discovery Globe Screen | Let users select countries for side-by-side comparison. |
| 5 | Country Screen | Show a selected country profile and its music discovery context. |
| 6 | Hidden Songs Screen | Show hidden-gem songs for a selected country and year. |
| 7 | Comparison View Screen | Compare selected countries and the music they are missing or sharing. |
| 8 | Dashboard Screen | Present broader analytical views, KPIs, and trend summaries. |
| 9 | Credits Screen | Present project/team credits in the same visual language as the app. |

This screen list became the foundation for the current app route set, with later naming refinements such as **Discovery Dashboard** and **Hidden Gems**.

---

## 3. Navigation Model

### Web

The web navigation model placed the app title/brand in the upper left and primary navigation actions in the upper right.

Planned web navigation actions:

- Discovery Globe / Discovery Map
- Comparison Mode
- Dashboard
- Search

### Mobile

The mobile navigation model kept the title/brand at the top and moved primary navigation controls to the bottom of the screen.

Planned mobile navigation actions:

- Discovery Globe / Discovery Map
- Comparison Mode
- Dashboard
- Search

The navigation direction was intentionally simple: users should always understand where they are, how to return to the main discovery surface, and how to move between discovery, comparison, and dashboard views.

---

## 4. Visual Direction

### Color System

The original color direction came from shared UI references that the team responded to positively. The plan explored two palette options and treated them as starting points rather than locked decisions.

Design intent:

- Dark default interface.
- High-contrast panels and buttons.
- Accent colors that feel music-oriented, polished, and visually memorable.
- Enough contrast for maps, filters, cards, and text-heavy screens.

The implemented app later formalized this direction into a shared theme file:

- `hidden-gem-music-app/src/theme/colors.ts`

### Typography

The original font direction proposed a two-font system:

- **Nyght Serif** for main app screen titles.
- **Tanklager** for supporting UI text and interface labels.

The rationale was to balance personality with readability. Nyght Serif gave the product a distinctive visual identity, while Tanklager supported a structured, condensed interface style.

### Album Art Treatment

The plan proposed a transparent CD-case treatment for album artwork.

Design rationale:

- Gives the music UI a recognizable identity.
- Avoids looking too similar to common streaming-app layouts.
- Works well when multiple album artworks appear on one screen.
- Supports a nostalgic music-object metaphor without overwhelming the interface.

This idea later became part of the app’s reusable visual language through the CD case artwork components.

---

## 5. Screen-Level Design Notes

### Welcome / Splash Screen

The Welcome screen was planned as a compact entry panel over the discovery surface on web, with mobile-safe layout behavior on phone screens.

Core content:

- App title.
- Short explanation of the project.
- Primary actions into the main app areas.
- Consistent styling with the later Credits popup/panel.

### Discovery Globe / Discovery Map

The Discovery screen was planned as the primary exploratory experience. Early planning referred to this as a globe, while later implementation moved toward an app-owned interactive map path that better fit the available project constraints.

Core interaction goals:

- Show countries visually.
- Let users select or inspect countries.
- Support year and filter controls.
- Keep the map central to the product’s “discovery gap” concept.

### Country Screen

The Country screen was planned to explain what is happening in one selected market.

Core content direction:

- Country identity.
- Country-level stats.
- Hidden-gem previews.
- Navigation into the full Hidden Gems view.
- Comparison entry points where useful.

### Hidden Gems Screen

The Hidden Gems screen was planned as a focused song-list experience for one country and year.

Core content direction:

- Selected country/year.
- Song list.
- Album art.
- Artist and song metadata.
- Playback or preview affordances where available.

### Comparison Mode and Comparison View

Comparison Mode was planned as a country-selection flow, followed by a Comparison View that would show the relationship between selected markets.

The original planning considered comparing more countries, but later product direction favored a cleaner two-country comparison as the primary flow.

### Dashboard

The Dashboard was identified as needing more team input during the first plan because it depended heavily on the BDA direction, KPI definitions, and chart/data availability.

The later implemented direction became **Discovery Dashboard**, focused on global overlap, discovery gap, isolation, reach, and trend-based narrative sections.

### Credits Screen

The Credits screen was planned to reuse the Welcome/popup visual language, with different content.

This gave the app a consistent modal/panel pattern instead of making Credits feel like an unrelated page.

---

## 6. Design Decisions Preserved in the Final App

Several early UI planning ideas remained important through implementation:

- Dark-mode-first interface.
- Web top navigation and mobile bottom navigation.
- Welcome screen as the first user-facing product explanation.
- Discovery Map as the primary visual entry point.
- CD-case/album-art treatment as a distinct music UI asset.
- Two-font visual system.
- Reusable panel/button/card styling.
- Comparison and dashboard as separate but related discovery tools.

---

## 7. Current Implementation Notes

The final app evolved from the original planning documents into a React Native / React Native Web app with shared screen ownership and responsive behavior.

Current implementation references:

- `hidden-gem-music-app/Documentation/frontend-architecture.md`
- `hidden-gem-music-app/Documentation/routing-state-and-navigation.md`
- `hidden-gem-music-app/Documentation/screen-data-flow.md`
- `hidden-gem-music-app/Documentation/frontend-styling-rules.md`

The original UI plan should be read as the early design foundation, not as the final source of truth for current implementation details.
