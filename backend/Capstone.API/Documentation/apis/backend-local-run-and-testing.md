# Backend Local Run and Testing

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Current Backend Local Runbook

---

## Purpose

This file documents the practical local workflow for running and smoke-testing `backend/Capstone.API`.

Use this file for:

- backend local run commands
- Local vs Development environment behavior
- browser/API smoke tests
- how backend testing fits the frontend’s combined LAN/mobile workflow

## Important local-only files

Backend local configuration depends on local-only files and values.

Important local-only backend file:

- `backend/Capstone.API/appsettings.Local.json`

Committed template:

- `backend/Capstone.API/appsettings.Local.example.json`

Use the template shape for local setup, but keep real server names, usernames, and passwords only in `appsettings.Local.json`.

Do not commit:

- connection strings
- local machine-specific server names
- private credentials or secrets

## Current practical backend run command for full app testing

Recommended command:

```bash
cd "/Users/stellar/School/Music_Capstone/backend/Capstone.API" && ASPNETCORE_ENVIRONMENT=Local dotnet run --no-launch-profile --urls "http://0.0.0.0:5140"
```

Why this is the practical default:

- `ASPNETCORE_ENVIRONMENT=Local` loads `appsettings.Local.json`
- `--no-launch-profile` avoids depending on profile selection
- `--urls "http://0.0.0.0:5140"` binds the backend in the same way the frontend LAN/mobile workflow expects
- the frontend’s combined web + phone testing setup depends on the backend being reachable beyond localhost-only binding

## Development-profile behavior

`Program.cs` currently behaves differently in `Development` versus `Local`.

Current important differences:

- OpenAPI is only mapped in `Development`
- HTTPS redirection is skipped in both `Development` and `Local`
- CORS uses the permissive local/dev policy in both `Development` and `Local`

The project launch settings currently define Development profiles that bind to:

- `http://0.0.0.0:5140`
- or `https://localhost:7164;http://0.0.0.0:5140`

Practical rule:

- use `Local` for normal frontend-integrated testing
- use `Development` only when Development-specific behavior such as mapped OpenAPI is actually needed

## Backend verification commands

Compile/build check:

```bash
cd "/Users/stellar/School/Music_Capstone/backend/Capstone.API" && dotnet build
```

Patch hygiene from repo root:

```bash
cd "/Users/stellar/School/Music_Capstone" && git diff --check
```

## Good browser/API smoke tests

After starting the backend, useful direct checks include:

- `http://localhost:5140/api/metadata/years`
- `http://localhost:5140/api/discovery/countries?year=2020`
- `http://localhost:5140/api/country/US?year=2020`
- `http://localhost:5140/api/country/US/hidden-gems/preview?year=2020&limit=5`
- `http://localhost:5140/api/country/US/songs?year=2020&listType=shared&page=1&pageSize=10`
- `http://localhost:5140/api/country/genre-samples?year=2020&codes=US,CA,JP`
- `http://localhost:5140/api/hidden-gems/US?year=2020&minCountries=2&page=1&pageSize=10`
- `http://localhost:5140/api/comparison?countryA=US&countryB=CA&year=2020`
- `http://localhost:5140/api/comparison/hidden-gems?countryA=US&countryB=CA&year=2020`

Useful dashboard checks:

- `http://localhost:5140/api/dashboard/overlap-rate?start=2020-01-01&end=2020-12-31`
- `http://localhost:5140/api/dashboard/discovery-gap?start=2020-01-01&end=2020-12-31&minCountries=2`
- `http://localhost:5140/api/dashboard/gap-distribution?start=2020-01-01&end=2020-12-31`
- `http://localhost:5140/api/dashboard/isolation-leader?start=2020-01-01&end=2020-12-31`
- `http://localhost:5140/api/dashboard/isolation-ranking?start=2020-01-01&end=2020-12-31`
- `http://localhost:5140/api/dashboard/peak-reach?start=2020-01-01&end=2020-12-31`
- `http://localhost:5140/api/dashboard/overlap-trend?start=2020-01-01&end=2020-12-31`

## Practical smoke-test sequence

Recommended minimum backend smoke test:

1. Start the backend with the Local command above.
2. Check `GET /api/metadata/years`.
3. Check `GET /api/discovery/countries?year=2020`.
4. Check one country profile route and one hidden-gems route.
5. If comparison work changed, check both comparison endpoints.
6. If dashboard work changed, check at least one KPI route and one chart/list route.

## How backend testing fits the frontend workflow

The frontend’s documented combined testing flow uses:

- backend on `0.0.0.0:5140`
- Expo web/mobile with LAN hosting

That means backend verification should consider two different questions:

- does the API respond correctly in a browser on the same machine?
- is the backend bound in a way the phone/LAN frontend flow can actually reach?

Browser success on localhost alone does not prove the second point.

## Additional-data enrichment testing notes

Some backend routes now trigger live Deezer enrichment during request handling.

Practical implications:

- a route may return fewer usable rows than the raw stored procedure produced if songs cannot be resolved to usable Deezer metadata
- preview URLs can expire and later refresh
- repeated requests may behave faster after local cache warm-up

Relevant local cache location:

- `backend/Capstone.API/live_song_enrichment_cache/`

## Cancellation and error-handling checks

Current controller behavior should treat client-side navigation/cancellation as a normal cancellation, not as an error.

Practical checks:

1. Start a slower endpoint request from the browser or frontend.
2. Navigate away or cancel the request quickly.
3. Backend logs should not show an error stack for normal `OperationCanceledException` cancellation.
4. If the database is unavailable, routes should return `503` with a user-facing unavailable message.
5. Unexpected unhandled failures should return `500` and be logged.

## Common failure cases

### Browser route works, but frontend phone testing still fails

Most likely checks:

- backend was started on localhost-only binding instead of `0.0.0.0:5140`
- the frontend resolved the wrong API base URL
- phone and laptop are not on the same network

### Country or Hidden Gems endpoints return fewer songs than expected

Most likely explanation:

- request-time enrichment can drop unresolved songs rather than returning broken metadata
- this is expected behavior in the current live enrichment path

### Backend starts, but one route returns SQL errors

Most likely checks:

- `appsettings.Local.json` is pointing at the wrong DB/server
- the local DB does not have the current stored procedure version
- the route is hitting a star-schema/read-procedure mismatch in the restored local DB

## Update rule

If the practical backend run command, environment behavior, smoke-test path, or local enrichment-cache behavior changes, this file should be updated in the same workstream.
