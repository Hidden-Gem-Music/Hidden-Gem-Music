# Additional Data API Documentation

**Author:** mp3li
**Date:** 2026-05-09

This folder documents the external API endpoints currently relevant to additional song metadata for Hidden Gem Music.

## Files in this folder

- `deezer-api.md`
  - Deezer endpoints currently used or planned for live song enrichment
  - required fields
  - reach fields
  - sample requests
  - response-shape notes
  - matching and expiry notes
- `genius-api.md`
  - Genius endpoint currently used for lyrics URL discovery
  - auth requirements
  - field coverage
  - limits of the official API for language extraction
- `genius-web-scraper.md`
  - project-specific Genius scraper workflow documentation
  - URL-structure and lyrics-page usage
  - match-validation rules before accepting a result
  - skip behavior when a candidate is not strong enough
- `additional-data-research-notes.md`
  - provider-comparison notes
  - field coverage matrix
  - matching concerns
  - fallback and rate-limit decisions
  - unresolved gaps and future-iteration notes
- `project-integration-endpoints.md`
  - internal app/backend endpoints that now expose or consume additional-data enrichment
  - external-provider chains used behind those endpoints
  - distinction between old tool path and current live-app path

## Current provider decisions

For the current project direction:

- Deezer is the primary source for:
  - genre(s)
  - album art URL
  - artist image URL
  - 30 second preview URL
  - release date
  - record type
  - contributors
  - artist album count
  - explicit flags
- Genius is the current source for:
  - lyrics page URL
- Language in lyrics is not currently coming directly from Deezer.
- Language in lyrics is not currently coming directly from the Genius JSON API either.
- If language detection is implemented later through the documented Genius route, it would be:
  - Genius API search to get a lyrics page URL
  - lyrics page fetch / extraction
  - local language detection on extracted text

## Security rules

- Do not store API secrets, tokens, app ids, or app secrets in this folder.
- Keep secrets in local environment files only.
- Do not commit `.env.local`.

## Current local secret names used in this repo

- `GENIUS_ACCESS_TOKEN`
- `DEEZER_APP_ID`
- `DEEZER_APP_SECRET`

## Important project note

This folder documents the endpoint research and implementation path selection.

It does **not** mean every one of the 200,000+ songs has already been fully enriched and written into the shared database.

What it does mean is:

- the required provider/endpoints have been identified,
- the extra endpoints used by the current tool and backend paths are now explicitly tracked too,
- the current live-app implementation path is documented,
- the future fuller pull-and-organize path is still documented and still possible,
- and the field coverage / limitations are now explicit instead of scattered across tool code and local notes.
