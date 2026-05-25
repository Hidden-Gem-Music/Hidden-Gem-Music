# Hidden Gem Music Deployment Platform Selection Plan

**Project:** Hidden Gem Music Discovery Platform - SOFT290 Capstone
**Team:** mp3li and Leena Komenski
**Plan owner:** mp3li - Software Development deployment/integration deliverable
**Documentation date:** 2026-05-23
**Status:** Selected for implementation

---

## Decision

Hidden Gem Music will use a hybrid Cloudflare deployment:

- **Frontend:** Cloudflare Pages at `https://hiddengemmusicapp.mp3li.online`
- **Backend API:** .NET 9 API running 24/7 on the iMac and exposed through a separate Cloudflare Tunnel at `https://api-hiddengemmusicapp.mp3li.online`
- **Database:** SQL Server remains private on the iMac/local Docker setup
- **Budget target:** free tier

This is the deployment plan for the Software Development deliverable. Team input is welcome, but this decision is framed as the technical setup for the deployment/integration work rather than a permission request.

## Why This Platform

Cloudflare Pages is appropriate for the frontend because the Expo web app exports into a static browser bundle. "Static" in this context means the deployed files are HTML, JavaScript, fonts, images, and generated assets. The app remains interactive because the JavaScript runs in the browser and calls the backend API for live data.

Cloudflare Tunnel is appropriate for the backend because it can route public HTTPS traffic to a local HTTP service, such as the .NET API running on the iMac, without opening inbound router ports. This matches the existing 24/7 home-server operating model while keeping the API reachable from the deployed frontend.

SQL Server will not be migrated to a managed cloud database before the presentation. The project uses a SQL Server database with stored procedures, precomputed tables, local restore steps, and performance-sensitive presentation warming. Migrating that database this late would add cost, schedule risk, and new failure modes without improving the capstone demo enough to justify the change.

## Platform Limits and Practical Boundaries

### Cloudflare Pages Free

Current Cloudflare Pages Free limits to account for:

- **Static requests:** static asset requests are free and unlimited.
- **Bandwidth:** Cloudflare developer pricing states there are no additional charges for data transfer or throughput. This is acceptable for a capstone/class demo, but still subject to Cloudflare's platform terms and abuse protections.
- **Builds:** 500 builds per month.
- **Concurrent builds:** 1 build at a time.
- **Build timeout:** 20 minutes per build.
- **Build minutes:** the current Cloudflare Pages limits page checked for this plan lists build count, concurrency, and timeout rather than a separate 3,000 build-minute quota. Use the current limits page as the source of truth if Cloudflare changes this wording again.
- **Custom domains:** supported; Pages Free supports up to 100 custom domains per project.
- **Files:** up to 20,000 files per Pages site on the Free plan.
- **Single asset size:** 25 MiB maximum per Pages site asset.
- **Preview deployments:** unlimited active preview deployments.
- **Git integration:** supports Git-backed builds, including GitHub integration.
- **SSL/HTTPS:** custom domains are served through Cloudflare-managed HTTPS.
- **CDN delivery:** Pages uploads site files to Cloudflare's globally distributed network.

This project should stay well within these limits because it is a small Expo web bundle for a class demo, not a high-volume commercial site.

### Cloudflare Tunnel / cloudflared

Cloudflare Tunnel does not host the backend. It only provides a public HTTPS route to a service that must already be running locally.

Practical constraints:

- The iMac must stay powered on and connected to the internet.
- The .NET API must stay running.
- Docker SQL Server must stay running and healthy.
- The Cloudflare Tunnel process/service must stay running.
- If any of those local pieces stop, the Cloudflare Pages frontend may still load but API-backed screens will fail or hang.
- The Hidden Gem Music tunnel should be separate from the existing media server tunnel/config.
- SQL Server should not be exposed publicly through Cloudflare or router port forwarding. Only the local backend API should connect to SQL Server.

## Selected Setup

### Frontend

Cloudflare Pages should build the frontend from `hidden-gem-music-app`.

Recommended Pages settings:

- **Build command:** `npm run export:web`
- **Build output directory:** `dist`
- **Production environment variable:** `EXPO_PUBLIC_API_BASE_URL=https://api-hiddengemmusicapp.mp3li.online`
- **Custom domain:** `hiddengemmusicapp.mp3li.online`

The frontend includes `public/_redirects` with:

```text
/*    /index.html   200
```

Expo copies files from `public` into `dist` during `npx expo export -p web`. This redirect makes Cloudflare Pages serve the SPA entrypoint for direct browser refreshes on app routes such as `/discovery`, `/hidden-gems`, and `/dashboard`.

### Backend API

Run the backend API locally on the iMac, then expose it through Cloudflare Tunnel.

Expected local backend target:

```bash
cd "/Users/stellar/School/Music_Capstone/backend/Capstone.API" && ASPNETCORE_ENVIRONMENT=Production dotnet run --no-launch-profile --urls "http://localhost:5140"
```

Expected public API hostname:

```text
https://api-hiddengemmusicapp.mp3li.online
```

The production CORS policy allows:

```text
https://hiddengemmusicapp.mp3li.online
```

The API is configured to honor `X-Forwarded-Proto` and `X-Forwarded-For` from the local loopback proxy path. This matters because Cloudflare Tunnel terminates public HTTPS and forwards to the local backend over HTTP; forwarded headers let the app understand that the original browser request used HTTPS before HTTPS redirection runs.

### Database

SQL Server stays private on the iMac/local Docker setup. The database is not published as a public service. All database access remains backend-only through the existing SQL Server connection string.

## Presentation Readiness

Before the June 3 presentation:

1. Confirm Docker SQL Server is running.
2. Start the .NET API.
3. Confirm the Cloudflare Tunnel is connected.
4. Run the existing presentation/cache warmer scripts.
5. Open `https://hiddengemmusicapp.mp3li.online`.
6. Smoke test from a network outside the home LAN, such as a phone hotspot.
7. Keep local/LAN access and screenshots or a short screen recording ready as fallback.

Minimum smoke-test URLs:

```text
https://api-hiddengemmusicapp.mp3li.online/api/metadata/years
https://api-hiddengemmusicapp.mp3li.online/api/discovery/countries?year=2020
```

Minimum app screens to verify:

- Welcome
- Discovery
- Country Profile
- Hidden Gems
- Comparison
- Dashboard

## Rejected or Deferred Options

### GitHub Pages

GitHub Pages can host static frontend files, so it is not rejected because the app is interactive. It is not selected because it only solves basic frontend hosting and does not fit the broader Cloudflare DNS, custom-domain, Tunnel, API routing, and existing 24/7 server workflow as cleanly.

### Full Cloud Backend and Database

Moving the frontend, backend, and SQL Server database fully into cloud hosting is deferred. It is technically possible, but the current database shape and timeline make it high-risk and likely more expensive than the capstone needs.

### Home Server Only

Hosting every piece directly from the iMac is not selected as the primary route because the rubric asks for cloud deployment. Cloudflare Pages provides the cloud-hosted frontend, while Cloudflare Tunnel provides managed public HTTPS routing to the local backend.

## Sources

- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- Cloudflare Workers/Pages static asset pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Pages serving behavior: https://developers.cloudflare.com/pages/configuration/serving-pages/
- Cloudflare Tunnel documentation: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
- Expo web publishing documentation: https://docs.expo.dev/guides/publishing-websites/
