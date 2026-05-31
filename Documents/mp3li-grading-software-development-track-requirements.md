# Hidden Gem Music
## Software Development Track Requirements Evidence

| Field | Details |
| --- | --- |
| Project | Hidden Gem Music Discovery Platform |
| Track | SOFTWARE DEVELOPMENT (SD) |
| Contributor | mp3li |
| Course context | SOFT290 Capstone |
| Document status | Final SD-track requirements evidence |

---

## 1. Purpose

This document explains how mp3li met the Software Development track requirements for the Hidden Gem Music capstone.

The project outline defines the Software Development track as:

> SOFTWARE DEVELOPMENT (SD): Full-stack app, API integration, deployment.

The SD deliverable is also summarized as:

> SD: Full-stack app, integrated APIs, deployed solution.

mp3li's work directly addressed this track through frontend architecture, full app screen implementation, backend/API integration, mobile/web adaptation, provider metadata integration, deployment preparation, production smoke testing, documentation, and presentation-readiness workflows.

---

## 2. Requirement Coverage Summary

| SD Requirement | Evidence of Completion |
| --- | --- |
| Full-stack app | Built and maintained the React Native / React Native Web frontend that consumes the .NET API and SQL-backed data model through app-facing API helpers. |
| API integration | Connected major screens to backend API data flows for Discovery, Country Profile, Hidden Gems, Comparison, Dashboard, metadata, years, and provider-enriched display fields. |
| Deployment | Prepared Cloudflare Pages frontend deployment configuration, SPA redirect behavior, production environment variable documentation, Cloudflare Tunnel/API routing documentation, and production smoke-test evidence. |
| Web and mobile app experience | Implemented responsive web/mobile screen behavior, mobile bottom navigation, mobile-safe Welcome/access flow, mobile Discovery Map controls, and native/mobile Dashboard adaptation. |
| Documentation and maintainability | Produced frontend architecture docs, routing/state docs, screen data-flow docs, local development docs, deployment docs, QA logs, README sections, and planning/reference documentation. |

---

## 3. Full-Stack App Requirement

### Requirement

The SD track required a full-stack application that could present insights through a web and mobile app.

### How This Was Met

mp3li built the app-facing frontend layer that turns the backend/database work into a navigable product experience.

Primary implementation areas:

- React Native / React Native Web app shell.
- Shared screen routing and app state.
- Web and mobile navigation.
- Frontend API client layer.
- Backend DTO mapping into UI-ready data.
- Screen-level loading, fallback, and error behavior.
- Responsive layout behavior across desktop web, mobile web, and native/mobile-oriented paths.

The frontend lives in:

- `hidden-gem-music-app/`

Core app shell:

- `hidden-gem-music-app/App.tsx`

Primary screen files:

- `hidden-gem-music-app/src/screens/WelcomeScreen.tsx`
- `hidden-gem-music-app/src/screens/DiscoveryScreen.tsx`
- `hidden-gem-music-app/src/screens/CountryScreen.tsx`
- `hidden-gem-music-app/src/screens/HiddenGemsScreen.tsx`
- `hidden-gem-music-app/src/screens/ComparisonSelectScreen.tsx`
- `hidden-gem-music-app/src/screens/ComparisonResultsScreen.tsx`
- `hidden-gem-music-app/src/screens/DashboardScreen.tsx`
- `hidden-gem-music-app/src/screens/DashboardScreen.web.tsx`
- `hidden-gem-music-app/src/screens/CreditsScreen.tsx`

The result is a full app experience with multiple connected product areas instead of isolated prototype screens.

---

## 4. Screen and Feature Implementation

### Welcome and Access Flow

mp3li implemented and refined the Welcome experience as the app's entry point.

Delivered behavior:

- Welcome screen presentation.
- Access-code entry layer.
- Desktop/mobile discovery-mode selection for production mobile-browser usability.
- Mobile-safe Welcome/access sizing.
- Route buttons into major app areas.
- Press feedback and guarded route transitions.
- Local/deployment environment configuration for access-code value.

Relevant files:

- `hidden-gem-music-app/src/screens/WelcomeScreen.tsx`
- `hidden-gem-music-app/src/config/accessGate.ts`
- `hidden-gem-music-app/src/config/discoveryMode.ts`

### Discovery Map

mp3li implemented the app-owned interactive Discovery Map experience.

Delivered behavior:

- Custom world-map rendering.
- Generated map geometry integration.
- Country hover behavior on web.
- Country first-tap/second-tap behavior on mobile.
- Country list and map synchronization.
- Year-aware discovery behavior.
- Filter/list panel integration.
- Zoom, pan, and reset controls.
- Mobile-specific control behavior.
- No-data country boundary preservation.
- Responsive map behavior across web and mobile.

Relevant files:

- `hidden-gem-music-app/src/components/globe/GlobePanel.tsx`
- `hidden-gem-music-app/src/components/globe/GlobeView.tsx`
- `hidden-gem-music-app/src/screens/DiscoveryScreen.tsx`
- `hidden-gem-music-app/src/components/DiscoverySidebarPanels.tsx`
- `tools/generate_world_map_assets.mjs`

### Country Profile

mp3li implemented frontend behavior for country-level discovery.

Delivered behavior:

- Country route handoff.
- Country summary sections.
- Year-aware country data.
- Hidden-gem previews.
- Favorite artist and song metadata display.
- Graceful fallbacks while API data loads or refreshes.
- Country comparison entry behavior.

Relevant files:

- `hidden-gem-music-app/src/screens/CountryScreen.tsx`
- `hidden-gem-music-app/src/data/countryApi.ts`
- `hidden-gem-music-app/src/data/apiMappers.ts`

### Hidden Gems

mp3li implemented the Hidden Gems screen and interaction model.

Delivered behavior:

- Country/year hidden-gem song list.
- Selected-song focus behavior.
- Preview playback state.
- Album art and CD-case visual treatment.
- Paged list behavior.
- Metadata display and graceful missing-data states.
- Favorite artist display.
- Loading and fallback behavior.

Relevant files:

- `hidden-gem-music-app/src/screens/HiddenGemsScreen.tsx`
- `hidden-gem-music-app/src/components/CdCaseArt.tsx`
- `hidden-gem-music-app/src/components/ExplicitIndicator.tsx`

### Comparison Mode and Comparison Results

mp3li implemented and integrated comparison-facing frontend flows.

Delivered behavior:

- Country selection flow.
- Comparison route state.
- Comparison result presentation.
- Country-side song and hidden-gem result display.
- Metadata-backed year behavior.
- Shared map/list behavior where applicable.

Relevant files:

- `hidden-gem-music-app/src/screens/ComparisonSelectScreen.tsx`
- `hidden-gem-music-app/src/screens/ComparisonResultsScreen.tsx`

### Discovery Dashboard Adaptation

Leena created the original Discovery Dashboard. mp3li's SD-track work adapted and polished it for frontend/mobile use.

Delivered behavior:

- Native/mobile Dashboard implementation.
- Replacement of Recharts-dependent behavior with app-owned React Native chart components for mobile/native paths.
- Tap-selected chart value behavior.
- Mobile-safe KPI card behavior.
- Dashboard navigation label/order updates.
- Loading text and presentation polish.

Relevant files:

- `hidden-gem-music-app/src/screens/DashboardScreen.tsx`
- `hidden-gem-music-app/src/screens/DashboardScreen.web.tsx`

### Credits

mp3li implemented and refined the Credits screen content and presentation.

Delivered behavior:

- Structured team credit sections.
- Data/provider credit sections.
- External link rows.
- App-styled panel layout.
- Responsive readability.

Relevant file:

- `hidden-gem-music-app/src/screens/CreditsScreen.tsx`

---

## 5. API Integration Requirement

### Requirement

The SD track required API integration and a full-stack app that connects frontend behavior to backend data.

### How This Was Met

mp3li connected the frontend to the backend API through app-owned data helpers and mapper functions.

Primary frontend data responsibilities:

- Resolve API base URL for local, mobile, and deployed environments.
- Fetch screen-ready backend data.
- Map backend DTOs into frontend UI shapes.
- Preserve fallback behavior when metadata is missing.
- Reuse country/year data across screens where possible.
- Avoid unnecessary repeated API requests.
- Support timeout/retry behavior.

Relevant data-layer files:

- `hidden-gem-music-app/src/data/apiBaseUrl.ts`
- `hidden-gem-music-app/src/data/discoveryApi.ts`
- `hidden-gem-music-app/src/data/countryApi.ts`
- `hidden-gem-music-app/src/data/apiMappers.ts`
- `hidden-gem-music-app/src/data/fetchWithTimeout.ts`
- `hidden-gem-music-app/src/data/countryDisplay.ts`

Integrated API-backed areas:

| App Area | API/Data Integration Evidence |
| --- | --- |
| Discovery Map | Loads countries, years, discovery data, and song availability fields. |
| Country Profile | Loads country summaries, country songs, hidden-gem previews, language/genre samples, and related metadata. |
| Hidden Gems | Loads hidden-gem song rows, preview metadata, album art, artist information, and paged results. |
| Comparison Mode | Loads country/year metadata and validates country selections. |
| Comparison Results | Loads comparison summaries and comparison hidden-gem result sets. |
| Discovery Dashboard | Uses API-backed dashboard metrics and chart data, with mobile/native adaptation. |
| Search and navigation | Uses stable country pools and display fallbacks to keep route labels readable during reloads. |

---

## 6. Provider and Additional Data Integration

mp3li also built tooling and frontend integration around additional music metadata that the base chart datasets did not provide.

Provider/data areas:

- Deezer-backed album art.
- Deezer preview/audio metadata.
- Deezer artist and album display data.
- Explicit-content fields.
- Contributor/record information.
- Genius lyrics URLs.
- Language display.
- Genre/provider fields.
- Missing-data fallbacks.

Tooling evidence:

- `tools/mp3li_additional_data_getter_v2/`
- `tools/song_data_enrichment/`
- `backend/Capstone.API/Documentation/apis/deezer-api.md`
- `backend/Capstone.API/Documentation/apis/genius-api.md`
- `backend/Capstone.API/Documentation/apis/genius-web-scraper.md`

This work strengthened the SD track because it connected external provider workflows to app-facing frontend behavior instead of leaving the product limited to raw chart rows.

---

## 7. Deployment Requirement

### Requirement

The SD track required a deployed solution.

### How This Was Met

mp3li prepared and documented the frontend deployment path and production smoke-test process.

Deployment architecture:

- Cloudflare Pages hosts the Expo web frontend.
- Cloudflare Tunnel routes public HTTPS API traffic to the .NET API.
- SQL Server remains private and is not directly exposed.
- The frontend communicates only with the backend API.

Production frontend:

- `https://hiddengemmusicapp.mp3li.online`

Deployment configuration evidence:

- Cloudflare Pages root directory: `hidden-gem-music-app`
- Build command: `npm run export:web`
- Build output: `dist`
- SPA redirect file: `hidden-gem-music-app/public/_redirects`
- Production source branch: `main`
- Required frontend environment variables:
  - `EXPO_PUBLIC_API_BASE_URL`
  - `EXPO_PUBLIC_ACCESS_CODE`

Deployment documentation:

- `Documentation/deployment-guide.md`
- `Documentation/ADR-DEPLOYMENT-001-Deployment-Decisions.md`
- `Documentation/deployment-platform-selection-plan.md`
- `Documentation/QA-log.md`

Deployment-related implementation files:

- `hidden-gem-music-app/package.json`
- `hidden-gem-music-app/public/_redirects`
- `hidden-gem-music-app/src/data/apiBaseUrl.ts`
- `hidden-gem-music-app/src/config/accessGate.ts`

---

## 8. Web and Mobile Requirement

### Requirement

The project scope required insights through a web and mobile app.

### How This Was Met

mp3li built the app using Expo, React Native, and React Native Web so the app could support browser and mobile-oriented experiences from one codebase.

Delivered cross-platform behavior:

- Shared app shell.
- Shared route ownership.
- Responsive screen scaffolds.
- Web top navigation.
- Mobile bottom navigation.
- Compact/mobile-safe Welcome behavior.
- Mobile Discovery Map controls.
- Mobile Dashboard chart adaptation.
- Responsive Country, Hidden Gems, Comparison, Credits, and map/list behavior.

Key mobile/browser stabilization work:

- Added Desktop/Mobile discovery-mode selection for production mobile-browser testing.
- Routed phone-browser users through mobile behavior when Mobile mode is selected.
- Preserved desktop web behavior for desktop users.
- Documented the remaining mobile spacing follow-up between the Discovery Map and Pre-Selected Filters section.

Relevant docs:

- `hidden-gem-music-app/Documentation/frontend-architecture.md`
- `hidden-gem-music-app/Documentation/routing-state-and-navigation.md`
- `hidden-gem-music-app/Documentation/interaction-loading-and-overlay-rules.md`
- `hidden-gem-music-app/Documentation/frontend-styling-rules.md`

---

## 9. Quality Assurance and Testing Evidence

mp3li performed repeated local, browser, mobile, and production-readiness testing.

Validation activities included:

- Frontend typechecking.
- Browser smoke tests.
- Phone-browser LAN testing.
- Expo/native mobile testing where available.
- API endpoint checks.
- Restored-database diagnostics.
- Route/navigation regression checks.
- Mobile responsiveness checks.
- Loading/fallback behavior verification.
- Production smoke-test documentation.

Common verification commands:

```bash
cd hidden-gem-music-app
npm run typecheck
```

```bash
cd hidden-gem-music-app
npm run export:web
```

```bash
cd backend/Capstone.API
dotnet build
```

```bash
git diff --check
```

QA documentation:

- `Documentation/QA-log.md`
- `hidden-gem-music-app/Documentation/local-development-environment.md`
- `Documentation/deployment-guide.md`

---

## 10. Documentation and Maintainability Evidence

The SD track was not only code delivery. It also required the project to be understandable, maintainable, and reviewable.

mp3li created and maintained documentation covering:

- Frontend architecture.
- Routing, state, and navigation.
- Screen data flow.
- Interaction/loading/overlay behavior.
- Frontend styling rules.
- Local development environment.
- Deployment architecture.
- Deployment guide.
- QA logs.
- README frontend/integration sections.
- Planning and mockup documentation.
- PR/issue handoff drafts.

Key documentation files:

- `README.md`
- `Documentation/README.md`
- `Documentation/deployment-guide.md`
- `Documentation/QA-log.md`
- `hidden-gem-music-app/Documentation/README.md`
- `hidden-gem-music-app/Documentation/frontend-architecture.md`
- `hidden-gem-music-app/Documentation/routing-state-and-navigation.md`
- `hidden-gem-music-app/Documentation/screen-data-flow.md`
- `hidden-gem-music-app/Documentation/interaction-loading-and-overlay-rules.md`
- `hidden-gem-music-app/Documentation/frontend-styling-rules.md`
- `hidden-gem-music-app/Documentation/local-development-environment.md`

---

## 11. SD Track Mapping to Project Timeline

| Timeline Phase | SD Track Expectation | mp3li Evidence |
| --- | --- | --- |
| Week 1: Kickoff & Planning | Define problem, roles, tech stack, success metrics. | Contributed UI/product planning, screen inventory, mockups, app direction, and frontend technology planning. |
| Week 2: Design Phase | Data schema, model architecture, UI wireframes. | Created UI plan, web mockups, visual direction, screen flow, navigation concepts, and map/globe research. |
| Week 3: Data Prep & EDA | BDA team cleans data; AI team explores features. | Supported SD readiness by planning frontend data needs, display fields, and screen-specific data expectations. |
| Week 4: Model Development | SD sets up backend skeleton. | Built frontend scaffold, screen structure, app shell, route state, and visual system needed to consume backend data. |
| Week 5: Model Refinement & API Design | SD creates API endpoints for model inference. | Integrated frontend API helpers and mapper functions for screen-ready backend data. |
| Week 6: Front-End Development | SD builds UI components and integrates dashboards. | Built major frontend screens, reusable components, navigation, map UI, Hidden Gems behavior, and Dashboard adaptation. |
| Week 7: Integration Sprint | Connect model/API/front-end/mobile and test end-to-end data flow. | Connected frontend screens to API flows, validated data loading, fixed route/state issues, and tested app behavior across screens. |
| Week 8: Testing & QA | Unit tests, integration tests, performance checks. | Ran typechecks, browser/mobile tests, API smoke checks, cache/loading validation, and QA documentation passes. |
| Week 9: Deployment | Deploy app to cloud and validate pipeline. | Prepared Cloudflare Pages configuration, SPA redirects, production API base URL usage, Cloudflare Tunnel documentation, and smoke tests. |
| Week 10: Final Deliverables | Pitch deck, demo, documentation, business report support. | Produced README sections, documentation maps, QA logs, deployment docs, presentation-readiness support, and final SD evidence documentation. |

---

## 12. Final Deliverables by SD Category

| SD Category | Delivered Artifacts |
| --- | --- |
| Full-stack app | React Native / React Native Web frontend connected to .NET API-backed data flows. |
| Integrated APIs | Frontend API helpers, DTO mappers, provider metadata display, country/comparison/hidden-gem/dashboard integrations. |
| Deployed solution | Cloudflare Pages frontend, Cloudflare Tunnel API path documentation, SPA redirect behavior, deployment guide, smoke-test process. |
| Web/mobile delivery | Responsive web app, mobile bottom nav, phone-browser mobile mode, mobile Dashboard adaptation, mobile Discovery Map controls. |
| Maintainability | Frontend docs, routing docs, data-flow docs, styling docs, local development docs, QA log, README documentation map. |

---

## 13. Final Assessment

mp3li met the Software Development track requirements by delivering the app-facing product layer of Hidden Gem Music and carrying it through integration, testing, deployment readiness, and documentation.

The SD work produced:

- a full frontend app experience
- integrated backend/API data flows
- provider metadata integration
- responsive web/mobile behavior
- deployment configuration and documentation
- production smoke-test evidence
- maintainable frontend documentation
- polished final-project documentation

This satisfies the Software Development track definition from the project outline:

> Full-stack app, API integration, deployment.

It also satisfies the SD deliverable definition:

> Full-stack app, integrated APIs, deployed solution.
