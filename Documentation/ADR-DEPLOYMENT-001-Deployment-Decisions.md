# ADR-DEPLOYMENT-001: Deployment Decisions

**Project:** Hidden Gem Music Discovery Platform - SOFT290 Capstone
**Team:** mp3li and Leena Komenski
**Decision owner:** mp3li - Software Development deployment/integration deliverable
**Date:** 2026-05-25
**Status:** Accepted

---

## Context

Hidden Gem Music needed a public deployment for final capstone review while preserving the existing application architecture:

- Expo web frontend exported as static browser assets.
- .NET 9 backend API.
- SQL Server database with stored procedures, precomputed tables, and local restore/runtime expectations.
- Presentation timeline near the end of the course.
- Free or near-free hosting target.

The deployment also needed to avoid exposing SQL Server directly and needed to support the deployed frontend calling the API over HTTPS.

## Decision

The project uses a hybrid Cloudflare deployment:

- **Frontend:** Cloudflare Pages hosts the Expo web build at `https://hiddengemmusicapp.mp3li.online`.
- **Backend API:** The .NET 9 API runs on the iMac and is exposed through Cloudflare Tunnel at `https://api-hiddengemmusicapp.mp3li.online`.
- **Database:** SQL Server remains private on the iMac/local Docker setup and is only reached by the backend API.
- **Repository branch:** The final intended production source branch is `main`. Initial deployment validation was completed from the dedicated `deployment` branch so the deployment path could be tested before the final team-approved `main` deployment cutover.

This ADR records the final deployment decision. The earlier deployment platform selection plan remains the detailed planning and setup record.

## Configuration Decisions

### Branch Source

The deployment branch strategy has two phases:

- **Validation phase:** use the dedicated `deployment` branch to confirm Cloudflare Pages, custom domain routing, API configuration, Cloudflare Tunnel routing, and production smoke tests before the deadline.
- **Final production phase:** move the frontend deployment source to `main` after team approval and after `main` contains the final deployable project state.

This branch flow was chosen to reduce deadline risk while respecting the team preference that the final production deployment should come from `main`.

### Frontend Build

Cloudflare Pages builds from:

```text
hidden-gem-music-app
```

The selected frontend build command is:

```text
npm run export:web
```

The selected build output directory is:

```text
dist
```

The production frontend API base URL is:

```text
EXPO_PUBLIC_API_BASE_URL=https://api-hiddengemmusicapp.mp3li.online
```

The frontend includes `hidden-gem-music-app/public/_redirects` so direct route refreshes serve the Expo web single-page app entrypoint.

### Backend API

The API runs locally on the iMac and is reachable to the public only through Cloudflare Tunnel.

The expected public API origin is:

```text
https://api-hiddengemmusicapp.mp3li.online
```

The expected production frontend origin allowed by CORS is:

```text
https://hiddengemmusicapp.mp3li.online
```

The backend keeps forwarded-header handling enabled for the local Cloudflare Tunnel path so the API can respect the original HTTPS request metadata.

### Database

SQL Server is not moved to a managed cloud database for the final capstone deployment. It remains private on the iMac/local Docker setup. Public users only interact with SQL Server through the backend API.

## Alternatives Considered

### GitHub Pages

GitHub Pages can host the static frontend bundle, but it does not address the API routing and custom-domain workflow as cleanly as Cloudflare Pages plus Cloudflare Tunnel.

### Full Cloud Backend and Database

A full cloud deployment for the frontend, backend, and database was deferred. It would add database migration risk, hosting cost, and new runtime configuration work late in the capstone timeline.

### iMac-Only Hosting

Hosting the entire app directly from the iMac was not selected as the primary deployment because the capstone deliverable required a cloud deployment path. Cloudflare Pages provides the cloud-hosted frontend while Cloudflare Tunnel provides managed HTTPS routing to the local backend.

## Consequences

Positive outcomes:

- The frontend is hosted through a public cloud platform with managed HTTPS.
- The API is reachable through a public HTTPS hostname without opening inbound router ports.
- SQL Server stays private.
- The deployment uses the current working app architecture instead of requiring a late database redesign.
- The setup can stay within the project budget target.

Tradeoffs:

- The iMac, SQL Server container, backend API, and Cloudflare Tunnel must stay running for API-backed screens to work.
- Cloudflare Pages may still serve the frontend even if the backend stack is down.
- Runtime operations now include local machine health checks in addition to cloud dashboard checks.
- Future maintainers need documentation for both the Cloudflare side and the local iMac runtime side.

## Lessons Learned

- Transfer and ownership details matter for deployment tooling. Cloudflare/GitHub integration depends on repository access under the account or organization authorized in Cloudflare.
- Project tracking and repository ownership are separate in GitHub. Moving the repository does not automatically guarantee the project board appears under the new organization.
- Static frontend hosting is still valid for an interactive Expo web app because the browser JavaScript calls the API after the static bundle loads.
- Cloudflare Tunnel solves public HTTPS routing, but it does not host or supervise the backend process. Local runtime reliability remains part of deployment operations.
- Keeping SQL Server private reduced deployment risk, but it made smoke testing and runtime handoff documentation more important.

## Verification Expectations

Minimum production smoke tests:

```text
https://hiddengemmusicapp.mp3li.online
https://api-hiddengemmusicapp.mp3li.online/api/metadata/years
https://api-hiddengemmusicapp.mp3li.online/api/discovery/countries?year=2020
```

Minimum app screens to verify after deployment changes:

- Welcome
- Discovery
- Country Profile
- Hidden Gems
- Comparison
- Dashboard

## Related Documentation

- `Documentation/deployment-platform-selection-plan.md`
- `Documentation/QA-log.md`
- `backend/Capstone.API/Documentation/ADR-BACKEND-001-API-Architecture.md`
- `backend/Capstone.API/Documentation/ADR-BACKEND-002-Routes-Controllers-DTOs.md`
