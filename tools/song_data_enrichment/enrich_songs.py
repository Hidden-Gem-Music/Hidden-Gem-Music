#!/usr/bin/env python3
"""Enrich songs from Deezer + Genius with safe throttling and multi-format outputs."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None

try:
    from langdetect import detect  # type: ignore
except Exception:  # pragma: no cover
    detect = None
try:
    from tqdm.auto import tqdm  # type: ignore
except Exception:  # pragma: no cover
    tqdm = None

DEEZER_BASE = "https://api.deezer.com"
GENIUS_BASE = "https://api.genius.com"
DEFAULT_INPUT_CANDIDATES = [
    "tools/song_data_enrichment/no_dupes_input_songs.csv",
    "tools/song_data_enrichment/input_songs.csv",
]

# Intentionally stricter than the documented Deezer limit.
DEEZER_MAX_REQUESTS = 50
DEEZER_WINDOW_SECONDS = 4


class RateLimiter:
    """Simple sliding-window limiter."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._timestamps: deque[float] = deque()

    def wait_for_slot(self) -> None:
        while True:
            now = time.time()
            while self._timestamps and now - self._timestamps[0] >= self.window_seconds:
                self._timestamps.popleft()
            if len(self._timestamps) < self.max_requests:
                self._timestamps.append(now)
                return
            sleep_for = self.window_seconds - (now - self._timestamps[0])
            time.sleep(max(sleep_for, 0.01))


@dataclass
class RunStats:
    processed: int = 0
    matched_deezer: int = 0
    matched_genius: int = 0
    retries: int = 0
    errors: int = 0
    deezer_unmatched: int = 0
    genius_unmatched: int = 0


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return bool(value)


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def check_secrets(require_genius: bool = True) -> Tuple[bool, List[str]]:
    required = ["GENIUS_ACCESS_TOKEN"] if require_genius else []
    optional = ["DEEZER_APP_ID", "DEEZER_APP_SECRET"]
    missing_required = [k for k in required if not os.getenv(k)]

    messages = []
    if missing_required:
        messages.append(f"Missing required secret(s): {', '.join(missing_required)}")
    elif not require_genius:
        messages.append("Genius token not required in Deezer-only mode.")
    else:
        messages.append("Required secrets are present.")

    missing_optional = [k for k in optional if not os.getenv(k)]
    if missing_optional:
        messages.append(
            "Optional Deezer app credentials not set (continuing without them): "
            + ", ".join(missing_optional)
        )
    else:
        messages.append("Optional Deezer app credentials are present.")

    return (len(missing_required) == 0, messages)


def resolve_input_path(requested_path: str) -> Path:
    if requested_path != "auto":
        return Path(requested_path)

    for candidate in DEFAULT_INPUT_CANDIDATES:
        path = Path(candidate)
        if path.exists():
            return path

    return Path(DEFAULT_INPUT_CANDIDATES[0])


def normalize_text(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value


def simplify_for_search(value: str) -> str:
    value = normalize_text(value)
    # Keep letters/numbers/spaces; drop punctuation/symbol noise for fallback searches.
    value = re.sub(r"[^\w\s]", " ", value, flags=re.UNICODE)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def request_json(
    session: requests.Session,
    url: str,
    params: Dict[str, Any],
    headers: Optional[Dict[str, str]] = None,
    limiter: Optional[RateLimiter] = None,
    max_attempts: int = 2,
    timeout: int = 20,
) -> Tuple[Optional[Dict[str, Any]], int]:
    retries = 0
    for attempt in range(1, max_attempts + 1):
        try:
            if limiter:
                limiter.wait_for_slot()
            response = session.get(url, params=params, headers=headers, timeout=timeout)
            if response.status_code in (429, 500, 502, 503, 504):
                if attempt == max_attempts:
                    return None, retries
                retries += 1
                backoff = min(2 ** (attempt - 1), 8)
                time.sleep(backoff)
                continue
            response.raise_for_status()
            return response.json(), retries
        except requests.RequestException:
            if attempt == max_attempts:
                return None, retries
            retries += 1
            backoff = min(2 ** (attempt - 1), 8)
            time.sleep(backoff)
    return None, retries


def deezer_track_lookup(
    session: requests.Session,
    limiter: RateLimiter,
    song_title: str,
    artist_name: str,
) -> Tuple[Optional[Dict[str, Any]], int]:
    retries = 0
    tracks: List[Dict[str, Any]] = []
    query_candidates = [
        f'track:"{song_title}" artist:"{artist_name}"',
        f'track:"{simplify_for_search(song_title)}" artist:"{artist_name}"',
        f'{song_title} {artist_name}',
        f'{simplify_for_search(song_title)} {artist_name}',
        artist_name,
    ]

    seen_queries = set()
    for query in query_candidates:
        query = query.strip()
        if not query or query in seen_queries:
            continue
        seen_queries.add(query)
        payload, r = request_json(
            session,
            f"{DEEZER_BASE}/search",
            params={"q": query},
            limiter=limiter,
        )
        retries += r
        if not payload:
            continue
        data = payload.get("data") or []
        if data:
            tracks = data
            break

    if not tracks:
        return None, retries

    wanted_song = normalize_text(song_title)
    wanted_artist = normalize_text(artist_name)
    wanted_song_simple = simplify_for_search(song_title)
    wanted_artist_simple = simplify_for_search(artist_name)

    # Prefer exact normalized match before taking the first candidate.
    for item in tracks:
        t = normalize_text(item.get("title", ""))
        a = normalize_text((item.get("artist") or {}).get("name", ""))
        if t == wanted_song and a == wanted_artist:
            return item, retries

    # Secondary match: simplified title/artist for symbol-heavy names.
    for item in tracks:
        t = simplify_for_search(item.get("title", ""))
        a = simplify_for_search((item.get("artist") or {}).get("name", ""))
        if t and a and t == wanted_song_simple and a == wanted_artist_simple:
            return item, retries

    # Tertiary match: artist exact + title prefix containment.
    for item in tracks:
        t_norm = normalize_text(item.get("title", ""))
        a_norm = normalize_text((item.get("artist") or {}).get("name", ""))
        if a_norm == wanted_artist and (
            t_norm.startswith(wanted_song) or wanted_song.startswith(t_norm)
        ):
            return item, retries

    return tracks[0], retries


def deezer_album_lookup(
    session: requests.Session,
    limiter: RateLimiter,
    album_id: Any,
) -> Tuple[Optional[Dict[str, Any]], int]:
    if not album_id:
        return None, 0
    payload, retries = request_json(
        session,
        f"{DEEZER_BASE}/album/{album_id}",
        params={},
        limiter=limiter,
    )
    return payload, retries


def choose_image_url(obj: Dict[str, Any], key_prefix: str) -> str:
    xl_key = f"{key_prefix}_xl"
    medium_key = f"{key_prefix}_medium"
    return str(obj.get(xl_key) or obj.get(medium_key) or "")


def genius_search(
    session: requests.Session,
    song_title: str,
    artist_name: str,
    genius_token: str,
) -> Tuple[Optional[Dict[str, Any]], int]:
    headers = {"Authorization": f"Bearer {genius_token}"}
    retries = 0
    hits: List[Dict[str, Any]] = []
    query_candidates = [
        f"{song_title} {artist_name}",
        f"{simplify_for_search(song_title)} {artist_name}",
        artist_name,
    ]
    seen_queries = set()
    for query in query_candidates:
        query = query.strip()
        if not query or query in seen_queries:
            continue
        seen_queries.add(query)
        payload, r = request_json(
            session,
            f"{GENIUS_BASE}/search",
            params={"q": query},
            headers=headers,
            limiter=None,
        )
        retries += r
        if not payload:
            continue
        candidate_hits = ((payload.get("response") or {}).get("hits")) or []
        if candidate_hits:
            hits = candidate_hits
            break
    if not hits:
        return None, retries

    wanted_song = normalize_text(song_title)
    wanted_artist = normalize_text(artist_name)
    wanted_song_simple = simplify_for_search(song_title)
    wanted_artist_simple = simplify_for_search(artist_name)

    for hit in hits:
        result = hit.get("result") or {}
        title = normalize_text(result.get("title", ""))
        artist = normalize_text((result.get("primary_artist") or {}).get("name", ""))
        if title == wanted_song and artist == wanted_artist:
            return result, retries

    for hit in hits:
        result = hit.get("result") or {}
        title = simplify_for_search(result.get("title", ""))
        artist = simplify_for_search((result.get("primary_artist") or {}).get("name", ""))
        if title and artist and title == wanted_song_simple and artist == wanted_artist_simple:
            return result, retries

    return (hits[0].get("result") or None), retries


def fetch_lyrics_text(url: str, timeout: int = 20) -> str:
    # Lightweight extraction fallback if no provider plugin is wired.
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException:
        return ""
    html = response.text
    matches = re.findall(r'<div data-lyrics-container="true"[^>]*>(.*?)</div>', html, flags=re.DOTALL)
    if not matches:
        return ""
    text = "\n".join(matches)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def detect_language(lyrics: str, song_title: str, artist_name: str) -> Tuple[str, str]:
    sample = (lyrics or "").strip()
    source = "lyrics"
    if not sample:
        sample = f"{song_title} {artist_name}".strip()
        source = "title_artist_fallback"

    if not sample:
        return "unknown", source

    if detect is None:
        return "unknown", source

    try:
        return detect(sample), source
    except Exception:
        return "unknown", source


def ensure_required_headers(headers: Iterable[str]) -> None:
    needed = {"song_title", "artist_name"}
    missing = needed - set(h.strip() for h in headers)
    if missing:
        raise ValueError("CSV is missing required header(s): " + ", ".join(sorted(missing)))


def clean_csv_value(value: Any) -> str:
    text = (value or "").strip()
    if text.upper() == "NULL":
        return ""
    return text


def load_input_rows(csv_path: Path) -> List[Dict[str, str]]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample) if sample else csv.excel

        reader = csv.DictReader(f, dialect=dialect)
        fieldnames = [h.strip() for h in (reader.fieldnames or [])]

        rows: List[Dict[str, str]] = []
        has_expected_headers = {"song_title", "artist_name"}.issubset(set(fieldnames))

        if has_expected_headers:
            for row in reader:
                song_title = clean_csv_value(row.get("song_title"))
                artist_name = clean_csv_value(row.get("artist_name"))
                if not song_title or not artist_name:
                    continue
                rows.append({"song_title": song_title, "artist_name": artist_name})
            return rows

    # Fallback for headerless two-column exports: treat col1 as song_title, col2 as artist_name.
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        plain_reader = csv.reader(f)
        for parts in plain_reader:
            if len(parts) < 2:
                continue
            song_title = clean_csv_value(parts[0])
            artist_name = clean_csv_value(parts[1])
            if not song_title or not artist_name:
                continue
            rows.append({"song_title": song_title, "artist_name": artist_name})

    if not rows:
        raise ValueError("CSV has no usable rows. Expected headered or 2-column data.")
    return rows


def dedupe_rows(rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
    seen = set()
    out: List[Dict[str, str]] = []
    for row in rows:
        key = (normalize_text(row.get("song_title", "")), normalize_text(row.get("artist_name", "")))
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def enrich_rows(
    rows: List[Dict[str, str]],
    include_lyrics_text: bool,
    *,
    offset: int,
    total_dedup: int,
    matched_so_far: int,
    skipped_so_far: int,
    live_progress: bool,
    deezer_only: bool,
) -> Tuple[List[Dict[str, Any]], RunStats]:
    stats = RunStats()
    limiter = RateLimiter(DEEZER_MAX_REQUESTS, DEEZER_WINDOW_SECONDS)
    genius_token = os.getenv("GENIUS_ACCESS_TOKEN", "")
    run_matched = 0
    run_skipped = 0

    output: List[Dict[str, Any]] = []
    chunk_total = len(rows)
    show_live = bool(live_progress and tqdm is not None)
    if show_live:
        print(
            f"[live] matched so far: {matched_so_far}/{total_dedup} | "
            f"skipped so far: {skipped_so_far}/{total_dedup}"
        )
    elif live_progress and tqdm is None:
        print("[live] tqdm not installed; falling back to plain progress output.")

    overall_bar = None
    if show_live:
        overall_bar = tqdm(
            total=chunk_total,
            desc="Chunk Progress",
            position=0,
            leave=True,
            unit="song",
        )

    with requests.Session() as session:
        for idx, row in enumerate(rows, start=1):
            stats.processed += 1
            song_title = row["song_title"].strip()
            artist_name = row["artist_name"].strip()
            current_global = offset + idx
            song_label = f"{current_global}/{total_dedup} {song_title} — {artist_name}"

            record: Dict[str, Any] = {
                "song_name": song_title,
                "artist_name": artist_name,
                "artist_photo_url": "",
                "album_art_url": "",
                "genres": [],
                "explicit_lyrics": None,
                "preview_url": "",
                "record_type": "",
                "release_date": "",
                "lyrics_url": "",
                "language": "unknown",
                "language_source": "unknown",
                "deezer_found": False,
                "genius_found": False,
            }
            if live_progress:
                print(f"[song] {song_label}")

            step_no = 0
            def song_bar(n: int, total: int = 5) -> str:
                pct = int((n / total) * 100)
                filled = int((n / total) * 20)
                return f"[{'#' * filled}{'-' * (20 - filled)}] {pct:>3}% ({n}/{total})"

            def render_song_progress(msg: str) -> None:
                if not live_progress:
                    return
                done_count = matched_so_far + skipped_so_far + (idx - 1)
                line = (
                    f"\r{song_label} | done {done_count}/{total_dedup} | "
                    f"{song_bar(step_no)} | {msg}"
                )
                # Padding clears leftovers from previous longer lines.
                print(line + " " * 8, end="", flush=True)

            def step(msg: str) -> None:
                nonlocal step_no
                step_no += 1
                render_song_progress(msg)

            step("Deezer track lookup")
            deezer_track, retries = deezer_track_lookup(session, limiter, song_title, artist_name)
            stats.retries += retries
            if deezer_track:
                stats.matched_deezer += 1
                record["deezer_found"] = True
                record["explicit_lyrics"] = bool(deezer_track.get("explicit_lyrics"))
                record["preview_url"] = deezer_track.get("preview") or ""

                artist = deezer_track.get("artist") or {}
                album = deezer_track.get("album") or {}
                record["artist_photo_url"] = choose_image_url(artist, "picture")
                record["album_art_url"] = choose_image_url(album, "cover")

                album_info, album_retries = deezer_album_lookup(session, limiter, album.get("id"))
                stats.retries += album_retries
                if album_info:
                    genres = (album_info.get("genres") or {}).get("data") or []
                    record["genres"] = [g.get("name") for g in genres if g.get("name")]
                    record["record_type"] = album_info.get("record_type") or ""
                    record["release_date"] = album_info.get("release_date") or ""
            else:
                stats.deezer_unmatched += 1

            lyrics_text = ""
            if deezer_only:
                step("Genius skipped (Deezer-only mode)")
            else:
                step("Genius lookup")
                genius_result, genius_retries = genius_search(session, song_title, artist_name, genius_token)
                stats.retries += genius_retries
                if genius_result:
                    stats.matched_genius += 1
                    record["genius_found"] = True
                    record["lyrics_url"] = genius_result.get("url") or ""
                    if include_lyrics_text and record["lyrics_url"]:
                        lyrics_text = fetch_lyrics_text(record["lyrics_url"])
                        if lyrics_text:
                            record["lyrics_text"] = lyrics_text
                else:
                    stats.genius_unmatched += 1

            step("Language detection")
            language, language_source = detect_language(lyrics_text, song_title, artist_name)
            record["language"] = language
            record["language_source"] = language_source
            step("Finalize record")
            step("Record complete")

            matched_this = bool(record["deezer_found"] or record["genius_found"])
            if matched_this:
                run_matched += 1
            else:
                run_skipped += 1

            output.append(record)
            step_count = step_no
            if live_progress:
                if step_count < 5:
                    step_count = 5
                    step_no = 5
                render_song_progress("Song complete")
                print("", flush=True)
            if overall_bar is not None:
                overall_bar.update(1)
                overall_bar.set_postfix_str(
                    (
                        f"current={current_global}/{total_dedup} "
                        f"matched={matched_so_far + run_matched}/{total_dedup} "
                        f"skipped={skipped_so_far + run_skipped}/{total_dedup}"
                    ),
                    refresh=False,
                )

            # Persistent line so user can scroll history of completed/failed songs.
            status_word = "completed" if matched_this else "not_fully_completed"
            print(
                f"[done] {current_global}/{total_dedup} | {song_title} | {artist_name} | "
                f"{status_word} | steps={step_count}/5 | "
                f"deezer={record['deezer_found']} genius={record['genius_found']}"
            )

    if overall_bar is not None:
        overall_bar.close()

    return output, stats


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return

    keys = list(rows[0].keys())
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        for row in rows:
            normalized = dict(row)
            if isinstance(normalized.get("genres"), list):
                normalized["genres"] = "|".join(str(x) for x in normalized["genres"])
            writer.writerow(normalized)


def write_json(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")


def write_txt(path: Path, rows: List[Dict[str, Any]]) -> None:
    lines: List[str] = []
    for idx, row in enumerate(rows, start=1):
        lines.append(f"[{idx}]")
        for key, value in row.items():
            if isinstance(value, list):
                value = ", ".join(str(v) for v in value)
            lines.append(f"{key}: {value}")
        lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def load_existing_rows(csv_path: Path) -> List[Dict[str, Any]]:
    if not csv_path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parsed = dict(row)
            genres = (parsed.get("genres") or "").strip()
            parsed["genres"] = [x for x in genres.split("|") if x] if genres else []
            explicit = parsed.get("explicit_lyrics")
            if explicit in ("True", "False"):
                parsed["explicit_lyrics"] = explicit == "True"
            rows.append(parsed)
    return rows


def merge_rows(existing: List[Dict[str, Any]], incoming: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    merged: List[Dict[str, Any]] = []
    seen = set()

    def key_for(row: Dict[str, Any]) -> Tuple[str, str]:
        return (
            normalize_text(str(row.get("song_name", ""))),
            normalize_text(str(row.get("artist_name", ""))),
        )

    for row in existing:
        k = key_for(row)
        if k in seen:
            continue
        seen.add(k)
        merged.append(row)

    for row in incoming:
        k = key_for(row)
        if k in seen:
            continue
        seen.add(k)
        merged.append(row)

    return merged


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Enrich song+artist pairs using Deezer and Genius")
    parser.add_argument(
        "--input",
        default="auto",
        help="Input CSV path. Default prefers no_dupes_input_songs.csv, then falls back to input_songs.csv.",
    )
    parser.add_argument("--output-dir", default="tools/song_data_enrichment/output", help="Output directory")
    parser.add_argument("--env-file", default=".env.local", help="Path to env file")
    parser.add_argument("--check-secrets", action="store_true", help="Validate required secrets and exit")
    parser.add_argument(
        "--include-lyrics-text",
        action="store_true",
        help="Also include extracted lyrics text when available",
    )
    parser.add_argument("--limit", type=int, default=0, help="Limit rows for smoke testing")
    parser.add_argument(
        "--offset",
        type=int,
        default=0,
        help="Skip the first N deduped rows before processing (0-based).",
    )
    parser.add_argument(
        "--merge-output",
        action="store_true",
        help="Merge with existing output CSV rows and dedupe by song_name+artist_name.",
    )
    parser.add_argument(
        "--live-progress",
        action="store_true",
        help="Show detailed per-song live progress (song/artist, steps, bars, and counts).",
    )
    parser.add_argument(
        "--deezer-only",
        action="store_true",
        help="Skip Genius requests and run Deezer-only enrichment.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    env_file = Path(args.env_file)
    load_env_file(env_file)

    ok, messages = check_secrets(require_genius=not args.deezer_only)
    for msg in messages:
        print(msg)
    if args.check_secrets:
        return 0 if ok else 2
    if not ok:
        return 2
    if requests is None:
        print("Missing dependency: requests. Install with:")
        print("python3 -m pip install -r tools/song_data_enrichment/requirements.txt")
        return 2

    input_path = resolve_input_path(args.input)
    if not input_path.exists():
        print(f"Input CSV not found: {input_path}")
        print("Create it from SSMS export and place it at the path above, or pass --input.")
        return 2

    try:
        rows = load_input_rows(input_path)
    except Exception as exc:
        print(f"Failed to parse input CSV: {exc}")
        return 2

    dedup_rows = dedupe_rows(rows)
    total_dedup = len(dedup_rows)
    if args.offset and args.offset > 0:
        rows = dedup_rows[args.offset :]
    else:
        rows = dedup_rows
    if args.limit and args.limit > 0:
        rows = rows[: args.limit]

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    csv_path = out_dir / "enriched_songs.csv"
    json_path = out_dir / "enriched_songs.json"
    txt_path = out_dir / "enriched_songs.txt"

    existing_rows: List[Dict[str, Any]] = []
    matched_so_far = 0
    skipped_so_far = 0
    if args.merge_output:
        existing_rows = load_existing_rows(csv_path)
        matched_so_far = sum(
            1
            for r in existing_rows
            if _as_bool(r.get("deezer_found")) or _as_bool(r.get("genius_found"))
        )
        skipped_so_far = sum(
            1
            for r in existing_rows
            if (not _as_bool(r.get("deezer_found"))) and (not _as_bool(r.get("genius_found")))
        )

    output_rows, stats = enrich_rows(
        rows,
        include_lyrics_text=args.include_lyrics_text,
        offset=args.offset,
        total_dedup=total_dedup,
        matched_so_far=matched_so_far,
        skipped_so_far=skipped_so_far,
        live_progress=args.live_progress,
        deezer_only=args.deezer_only,
    )

    final_rows = output_rows
    if args.merge_output:
        final_rows = merge_rows(existing_rows, output_rows)

    write_csv(csv_path, final_rows)
    write_json(json_path, final_rows)
    write_txt(txt_path, final_rows)

    summary = {
        "processed": stats.processed,
        "matched_deezer": stats.matched_deezer,
        "matched_genius": stats.matched_genius,
        "deezer_unmatched": stats.deezer_unmatched,
        "genius_unmatched": stats.genius_unmatched,
        "retries": stats.retries,
        "errors": stats.errors,
        "output_files": [str(csv_path), str(json_path), str(txt_path)],
        "written_rows": len(final_rows),
        "deezer_limit_policy": f"{DEEZER_MAX_REQUESTS} requests / {DEEZER_WINDOW_SECONDS} seconds",
    }
    print(json.dumps(summary, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
