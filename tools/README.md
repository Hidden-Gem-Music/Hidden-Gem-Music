# Tools

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Date:** 2026-05-15
**Status:** Active

---

## Purpose

This folder contains project tools that sit outside the live frontend and backend app paths.

These tools are repo-level utilities, so they stay at the repository root instead of inside `hidden-gem-music-app/` or `backend/`.

## Tools in this folder

### `song_data_enrichment`

Original additional-data enrichment tool, now treated as v1.

Documentation:

- `tools/song_data_enrichment/README.md`

Primary role:

- enriches song rows from exported input lists
- writes organized output files for additional-data work
- supports chunked runs, resume/unmatched passes, Deezer-only runs, and merged output handling

### `mp3li_additional_data_getter_v2`

Separate newer additional-data getter workflow.

Documentation:

- `tools/mp3li_additional_data_getter_v2/README.md`

Primary role:

- interactive source-specific additional-data pulling workflow
- separate runtime/output/state paths from the original tool
- supports Deezer, Genius API, Genius Web, and Genius Web language-getter modes
- includes helper scripts for UI live-pull maps and Deezer/Genius output merging

## Documentation rule

Tool-specific run instructions, flags, inputs, outputs, and state behavior should be documented inside the tool’s own folder README.

This file is only the shared tools index.

## Local-artifact rule

Many tool outputs and runtime state files are local working artifacts.

Important practical rule:

- keep generated output/state local unless a specific file is intentionally meant to become a tracked project asset
- runtime state/output folders are useful during enrichment work but should not be treated as frontend/backend source-of-truth code
- full enrichment outputs should stay ignored; if a tracked sample is needed, add a small fixture outside the runtime output folder and document why it is versioned
