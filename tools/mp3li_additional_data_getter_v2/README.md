# mp3li's Additional Data Getter v2

This is a fully separate tool from `tools/song_data_enrichment`.

## What it does

- Interactive source selection: Deezer or Genius (no both)
- Interactive mode selection:
  1. Start from Beginning
  2. Resume at Next Song
  3. Fill Missing Fields Only
  4. Retry Skipped Songs Only
- Deezer ID-first workflow with exact/simplified matching
- Skipped song tracking with song+artist and attempt trail
- Resume pointers (`last_completed_index`, `next_index`)
- Chunked processing in batches of 100
- Fixed bottom status section with chunk progress, getting/skipped counts, current song, current action, endpoint success count, and state
- Equivalent content output to:
  - `output/enriched_songs.csv`
  - `output/enriched_songs.json`
  - `output/enriched_songs.txt`

## Auth handling

- Loads `.env.local` from repo root.
- Genius source requires `GENIUS_ACCESS_TOKEN`.
- Deezer app credentials are optional:
  - `DEEZER_APP_ID`
  - `DEEZER_APP_SECRET`

## Run

```bash
cd tools/mp3li_additional_data_getter_v2
python3 main.py
```

Optional flags for test runs:

```bash
python3 main.py --source deezer --mode begin --limit 25
```

## Input

Input is now locked to:

- `tools/song_data_enrichment/no_dupes_input_songs.csv`

The tool will not fall back to `input_songs.csv`.

Expected headers:

- `song_title`
- `artist_name`

The tool now trusts that this file is already the authoritative no-dupes list.

## Resume behavior after switching to the no-dupes list

Resume is now keyed to processed `song + artist` pairs, not only the old raw `next_index` number.

That means if you previously ran v2 against the older `input_songs.csv` and then switch to `no_dupes_input_songs.csv`:

- v2 will use only the no-dupes file
- it will scan existing cached/skipped songs
- if `rows_cache.json` is missing but an existing `enriched_songs.json` or `enriched_songs.csv` exists for that runtime path, it can bootstrap resume from that output too
- and it will resume at the first still-unprocessed unique song row

So the normal "Resume at Next Song" flow is preserved even though the input list changed.

## State files

- `state/run_state.json`
- `state/rows_cache.json`

## Notes on endpoint comparison capture

The output stores both variants so you can compare later:

- `tracklist_url` and `album_tracks_endpoint_url` + count
- `nb_album` and `artist_albums_endpoint_url` + count
