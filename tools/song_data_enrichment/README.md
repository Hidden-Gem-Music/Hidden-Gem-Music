# Song Data Enrichment (Deezer + Genius)

This tool enriches `song_title + artist_name` rows and outputs identical dataset content as:
- `enriched_songs.csv`
- `enriched_songs.json`
- `enriched_songs.txt`

## 1. Create your input CSV from restored DB (SSMS)

Run this query in SSMS against your restored local database:

```sql
SELECT
  s.song_name AS song_title,
  a.artist_name AS artist_name
FROM DIM_Song s
JOIN Bridge_SongArtist bsa ON bsa.song_id = s.song_id
JOIN DIM_Artist a ON a.artist_id = bsa.artist_id
ORDER BY s.song_name, a.artist_name;
```

Then export results:
1. In results grid, right-click.
2. Select `Save Results As...`.
3. Save as CSV named `input_songs.csv`.
4. Make sure the header is exactly: `song_title,artist_name`.

Put that file at:

`tools/song_data_enrichment/input_songs.csv`

## 2. Configure API secrets safely

Create a local file in repo root named `.env.local` (do not commit it):

```env
GENIUS_ACCESS_TOKEN=your_token_here
DEEZER_APP_ID=optional_app_id
DEEZER_APP_SECRET=optional_app_secret
```

Notes:
- `GENIUS_ACCESS_TOKEN` is required.
- Deezer credentials are optional for this implementation path.
- The script auto-loads `.env.local` and fails fast if required secrets are missing.

## 3. Install dependencies

```bash
python3 -m pip install -r tools/song_data_enrichment/requirements.txt
```

## 4. Secret check only

```bash
python3 tools/song_data_enrichment/enrich_songs.py --check-secrets
```

## 5. Smoke test (10 rows)

```bash
python3 tools/song_data_enrichment/enrich_songs.py --limit 10
```

## 6. Full run

```bash
python3 tools/song_data_enrichment/enrich_songs.py
```

Outputs are written to:

`tools/song_data_enrichment/output/`

## Data rules implemented

- Deezer throttle safety policy: **50 requests per 4 seconds**.
- Retries with exponential backoff for transient failures.
- Image URL policy:
  - `artist_photo_url`: prefer `xl`, fallback to `medium`
  - `album_art_url`: prefer `xl`, fallback to `medium`
- Lyrics strategy: Genius API search first.
- Language detection:
  - primary from lyrics text (when available)
  - fallback from `song_title + artist_name`

## Optional flags

- `--input <path>` custom input CSV path
- `--output-dir <path>` custom output folder
- `--env-file <path>` custom env file
- `--include-lyrics-text` include extracted lyrics text in outputs
- `--limit <n>` row limit for test runs
- `--offset <n>` skip first `n` deduped input rows
- `--merge-output` merge new chunk into existing output and dedupe by `song_name + artist_name`

## Large dataset chunk strategy (recommended)

For very large files, run in chunks and merge safely:

```bash
python3 tools/song_data_enrichment/enrich_songs.py --offset 0 --limit 2000 --merge-output
python3 tools/song_data_enrichment/enrich_songs.py --offset 2000 --limit 2000 --merge-output
python3 tools/song_data_enrichment/enrich_songs.py --offset 4000 --limit 2000 --merge-output
```

This prevents replacing prior results on each batch run.

## Continuous chunk runner with checkpoints (recommended for full pass)

Use the runner to keep progress visible and recover safely from stalls:

```bash
python3 tools/song_data_enrichment/run_enrichment_chunks.py \
  --chunk-size 500 \
  --start-offset 0 \
  --stall-timeout-sec 1800 \
  --retry-on-stall 1 \
  --reduced-chunk-on-second-stall 200
```

What it does:
- Runs `enrich_songs.py` in `--merge-output` chunk mode.
- Writes rolling checkpoint events to:
  - `tools/song_data_enrichment/output/chunk_checkpoints.jsonl`
- After each chunk, validates:
  - output files exist/readable
  - output row count is non-decreasing (dedupe-safe)
- Stall handling:
  - timeout marks stall
  - retries same chunk once
- if stall repeats, retries with smaller chunk size (`200` by default)

## Interactive terminal app behavior

When you run the chunk runner from a terminal, it now prompts you with 3 choices:
1. Start from beginning
2. Resume where last successful chunk ended
3. Second pass: unmatched/skipped only

It also shows:
- total matched so far / total rows
- total skipped so far / total rows
- current song index out of total (`N / total`)
- per-song loading bar for the full song pipeline
- step text while processing each song (Deezer, Genius, language, finalize)
- persistent per-song result lines:
  - `completed` (matched)
  - `not_fully_completed` (unmatched/skipped)

This means you can scroll up during execution and see a history of which songs completed vs not fully completed.

## Stop / Pause controls

- Stop gracefully: `Ctrl+C`
- Force stop from another terminal:
  - `pkill -f "tools/song_data_enrichment/run_enrichment_chunks.py"`
  - `pkill -f "tools/song_data_enrichment/enrich_songs.py"`
- Pause/resume at OS level (macOS/Linux terminal):
  - pause: `Ctrl+Z`
  - resume: `fg`
