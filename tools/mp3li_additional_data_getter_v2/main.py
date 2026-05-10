#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import subprocess
import sys
import threading
from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

from deezer_client import (
    DEEZER_MAX_REQUESTS,
    DEEZER_WINDOW_SECONDS,
    RateLimiter as DeezerLimiter,
    build_row_from_deezer,
    fetch_album,
    fetch_artist,
    fetch_artist_top,
    find_track_with_strategy,
)
from genius_client import (
    GENIUS_MAX_REQUESTS,
    GENIUS_WINDOW_SECONDS,
    GENIUS_WEB_MAX_REQUESTS,
    GENIUS_WEB_WINDOW_SECONDS,
    GeniusBackoffStop,
    RateLimiter as GeniusLimiter,
    build_genius_web_candidates,
    build_genius_web_row,
    fetch_genius_row,
    validate_genius_lyrics_url,
)
from state_store import (
    add_or_update_skipped,
    load_rows_by_key,
    load_state,
    now_iso,
    remove_from_skipped,
    save_rows,
    save_state,
)
from writers import write_outputs

BASE_DIR = Path(__file__).resolve().parent
STRICT_INPUT_PATH = BASE_DIR.parent / "song_data_enrichment" / "no_dupes_input_songs.csv"
CHUNK_SIZE = 100
GENIUS_WEB_WORKERS = 10
GENIUS_WEB_FLUSH_EVERY = 10
_GENIUS_WEB_THREAD_LOCAL = threading.local()
GENIUS_WEB_ALL_ATTEMPTS = (
    "slug_build_full",
    "slug_build_clean_title",
    "slug_build_clean_title_first_artist",
)
GENIUS_WEB_DETERMINISTIC_SKIP_REASONS = {
    "Genius URL returned HTTP 404",
    "Constructed Genius URL page text did not match song+artist",
    "Unable to construct Genius URL slug from song/artist text",
}


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


def check_secrets(source: str) -> Tuple[bool, List[str]]:
    messages: List[str] = []
    if source == "genius_api":
        if not os.getenv("GENIUS_ACCESS_TOKEN"):
            messages.append("Missing required secret: GENIUS_ACCESS_TOKEN")
            return False, messages
        messages.append("Genius token is present.")
    elif source == "genius_web":
        messages.append("Genius web scraping mode selected. No Genius API token required.")
    else:
        messages.append("Deezer mode selected. Optional Deezer credentials will be used if present.")

    optional = ["DEEZER_APP_ID", "DEEZER_APP_SECRET"]
    missing_optional = [k for k in optional if not os.getenv(k)]
    if missing_optional:
        messages.append("Optional Deezer credentials missing: " + ", ".join(missing_optional))
    else:
        messages.append("Optional Deezer credentials are present.")
    return True, messages


def load_input_rows(csv_path: Path) -> List[Dict[str, str]]:
    def clean(value: Any) -> str:
        text = str(value or "").strip()
        if text.upper() == "NULL":
            return ""
        return text

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        out = []
        for row in reader:
            song_title = clean(row.get("song_title"))
            artist_name = clean(row.get("artist_name"))
            if song_title and artist_name:
                out.append({"song_title": song_title, "artist_name": artist_name})
        if out:
            return out

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        plain = csv.reader(f)
        out = []
        for parts in plain:
            if len(parts) < 2:
                continue
            song_title = clean(parts[0])
            artist_name = clean(parts[1])
            if song_title and artist_name:
                out.append({"song_title": song_title, "artist_name": artist_name})
    return out


def resolve_input_path(requested_path: str) -> Path:
    strict_resolved = STRICT_INPUT_PATH.resolve()
    if requested_path == "auto":
        return strict_resolved

    requested_resolved = Path(requested_path).resolve()
    if requested_resolved != strict_resolved:
        raise ValueError(
            "mp3li_additional_data_getter_v2 is locked to tools/song_data_enrichment/no_dupes_input_songs.csv."
        )

    return strict_resolved


def ensure_dirs(output_dir: Path, state_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    state_dir.mkdir(parents=True, exist_ok=True)


def resolve_runtime_paths(source: str) -> Tuple[Path, Path, Path, Path, Path]:
    # Keep Deezer on the original paths to avoid interrupting active runs.
    if source == "deezer":
        output_dir = BASE_DIR / "output"
        state_dir = BASE_DIR / "state"
    elif source == "genius_api":
        output_dir = BASE_DIR / "output_genius_api"
        state_dir = BASE_DIR / "state_genius_api"
    else:
        output_dir = BASE_DIR / "output_genius_web"
        state_dir = BASE_DIR / "state_genius_web"

    state_path = state_dir / "run_state.json"
    rows_cache_path = state_dir / "rows_cache.json"
    live_pull_map_path = output_dir / "ui_live_pull_map.md"
    return output_dir, state_dir, state_path, rows_cache_path, live_pull_map_path


def prompt_source() -> str:
    print("Choose data source:")
    print("1) Deezer")
    print("2) Genius API")
    print("3) Genius Web Scraping")
    choice = input("Enter choice (1/2/3): ").strip()
    return {
        "1": "deezer",
        "2": "genius_api",
        "3": "genius_web",
    }.get(choice, "deezer")


def prompt_mode() -> str:
    print("Select run mode:")
    print("1) Start from Beginning")
    print("2) Resume at Next Song")
    print("3) Fill Missing Fields Only")
    print("4) Retry Skipped Songs Only")
    print("5) Smart Catch-Up (Genius Web Only)")
    choice = input("Enter choice (1/2/3/4/5): ").strip()
    return {
        "1": "begin",
        "2": "resume",
        "3": "fill_missing",
        "4": "retry_skipped",
        "5": "smart_catch_up",
    }.get(choice, "resume")


def build_skipped_row(song_name: str, artist_name: str, source: str, reason: str, attempt_trail: List[str]) -> Dict[str, Any]:
    return {
        "song_name": song_name,
        "artist_name": artist_name,
        "source": source,
        "skipped": True,
        "skip_reason": reason,
        "attempt_trail": attempt_trail,
        "updated_at": now_iso(),
    }


def row_missing_fields(row: Dict[str, Any]) -> bool:
    required_fields = [
        "track_id",
        "album_id",
        "genres",
        "preview_url",
        "album_object",
        "artist_object",
    ]
    for field in required_fields:
        value = row.get(field)
        if value in (None, ""):
            return True
        if isinstance(value, list) and not value:
            return True
    return False


def _progress_bar(percent: float, width: int = 24) -> str:
    pct = max(0.0, min(100.0, percent))
    filled = int((pct / 100.0) * width)
    return "[" + ("#" * filled) + ("-" * (width - filled)) + f"] {pct:6.2f}%"


def _clip_text(value: str, limit: int = 132) -> str:
    text = str(value or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def _idle_worker_line(slot_index: int) -> str:
    return f"[{slot_index + 1}] Idle"


def _worker_line(slot_index: int, song_label: str, action: str) -> str:
    return _clip_text(f"[{slot_index + 1}] {song_label}   /   {action}")


def render_live_section(
    completed_lines: List[str],
    chunk_processed: int,
    chunk_total: int,
    gotten_count: int,
    skipped_count: int,
    total_target: int,
    current_song: str,
    current_action: str,
    got_endpoints: int,
    endpoint_total: int,
    state_text: str,
    active_lines: Optional[List[str]] = None,
) -> None:
    os.system("clear")
    if completed_lines:
        print("\n".join(completed_lines))
    print("_" * 140)
    pct = 100.0 if chunk_total == 0 else (chunk_processed / chunk_total) * 100.0
    display_total = max(total_target, gotten_count + skipped_count)
    status_line = (
        f"Chunk Progress {_progress_bar(pct)}   /   "
        f"Getting {gotten_count}/{display_total}   /   "
        f"Skipped {skipped_count}/{display_total}   /   "
        f"Got {got_endpoints} out of {endpoint_total}   /   "
        f"{state_text}   /"
    )
    print(status_line)
    lines = list(active_lines or [])
    if not lines:
        lines = [_worker_line(0, current_song, current_action)]
    while len(lines) < GENIUS_WEB_WORKERS:
        lines.append(_idle_worker_line(len(lines)))
    for line in lines[:GENIUS_WEB_WORKERS]:
        print(line)


def compute_merged_counts(existing_by_key: Dict[Tuple[str, str], Dict[str, Any]]) -> Tuple[int, int]:
    gotten = 0
    skipped = 0
    for row in existing_by_key.values():
        if bool(row.get("skipped")):
            skipped += 1
        else:
            gotten += 1
    return gotten, skipped


def load_rows_from_output_json(json_path: Path) -> Dict[Tuple[str, str], Dict[str, Any]]:
    if not json_path.exists():
        return {}
    try:
        raw = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception:
        return {}

    if not isinstance(raw, list):
        return {}

    rows: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for item in raw:
        row = item.get("entry") if isinstance(item, dict) and isinstance(item.get("entry"), dict) else item
        if not isinstance(row, dict):
            continue
        song = str(row.get("song_name", "")).strip()
        artist = str(row.get("artist_name", "")).strip()
        if not song or not artist:
            continue
        rows[(song.lower(), artist.lower())] = row
    return rows


def load_rows_from_output_csv(csv_path: Path) -> Dict[Tuple[str, str], Dict[str, Any]]:
    if not csv_path.exists():
        return {}
    rows: Dict[Tuple[str, str], Dict[str, Any]] = {}
    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                song = str(row.get("song_name", "")).strip()
                artist = str(row.get("artist_name", "")).strip()
                if not song or not artist:
                    continue
                rows[(song.lower(), artist.lower())] = dict(row)
    except Exception:
        return {}
    return rows


def load_existing_runtime_rows(rows_cache_path: Path, output_dir: Path) -> Tuple[Dict[Tuple[str, str], Dict[str, Any]], Optional[str]]:
    rows = load_rows_by_key(rows_cache_path)
    if rows:
        return rows, "rows_cache.json"

    json_rows = load_rows_from_output_json(output_dir / "enriched_songs.json")
    if json_rows:
        return json_rows, "enriched_songs.json"

    csv_rows = load_rows_from_output_csv(output_dir / "enriched_songs.csv")
    if csv_rows:
        return csv_rows, "enriched_songs.csv"

    return {}, None


def hydrate_skipped_from_existing_rows(state: Dict[str, Any], existing_by_key: Dict[Tuple[str, str], Dict[str, Any]]) -> None:
    if state.get("skipped_songs"):
        return

    for row in existing_by_key.values():
        skipped_value = row.get("skipped")
        skipped = skipped_value is True or str(skipped_value).strip().lower() == "true"
        if not skipped:
            continue
        song_name = str(row.get("song_name", "")).strip()
        artist_name = str(row.get("artist_name", "")).strip()
        if not song_name or not artist_name:
            continue
        add_or_update_skipped(
            state,
            song_name,
            artist_name,
            str(row.get("skip_reason", "")).strip() or "Recovered from existing output",
            ["recovered_from_output"],
        )


def normalize_attempt_trail(value: Any) -> List[str]:
    if isinstance(value, list):
        raw = value
    elif value in (None, ""):
        raw = []
    else:
        raw = [str(value)]

    normalized: List[str] = []
    seen: set[str] = set()
    for item in raw:
        label = str(item or "").strip()
        if not label:
            continue
        if label == "slug_build":
            label = "slug_build_full"
        if label not in seen:
            seen.add(label)
            normalized.append(label)
    return normalized


def genius_web_candidate_attempt_labels(song_name: str, artist_name: str) -> List[str]:
    labels: List[str] = []
    for candidate in build_genius_web_candidates(song_name, artist_name):
        label = str(candidate.get("attempt_label", "")).strip()
        if label:
            labels.append(label)
    return labels


def row_has_genius_lyrics_url(row: Optional[Dict[str, Any]]) -> bool:
    if not row:
        return False
    if bool(row.get("skipped")):
        return False
    return bool(str(row.get("lyrics_url", "")).strip())


def get_skipped_lookup(state: Dict[str, Any]) -> Dict[Tuple[str, str], Dict[str, Any]]:
    out: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for item in state.get("skipped_songs", []):
        song = str(item.get("song_name", "")).strip().lower()
        artist = str(item.get("artist_name", "")).strip().lower()
        if song and artist:
            out[(song, artist)] = item
    return out


def classify_genius_web_smart_row(
    song_name: str,
    artist_name: str,
    existing_row: Optional[Dict[str, Any]],
    skipped_item: Optional[Dict[str, Any]],
) -> Tuple[str, List[str]]:
    if row_has_genius_lyrics_url(existing_row):
        return "already_has_url", []

    candidate_labels = genius_web_candidate_attempt_labels(song_name, artist_name)
    if not candidate_labels:
        return "fully_exhausted", []

    source_row = existing_row if existing_row else skipped_item
    if existing_row and skipped_item:
        existing_attempts = normalize_attempt_trail(existing_row.get("attempt_trail"))
        skipped_attempts = normalize_attempt_trail(skipped_item.get("attempt_trail"))
        if len(skipped_attempts) > len(existing_attempts):
            source_row = skipped_item
    attempted_labels = normalize_attempt_trail((source_row or {}).get("attempt_trail"))
    remaining_labels = [label for label in candidate_labels if label not in attempted_labels]
    skip_reason = str((source_row or {}).get("skip_reason", "")).strip()

    if not attempted_labels:
        return "full_retry", []

    if skip_reason.startswith("Error:") or skip_reason in {
        "Genius URL returned HTTP 502",
        "Genius returned rate limit while validating URL",
    }:
        return "full_retry", []

    if remaining_labels:
        return "remaining_only", attempted_labels

    if skip_reason in GENIUS_WEB_DETERMINISTIC_SKIP_REASONS:
        return "fully_exhausted", attempted_labels

    return "fully_exhausted", attempted_labels


def _get_genius_web_session() -> requests.Session:
    session = getattr(_GENIUS_WEB_THREAD_LOCAL, "session", None)
    if session is None:
        session = requests.Session()
        _GENIUS_WEB_THREAD_LOCAL.session = session
    return session


def run_genius_web_lookup(
    limiter: GeniusLimiter,
    song_name: str,
    artist_name: str,
    attempted_labels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    candidates = build_genius_web_candidates(song_name, artist_name)
    attempted_labels = normalize_attempt_trail(attempted_labels)
    attempted_label_set = set(attempted_labels)
    if attempted_label_set:
        candidates = [
            candidate
            for candidate in candidates
            if str(candidate.get("attempt_label", "")).strip() not in attempted_label_set
        ]
    if not candidates:
        return {
            "row": {
                **build_genius_web_row(song_name, artist_name),
                "attempt_trail": list(attempted_labels),
                "skip_reason": "No remaining Genius URL fallback attempts",
                "skipped": True,
                "lyrics_url": "",
                "updated_at": now_iso(),
            },
            "got_endpoints": 0,
        }

    session = _get_genius_web_session()
    attempt_trail: List[str] = list(attempted_labels)
    last_deterministic_reason = "Genius URL returned HTTP 404"

    for idx, candidate in enumerate(candidates):
        attempt_label = str(candidate.get("attempt_label", f"slug_build_{idx + 1}"))
        attempt_trail.append(attempt_label)
        ok, reason = validate_genius_lyrics_url(
            session,
            limiter,
            str(candidate.get("lyrics_url", "")),
            song_name,
            artist_name,
        )
        if ok:
            row = dict(candidate)
            row.update(
                {
                    "attempt_trail": list(attempt_trail),
                    "skipped": False,
                    "skip_reason": "",
                    "updated_at": now_iso(),
                }
            )
            return {
                "row": row,
                "got_endpoints": 2,
            }
        last_deterministic_reason = reason
        if reason not in {
            "Genius URL returned HTTP 404",
            "Constructed Genius URL page text did not match song+artist",
        }:
            row = dict(candidate)
            row.update(
                {
                    "attempt_trail": list(attempt_trail),
                    "skipped": True,
                    "skip_reason": reason,
                    "lyrics_url": "",
                    "updated_at": now_iso(),
                }
            )
            return {
                "row": row,
                "got_endpoints": 1,
            }

    row = dict(candidates[-1])
    row.update(
        {
            "attempt_trail": list(attempt_trail),
            "skipped": True,
            "skip_reason": last_deterministic_reason,
            "lyrics_url": "",
            "updated_at": now_iso(),
        }
    )
    return {
        "row": row,
        "got_endpoints": 1,
    }


def get_processed_keys(existing_by_key: Dict[Tuple[str, str], Dict[str, Any]], state: Dict[str, Any]) -> set[Tuple[str, str]]:
    processed = set(existing_by_key.keys())
    for item in state.get("skipped_songs", []):
        song = str(item.get("song_name", "")).strip().lower()
        artist = str(item.get("artist_name", "")).strip().lower()
        if song and artist:
            processed.add((song, artist))
    return processed


def resolve_resume_index(
    input_rows: List[Dict[str, str]],
    state: Dict[str, Any],
    existing_by_key: Dict[Tuple[str, str], Dict[str, Any]],
) -> int:
    state_next_index = max(int(state.get("next_index", 0) or 0), 0)
    processed_keys = get_processed_keys(existing_by_key, state)

    if state_next_index < len(input_rows):
        candidate = input_rows[state_next_index]
        candidate_key = (
            candidate.get("song_title", "").strip().lower(),
            candidate.get("artist_name", "").strip().lower(),
        )
        if candidate_key not in processed_keys:
            return state_next_index

    for index, row in enumerate(input_rows):
        key = (
            row.get("song_title", "").strip().lower(),
            row.get("artist_name", "").strip().lower(),
        )
        if key not in processed_keys:
            return index

    return len(input_rows)


def trigger_live_pull_map_update_async(rows_cache_path: Path, live_pull_map_path: Path) -> None:
    script = BASE_DIR / "build_ui_live_pull_map.py"
    if not script.exists():
        return
    cmd = [
        sys.executable,
        str(script),
        "--rows-cache",
        str(rows_cache_path),
        "--out",
        str(live_pull_map_path),
    ]
    try:
        with open(os.devnull, "w", encoding="utf-8") as devnull:
            subprocess.Popen(
                cmd,
                cwd=str(BASE_DIR),
                stdout=devnull,
                stderr=devnull,
                start_new_session=True,
            )
    except Exception:
        # Never block main enrichment flow on documentation generation.
        pass


def main() -> int:
    parser = argparse.ArgumentParser(description="mp3li's Additional Data Getter v2")
    parser.add_argument(
        "--input",
        default="auto",
        help="Input is locked to tools/song_data_enrichment/no_dupes_input_songs.csv.",
    )
    parser.add_argument("--source", choices=["deezer", "genius_api", "genius_web"], help="Optional source override")
    parser.add_argument(
        "--mode",
        choices=["begin", "resume", "fill_missing", "retry_skipped", "smart_catch_up"],
        help="Optional mode override",
    )
    parser.add_argument("--limit", type=int, default=0, help="Optional processing limit for test runs")
    args = parser.parse_args()

    repo_root = BASE_DIR.parent.parent
    load_env_file(repo_root / ".env.local")

    print()
    print("Welcome to mp3li's Additional Data Getter v2.")
    print()

    source = args.source or prompt_source()
    mode = args.mode or prompt_mode()
    if mode == "smart_catch_up" and source != "genius_web":
        print("Smart Catch-Up is only available for Genius Web Scraping.")
        return 1
    output_dir, state_dir, state_path, rows_cache_path, live_pull_map_path = resolve_runtime_paths(source)
    ensure_dirs(output_dir, state_dir)

    ok, messages = check_secrets(source)
    for m in messages:
        print(f"[auth] {m}")
    if not ok:
        return 1

    try:
        input_path = resolve_input_path(args.input)
    except ValueError as exc:
        print(exc)
        return 1
    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        return 1

    input_rows = load_input_rows(input_path)
    if not input_rows:
        print("No usable song rows found in input file.")
        return 1

    state = load_state(state_path)
    existing_by_key, resume_source = load_existing_runtime_rows(rows_cache_path, output_dir)
    hydrate_skipped_from_existing_rows(state, existing_by_key)
    output_rows = list(existing_by_key.values())

    if mode == "begin":
        start_index = 0
    elif mode == "resume":
        start_index = resolve_resume_index(input_rows, state, existing_by_key)
    else:
        start_index = 0

    state["input_path"] = str(input_path)
    state["input_total_rows"] = len(input_rows)
    if mode == "resume":
        state["next_index"] = start_index

    print(f"[input] Using input file: {input_path}")
    print(f"[input] Usable rows: {len(input_rows)}")
    if resume_source:
        print(f"[resume] Existing runtime data source: {resume_source}")
    if mode == "resume":
        print(f"[resume] Effective next index: {start_index}")

    skipped_lookup = get_skipped_lookup(state)

    if mode == "retry_skipped":
        targets = [
            {"song_title": item.get("song_name", ""), "artist_name": item.get("artist_name", "")}
            for item in state.get("skipped_songs", [])
            if item.get("song_name") and item.get("artist_name")
        ]
    elif mode == "smart_catch_up":
        resume_index = resolve_resume_index(input_rows, state, existing_by_key)
        targets = []
        for input_index, row in enumerate(input_rows):
            song_name = row["song_title"].strip()
            artist_name = row["artist_name"].strip()
            key = (song_name.lower(), artist_name.lower())
            existing_row = existing_by_key.get(key)
            skipped_item = skipped_lookup.get(key)
            status, attempted_labels = classify_genius_web_smart_row(song_name, artist_name, existing_row, skipped_item)
            if status == "already_has_url":
                continue
            if status == "fully_exhausted":
                continue
            if status == "full_retry" and not existing_row and not skipped_item and input_index < resume_index:
                # Preserve the historical resume point for normal untouched rows.
                continue

            target_row = {
                "song_title": song_name,
                "artist_name": artist_name,
                "__input_index": input_index,
            }
            if attempted_labels:
                target_row["__attempted_labels"] = list(attempted_labels)
            targets.append(target_row)
    else:
        targets = input_rows[start_index:]

    if args.limit > 0:
        targets = targets[: args.limit]

    deezer_limiter = DeezerLimiter(DEEZER_MAX_REQUESTS, DEEZER_WINDOW_SECONDS)
    genius_limiter = GeniusLimiter(GENIUS_MAX_REQUESTS, GENIUS_WINDOW_SECONDS)
    genius_web_limiter = GeniusLimiter(GENIUS_WEB_MAX_REQUESTS, GENIUS_WEB_WINDOW_SECONDS)
    genius_token = os.getenv("GENIUS_ACCESS_TOKEN", "")

    total_target = len(targets)
    gotten_count, skipped_count = compute_merged_counts(existing_by_key)

    with requests.Session() as session:
        global_idx = 0
        while global_idx < len(targets):
            chunk = targets[global_idx : global_idx + CHUNK_SIZE]
            chunk_completed_lines: List[str] = []
            chunk_processed = 0
            chunk_total = len(chunk)
            active_lines = [_idle_worker_line(slot) for slot in range(GENIUS_WEB_WORKERS)]
            chunk_active_lines = active_lines if source == "genius_web" else None

            render_live_section(
                chunk_completed_lines,
                chunk_processed,
                chunk_total,
                gotten_count,
                skipped_count,
                total_target,
                "Waiting...",
                "Starting chunk",
                0,
                4 if source == "deezer" else (2 if source == "genius_web" else 1),
                "In Progress",
                active_lines=chunk_active_lines,
            )

            if source == "genius_web":
                endpoint_total = 2
                skipped_keys = {
                    (s.get("song_name", "").lower(), s.get("artist_name", "").lower())
                    for s in state.get("skipped_songs", [])
                }
                completed_local_indices: set[int] = set()
                contiguous_local_done = 0
                queued_rows: List[Tuple[int, Dict[str, str], str, Tuple[str, str], int, List[str]]] = []
                pending_genius_web_flush = 0

                def update_resume_cursor() -> None:
                    nonlocal contiguous_local_done
                    while contiguous_local_done in completed_local_indices:
                        contiguous_local_done += 1
                    state["last_completed_index"] = start_index + global_idx + contiguous_local_done - 1
                    state["next_index"] = start_index + global_idx + contiguous_local_done
                    state["source"] = source
                    state["mode"] = mode

                def flush_genius_web_writes(force: bool = False) -> bool:
                    nonlocal pending_genius_web_flush, output_rows
                    if not force and pending_genius_web_flush < GENIUS_WEB_FLUSH_EVERY:
                        return False
                    output_rows = list(existing_by_key.values())
                    save_state(state_path, state)
                    save_rows(rows_cache_path, output_rows)
                    write_outputs(output_dir, output_rows)
                    pending_genius_web_flush = 0
                    return True

                for chunk_idx, row in enumerate(chunk, start=0):
                    song_name = row["song_title"].strip()
                    artist_name = row["artist_name"].strip()
                    key = (song_name.lower(), artist_name.lower())
                    current_song_label = f"{song_name} by {artist_name}"
                    existing = existing_by_key.get(key)
                    input_index = int(row.get("__input_index", global_idx + chunk_idx))

                    if mode == "fill_missing" and key in skipped_keys:
                        chunk_processed += 1
                        chunk_completed_lines.append(f"[SKIPPED LIST] {current_song_label}")
                        completed_local_indices.add(chunk_idx)
                        update_resume_cursor()
                        pending_genius_web_flush += 1
                        flushed = flush_genius_web_writes()
                        gotten_count, skipped_count = compute_merged_counts(existing_by_key)
                        render_live_section(
                            chunk_completed_lines,
                            chunk_processed,
                            chunk_total,
                            gotten_count,
                            skipped_count,
                            total_target,
                            current_song_label,
                            "Skipping known skipped song",
                            0,
                            endpoint_total,
                            "Done" if flushed else "Buffered",
                            active_lines=active_lines,
                        )
                        continue

                    if mode == "fill_missing" and existing and not row_missing_fields(existing):
                        chunk_processed += 1
                        chunk_completed_lines.append(f"[ALREADY COMPLETE] {current_song_label}")
                        completed_local_indices.add(chunk_idx)
                        update_resume_cursor()
                        pending_genius_web_flush += 1
                        flushed = flush_genius_web_writes()
                        gotten_count, skipped_count = compute_merged_counts(existing_by_key)
                        render_live_section(
                            chunk_completed_lines,
                            chunk_processed,
                            chunk_total,
                            gotten_count,
                            skipped_count,
                            total_target,
                            current_song_label,
                            "No missing fields",
                            0,
                            endpoint_total,
                            "Done" if flushed else "Buffered",
                            active_lines=active_lines,
                        )
                        continue

                    queued_rows.append(
                        (
                            chunk_idx,
                            row,
                            current_song_label,
                            key,
                            input_index,
                            normalize_attempt_trail(row.get("__attempted_labels")),
                        )
                    )

                future_to_meta: Dict[Future, Dict[str, Any]] = {}
                queued_cursor = 0
                executor = ThreadPoolExecutor(max_workers=GENIUS_WEB_WORKERS)

                def submit_next(slot_index: int) -> bool:
                    nonlocal queued_cursor
                    if queued_cursor >= len(queued_rows):
                        active_lines[slot_index] = _idle_worker_line(slot_index)
                        return False

                    chunk_idx, row, current_song_label, key, input_index, attempted_labels = queued_rows[queued_cursor]
                    queued_cursor += 1
                    song_name = row["song_title"].strip()
                    artist_name = row["artist_name"].strip()
                    active_lines[slot_index] = _worker_line(slot_index, current_song_label, "Building + validating Genius URL")
                    future = executor.submit(run_genius_web_lookup, genius_web_limiter, song_name, artist_name, attempted_labels)
                    future_to_meta[future] = {
                        "slot_index": slot_index,
                        "chunk_idx": chunk_idx,
                        "input_index": input_index,
                        "song_name": song_name,
                        "artist_name": artist_name,
                        "song_label": current_song_label,
                        "key": key,
                    }
                    return True

                try:
                    for slot_index in range(GENIUS_WEB_WORKERS):
                        submit_next(slot_index)

                    if future_to_meta:
                        render_live_section(
                            chunk_completed_lines,
                            chunk_processed,
                            chunk_total,
                            gotten_count,
                            skipped_count,
                            total_target,
                            "3 Genius workers",
                            "Running Genius Web lookups",
                            0,
                            endpoint_total,
                            "In Progress",
                            active_lines=active_lines,
                        )

                    while future_to_meta:
                        done, _ = wait(list(future_to_meta.keys()), return_when=FIRST_COMPLETED)
                        for future in done:
                            meta = future_to_meta.pop(future)
                            slot_index = meta["slot_index"]
                            input_index = int(meta["input_index"])
                            song_name = meta["song_name"]
                            artist_name = meta["artist_name"]
                            current_song_label = meta["song_label"]
                            key = meta["key"]
                            got_endpoints = 0

                            try:
                                result = future.result()
                                g_row = result["row"]
                                got_endpoints = int(result.get("got_endpoints", 0) or 0)
                                if g_row.get("skipped"):
                                    add_or_update_skipped(
                                        state,
                                        song_name,
                                        artist_name,
                                        g_row.get("skip_reason", "Unable to build Genius URL"),
                                        g_row.get("attempt_trail", ["slug_build"]),
                                    )
                                    chunk_completed_lines.append(
                                        f"[SKIPPED] {current_song_label} | {g_row.get('skip_reason', 'Unable to build Genius URL')}"
                                    )
                                else:
                                    remove_from_skipped(state, song_name, artist_name)
                                    chunk_completed_lines.append(f"[DONE] {current_song_label}")

                                existing = existing_by_key.get(key, {"song_name": song_name, "artist_name": artist_name})
                                existing.update(g_row)
                                existing_by_key[key] = existing
                            except GeniusBackoffStop as stop:
                                active_lines[slot_index] = _worker_line(slot_index, current_song_label, "Genius backoff warning")
                                render_live_section(
                                    chunk_completed_lines,
                                    chunk_processed,
                                    chunk_total,
                                    gotten_count,
                                    skipped_count,
                                    total_target,
                                    current_song_label,
                                    "Genius backoff warning",
                                    got_endpoints,
                                    endpoint_total,
                                    "Done",
                                    active_lines=active_lines,
                                )
                                print("\nGenius asked us to back off, so the program is stopping now.")
                                print(f"Warning text: {stop.message}")
                                print(f"Approximate retry time: {stop.approx_retry_at}")
                                if mode == "smart_catch_up":
                                    state["last_completed_index"] = input_index - 1
                                    state["next_index"] = input_index
                                else:
                                    state["last_completed_index"] = start_index + global_idx + contiguous_local_done - 1
                                    state["next_index"] = start_index + global_idx + contiguous_local_done
                                state["source"] = source
                                state["mode"] = mode
                                flush_genius_web_writes(force=True)
                                return 2
                            except Exception as exc:
                                skipped_row = build_skipped_row(song_name, artist_name, source, f"Error: {exc}", ["error"])
                                existing_by_key[key] = skipped_row
                                add_or_update_skipped(state, song_name, artist_name, f"Error: {exc}", ["error"])
                                chunk_completed_lines.append(f"[ERROR->SKIPPED] {current_song_label} | {exc}")

                            active_lines[slot_index] = _idle_worker_line(slot_index)
                            chunk_processed += 1
                            completed_local_indices.add(meta["chunk_idx"])
                            if mode == "smart_catch_up":
                                state["last_completed_index"] = input_index
                                state["next_index"] = input_index + 1
                                state["source"] = source
                                state["mode"] = mode
                            else:
                                update_resume_cursor()
                            pending_genius_web_flush += 1
                            flushed = flush_genius_web_writes()
                            gotten_count, skipped_count = compute_merged_counts(existing_by_key)
                            submit_next(slot_index)
                            render_live_section(
                                chunk_completed_lines,
                                chunk_processed,
                                chunk_total,
                                gotten_count,
                                skipped_count,
                                total_target,
                                current_song_label,
                                "Writing state/output cache" if flushed else "Buffered for batch write",
                                got_endpoints,
                                endpoint_total,
                                "Done" if flushed else "Buffered",
                                active_lines=chunk_active_lines,
                            )
                finally:
                    executor.shutdown(wait=True)
                    if pending_genius_web_flush > 0:
                        flush_genius_web_writes(force=True)
            else:
                for chunk_idx, row in enumerate(chunk, start=0):
                    idx = global_idx + chunk_idx
                    endpoint_total = 4 if source == "deezer" else 1
                    got_endpoints = 0
                    song_name = row["song_title"].strip()
                    artist_name = row["artist_name"].strip()
                    key = (song_name.lower(), artist_name.lower())
                    current_song_label = f"{song_name} by {artist_name}"

                    existing = existing_by_key.get(key)
                    if mode == "fill_missing":
                        skipped_keys = {(s.get("song_name", "").lower(), s.get("artist_name", "").lower()) for s in state.get("skipped_songs", [])}
                        if key in skipped_keys:
                            chunk_processed += 1
                            chunk_completed_lines.append(f"[SKIPPED LIST] {current_song_label}")
                            gotten_count, skipped_count = compute_merged_counts(existing_by_key)
                            render_live_section(
                                chunk_completed_lines,
                                chunk_processed,
                                chunk_total,
                                gotten_count,
                                skipped_count,
                                total_target,
                                current_song_label,
                                "Skipping known skipped song",
                                got_endpoints,
                                endpoint_total,
                                "Done",
                                active_lines=chunk_active_lines,
                            )
                            continue
                        if existing and not row_missing_fields(existing):
                            chunk_processed += 1
                            chunk_completed_lines.append(f"[ALREADY COMPLETE] {current_song_label}")
                            gotten_count, skipped_count = compute_merged_counts(existing_by_key)
                            render_live_section(
                                chunk_completed_lines,
                                chunk_processed,
                                chunk_total,
                                gotten_count,
                                skipped_count,
                            total_target,
                            current_song_label,
                            "No missing fields",
                            got_endpoints,
                            endpoint_total,
                            "Done",
                            active_lines=chunk_active_lines,
                        )
                        continue

                    try:
                        if source == "deezer":
                            render_live_section(
                                chunk_completed_lines,
                                chunk_processed,
                                chunk_total,
                                gotten_count,
                                skipped_count,
                                total_target,
                                current_song_label,
                                "Running Deezer lookup",
                                got_endpoints,
                                endpoint_total,
                                "In Progress",
                                active_lines=chunk_active_lines,
                            )
                            search_mode = "retry_skipped" if mode == "retry_skipped" else "begin"
                            track_hit, attempts, strategy = find_track_with_strategy(session, deezer_limiter, song_name, artist_name, mode=search_mode)
                            got_endpoints = 1 if track_hit else 0
                            if not track_hit:
                                skipped_row = build_skipped_row(song_name, artist_name, source, "No Deezer ID found", attempts)
                                existing_by_key[key] = skipped_row
                                add_or_update_skipped(state, song_name, artist_name, "No Deezer ID found", attempts)
                                chunk_completed_lines.append(f"[SKIPPED] {current_song_label} | No Deezer ID found")
                            else:
                                album_id = int((track_hit.get("album") or {}).get("id")) if (track_hit.get("album") or {}).get("id") else None
                                artist_id = int((track_hit.get("artist") or {}).get("id")) if (track_hit.get("artist") or {}).get("id") else None

                                track = track_hit
                                album = fetch_album(session, deezer_limiter, album_id) if album_id else None
                                if album:
                                    got_endpoints += 1
                                artist = fetch_artist(session, deezer_limiter, artist_id) if artist_id else None
                                if artist:
                                    got_endpoints += 1
                                artist_top = fetch_artist_top(session, deezer_limiter, artist_id) if artist_id else None
                                if artist_top:
                                    got_endpoints += 1

                                row_data = build_row_from_deezer(
                                    song_name,
                                    artist_name,
                                    strategy,
                                    attempts,
                                    track,
                                    album,
                                    artist,
                                    artist_top,
                                )
                                existing_by_key[key] = row_data
                                remove_from_skipped(state, song_name, artist_name)
                                chunk_completed_lines.append(f"[DONE] {current_song_label}")
                        else:
                            render_live_section(
                                chunk_completed_lines,
                                chunk_processed,
                                chunk_total,
                                gotten_count,
                                skipped_count,
                                total_target,
                                current_song_label,
                                "Running Genius search",
                                got_endpoints,
                                endpoint_total,
                                "In Progress",
                                active_lines=chunk_active_lines,
                            )
                            g_row = fetch_genius_row(session, genius_limiter, genius_token, song_name, artist_name)
                            g_row.setdefault("attempt_trail", ["exact", "simplified"])
                            got_endpoints = 1 if not g_row.get("skipped") else 0
                            if g_row.get("skipped"):
                                add_or_update_skipped(
                                    state,
                                    song_name,
                                    artist_name,
                                    g_row.get("skip_reason", "No Genius match found"),
                                    g_row.get("attempt_trail", ["exact", "simplified"]),
                                )
                                chunk_completed_lines.append(f"[SKIPPED] {current_song_label} | {g_row.get('skip_reason', 'No Genius match found')}")
                            else:
                                remove_from_skipped(state, song_name, artist_name)
                                chunk_completed_lines.append(f"[DONE] {current_song_label}")
                            existing = existing_by_key.get(key, {"song_name": song_name, "artist_name": artist_name})
                            existing.update(g_row)
                            existing_by_key[key] = existing
                    except GeniusBackoffStop as stop:
                        render_live_section(
                            chunk_completed_lines,
                            chunk_processed,
                            chunk_total,
                            gotten_count,
                            skipped_count,
                            total_target,
                            current_song_label,
                            "Genius backoff warning",
                            got_endpoints,
                            endpoint_total,
                            "Done",
                            active_lines=chunk_active_lines,
                        )
                        print("\nGenius asked us to back off, so the program is stopping now.")
                        print(f"Warning text: {stop.message}")
                        print(f"Approximate retry time: {stop.approx_retry_at}")
                        state["last_completed_index"] = start_index + idx - 1
                        state["next_index"] = start_index + idx
                        state["source"] = source
                        state["mode"] = mode
                        save_state(state_path, state)
                        save_rows(rows_cache_path, list(existing_by_key.values()))
                        write_outputs(output_dir, list(existing_by_key.values()))
                        return 2
                    except Exception as exc:
                        skipped_row = build_skipped_row(song_name, artist_name, source, f"Error: {exc}", ["error"])
                        existing_by_key[key] = skipped_row
                        add_or_update_skipped(state, song_name, artist_name, f"Error: {exc}", ["error"])
                        chunk_completed_lines.append(f"[ERROR->SKIPPED] {current_song_label} | {exc}")

                    state["last_completed_index"] = start_index + idx
                    state["next_index"] = start_index + idx + 1
                    state["source"] = source
                    state["mode"] = mode
                    save_state(state_path, state)
                    chunk_processed += 1
                    gotten_count, skipped_count = compute_merged_counts(existing_by_key)
                    render_live_section(
                        chunk_completed_lines,
                        chunk_processed,
                        chunk_total,
                        gotten_count,
                        skipped_count,
                        total_target,
                        current_song_label,
                        "Writing state/output cache",
                        got_endpoints,
                        endpoint_total,
                        "Done",
                        active_lines=chunk_active_lines,
                    )
                    output_rows = list(existing_by_key.values())
                    save_rows(rows_cache_path, output_rows)
                    write_outputs(output_dir, output_rows)

            global_idx += chunk_total
            gotten_count, skipped_count = compute_merged_counts(existing_by_key)
            trigger_live_pull_map_update_async(rows_cache_path, live_pull_map_path)
            render_live_section(
                chunk_completed_lines,
                chunk_processed,
                chunk_total,
                gotten_count,
                skipped_count,
                total_target,
                "Chunk complete",
                "Chunk finalized",
                0,
                4 if source == "deezer" else (2 if source == "genius_web" else 1),
                "Done",
                active_lines=chunk_active_lines,
            )

    output_rows = list(existing_by_key.values())
    save_rows(rows_cache_path, output_rows)
    write_outputs(output_dir, output_rows)
    trigger_live_pull_map_update_async(rows_cache_path, live_pull_map_path)
    save_state(state_path, state)

    print(f"Run complete. Wrote {len(output_rows)} rows to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
