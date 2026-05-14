## Summary:

This PR completes Issue 107 for **Obtain, Organize, and Document Additional Required and Reach Data External API Endpoints**.

Scope includes researching, identifying, organizing, and documenting the external API/provider routes needed for required and reach additional song metadata, while keeping actual large-scale database ingestion and full future UI implementation work outside this issue's scope.

## Work Performed:

### 1) Created a dedicated backend documentation folder for additional-data endpoint documentation:

- Added a dedicated API documentation folder under the existing backend documentation structure.
- This created one organized location for provider docs, project integration docs, and research/decision notes instead of leaving the information scattered across tool code, backend code, and local notes.

Files:
- `backend/Capstone.API/Documentation/apis/README.md`

### 2) Documented the Deezer provider endpoints and field coverage:

- Documented the Deezer endpoints relevant to this project's additional-data needs.
- Recorded which required fields Deezer provides.
- Recorded which reach fields Deezer provides.
- Documented practical matching behavior, preview URL behavior, and usage/rate-limit notes.

Files:
- `backend/Capstone.API/Documentation/apis/deezer-api.md`

### 3) Documented the official Genius API usage and limitations:

- Documented the official Genius API route currently relevant to this project.
- Recorded authentication requirements and current repo usage.
- Documented what Genius can directly provide versus what it cannot directly provide through the official JSON API path.

Files:
- `backend/Capstone.API/Documentation/apis/genius-api.md`

### 4) Documented the custom Genius web-scraper workflow:

- Added a separate professional documentation file for the project-specific Genius scraper workflow.
- Documented how the workflow uses Genius URL structure and lyrics page fetching.
- Documented query fallback order, normalization, match testing, and skip behavior when a candidate is not strong enough.

Files:
- `backend/Capstone.API/Documentation/apis/genius-web-scraper.md`

### 5) Documented additional-data research findings, provider limits, and decision notes:

- Added a research/decision file that records what was learned during provider investigation.
- Documented field coverage comparisons, rate-limit concerns, matching concerns, fallback behavior, and unresolved gaps such as language.

Files:
- `backend/Capstone.API/Documentation/apis/additional-data-research-notes.md`

### 6) Documented the actual project integration endpoints:

- Added a project-level wiring file documenting the internal frontend/backend endpoints involved in additional-data behavior.
- Documented which external provider routes sit behind those project endpoints.
- Documented the distinction between the original enrichment-tool path and the current live/backend enrichment path.

Files:
- `backend/Capstone.API/Documentation/apis/project-integration-endpoints.md`

### 7) Added author/date headers and aligned documentation placement with existing backend documentation style:

- Added `Author` and `Date` headers at the top of the new documentation files to match the style already used in the backend documentation folder.
- Moved the API docs into the correct backend documentation area instead of leaving them in a separate root-level documentation folder.

Files:
- `backend/Capstone.API/Documentation/apis/README.md`
- `backend/Capstone.API/Documentation/apis/deezer-api.md`
- `backend/Capstone.API/Documentation/apis/genius-api.md`
- `backend/Capstone.API/Documentation/apis/genius-web-scraper.md`
- `backend/Capstone.API/Documentation/apis/additional-data-research-notes.md`
- `backend/Capstone.API/Documentation/apis/project-integration-endpoints.md`

### 8) Updated the personal implementation timeline to record the completed endpoint-documentation work:

- Updated the personal timeline document to record what was documented, why the provider choices were made, and how the new API documentation set was organized in the repo.

Files:
- `Documents/mp3li implementation timeline document.txt`

## Task-by-Task Status Against Issue Text:

1. **Research, identify, and document needed external API/provider routes**: Completed.
2. **Securely/private-only handling of keys, secrets, tokens, and IDs**: Completed in scope.
3. **Thorough provider/endpoint research for required additional data**: Completed.
4. **Document all endpoints needed for required data and what each provides**: Completed.
5. **Document endpoint testing notes, matching concerns, duplicate handling concerns, and fallback behavior**: Completed.
6. **Organize documentation into dedicated markdown files in a backend API documentation folder**: Completed.
7. **Keep tools/scripts separate from documentation and keep secrets out of docs/GitHub**: Completed.
8. **Create a documentation set clear enough to support future implementation/database work**: Completed.

## Files Changed:

- `backend/Capstone.API/Documentation/apis/README.md`
- `backend/Capstone.API/Documentation/apis/deezer-api.md`
- `backend/Capstone.API/Documentation/apis/genius-api.md`
- `backend/Capstone.API/Documentation/apis/genius-web-scraper.md`
- `backend/Capstone.API/Documentation/apis/additional-data-research-notes.md`
- `backend/Capstone.API/Documentation/apis/project-integration-endpoints.md`
- `Documents/mp3li implementation timeline document.txt`

## Verification:

- Documentation placement verified in backend documentation folder
- Author/date header format aligned to existing backend documentation style
- Documentation content checked against current repo/tool/backend behavior
- Secrets/tokens not included in documentation files
