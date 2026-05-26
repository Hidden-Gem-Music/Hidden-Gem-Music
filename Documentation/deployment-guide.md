# Deployment Guide

**Project:** Hidden Gem Music Discovery Platform - SOFT290 Capstone
**Team:** mp3li and Leena Komenski
**Owner:** mp3li - deployment/integration documentation
**Date:** 2026-05-25
**Status:** Active capstone deployment documentation

---

## Purpose

This guide documents how the Hidden Gem Music capstone deployment is configured, why the deployment architecture was chosen, how the deployed app should be verified, and how the final production branch source will move to `main`.

This guide is written as deployment evidence for capstone review and grading, with enough technical detail to show the frontend, backend API, Cloudflare routing, private SQL Server position, smoke-test process, and final branch-source plan without exposing secrets or private machine-specific configuration.

## Current Deployment Summary

Hidden Gem Music uses a hybrid Cloudflare deployment:

- **Frontend:** Cloudflare Pages hosts the exported Expo web app.
- **Backend API:** The .NET 9 API runs on the iMac and is routed publicly through Cloudflare Tunnel.
- **Database:** SQL Server stays private on the iMac/local Docker setup and is only reached by the backend API.

Production URLs:

```text
Frontend: https://hiddengemmusicapp.mp3li.online
API:      configured through Cloudflare Tunnel; exact endpoint checks are kept in project/private deployment notes
```

The public README intentionally does not publish copy-paste API endpoint examples. API-specific smoke tests should use the Cloudflare dashboard, backend docs, or private project deployment notes.

## Branch Source Plan

The deployment branch strategy has two phases.

### Phase 1: Validation from `deployment`

Initial deployment validation used the dedicated `deployment` branch because the final project branch was not ready for production source cutover at the time deployment testing needed to begin.

This allowed the team to verify:

- Cloudflare Pages build configuration
- custom frontend domain routing
- production frontend environment variables
- Cloudflare Tunnel API routing
- backend CORS behavior
- deployed app smoke tests
- access-code flow
- major app screens against the deployed API path

### Phase 2: Final Production Source from `main`

The intended final production frontend source branch is `main`.

Move the Cloudflare Pages production source to `main` after:

- the team approves the cutover
- `main` contains the final deployable project state
- the README/deployment documentation branch has landed
- required deployment files exist on `main`
- the backend/API/tunnel stack is available for smoke testing
- the team is ready to verify the final production build

This wording is intentional: validation from `deployment` was a risk-reduction step, while `main` is the intended final production source after team approval.

## Frontend Deployment Configuration

Cloudflare Pages should build the frontend from the Expo app directory.

Expected settings:

```text
Root directory: hidden-gem-music-app
Build command: npm run export:web
Build output directory: dist
```

Required production environment variable:

```text
EXPO_PUBLIC_API_BASE_URL=<production API base URL from Cloudflare Tunnel>
```

The frontend includes a single-page app redirect file:

```text
hidden-gem-music-app/public/_redirects
```

Expected redirect content:

```text
/*    /index.html   200
```

This keeps direct browser refreshes and deep links from failing in the static Cloudflare Pages deployment.

## Backend API Deployment Configuration

The backend API is not hosted by Cloudflare Pages. It runs on the iMac and is exposed through Cloudflare Tunnel.

Expected backend runtime:

- .NET 9 API running locally on the deployment machine
- production/local configuration available on that machine
- SQL Server connection available from the backend process
- Cloudflare Tunnel running and routing HTTPS traffic to the local backend service
- backend CORS policy allowing the deployed frontend origin

Expected frontend origin allowed by CORS:

```text
https://hiddengemmusicapp.mp3li.online
```

Forwarded-header handling should remain enabled for the Cloudflare Tunnel path so the API can respect original HTTPS request metadata.

## Database Deployment Position

SQL Server is intentionally not exposed publicly.

The deployed architecture is:

```text
Frontend -> API -> SQL Server
```

Not:

```text
Frontend -> SQL Server
```

This keeps the database private while allowing the app to load screen-ready data through the backend API.

## Final Cutover Checklist to `main`

Before moving Cloudflare Pages production source to `main`, confirm:

- `main` includes the final frontend app source.
- `main` includes `hidden-gem-music-app/public/_redirects`.
- `main` includes the current README/deployment documentation.
- Cloudflare Pages production settings still match the expected root/build/output values.
- `EXPO_PUBLIC_API_BASE_URL` is set in Cloudflare Pages production environment variables.
- Cloudflare Tunnel is running.
- The backend API is running on the deployment machine.
- SQL Server is running and reachable by the backend.
- CORS allows the production frontend origin.
- The app access-code flow works.

After switching the production source to `main`, trigger or wait for a Cloudflare Pages production deployment, then run the smoke tests below.

## Smoke Test Checklist

### Frontend

Open:

```text
https://hiddengemmusicapp.mp3li.online
```

Verify:

- the app loads over HTTPS
- the access-code screen appears when expected
- the provided access code opens the app
- refresh does not break the app route
- browser console does not show API base URL or CORS failures

### Major Screens

Verify at minimum:

- Welcome
- Discovery Map
- Country Profile
- Hidden Gems
- Comparison Mode
- Discovery Dashboard
- Credits

### API-Backed Behavior

Verify that API-backed screens load real data:

- years populate
- countries populate on Discovery
- country profile stats load
- hidden-gem rows load
- comparison results load
- dashboard charts/KPIs load

Use private project API smoke-test URLs from Cloudflare/backend notes when direct API checks are needed. Do not publish copy-paste API endpoint examples in the public README.

## Troubleshooting

### Frontend Loads but Data Does Not

Check:

- Cloudflare Tunnel is running
- backend API process is running
- SQL Server is running
- `EXPO_PUBLIC_API_BASE_URL` points to the production API route
- backend CORS allows `https://hiddengemmusicapp.mp3li.online`
- browser console/network tab for failed API requests

### Direct Refresh Shows a 404

Check:

- `hidden-gem-music-app/public/_redirects` exists on the deployed branch
- Cloudflare Pages build output includes the redirect file
- build output directory is `dist`

### Cloudflare Pages Build Fails

Check:

- root directory is `hidden-gem-music-app`
- build command is `npm run export:web`
- dependencies install successfully
- no local-only files are required for the frontend build
- production environment variables are configured in Cloudflare, not hardcoded

### API Works Locally but Not Through the Domain

Check:

- Cloudflare Tunnel route points to the correct local backend port
- backend is listening on the expected local address/port
- forwarded-header handling remains enabled
- CORS allows the deployed frontend origin
- local firewall/network settings are not blocking the backend process

## Safety Notes

Do not commit:

- real connection strings
- Cloudflare tokens
- provider API tokens
- private tunnel credentials
- private machine URLs
- personal LAN IPs
- generated frontend `dist` output
- local backend config files with secrets

Public documentation should describe configuration shape and verification expectations without publishing private runtime values.

## Related Documentation

- `Documentation/ADR-DEPLOYMENT-001-Deployment-Decisions.md`
- `Documentation/deployment-platform-selection-plan.md`
- `Documentation/QA-log.md`
- `README.md`
