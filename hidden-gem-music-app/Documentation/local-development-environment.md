# Local Development Environment

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-10
**Status:** Active

---

## Purpose

This document records the local environment expectations for frontend work in `hidden-gem-music-app`.

Use this file for:

- local-only config expectations
- installation and tooling prerequisites
- frontend verification commands
- source-of-truth notes about API base URL resolution

Use `full-stack-local-testing.md` for the actual backend + frontend + phone/web run workflow.

## Repository and local-only files

Frontend/local secrets and machine-specific configuration should stay local.

Important local-only frontend file:

- `hidden-gem-music-app/.env.local`

Backend local configuration that frontend work commonly depends on:

- `backend/Capstone.API/appsettings.Local.json`

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

## Environment-variable guidance

`EXPO_PUBLIC_API_BASE_URL` should be used when:

- phone testing is reaching Expo but not the backend
- runtime host detection resolves the wrong host
- a temporary backend host or port override is needed

This variable should remain local-only.

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

## Related documentation

- `frontend-architecture.md`
  - structural frontend ownership
- `full-stack-local-testing.md`
  - end-to-end backend + web + phone runbook
- `routing-state-and-navigation.md`
  - app-owned route/state handoff rules
- `screen-data-flow.md`
  - per-screen data-loading ownership
