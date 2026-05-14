# Full-Stack Local Testing

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-10
**Status:** Current Full-Stack Local Runbook

---

## Purpose

This document records the practical end-to-end workflow for running the backend and frontend together for real testing on:

- desktop web
- Expo on the same machine
- and phone/mobile over the same local network

This is project runbook documentation, not a person-specific setup note.

Use `local-development-environment.md` for local environment/config expectations and frontend-only verification commands.

Use this file for:

- the real backend run command
- the real Expo mobile and web commands used for combined testing
- LAN/phone testing requirements
- smoke-test flow
- practical troubleshooting when web and phone behave differently

## Current practical default workflow

The most reliable current local testing workflow for this project is:

1. Run backend on `0.0.0.0:5140`
2. Run Expo with cache clear and LAN hosting
3. Use the same LAN-hosted frontend flow for phone/mobile testing
4. Use the LAN-hosted web flow when combined web/mobile verification is needed

## Backend command

Run backend:

```bash
cd "/Users/stellar/School/Music_Capstone/backend/Capstone.API" && ASPNETCORE_ENVIRONMENT=Local dotnet run --no-launch-profile --urls "http://0.0.0.0:5140"
```

Why this matters:

- `ASPNETCORE_ENVIRONMENT=Local` uses the local backend config path
- `0.0.0.0` allows access beyond plain localhost-only binding
- frontend mobile testing depends on the backend being reachable from the LAN path, not only from the browser on the same machine

## Frontend command for phone/mobile testing

Run frontend for the current practical mobile workflow:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start -c --host lan
```

Why this is the current recommended mobile workflow:

- `-c` clears stale Expo cache
- `--host lan` exposes the Expo app over the local network
- this has been the practical working path for phone testing in this repo

## Frontend command for web testing

Run frontend for web:

```bash
cd "/Users/stellar/School/Music_Capstone/hidden-gem-music-app" && npx expo start --web -c --host lan
```

Why this web command is documented this way:

- it keeps the same cache-cleared flow as mobile testing
- it keeps the same LAN-hosted workflow when web and phone both need to be tested in the same run

## Local-only config expectations

Important local-only files:

- `backend/Capstone.API/appsettings.Local.json`
- `hidden-gem-music-app/.env.local`

Do not commit:

- secrets
- tokens
- private machine-specific config
- temporary tool outputs

API base URL source-of-truth notes live in:

- `local-development-environment.md`

## LAN and phone-testing requirements

For phone testing to work reliably:

- backend should be running first
- Expo should be running with `--host lan`
- the phone and Mac should be on the same network
- the phone should be able to reach the Mac’s LAN IP

## How to find the Mac LAN IP

Quick check:

```bash
ipconfig getifaddr en0
```

Broader check if needed:

```bash
ifconfig | rg "inet "
```

## When to use `EXPO_PUBLIC_API_BASE_URL`

Use `EXPO_PUBLIC_API_BASE_URL` when:

- runtime host detection is not resolving the right backend host
- phone testing is clearly reaching Expo but not the backend
- a different backend host/port is temporarily needed

That variable should stay local-only.

## Practical smoke-test flow

After starting backend and frontend, the minimum useful full-stack smoke test is:

1. Open web and confirm the app loads
2. Open Welcome and confirm the shell/nav/modal all render correctly
3. Open Discovery and confirm countries load
4. Change year and confirm the screen refreshes without breaking
5. Open a Country page and confirm summary/album art/artist image data loads
6. Open Hidden Gems and confirm list data + big-CD behavior still work
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

## Update rule

If the project’s real working local run workflow changes, this file should be updated at the same time so the documented runbook stays aligned with what actually works in practice.
