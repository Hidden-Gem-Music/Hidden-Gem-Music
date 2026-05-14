# Custom Interactive World Map

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-11
**Status:** Current Working Feature Reference

---

## Purpose

This document explains the current custom world-map feature used by the frontend in the Discovery and Comparison flows.

This map replaces the old placeholder globe-area rendering with an app-owned interactive map surface that:

- works in browser and Expo Go
- uses real country boundary data
- keeps the Hidden Gem Music visual language
- supports filtering, selection, hover/tap cards, globe rotation, and zoom

This file focuses on the feature itself.

Use:

- `frontend-architecture.md` for broader frontend ownership
- `screen-data-flow.md` for screen request/cache behavior
- `full-stack-local-testing.md` for app run/testing workflow

## Main files

- `src/components/globe/GlobePanel.tsx`
  - shared map shell used by Discovery and Comparison
- `src/components/globe/GlobeView.tsx`
  - actual custom world-map renderer and interaction behavior
- `src/assets/maps/worldMap50m.ts`
  - app-owned generated world geometry and projection metadata
- `tools/generate_world_map_assets.mjs`
  - conversion script used to regenerate the app-owned world-map asset

## Data source and asset pipeline

The live frontend does not call an external map provider.

Instead:

1. country geometry comes from Natural Earth 50m country boundaries through the checked-in generation pipeline
2. the generation script converts that source into the app-owned `worldMap50m.ts` asset
3. runtime rendering uses the generated asset directly

Current asset contents include:

- country reference metadata
- continent grouping metadata
- generated flat-map path data used by the asset pipeline

Country markers do not come from the geometry file itself.

Marker anchors come from the frontend/backend `Country` model through:

- `lat`
- `long`

That keeps screen-level country data and map placement aligned.

## Current behavior

### Discovery

- Discovery still owns filtering, sorting, selected year, and selected country behavior.
- The map receives the active filtered countries plus the broader available country pool.
- Matching countries stay emphasized.
- Non-matching countries remain dim but visible.
- Hovering a valid country on web opens its attached card.
- Clicking a valid country/gem/card opens the country flow.

### Comparison

- Comparison still owns filter state and selected comparison countries.
- The map receives the filtered comparison results plus the broader comparison country pool.
- Selected comparison countries use two distinct visual treatments so country A and country B stay clear.
- On mobile, tap opens the card first before the next action.

## Interaction model

- Web:
  - hover preview
  - click action
  - drag to rotate
  - mouse wheel zoom
- Mobile:
  - tap preview
  - tap card/gem/country for action
  - drag to rotate
  - pinch to zoom

Map interaction is bounded so the globe stays usable and can be reset back to its default view.

## Visual rules

Current intended styling direction:

- circular frame
- orthographic globe presentation
- atmospheric dark base
- real country lines
- stronger continent lines
- gem markers
- glass-panel attached cards
- no permanent map labels

Cards are intentionally connected to the gem corner so the gem remains the visual owner and the card reads as emerging from it.

## Update rule

If future work changes:

- the geometry source
- the asset-generation pipeline
- the interaction model
- the Discovery/Comparison map ownership split
- or the card/marker styling rules

then this file should be updated in the same change.
