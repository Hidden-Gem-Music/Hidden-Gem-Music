<p align="center">
  <img src="hidden-gem-music-app/src/assets/images/gemicon.png" alt="Hidden Gem Music gem icon" width="42" />
</p>

<p align="center">
  <img src="Documentation/Images/readme-title.svg" alt="Hidden Gem Music" width="500" />
</p>

<p align="center">
  The purpose of this app is to find and display the 'Discovery Gap' — What music is most loved in each country, and how much was that country's most loved music spread, shared, and loved by other countries? Explore the Discovery Gap multiple ways: the discovery map, country detail pages, comparison mode, listen to 30 second previews of hidden gems, and the Discovery Dashboard. Utilize filters in multiple areas of the app to fine tune your discovery.
</p>

<p align="center">
  <img alt="Unique songs" src="https://img.shields.io/badge/unique_songs-240%2C848-75526B?style=for-the-badge" />
  <img alt="Countries" src="https://img.shields.io/badge/countries-57-6C7690?style=for-the-badge" />
  <img alt="Playback" src="https://img.shields.io/badge/playback-30_second_previews-2C2E4B?style=for-the-badge" />
  <img alt="Timeline" src="https://img.shields.io/badge/built_in-11_weeks-4C2F3F?style=for-the-badge" />
</p>

<p align="center">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-Expo_React_Native-4C2F3F?style=for-the-badge" />
  <img alt="Backend" src="https://img.shields.io/badge/backend-.NET_9-75526B?style=for-the-badge" />
  <img alt="Database" src="https://img.shields.io/badge/database-SQL_Server-6C7690?style=for-the-badge" />
  <img alt="Deployment" src="https://img.shields.io/badge/deployment-Cloudflare-2C2E4B?style=for-the-badge" />
</p>

<p align="center">
  <img src="Documentation/GIFs/header-app-flow-slow.gif" alt="Hidden Gem Music app flow preview" width="900" />
</p>

## Table of Contents

<details>
<summary>Open Table of Contents</summary>

<br />

- [About the Project](#about-the-project)
- [Team Roles](#team-roles)
- [Live App](#live-app)
- [How to Use Hidden Gem Music](#how-to-use-hidden-gem-music)
- [How It Was Built](#how-it-was-built)
- [Architecture Flow](#architecture-flow)
- [Custom Discovery Map](#custom-discovery-map)
- [About the Database](#about-the-database)
- [Data, API, and Provider Architecture](#data-api-and-provider-architecture)
- [Frontend and Integration Work](#frontend-and-integration-work)
- [Deployment Architecture](#deployment-architecture)
- [Developer Reference](#developer-reference)
- [Documentation Map](#documentation-map)
- [Project Tracking](#project-tracking)
- [Challenges and Solutions](#challenges-and-solutions)
- [Dataset and Provider Credits](#dataset-and-provider-credits)
- [Team Credits](#team-credits)

</details>

## About the Project

Hidden Gem Music was built for the two teammates' Software Development and Business Analytics Capstone Project, the final class needed before graduation and obtaining Associate Degrees.

At its core, Hidden Gem Music is a full-stack app about musical movement: what each country loves most, what stays local, what spreads globally, and where the discovery gaps appear. The app turns chart and metadata work into an interactive experience where users can move from a world map to country profiles, hidden-gem songs, comparisons, and dashboard analytics without needing to read the raw data first.

The project is built around the **Discovery Gap**: the distance between music that is loved in one country and music that becomes shared, spread, and loved elsewhere.

The app includes:

- country-by-country music discovery
- map and list exploration
- country profile pages
- hidden-gem song lists with 30 second previews
- country comparison
- dashboard-style discovery analytics
- credits/source transparency

## Team Roles

<details open>
<summary>Open Team Roles</summary>

<br />

| Team member | Credits role | App contribution summary |
| --- | --- | --- |
| Leena Komenski | Project Manager, Data Engineering, Backend Architecture, and Data Visualization | Built the foundation Hidden Gem Music runs on. Every insight, every chart, every discovery the app surfaces exists because of the data pipeline, stored procedures, and backend architecture underneath it. |
| mp3li | Frontend Lead, UX Implementation, Additional Data Integration, and Presentation Tooling | Owned the app-facing design and implementation work that turned Hidden Gem Music into a polished, data-connected web and mobile experience. |

</details>

## Live App

Hidden Gem Music is deployed for web/mobile browser access at:

```text
https://hiddengemmusicapp.mp3li.online
```

If the app asks for an access code, enter it only if it has been provided to you by the project team.

The source code is hosted in the Hidden Gem Music organization:

```text
https://github.com/Hidden-Gem-Music/Hidden-Gem-Music
```

## How to Use Hidden Gem Music

### 1. Start at Welcome

Open the live app, enter the access code if it has been provided, then choose one of the main app areas from the Welcome screen.

<p align="center">
  <img src="Documentation/Screenshots/welcome-screen.png" alt="Hidden Gem Music welcome screen" width="780" />
</p>

### 2. Explore the Discovery Map

Use Discovery Map to pick a year, search countries, hover countries on the map, view country info on the map or in list view, and open deeper country views.

<p align="center">
  <img src="Documentation/GIFs/readme-discovery-guide.gif" alt="Discovery map usage preview" width="780" />
</p>

<p align="center"><em>Screenshots shown: Discovery Map default view, USA hover/selection state, country search state, and filters panel state.</em></p>

<details>
<summary>More Discovery screenshots</summary>

<br />

<p align="center">
  <img src="Documentation/Screenshots/discovery-map-screen-top-no-hover.png" alt="Discovery map default state" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/discovery-map-screen-hover-usa.png" alt="Discovery map USA hover state" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/discovery-map-screen-search.png" alt="Discovery map search state" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/discovery-map-screen-filters-top.png" alt="Discovery filters top" width="780" />
</p>

</details>

### 3. Open a Country Profile

Country Profile pages summarize a selected country's chart behavior, favorite artists, top songs, hidden-gem previews, and navigate to Comparison Mode.

<p align="center">
  <img src="Documentation/GIFs/readme-country-guide.gif" alt="Country Profile usage preview" width="780" />
</p>

<p align="center"><em>Screenshots shown: USA Country Profile top section, country stats row, and comparison navigation area.</em></p>

<details>
<summary>More Country Profile screenshots</summary>

<br />

<p align="center">
  <img src="Documentation/Screenshots/country-screen-usa-top.png" alt="USA country profile top section" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/country-screen-usa-stat-row.png" alt="USA country profile stats" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/country-screen-usa-main-comp-area.png" alt="USA country profile comparison area" width="780" />
</p>

</details>

### 4. Find Hidden Gems

Hidden Gems shows song-level discovery results for a selected country/year. Users can browse song rows, select tracks, view album/artist metadata, and listen to available 30 second previews.

<p align="center">
  <img src="Documentation/GIFs/readme-hidden-gems-guide.gif" alt="Hidden Gems usage preview" width="780" />
</p>

<p align="center"><em>Screenshots shown: USA Hidden Gems list top, selected-song playback state, and bottom of the song list.</em></p>

<details>
<summary>More Hidden Gems screenshots</summary>

<br />

<p align="center">
  <img src="Documentation/Screenshots/hidden-gems-screen-usa-top.png" alt="Hidden Gems USA top section" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/hidden-gems-screen-usa-play-state.png" alt="Hidden Gems play state" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/hidden-gems-screen-usa-bottom-of-list.png" alt="Hidden Gems bottom of list" width="780" />
</p>

</details>

### 5. Compare Countries

Comparison Mode lets users select two countries and compare overlap, unique songs, most-loved songs, and hidden-gem behavior.

<p align="center">
  <img src="Documentation/GIFs/readme-comparison-guide.gif" alt="Comparison Mode usage preview" width="780" />
</p>

<p align="center"><em>Screenshots shown: Comparison Mode country/filter selection, USA vs. UK comparison summary, and hidden-gems comparison section.</em></p>

<details>
<summary>Comparison Results screenshots</summary>

<br />

<p align="center">
  <img src="Documentation/Screenshots/comp-mode-screen-filters-top.png" alt="Comparison Mode filter selection" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/comp-view-screen-usa-uk-top.png" alt="USA UK comparison results top" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/comp-view-screen-usa-uk-hidden-gems.png" alt="USA UK hidden gems comparison" width="780" />
</p>

</details>

### 6. Read the Discovery Dashboard

The Discovery Dashboard presents broader analytics about overlap, discovery timing, country isolation, peak reach, and trend movement.

<p align="center">
  <img src="Documentation/GIFs/readme-dashboard-guide.gif" alt="Discovery Dashboard usage preview" width="780" />
</p>

<p align="center"><em>Screenshots shown: Japan Discovery Dashboard top section, first story chapter, and dashboard conclusion section.</em></p>

<details>
<summary>More Dashboard screenshots</summary>

<br />

<p align="center">
  <img src="Documentation/Screenshots/dashboard-screen-japan-top.png" alt="Dashboard Japan top section" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/dashboard-screen-japan-chapter-one.png" alt="Dashboard chapter one" width="780" />
</p>

<p align="center">
  <img src="Documentation/Screenshots/dashboard-screen-japan-conclusion.png" alt="Dashboard conclusion" width="780" />
</p>

</details>

## How It Was Built

Hidden Gem Music is a full-stack music discovery app with a browser/mobile frontend, .NET API, SQL Server read model, provider research, and a hybrid Cloudflare deployment.

| Layer | Technology | Role |
| --- | --- | --- |
| Frontend | Expo, React Native, React Native Web, TypeScript | Shared app experience for web and mobile layouts |
| Navigation/UI | App-owned navigation, screen state, responsive components | Discovery, Country, Hidden Gems, Comparison, Dashboard, Credits |
| Backend | .NET 9 ASP.NET Core Web API | Controller/repository API layer for frontend data |
| Data access | Dapper + repository pattern | Stored procedure calls and DTO mapping |
| Database | SQL Server | Precomputed country/year/song summaries and stored procedure read paths |
| Metadata enrichment | Deezer and Genius research/tooling | Album art, previews, artist images, genre/provider fields, lyrics URL/language workflow notes |
| Deployment | Cloudflare Pages + Cloudflare Tunnel | Cloud-hosted frontend and HTTPS API route to local backend |

The SQL Server read model currently documents 240,848 unique songs in `DIM_Song`, 57 country codes in the deployed discovery cache, and approximately 28 million underlying chart rows across the source datasets.

## Architecture Flow

The app has two main data paths: the live app request path users interact with, and the preparation/enrichment path that makes the app data richer before it appears in the UI.

```text
Live app request path

User
  -> Cloudflare Pages frontend
  -> .NET 9 API through Cloudflare Tunnel
  -> private SQL Server read model
  -> .NET 9 API
  -> frontend screens
```

```text
Data preparation and enrichment path

Kaggle chart datasets
  -> SQL Server warehouse and summary tables
  -> .NET API read endpoints
  -> frontend screens

Deezer and Genius research
  -> additional-data tools
  -> reviewed metadata/language/genre outputs
  -> SQL/API/frontend display fields where available
```

The deployed app does not expose SQL Server directly. Users interact with the frontend, the frontend requests screen-ready data from the API, and the API reads stored procedure outputs from the private SQL Server read model. Provider-enriched fields are prepared through tooling so the UI can show album art, previews, lyrics URLs, language, genre, and display metadata where available.

<details open>
<summary>Frontend implementation</summary>

<br />

- The frontend lives in `hidden-gem-music-app`.
- The app is built with Expo and React Native, with React Native Web used for browser deployment.
- The same app structure supports web and mobile, with responsive screen/layout behavior documented in the frontend docs.
- App state and route handoff live around `App.tsx`, route linking, and screen-owned data flows.
- API helpers in `src/data/` map backend DTOs into screen-ready frontend data.
- The app uses a custom visual system with app-owned colors, typography, panels, loading overlays, navigation, and reusable screen components.
- The production web build is generated with `npm run export:web`.

Frontend docs:

- [Frontend documentation index](hidden-gem-music-app/Documentation/README.md)
- [Frontend architecture](hidden-gem-music-app/Documentation/frontend-architecture.md)
- [Routing, state, and navigation](hidden-gem-music-app/Documentation/routing-state-and-navigation.md)
- [Screen data flow](hidden-gem-music-app/Documentation/screen-data-flow.md)
- [Interaction, loading, and overlay rules](hidden-gem-music-app/Documentation/interaction-loading-and-overlay-rules.md)
- [Frontend styling rules](hidden-gem-music-app/Documentation/frontend-styling-rules.md)

</details>

<details open>
<summary>Backend and database implementation</summary>

<br />

- The backend lives in `backend/Capstone.API`.
- The API targets .NET 9 and uses controller routes grouped by screen/domain area.
- Controllers call repository interfaces; repositories call SQL Server stored procedures.
- Dapper maps stored procedure result sets into DTOs.
- Expensive chart aggregation is handled through database preparation/population work instead of raw runtime chart scans.
- Read endpoints query precomputed summary tables and stored procedure outputs.
- The backend standardizes SQL failures, cancellations, and unexpected errors so frontend navigation/cancellation does not become noisy backend failure logging.
- SQL Server remains private. The public app communicates only with the backend API.

Backend/database docs:

- [Backend documentation index](backend/Capstone.API/Documentation/README.md)
- [Current backend API surface](backend/Capstone.API/Documentation/apis/current-backend-api-surface.md)
- [Database documentation index](backend/Capstone.API/database/README.md)
- [Stored procedures reference](backend/Capstone.API/database/Documentation/stored-procedures-reference.md)

</details>

## Custom Discovery Map

Hidden Gem Music does not use a live third-party map service for the Discovery Map. The project uses an app-owned SVG world map so the web and mobile app can share the same rendering path, interaction rules, and visual styling.

How the map was made:

- `tools/generate_world_map_assets.mjs` generates the map asset from `world-atlas`, `topojson-client`, `d3-geo`, and `world-countries`.
- The script converts Natural Earth 50m country geometry into flat SVG path data using an equirectangular projection.
- The generated runtime asset lives at `hidden-gem-music-app/src/assets/maps/worldMap50m.ts`.
- `GlobeView.tsx` reads the checked-in country path data directly instead of calling a live map provider.
- `GlobePanel.tsx` owns the shared framed map slot used by Discovery and Comparison flows.

How the map works in the app:

- Country shapes are matched to backend/app country data by ISO country code.
- Countries with app data receive active fills, hover/selected states, and list synchronization.
- Web users can hover a country to update the map info panel and click to open the country flow.
- Mobile users can tap once to preview/select a country and tap the same country again to open the country flow.
- Mobile controls include explicit arrow, zoom, and reset controls for discoverability.
- Discovery filters and search operate at the screen level, then pass the active country pools into the map renderer.
- Continent outlines and no-data borders keep the map readable even when a country has no chart data for the selected year.

## About the Database

Hidden Gem Music runs on a SQL Server database covering approximately 28.2 million Spotify chart rows across 73 countries and 8 years. With 240,848 unique songs and 57 country codes in the deployed discovery cache, the database is not just infrastructure. It is a feature of the product.

Leena led all database work throughout the project: data sourcing, cleaning, ingestion, schema design, stored procedure development, performance tuning, data quality investigations, and ongoing health maintenance. The data contracts that let the frontend request screen-ready results instead of raw data came from this work.

The database is built as a data warehouse, structured for analytical reads and designed to support new chart sources, additional countries, or new KPIs without the underlying architecture needing to change. That design is what makes the app's current performance possible and future expansion straightforward.

All expensive analytical work happens once, upfront. The results are stored in precomputed summary tables the API reads from at request time, with no aggregation during navigation and nothing calculated on the frontend. This logic is why Discovery, Country Profile, Hidden Gems, Comparison, and Dashboard can all move quickly between screens.

The two source datasets were cleaned, validated, and ingested separately. They do not share a common structure: different country formats, different song identifiers, and metrics that cannot be directly compared. There is a 22-month gap in the data between December 2021 and October 2023, disclosed on the Dashboard and visually accounted for throughout the app.

The database is responsible for:

- storing and serving 28.2 million chart rows across 73 countries and 8 years as a unified, queryable warehouse
- maintaining the relationships between songs, artists, countries, chart types, and all precomputed summary data the app depends on
- powering every data insight in the app through a stored procedure suite: country profiles, hidden gem results, overlap comparisons, discovery gap metrics, isolation rankings, and dashboard KPIs
- serving screen-ready results to the API at request time with no runtime aggregation
- keeping the database private while the backend API acts as the only app-facing data access layer

Data quality investigations were a sustained part of the database work. What the app tells users has to be continuously verified to be true. Incorrect assumptions at the data layer affect the meaning of every chart, every KPI, every hidden gem result, and every conclusion a user draws. Several investigations were also directly about load performance: identifying procedures and summary tables that were too slow, restructuring them, and repopulating in dependency order. Almost all of the loading speed users experience in the frontend is a direct result of that work.

In practice, the database is the foundation of the product. The frontend can feel like an exploratory music app because the database has already done the heavy analytical work: identifying what charted where, what stayed local, what spread globally, how quickly songs moved, which countries overlap, which songs qualify as hidden gems, and which dashboard metrics explain the Discovery Gap.

Related:

- [Business report and data documentation](business-report/README.md)

## Data, API, and Provider Architecture

The deployed frontend talks to a .NET API, but this public README intentionally does not publish copy-paste production API URLs or endpoint call examples. The API is part of the app's implementation surface, not a public developer product. The source of truth for maintainers remains the backend API documentation inside the repo.

### App Database and Internal API Architecture

<details open>
<summary>Open App Database and Internal API Architecture</summary>

<br />

The app's internal data path starts with SQL Server and ends in screen-ready frontend data. SQL Server stores the chart warehouse and precomputed read model; the .NET API reads that data through repositories/stored procedures; the frontend maps those DTOs into Discovery, Country, Hidden Gems, Comparison, and Dashboard UI states.

The README summarizes route groups instead of publishing production URLs or exact endpoint paths. That keeps the public documentation useful for understanding the build without turning the backend into an advertised public API.

| Area | Route group | Purpose |
| --- | --- | --- |
| Metadata | Available-year routes | Populate year selectors and data-availability behavior |
| Discovery | Discovery country/map routes | Feed the custom map, list view, country cards, and selected-year discovery data |
| Country | Country profile routes | Feed country summary KPIs, top shared/unique songs, hidden-gem preview rows, and paged song lists |
| Country | Genre sample routes | Provide sampled genre display data for selected countries where available |
| Hidden Gems | Hidden-gem list routes | Feed paged hidden-gem song exploration and selected-song detail states |
| Comparison | Comparison summary routes | Feed two-country KPI, overlap, unique-song, and shared-song comparisons |
| Comparison | Comparison hidden-gem routes | Feed hidden-gem recommendations for the selected country pair |
| Dashboard | Dashboard KPI/chart routes | Feed overlap, discovery-gap, isolation, peak-reach, distribution, and trend analytics |

</details>

### Deezer, Genius, and Provider Architecture

Deezer is the primary provider for app-facing song enrichment fields such as album art, artist images, preview URLs, genre/provider fields, release dates, contributors, explicit flags, and artist album counts. Genius is used for lyrics URL discovery and the language-preparation workflow used by the additional-data tooling.

<details open>
<summary>Open Deezer, Genius, and Provider Architecture</summary>

<br />

| Provider | Endpoint/path | Project use | Fields used |
| --- | --- | --- | --- |
| Deezer | Search endpoints | Resolve likely song/artist matches for enrichment before pulling detail records | candidate track id, title, artist name/id, album name/id, rank/match context |
| Deezer | Track data | Retrieve playable and display-ready song metadata | preview URL, album id/title, artist id/name, explicit flag, release date, readable duration/rank fields where available |
| Deezer | Artist data | Add artist-level display metadata | artist image URLs, artist id/name, artist album count, artist identity fields |
| Deezer | Album data | Add album-level display metadata | cover art URLs, album title, release date, record type, contributor/tracklist context |
| Genius API | Search endpoint | Find likely lyrics page URLs for language workflow preparation | lyrics URL candidates, title/artist match context |
| Genius page workflow | Lyrics page fetch/research path | Supports the language getter tools after likely Genius URLs are identified | lyrics page text path for local language detection and review |

</details>

These provider summaries intentionally document integration shape and field purpose without publishing provider secrets, tokens, app secrets, or private runtime configuration.

Provider docs:

- [Backend API docs index](backend/Capstone.API/Documentation/apis/README.md)
- [Deezer API notes](backend/Capstone.API/Documentation/apis/deezer-api.md)
- [Genius API notes](backend/Capstone.API/Documentation/apis/genius-api.md)
- [Genius web scraper notes](backend/Capstone.API/Documentation/apis/genius-web-scraper.md)
- [Additional data research notes](backend/Capstone.API/Documentation/apis/additional-data-research-notes.md)

### Language, Genre, and Presentation Warming Tools

mp3li built additional-data tooling to support language, genre, lyrics URL, and app-facing metadata workflows beyond the base chart datasets. This tooling connects directly to the Genius and Deezer provider workflow above: Genius supports lyrics URL/language preparation, while Deezer supports genre and display metadata where available.

<details open>
<summary>Open Language, Genre, and Presentation Warming Tooling</summary>

<br />

The main additional-data tool lives in `tools/mp3li_additional_data_getter_v2`.

#### Deezer metadata collector

`deezer_client.py` looks up Deezer song, album, artist, preview, genre, image, release, contributor, and display fields. This exists so Hidden Gem Music can show richer song cards than the raw chart datasets provide.

#### Genius URL collector

`genius_client.py` searches for likely Genius lyrics pages by song and artist. This gives the language workflow a reviewable lyrics source path without placing lyrics text directly in the app.

#### Language workflow

`language_getter.py` and `language_writers.py` prepare language-ready output from the reviewed lyrics URL workflow. This supports language display and review without making missing language data break app screens.

#### Genre workflow

The genre path uses Deezer metadata where available, then relies on frontend/backend fallback behavior when provider data is missing. This lets the app show useful genre context without pretending every track has perfect provider coverage.

#### Output and resume support

`writers.py`, `state_store.py`, and `merge_outputs.py` keep long enrichment runs organized. They write reviewable CSV/JSON/TXT outputs, preserve run state for retries, and merge partial outputs so the workflow can recover from interruptions instead of starting over.

#### UI live-pull map

`build_ui_live_pull_map.py` prepares app-facing lookup output for live metadata pull behavior. This helps the frontend know which songs have provider-enriched fields available and where fallbacks may still be needed.

#### Presentation warming

Presentation warming prepares known demo paths before a live walkthrough by calling the same data paths the app will need on screen: Discovery samples, Country Profile summaries, Comparison summaries, Hidden Gems demo paths, and cache-aware presentation data. It exists because the first load of a data-heavy route can be slower than later loads if SQL Server, backend caches, or file-backed presentation data are cold. Warming does not change app behavior; it makes likely presentation screens ready before people are waiting on them.

</details>

## Frontend and Integration Work

<details open>
<summary>Open Frontend and Integration Work</summary>

<br />

The frontend work turns the backend/database foundation into the app users actually navigate. The React Native / React Native Web app owns the cross-platform user experience, screen state, navigation paths, responsive layouts, custom visual system, and the mapping layer between backend DTOs and UI-ready data.

Frontend and integration work includes:

- Building the app-facing screens and interaction flows users navigate in the deployed product: Welcome, Discovery Map, Country Profile, Hidden Gems, Comparison Mode, Comparison View, Discovery Dashboard adaptation, and Credits.
- Connecting frontend screens to backend API helpers for metadata/year selection, Discovery country data, Country Profile summaries, hidden-gem previews, paged country songs, comparison summaries, comparison hidden gems, dashboard analytics, and additional-data/language display paths.
- Building the app-owned navigation model, including route handoff, selected year/country state, breadcrumbs, Welcome routing, search flow, mobile bottom navigation, and web/mobile route behavior.
- Implementing responsive screen scaffolds and layout behavior so web and mobile share one app path instead of becoming separate apps.
- Integrating provider-enriched song metadata into visible UI states, including album art, artist images, track previews, explicit flags, contributor/record information, Genius lyrics URLs, language display, genre/provider fields, and graceful missing-data states.
- Implementing the app-owned interactive Discovery Map experience, including generated map assets, country selection, hover/tap behavior, list/map synchronization, filters, zoom/reset controls, no-data borders, and responsive map behavior.
- Adapting Leena's Discovery Dashboard for native/mobile use by replacing Recharts-dependent behavior with custom React Native chart components and mobile-safe interaction states.
- Building Hidden Gems interaction behavior including selected-song focus, preview playback state, paged song lists, CD art handling, favorite-artist display, and loading/fallback behavior.
- Hardening frontend/backend integration through browser smoke tests, local API checks, restored-database diagnostics, stored-procedure contract checks, and documentation of handoff steps where backend/database work needs local follow-through.
- Preparing Cloudflare Pages frontend deployment configuration, SPA redirect behavior, production API base URL usage, and production smoke-test documentation without exposing private runtime values in the public README.
- Building README/documentation media assets, PR/issue drafts, QA logs, implementation timelines, and final documentation workflows so implementation, deployment, and project evidence are discoverable.

Frontend and integration docs:

- [Frontend documentation index](hidden-gem-music-app/Documentation/README.md)
- [Frontend architecture](hidden-gem-music-app/Documentation/frontend-architecture.md)
- [Routing, state, and navigation](hidden-gem-music-app/Documentation/routing-state-and-navigation.md)
- [Screen data flow](hidden-gem-music-app/Documentation/screen-data-flow.md)
- [Interaction, loading, and overlay rules](hidden-gem-music-app/Documentation/interaction-loading-and-overlay-rules.md)
- [Frontend styling rules](hidden-gem-music-app/Documentation/frontend-styling-rules.md)
- [Frontend local development](hidden-gem-music-app/Documentation/local-development-environment.md)

</details>

## Deployment Architecture

Hidden Gem Music uses a hybrid Cloudflare deployment:

- Cloudflare Pages hosts the Expo web frontend at `https://hiddengemmusicapp.mp3li.online`.
- Cloudflare Tunnel routes frontend API traffic to the iMac-hosted .NET API without exposing SQL Server.
- SQL Server stays private on the iMac/local Docker setup.

The production frontend source branch is now `main`. Initial deployment validation used the dedicated `deployment` branch so the deployment path could be tested before the final cutover.

Deployment docs:

- [Deployment guide](Documentation/deployment-guide.md)
- [Deployment ADR](Documentation/ADR-DEPLOYMENT-001-Deployment-Decisions.md)
- [Deployment platform selection plan](Documentation/deployment-platform-selection-plan.md)

<details>
<summary>Deployment configuration details</summary>

<br />

Cloudflare Pages settings:

```text
Root directory: hidden-gem-music-app
Build command: npm run export:web
Build output directory: dist
Production environment variable:
  EXPO_PUBLIC_API_BASE_URL=<production API base URL>
  EXPO_PUBLIC_ACCESS_CODE=<provided access code>
Custom domain:
  hiddengemmusicapp.mp3li.online
```

The frontend includes `hidden-gem-music-app/public/_redirects`:

```text
/*    /index.html   200
```

Cloudflare Tunnel routes:

```text
<production API base URL> -> local backend API service
```

The backend production CORS policy allows:

```text
https://hiddengemmusicapp.mp3li.online
```

Production smoke tests:

```text
https://hiddengemmusicapp.mp3li.online
```

API smoke tests should be run by maintainers from the deployment documentation or private environment notes, not copied from the public README.

</details>

## Developer Reference

The live app is already deployed at the public URL above. This section is for maintainers/contributors who need to understand or verify the code locally, not for normal app users.

<details>
<summary>Local verification and runbook</summary>

<br />

Backend local config:

```bash
cp backend/Capstone.API/appsettings.Local.example.json backend/Capstone.API/appsettings.Local.json
```

Run backend locally:

```bash
cd backend/Capstone.API
ASPNETCORE_ENVIRONMENT=Local dotnet run --no-launch-profile --urls "http://0.0.0.0:5140"
```

Install/run frontend locally:

```bash
cd hidden-gem-music-app
npm install
npx expo start --web -c --host lan
```

Phone/LAN testing override when needed:

```bash
EXPO_PUBLIC_API_BASE_URL="http://YOUR_MAC_LAN_IP:5140" npx expo start -c --host lan
```

Verification commands:

```bash
cd hidden-gem-music-app
npm run typecheck
npm run export:web
```

```bash
cd backend/Capstone.API
dotnet build
```

```bash
git diff --check
```

</details>

<details>
<summary>Environment variables and local secrets</summary>

<br />

| Name/file | Used by | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Frontend | Overrides the API base URL. Keep production/runtime values in deployment settings, not in committed docs. |
| `EXPO_PUBLIC_ACCESS_CODE` | Frontend | Access-code value for the temporary limited-access gate. Keep the real value in local/deployment settings, not in committed docs. |
| `backend/Capstone.API/appsettings.Local.json` | Backend | Local SQL Server configuration. Copy from `appsettings.Local.example.json`. |
| `ConnectionStrings:DefaultConnection` | Backend | SQL Server connection string. Keep real credentials local. |
| `GENIUS_ACCESS_TOKEN` | Provider/tooling workflows | Genius API token. Keep local. |
| `DEEZER_APP_ID` | Provider/tooling workflows | Deezer app id where needed. Keep local. |
| `DEEZER_APP_SECRET` | Provider/tooling workflows | Deezer app secret where needed. Keep local. |

</details>

## Documentation Map

<details>
<summary>Open documentation index</summary>

<br />

Shared documentation:

- [Repository documentation map](Documentation/README.md)
- [QA log](Documentation/QA-log.md)

Frontend documentation:

- [Frontend documentation index](hidden-gem-music-app/Documentation/README.md)
- [Frontend architecture](hidden-gem-music-app/Documentation/frontend-architecture.md)
- [Routing, state, and navigation](hidden-gem-music-app/Documentation/routing-state-and-navigation.md)
- [Screen data flow](hidden-gem-music-app/Documentation/screen-data-flow.md)
- [Interaction, loading, and overlay rules](hidden-gem-music-app/Documentation/interaction-loading-and-overlay-rules.md)
- [Frontend styling rules](hidden-gem-music-app/Documentation/frontend-styling-rules.md)
- [Frontend local development](hidden-gem-music-app/Documentation/local-development-environment.md)

Backend and database documentation:

- [Backend documentation index](backend/Capstone.API/Documentation/README.md)
- [Backend API docs index](backend/Capstone.API/Documentation/apis/README.md)
- [Database documentation index](backend/Capstone.API/database/README.md)
- [Stored procedures reference](backend/Capstone.API/database/Documentation/stored-procedures-reference.md)

Tools and business/data documentation:

- [Tools documentation](tools/README.md)
- [Song data enrichment tool](tools/song_data_enrichment/README.md)
- [Additional data getter v2](tools/mp3li_additional_data_getter_v2/README.md)
- [Business report index](business-report/README.md)

</details>

## Project Tracking

<details open>
<summary>Open project board details</summary>

<br />

The active GitHub Projects board is [Capstone Progress Tracker](https://github.com/users/lkomenski/projects/6). Leena built the board at the start of the project, and it has been the shared planning source for the full 11-week capstone. The team has used it to organize the backlog, prioritize weekly work, assign ownership, track in-progress implementation, move completed work into Done, and keep deployment/final-documentation tasks visible.

The board is the planning structure the project has been built from, not just an after-the-fact checklist. It has carried the project from proposal and setup through frontend buildout, backend/database work, integration, QA, deployment, and final documentation. Its views and fields have made the work easier to scan by status, priority, owner, milestone, and review state.

As of the May 25, 2026 documentation pass, the GitHub repository shows:

- 98 issues
- 70 pull requests
- 10 project labels: BACKEND, BDA, DATA, DEPLOY, DOCS, FRONTEND, help wanted, INTEGRATION, QA, and UI
- 9 milestones spanning Planning Phase through Final Presentation + Prep

Labels represented in the repo:

| Label | Purpose |
| --- | --- |
| BACKEND | .NET API work, controllers, endpoints, DTOs, repository pattern, and backend behavior |
| BDA | Business/data analytics work, KPIs, charts, and dashboard/data insight work |
| DATA | Database, dataset, ingestion, stored procedure, and data-layer work |
| DEPLOY | Cloud deployment, deployment configuration, CI/CD-adjacent work, and smoke tests |
| DOCS | README, ADRs, component documentation, deployment guide, and final audit work |
| FRONTEND | React Native UI work, components, screens, navigation, and styling |
| help wanted | Work needing assistance, discussion, or team decision-making |
| INTEGRATION | Wiring live endpoints to UI and validating end-to-end flows |
| QA | Testing, debugging, bug fixes, and validation |
| UI | Design-system decisions, dark mode, fonts, color palette, and design review |

Milestones represented in the repo:

| Milestone | Purpose |
| --- | --- |
| Planning Phase | Initial planning and project setup |
| Front End Build + Data Prep | Early UI buildout and data-prep work |
| Database Completion + Backend Skeleton | Database build and backend foundation |
| Remaining Endpoints & Data Visualization | Endpoint completion and visual analytics |
| Integration Debugging + Polish | Cross-layer integration and app polish |
| Integration Sprint | Focused integration work |
| Testing & QA | Regression testing, bug fixes, and validation |
| Deployment + Final Presentation | Deployment work and final presentation readiness |
| Final Presentation + Prep | Final presentation and last-mile preparation |

</details>

## Challenges and Solutions

<details>
<summary>Open Challenges and Solutions</summary>

<br />

| Challenge | Solution |
| --- | --- |
| Large dataset performance | Moved expensive chart calculations into SQL population stored procedures and precomputed summary tables so runtime API requests read prepared result sets instead of scanning the raw chart table. |
| Database schema evolution | Migrated the database from the earlier transactional structure into a star-schema read model, then repopulated dependent summary tables and updated stored procedure/read contracts against the new structure. |
| App needed more metadata than the Kaggle datasets provided | Added Deezer/Genius-backed tooling to collect and review album art, previews, lyrics URLs, language, genre, artist, album, and display metadata while keeping provider data as enrichment with fallbacks. |
| Custom discovery map control | Chose an app-owned SVG world map instead of Mapbox/MapLibre so the project had full control over styling, hover/tap behavior, mobile controls, country data matching, and web/mobile consistency. |
| Mobile/web responsive adaptation | Built one responsive React Native / React Native Web path for the major screens instead of maintaining separate web and mobile implementations. |
| Navigation model changes | Reworked app navigation into app-owned route state, breadcrumbs, screen handoff, selected year/country state, and mobile bottom navigation so web and mobile could share one product flow. |
| Deployment permissions and ownership | Moved the repository into the Hidden Gem Music organization so deployment ownership, repository access, and team visibility could align with the final project home. |
| Deployment architecture decisions | Selected a hybrid Cloudflare approach: Pages for the Expo web frontend, Tunnel for the private iMac-hosted .NET API, and SQL Server kept private behind the backend. |
| Cold-start presentation readiness | Added cache-aware presentation warming for known demo paths so Discovery, Country Profile, Comparison, and Hidden Gems screens can be prepared before a live walkthrough. |

</details>

## Dataset and Provider Credits

<details>
<summary>Open Dataset and Provider Credits</summary>

<br />

Hidden Gem Music uses chart/data work and provider research documented throughout the repository. Data and provider documentation is maintained in:

- [Business report index](business-report/README.md)
- [Database documentation index](backend/Capstone.API/database/README.md)
- [Backend API docs index](backend/Capstone.API/Documentation/apis/README.md)
- [Deezer API notes](backend/Capstone.API/Documentation/apis/deezer-api.md)
- [Genius API notes](backend/Capstone.API/Documentation/apis/genius-api.md)

Hidden Gem Music combines large-scale Spotify chart datasets with live music metadata APIs to power its discovery, comparison, country, hidden-gem, and presentation views.

Project data/provider roles:

- Spotify chart history from Kaggle supports the app's historical country/year song analysis, including country profiles, comparison views, shared-song counts, and hidden-gem calculations.
- The daily Top Spotify Songs in 73 Countries dataset supports the newer country chart coverage used throughout the app's current-year discovery and dashboard experiences.
- Deezer API metadata is used for app-facing song details such as album art, preview/audio metadata, artist and album information, explicit-content fields, contributors, and tracklist-backed display details.

Source/provider links:

- [Top Spotify Songs in 73 Countries](https://www.kaggle.com/datasets/asaniczka/top-spotify-songs-in-73-countries-daily-updated)
- [Spotify Charts](https://www.kaggle.com/datasets/dhruvildave/spotify-charts)
- [Deezer API](https://developers.deezer.com/api)

</details>

## Team Credits

<details>
<summary>Open Team Credits</summary>

<br />

Hidden Gem Music was built for the SOFT290 capstone by Leena Komenski and mp3li.

### Leena Komenski - Project Manager, Data Engineering, Backend Architecture, and Data Visualization

Built the foundation Hidden Gem Music runs on. Every insight, every chart, every discovery the app surfaces exists because of the data pipeline, stored procedures, and backend architecture underneath it.

- Co-named the Discovery Gap and defined how to quantify it — translating the concept into the metrics, stored procedures, and data structures that make it visible across the app.
- Sourced, cleaned, and ingested 28.2 million rows of Spotify chart data spanning 73 countries and eight years into a SQL Server database built from scratch — including diagnosing and resolving a SQL Server 2025 compatibility break that prevented standard CSV ingestion entirely.
- Migrated the database mid-project from a transactional structure to a star-schema data warehouse — redesigning the schema, moving all data without loss, and rebuilding the stored procedure suite against the new structure.
- Designed and implemented the index strategy and pre-computation architecture that makes the app fast — including all summary tables populated once and read instantly at runtime.
- Authored the full SQL stored procedure suite powering every data insight in the app, and maintained sole ownership of database health throughout the project.
- Ran multiple systematic data quality investigations across the pipeline — diagnosing structural and correctness flaws end-to-end, from aggregation errors and schema mismatches to wrong data surfacing in live screens.
- Resolved each investigation end-to-end: live schema changes, stored procedure rewrites, and full summary-table repopulation in dependency order — often tracing root cause from a frontend symptom all the way back to the query layer.
- Optimized backend performance through pre-computed summary tables, backend parallelization, and frontend API caching — turning multi-second loads into near-instant responses.
- Scaffolded the complete .NET 9 backend — controllers, repository interfaces, data models, and DTOs — giving mp3li the foundation to build the app's feature endpoints on top of.
- Created the Discovery Dashboard — translating 28.2 million rows of raw chart data into an interactive, readable analytics view that makes the app's central argument visible to anyone who uses it, through four live charts, four KPI cards, and a dynamic discovery gap display.
- Managed the project end-to-end: proposal, timeline, GitHub board, PR reviews, and scope decisions throughout.

Links:

- [GitHub](https://github.com/lkomenski)
- [LinkedIn](https://www.linkedin.com/in/leena-komenski)

### mp3li - Frontend Lead, UX Implementation, Additional Data Integration, and Presentation Tooling

Owned the app-facing design and implementation work that turned Hidden Gem Music into a polished, data-connected web and mobile experience. This included visual design, screen flow, user experience direction, frontend architecture, screen builds, interaction systems, Deezer-backed additional-data integration, Deezer metadata workflows, album-art and preview-data handling, loading behavior, documentation, QA, and presentation-readiness support. The Discovery Dashboard was originally created by Leena; mp3li's Dashboard work focused on frontend polish, naming/navigation updates, and the native/mobile adaptation without Recharts.

- Designed the app's visual direction, screen flow, interaction model, and overall user experience across the full Hidden Gem Music interface.
- Established the frontend architecture and core screen scaffolding, including the shared app shell, screen ownership patterns, navigation structure, visual system, and responsive layout direction.
- Built and maintained the React Native / React Native Web app shell, including routing, breadcrumbs, selected year/country state, Welcome behavior, search flow, and mobile bottom navigation.
- Implemented and integrated the main user-facing screens across web and mobile, including Discovery Map, Country Detail, Comparison Mode, Comparison View, Hidden Gems, and Credits.
- Adapted Leena's Discovery Dashboard for native/mobile use by matching the narrow web layout closely and replacing Recharts with custom React Native chart components, tap-selected value states, and mobile-safe card and loading behavior.
- Implemented the app-owned interactive Discovery Map experience, including custom world-map rendering, country selection, hover/tap behavior, list/map synchronization, filters, zoom/reset controls, and responsive map behavior.
- Built and refined Hidden Gems UI behavior, including song preview playback, paginated song lists, CD art handling, favorite-artist display, selected-song focus handoff, loading states, and metadata presentation.
- Connected frontend screens to live backend data flows, including API client layers, mapper compatibility work, paged country song lists, comparison results, hidden-gem previews, and metadata-backed year handling.
- Verified and hardened backend integration points where needed, including country/comparison endpoint validation, restored-database diagnostics, stored-procedure contract checks, SQL handoff notes, and local API smoke testing.
- Integrated additional song data across the app, including Deezer-backed album art and metadata, explicit-content details, contributor/record information, Genius lyrics URLs, language display, and graceful missing-data handling.
- Created and maintained mp3li Additional Data Getter v2 workflows for organized additional-data collection, Genius URL validation, lyrics/language preparation, synchronized outputs, and app-facing language data support.
- Added presentation data prep tooling and cache-aware loading support for Discovery samples, country/comparison summary sections, and Hidden Gems demo paths while preserving fallback behavior.
- Managed practical project workflow support, including branch movement, merge cleanup, local-only file hygiene, database restore verification, issue planning, PR preparation, and teammate handoff documentation.
- Completed frontend polish and stabilization work across loading states, mobile responsiveness, route behavior, data fallbacks, copy wording, scrollbar behavior, and visual consistency.
- Produced and maintained frontend documentation, QA logs, PR drafts, implementation timelines, issue handoff notes, and project workflow documentation.
- Performed repeated browser and mobile testing, regression triage, UI polish, loading optimization, branch cleanup, and presentation-readiness verification across the frontend app.

Links:

- [Linktree](https://linktr.ee/mp3li)
- [Patreon](https://www.patreon.com/mp3li)
- [GitHub](https://github.com/mp3li)
- [TikTok](https://www.tiktok.com/@mp3li.videos)
- [Reddit](https://www.reddit.com/u/jasperhooloop/s/qkgd8zrz4W)

</details>
