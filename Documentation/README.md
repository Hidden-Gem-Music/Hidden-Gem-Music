# Repository Documentation Map

**Project:** Hidden Gem Music Discovery Platform — SOFT290 Capstone
**Author:** mp3li
**Contributors:** Leena Komenski
**Date:** 2026-05-15
**Last updated:** 2026-05-25
**Status:** Active

---

## Purpose

This folder is the shared documentation entrypoint for the repository as a whole.

It exists to explain where project documentation lives across the repo, especially now that frontend, backend, and tooling each have their own documentation near the code they describe.

## Documentation layout

### Shared project documentation

Shared repository-level documentation lives in:

- `Documentation/`

Current scope here includes:

- repository documentation map
- deployment guide for capstone review and verification
- accepted deployment decision record
- deployment platform selection and setup plan
- final documentation audit tracker
- shared QA/regression log used by project contributors

The deployment guide is:

- `Documentation/deployment-guide.md`

The accepted deployment decision record is:

- `Documentation/ADR-DEPLOYMENT-001-Deployment-Decisions.md`

The deployment platform selection and setup plan is:

- `Documentation/deployment-platform-selection-plan.md`

The final documentation audit tracker is:

- `Documentation/final-documentation-audit.md`

The shared QA log is:

- `Documentation/QA-log.md`

Each QA entry should include ownership fields such as `Tester` and `Fix owner` when applicable.

Shared visual documentation assets live in:

- `Documentation/Screenshots/` for app screenshots
- `Documentation/GIFs/` for app flow GIFs

### Frontend documentation

Frontend implementation documentation lives in:

- `hidden-gem-music-app/Documentation/`

Current scope there includes:

- frontend architecture
- routing/state/navigation
- screen data flow
- interaction/loading/overlay rules
- frontend local environment notes
- full-stack frontend-integrated testing workflow
- styling rules
- frontend glossary

### Backend documentation

Backend architecture documentation lives in:

- `backend/Capstone.API/Documentation/`
- `backend/Capstone.API/Documentation/README.md`

Backend API/provider/integration documentation lives in:

- `backend/Capstone.API/Documentation/apis/`
- `backend/Capstone.API/Documentation/apis/README.md`

Current scope there includes:

- accepted backend ADRs
- current backend API surface supplement
- backend local run/testing workflow
- Deezer and Genius provider docs
- additional-data research notes
- backend/project integration endpoint mapping

Backend database and stored procedure documentation lives in:

- `backend/Capstone.API/database/`
- `backend/Capstone.API/database/README.md`

### Tool documentation

Tool-specific documentation lives with the tools themselves:

- `tools/README.md`
- `tools/song_data_enrichment/README.md`
- `tools/mp3li_additional_data_getter_v2/README.md`

This keeps operational tool usage close to the scripts and runtime paths they describe.

### Business & Data Analytics documentation

Business deliverables live in:

- `business-report/`
  - see `business-report/README.md` for full index

Data findings, dashboard methodology, and BDA decision records live in:

- `backend/Capstone.API/database/Documentation/Data Findings and Updates/`
  - see `backend/Capstone.API/database/Documentation/Data Findings and Updates/README.md` for full index

---

## What does not belong here

This shared documentation folder is for repo-wide orientation only.

Exception:

- the shared QA/regression log belongs here because it applies across frontend, backend, data, tooling, and teammate testing

It is not intended to replace:

- frontend docs near frontend code
- backend docs near backend code
- stored procedure and database docs in `backend/Capstone.API/database/`
- tool docs near tool code
- business deliverables in `business-report/`
- data findings, dashboard methodology, and BDA decision records in `backend/Capstone.API/database/Documentation/Data Findings and Updates/`
- private planning notes, issue drafts, PR drafts, or personal timeline files

## Practical rule

When adding documentation:

- put frontend-specific implementation docs in `hidden-gem-music-app/Documentation/`
- put backend/API docs in `backend/Capstone.API/Documentation/` or `backend/Capstone.API/Documentation/apis/`
- put stored procedure and database docs in `backend/Capstone.API/database/`
- put tool usage docs in the relevant tool folder
- put business deliverables in `business-report/`
- put data findings, dashboard methodology, and BDA decision records in `backend/Capstone.API/database/Documentation/Data Findings and Updates/`
- use this shared folder only for cross-stack or repository-wide orientation
