# Local Development and Full-Stack Testing

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Current Local Runbook

---

## Purpose

This document records the local environment expectations and practical end-to-end run workflow for `hidden-gem-music-app`.

Use this file for:

- local-only config expectations
- installation and tooling prerequisites
- frontend verification commands
- source-of-truth notes about API base URL resolution
- backend + frontend local run commands
- LAN/phone testing requirements
- smoke-test flow
- practical troubleshooting when web and phone behave differently

## Repository and local-only files

Frontend/local secrets and machine-specific configuration should stay local.

Important local-only frontend file:

- `hidden-gem-music-app/.env.local`

Backend local configuration that frontend work commonly depends on:

- `backend/Capstone.API/appsettings.Local.json`
- `backend/Capstone.API/appsettings.Local.example.json` is the committed template; copy its shape into the local-only file and replace placeholders on your own machine

Do not commit:

- secrets
- tokens
- private machine-specific URLs
- private local config values
- temporary tool outputs

## Prerequisites

The current frontend expects:

- Node/npm available locally
- Expo CLI usage through `npx expo ...`
- the backend project available locally when real data flows need to be tested

Install frontend dependencies from `hidden-gem-music-app`:

```bash
npm install
```

## Frontend API base URL source of truth

Frontend API base URL logic lives in:

- `src/data/apiBaseUrl.ts`

Current behavior summary:

- web defaults to `http://localhost:5140`
- mobile prefers `EXPO_PUBLIC_API_BASE_URL` when set
- otherwise mobile tries to infer the host from the Expo runtime
- otherwise mobile falls back to the hardcoded LAN fallback currently defined in that file

Practical implication:

- web-only success on `localhost` does not automatically prove that phone/mobile testing will work
- phone/mobile testing depends on LAN-reachable backend behavior

This matters because current full-stack testing may involve more than one host context:

- SQL Server can run in Docker on macOS.
- SSMS/database inspection can run from Windows 11 in Parallels.
- the .NET API can run on macOS.
- the Expo frontend can run on macOS, while phone/mobile testing runs from a separate device over the local network.

In that setup, `localhost` is relative to whichever machine or runtime is making the request. Browser testing on the Mac can use `localhost`, but a phone running the Expo app needs the Mac's LAN address to reach the backend API.

## Environment-variable guidance

`EXPO_PUBLIC_API_BASE_URL` should be used when:

- phone testing is reaching Expo but not the backend
- runtime host detection resolves the wrong host
- a temporary backend host or port override is needed

This variable should remain local-only.

Example local override:

```bash
EXPO_PUBLIC_API_BASE_URL="http://YOUR_MAC_LAN_IP:5140" npx expo start -c --host lan
```

Replace `YOUR_MAC_LAN_IP` with the address returned by `ipconfig getifaddr en0` or the correct LAN address for the tester's machine. This does not need to match the hardcoded fallback in `src/data/apiBaseUrl.ts`; the environment variable exists so each tester can point the app at the backend host that works on their own network.

Do not commit a personal LAN IP into source just to support another tester. If two people need different mobile API hosts, each person should run Expo with their own `EXPO_PUBLIC_API_BASE_URL` value in their local terminal/session.

## Frontend verification commands

Frontend type check:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx tsc --noEmit
```

Patch hygiene from repo root:

```bash
cd "/Users/stellar/School/Music_Capstone" && git diff --check
```

## Frontend verification expectations

Type-check success is useful, but it is not a complete verification standard for shared frontend changes.

If a change touches:

- `App.tsx`
- `ScreenScaffold`
- shared screens
- global overlays
- navigation/state handoff
- or frontend API/data-loading seams

then the change should also be checked in actual app behavior, not only through static verification.

## Current practical full-stack workflow

The most reliable current local testing workflow is:

1. Run backend on `0.0.0.0:5140`.
2. Run Expo with cache clear and LAN hosting.
3. Use the LAN-hosted frontend flow for phone/mobile testing.
4. Use the LAN-hosted web flow when combined web/mobile verification is needed.

## Backend command

Run backend:

```bash
cd "/Users/stellar/School/Music_Capstone/backend/Capstone.API" && ASPNETCORE_ENVIRONMENT=Local dotnet run --no-launch-profile --urls "http://0.0.0.0:5140"
```

Why this matters:

- `ASPNETCORE_ENVIRONMENT=Local` uses the local backend config path.
- `0.0.0.0` allows access beyond localhost-only binding.
- frontend mobile testing depends on the backend being reachable from the LAN path, not only from the browser on the same machine.

## Frontend command for phone/mobile testing

Run frontend for the current practical mobile workflow:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start -c --host lan
```

Why this is recommended:

- `-c` clears stale Expo cache.
- `--host lan` exposes the Expo app over the local network.
- this has been the practical working path for phone testing in this repo.

## Frontend command for web testing

Run frontend for web:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start --web -c --host lan
```

Why this web command is documented this way:

- it keeps the same cache-cleared flow as mobile testing.
- it keeps the same LAN-hosted workflow when web and phone both need to be tested in the same run.

## LAN and phone-testing requirements

For phone testing to work reliably:

- backend should be running first.
- Expo should be running with `--host lan`.
- the phone and Mac should be on the same network.
- the phone should be able to reach the Mac's LAN IP.

## How to find the Mac LAN IP

Quick check:

```bash
ipconfig getifaddr en0
```

Broader check if needed:

```bash
ifconfig | rg "inet "
```

## Practical smoke-test flow

After starting backend and frontend, the minimum useful full-stack smoke test is:

1. Open web and confirm the app loads.
2. Open Welcome and confirm the shell/nav/modal render correctly.
3. Open Discovery and confirm countries load.
4. Change year and confirm the screen refreshes without breaking.
5. Open a Country page and confirm summary/album art/artist image data loads.
6. Open Hidden Gems and confirm list data and big-CD behavior still work.
7. On phone, repeat the most important path:
   - app loads
   - Discovery loads
   - Country loads
   - Hidden Gems loads

## Good quick backend/API checks during frontend testing

Useful direct browser/API checks:

- `http://localhost:5140/api/metadata/years`
- `http://localhost:5140/api/discovery/countries?year=2020`

These are useful when:

- backend is suspected
- frontend is loading forever
- or the question is whether the frontend is broken versus the API not returning data

## Common failure cases

### Web works, phone does not

Most likely checks:

- Expo not started with `--host lan`
- phone and Mac not on the same network
- backend not reachable from LAN path
- API base URL resolution not using the right host

### Expo works on phone, but data does not load

Most likely checks:

- backend is not running
- backend is not bound to `0.0.0.0:5140`
- the phone cannot reach the backend host
- API base URL resolved to localhost on a path that needed the LAN host

### Browser works on localhost, but phone still cannot use the app correctly

Most likely explanation:

- localhost-only success does not prove LAN/mobile success
- the backend/frontend path must be validated over the same network conditions the phone uses

### Everything feels stale or inconsistent after multiple changes

Recommended first reset:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start -c --host lan
```

## Related documentation

- `frontend-architecture.md`
  - structural frontend ownership
- `routing-state-and-navigation.md`
  - app-owned route/state handoff rules
- `screen-data-flow.md`
  - per-screen data-loading ownership

## Update rule

If local config expectations, frontend verification commands, or the working backend/frontend/phone run workflow changes, this file should be updated in the same change.
