# Frontend Documentation

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-10
**Status:** Active

---

This folder documents the current frontend architecture, state ownership, screen data flow, interaction rules, styling conventions, naming vocabulary, and local run workflow for `hidden-gem-music-app`.

## How this documentation set is organized

The files in this folder are separated by responsibility:

- `frontend-architecture.md`
  - structural ownership and major frontend seams
- `routing-state-and-navigation.md`
  - route names, params, app-owned state, and navigation handoff
- `screen-data-flow.md`
  - which screens call which frontend data helpers and how live data is reused
- `interaction-loading-and-overlay-rules.md`
  - shared interaction, popup, loading, and overlay behavior rules
- `local-development-environment.md`
  - setup/reference expectations for local frontend work
- `full-stack-local-testing.md`
  - the actual end-to-end backend + frontend + phone/web runbook
- `frontend-styling-rules.md`
  - visual-system and interaction-styling conventions
- `frontend-glossary.md`
  - internal frontend vocabulary

The goal is to avoid repeating the same content across multiple files. If a topic already has a source-of-truth document here, other docs should reference it rather than restate it in full.

## Files in this folder

- `frontend-architecture.md`
  - app shell structure
  - shared-screen ownership rules
  - component/layout responsibilities
  - theme and file-organization overview

- `routing-state-and-navigation.md`
  - route list
  - deep-link paths
  - app-owned state in `App.tsx`
  - URL sync, local storage, and navigation handoff rules

- `screen-data-flow.md`
  - frontend API entrypoints
  - per-screen fetch flow
  - cache/reuse behavior
  - additional-data integration points

- `interaction-loading-and-overlay-rules.md`
  - popup/overlay behavior
  - loading-state rules
  - search/welcome/Hidden Gems interaction rules
  - explicit badge behavior

- `local-development-environment.md`
  - local-only config expectations
  - frontend setup/tooling expectations
  - API base URL behavior
  - frontend verification expectations

- `full-stack-local-testing.md`
  - combined backend + frontend local run workflow
  - LAN/phone testing flow
  - why `--host lan` is used
  - API base URL and Mac LAN IP troubleshooting
  - practical smoke-test steps for web and mobile

- `frontend-styling-rules.md`
  - theme ownership
  - typography and surface rules
  - spacing, responsive, and interaction styling conventions

- `frontend-glossary.md`
  - internal frontend naming vocabulary
  - section/component terminology
  - code-location references for recurring UI structures

## Scope note

This folder is for shared project/frontend documentation.
