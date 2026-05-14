# mp3li's Additional Data Getter v2

This is a separate tool from:

- `tools/song_data_enrichment`

That original folder remains the v1 tool path. This v2 folder is the newer source-specific additional-data getter workflow.

## Purpose

This tool processes the shared no-dupes song list and writes source-specific additional-data outputs and runtime state.

It is designed around:

- one chosen source per run
- resumable local state
- source-specific output/state folders
- safer catch-up behavior for partially processed datasets

## Current source options

The tool currently supports four source modes:

1. `deezer`
2. `genius_api`
3. `genius_web`
4. `genius_web_language`

Interactive source selection presents:

1. Deezer
2. Genius API
3. Genius Web Scraping
4. Language Getter from Genius Lyric URLs

## Current run modes

The tool currently supports five run modes:

1. `begin`
2. `resume`
3. `fill_missing`
4. `retry_skipped`
5. `smart_catch_up`

Interactive mode selection presents:

1. Start from Beginning
2. Resume at Next Song
3. Fill Missing Fields Only
4. Retry Skipped Songs Only
5. Smart Catch-Up (Genius Web Only)

Important rule:

- `smart_catch_up` is only valid when `--source genius_web` is used

## Current input behavior

Input is locked to:

- `tools/song_data_enrichment/no_dupes_input_songs.csv`

The tool will not accept a different effective input file.

Expected headers:

- `song_title`
- `artist_name`

The tool treats this file as the authoritative deduped song list.

## Current runtime folders

### Deezer

- output: `tools/mp3li_additional_data_getter_v2/output`
- state: `tools/mp3li_additional_data_getter_v2/state`

### Genius API

- output: `tools/mp3li_additional_data_getter_v2/output_genius_api`
- state: `tools/mp3li_additional_data_getter_v2/state_genius_api`

### Genius Web

- output: `tools/mp3li_additional_data_getter_v2/output_genius_web`
- state: `tools/mp3li_additional_data_getter_v2/state_genius_web`

### Language Getter from Genius Lyric URLs

- source data: `tools/mp3li_additional_data_getter_v2/output_genius_web/enriched_songs.csv`
- output: `tools/mp3li_additional_data_getter_v2/output_genius_web/language_ready_matches.*`
- state: `tools/mp3li_additional_data_getter_v2/state_genius_web_language`

Each runtime path uses:

- `run_state.json`
- `rows_cache.json`

Each output path writes:

- `enriched_songs.csv`
- `enriched_songs.json`
- `enriched_songs.txt`

The tool also triggers generation of:

- `ui_live_pull_map.md`

inside the active output folder.

## Auth and local env handling

The tool loads:

- repo-root `.env.local`

Current secret behavior:

- `genius_api` requires `GENIUS_ACCESS_TOKEN`
- `genius_web` does not require a Genius API token
- `genius_web_language` does not require a Genius API token
- Deezer app credentials are optional:
  - `DEEZER_APP_ID`
  - `DEEZER_APP_SECRET`

## Run

Interactive run:

```bash
cd "/Users/stellar/School/Music_Capstone/tools/mp3li_additional_data_getter_v2" && python3 main.py
```

Example non-interactive test run:

```bash
cd "/Users/stellar/School/Music_Capstone/tools/mp3li_additional_data_getter_v2" && python3 main.py --source deezer --mode begin --limit 25
```

Example Genius Web smart catch-up run:

```bash
cd "/Users/stellar/School/Music_Capstone/tools/mp3li_additional_data_getter_v2" && python3 main.py --source genius_web --mode smart_catch_up
```

Example language getter test run:

```bash
cd "/Users/stellar/School/Music_Capstone/tools/mp3li_additional_data_getter_v2" && python3 main.py --source genius_web_language --mode begin --limit 20
```

## CLI flags

- `--input`
  - documented for clarity, but the tool is still locked to `tools/song_data_enrichment/no_dupes_input_songs.csv`
- `--source`
  - `deezer`
  - `genius_api`
  - `genius_web`
- `--mode`
  - `begin`
  - `resume`
  - `fill_missing`
  - `retry_skipped`
  - `smart_catch_up`
- `--limit <n>`
  - optional row cap for test runs

## Resume and bootstrap behavior

Resume is not based only on a stored numeric pointer anymore.

Current resume logic uses:

- processed `song_name + artist_name` pairs from runtime state
- `rows_cache.json` when present
- fallback bootstrap from existing:
  - `enriched_songs.json`
  - or `enriched_songs.csv`

This means the tool can recover more safely if runtime state is partially missing but output files already exist.

## Current behavior notes by source

### Deezer

Current focus:

- Deezer ID-first matching workflow
- track / album / artist metadata capture
- preview and endpoint-comparison output fields

### Genius API

Current focus:

- token-backed Genius search path
- lyrics URL capture through the API-supported workflow

### Genius Web

Current focus:

- constructed Genius URL attempts
- concurrent web validation workers
- attempt-trail tracking
- deterministic skip classification
- smart catch-up support for incomplete prior runs

## Output shape notes

The tool normalizes rows into a canonical field set and writes the same dataset content to:

- CSV
- JSON
- TXT

Current output includes fields such as:

- `song_name`
- `artist_name`
- `track_id`
- `album_id`
- `preview_url`
- `lyrics_url`
- `genres`
- `contributors`
- `record_type`
- `attempt_trail`
- `skip_reason`
- `source`

The writer also materializes endpoint-comparison fields such as:

- `preview_live_pull_endpoint`
- `endpoint_tracklist`
- `endpoint_album_tracks`
- `endpoint_artist_albums`
- `endpoint_artist_related`

## Helper scripts

### `build_ui_live_pull_map.py`

Purpose:

- generates `ui_live_pull_map.md` from the current rows cache
- documents endpoint/key-path observations from real payloads already seen by the tool

### `merge_outputs.py`

Purpose:

- merges Deezer rows and Genius rows by `song_name + artist_name`

Default paths:

- Deezer rows: `state/rows_cache.json`
- Genius rows: `state_genius_web/rows_cache.json`
- merged output dir: `output_merged`

Example:

```bash
cd "/Users/stellar/School/Music_Capstone/tools/mp3li_additional_data_getter_v2" && python3 merge_outputs.py
```

## Practical note

This tool is intentionally kept separate from v1 so active output/state paths and source-specific workflows do not overwrite each other accidentally.
