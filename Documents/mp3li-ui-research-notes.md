# Hidden Gem Music
## UI Research Notes

| Field | Details |
| --- | --- |
| Project | Hidden Gem Music Discovery Platform |
| Author | mp3li / Elias Christmas |
| Original planning date | April 13, 2026 |
| Document status | Professionalized research source derived from original UI research notes |

---

## 1. Research Objective

The UI research focused on how Hidden Gem Music should represent global music discovery visually. The central design question was whether the app should use a 3D globe, an interactive web/mobile map library, or a custom app-owned map experience.

The research evaluated three early directions:

- Globe.gl
- Mapbox Globe
- MapLibre

The goal was to identify a visual approach that could support country-level interaction, future comparison features, mobile usability, and a polished capstone presentation.

---

## 2. Evaluation Criteria

Each option was considered against the same product criteria:

| Criterion | Why It Mattered |
| --- | --- |
| Web support | The capstone needed a working browser deployment. |
| Mobile support | The app also needed mobile-friendly behavior through React Native or responsive web. |
| Country interaction | Users needed to select or inspect countries. |
| Visual polish | The discovery surface needed to feel like a product, not a raw data demo. |
| API/key requirements | Setup and deployment risk mattered during capstone delivery. |
| Custom styling | The map/globe needed to match the app’s dark music-focused interface. |
| Long-term flexibility | The map layer needed to support future data and interaction needs. |

---

## 3. Option Review

### Globe.gl

Globe.gl was reviewed as a simple 3D spinning globe library for visualizing data between locations.

Strengths:

- Supports 3D globe visualization.
- Can rotate, zoom, and support point/line relationships.
- Free and does not require an API key.
- Good for showing relationships between locations.

Risks:

- The default visual style can feel technical unless heavily customized.
- The original research raised concern that it may be better suited to web-only usage.
- Mobile/native behavior would need careful validation.

Planning assessment:

Globe.gl was interesting for global relationship visualization, but less clearly aligned with the project’s need for a polished, reliable web/mobile country-selection experience.

### Mapbox Globe

Mapbox Globe was reviewed as the most polished early option.

Strengths:

- Real map data with smooth globe-style interaction.
- Strong visual quality and product-level presentation.
- Country highlighting and marker-based interaction are natural fits.
- Supports custom styling.
- Has a large ecosystem and recognizable industry usage.
- React Native Mapbox support made it relevant for mobile planning.

Risks:

- Requires an API key.
- Introduces dependency on a third-party map provider.
- Free-tier usage and production configuration would need monitoring.

Planning assessment:

Mapbox was the strongest early candidate when the product direction still emphasized a true globe. It had the best presentation quality and strongest “wow factor,” but it also introduced provider setup and deployment considerations.

### MapLibre

MapLibre was reviewed as an open-source interactive map option.

Strengths:

- Free and open source.
- Works across web and React Native paths.
- Supports interactive maps, markers, and custom styles.
- Avoids Mapbox account/API-key dependency.
- Safer long-term option if provider usage limits became a concern.

Risks:

- Less immediately polished than Mapbox Globe.
- Does not provide the same built-in 3D globe presentation.
- Would likely require more design work to reach the desired product feel.

Planning assessment:

MapLibre was a strong practical fallback because it reduced provider risk, but it did not fully match the original desire for a globe-like product centerpiece.

---

## 4. Early Recommendation

The early research favored Mapbox Globe as the strongest presentation option because it offered the most polished global interaction model and best aligned with the original “Discovery Globe” concept.

The recommended fallback was MapLibre if Mapbox usage limits, API-key setup, or deployment concerns became too costly for the project.

Original decision logic:

- Use Mapbox if the team wanted the strongest visual presentation.
- Use MapLibre if provider independence became more important.
- Avoid locking the app into a provider choice until implementation constraints were clearer.

---

## 5. What Changed During Implementation

The final implementation changed from the early Mapbox-first plan to a custom app-owned map path.

| Planning Question | Early Direction | Final Direction | Reason |
| --- | --- | --- | --- |
| Primary map technology | Mapbox Globe was the preferred visual option. | The app uses a generated custom world-map asset rendered inside the frontend. | This avoided runtime provider dependency, API-key risk, and deployment complexity late in the capstone. |
| Product label | Early planning used “Discovery Globe.” | The final user-facing feature is “Discovery Map.” | The implemented experience is a flat app-owned world map, not a live 3D globe provider. |
| Web/mobile split | Early planning assumed provider/library support would determine the web/mobile path. | The final app uses one shared map renderer with responsive behavior across web and mobile paths. | A shared path reduced duplicate implementation work and kept behavior consistent. |
| Interaction model | Globe/map interaction was initially framed around spin, zoom, click, and markers. | Web uses hover/click behavior; mobile uses first-tap preview and second-tap navigation with explicit arrow/zoom/reset controls. | Real-device testing showed phone-browser interaction needed touch-first behavior instead of hover-first assumptions. |
| Deployment dependency | Mapbox would require deployment configuration for a public token. | The live Discovery Map does not call a map provider at runtime. | The capstone deployment needed to be stable, reviewable, and free from unnecessary provider configuration risk. |

The final decision did not reject the research; it refined it. The research established that the map needed to be central, interactive, visually branded, and country-focused. Implementation then prioritized reliability, mobile usability, and deployment control over the original 3D globe presentation.

---

## 6. Final Implementation Direction

The final app direction evolved away from a provider-backed globe and toward an app-owned interactive Discovery Map.

Current implementation uses:

- Generated country geometry.
- A checked-in map asset.
- Shared React Native / React Native Web rendering.
- App-owned country interaction behavior.
- No live external map provider dependency.

Current implementation references:

- `hidden-gem-music-app/src/components/globe/GlobePanel.tsx`
- `hidden-gem-music-app/src/components/globe/GlobeView.tsx`
- `hidden-gem-music-app/src/assets/maps/worldMap50m.ts`
- `tools/generate_world_map_assets.mjs`

This final direction preserved the original product intent: a global discovery surface that helps users explore country-level music gaps. It also reduced deployment risk by avoiding runtime map-provider requirements.

---

## 7. Current App Behavior

The implemented Discovery Map now supports both desktop web and mobile-oriented behavior.

Current web behavior:

- Hovering a country updates the map information panel.
- Hovering a country synchronizes the country list.
- Clicking a country opens the country flow.
- The map remains part of the shared Discovery and Comparison map seam.

Current mobile behavior:

- First tap previews/selects a country.
- Second tap on the same country opens the Country route.
- Arrow, zoom, and reset controls are explicit visible controls.
- Countries without data keep visible borders so the geography remains readable.

Current production mobile-web behavior:

- The web build asks users to choose Desktop or Mobile before the access-code step.
- Mobile mode routes phone-browser users through the mobile Welcome/access presentation, app chrome, Discovery Map controls, and selected mobile layout paths.
- This is a production-readiness workaround for capstone testing and review, not the intended long-term device-detection strategy.

Known follow-up:

- Phone-browser mobile mode still has extra vertical space between the Discovery Map section and the Pre-Selected Filters section.
- A future iteration should replace the manual Desktop/Mobile question with automatic detection that accounts for viewport size, pointer behavior, touch capability, and production browser behavior.

---

## 8. Lessons from the Research

The research was useful even though the final implementation did not use the original Mapbox-first recommendation.

Key takeaways:

- The app needed a global visual centerpiece.
- Country selection mattered more than true globe physics.
- Mobile usability mattered more than visual novelty.
- Provider risk needed to be balanced against presentation quality.
- The final app-owned map path gave the team more control over styling, interaction, and deployment.

The research helped clarify the product goal: the map is not decoration. It is the main interface for discovering where music spreads and where it has not yet arrived.

---

## 9. Final Assessment

The final app-owned map was the right implementation choice for this capstone stage.

It preserved the original product vision:

- global discovery
- country-level exploration
- visual music geography
- map-first navigation into Country and Comparison flows

It also improved practical delivery:

- no runtime map-provider dependency
- no map-provider API key in production
- shared web/mobile renderer
- fully app-owned styling and interaction behavior
- lower deployment risk
- clearer documentation and ownership

If the product continues beyond the capstone, Mapbox or MapLibre could still be reconsidered for richer globe effects or advanced map features. For the completed capstone release, the custom Discovery Map gives the strongest balance of product clarity, implementation control, and deployment reliability.
