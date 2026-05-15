from __future__ import annotations

import csv
import html
import json
import os
import re
from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

from genius_client import _browser_headers
from language_writers import normalize_language_rows, write_language_outputs
from state_store import (
    add_or_update_skipped,
    default_state,
    load_rows_by_key,
    load_state,
    now_iso,
    remove_from_skipped,
    save_rows,
    save_state,
)

try:
    from bs4 import BeautifulSoup  # type: ignore
except Exception:  # pragma: no cover
    BeautifulSoup = None

try:
    from lingua import LanguageDetectorBuilder  # type: ignore
except Exception:  # pragma: no cover
    LanguageDetectorBuilder = None

BASE_DIR = Path(__file__).resolve().parent
LANGUAGE_SOURCE = "genius_web_language"
LANGUAGE_CHUNK_SIZE = 20
LANGUAGE_WORKERS = 10
FAILURE_LOG_NAME = "failures.jsonl"
SOURCE_OUTPUT_NAME = "enriched_songs.csv"

_DETECTOR = None
INSTRUMENTAL_LANGUAGE_VALUE = "This song is an instrumental"
NO_USABLE_LYRICS_REASON = "No usable lyrics on page"
NOT_YET_TRANSCRIBED_REASON = "Lyrics for this song have not been transcribed on Genius yet"
UNCLASSIFIABLE_LANGUAGE_REASON = "Lyrics text was not classifiable as a real language"


def resolve_language_runtime_paths() -> Tuple[Path, Path, Path, Path, Path]:
    output_dir = BASE_DIR / "output_genius_web"
    state_dir = BASE_DIR / "state_genius_web_language"
    state_path = state_dir / "run_state.json"
    rows_cache_path = state_dir / "rows_cache.json"
    failure_log_path = state_dir / FAILURE_LOG_NAME
    return output_dir, state_dir, state_path, rows_cache_path, failure_log_path


def ensure_language_dirs(output_dir: Path, state_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    state_dir.mkdir(parents=True, exist_ok=True)


def prompt_language_mode() -> str:
    print("Select run mode:")
    print("1) Start from Beginning")
    print("2) Resume at Next Song")
    print("3) Retry Failed Songs Only")
    choice = input("Enter choice (1/2/3): ").strip()
    return {
        "1": "begin",
        "2": "resume",
        "3": "retry_failed",
    }.get(choice, "resume")


def _language_progress_bar(percent: float, width: int = 24) -> str:
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


def render_language_live_section(
    completed_lines: List[str],
    chunk_processed: int,
    chunk_total: int,
    completed_count: int,
    failed_count: int,
    total_target: int,
    current_song: str,
    current_action: str,
    state_text: str,
    active_lines: Optional[List[str]] = None,
) -> None:
    os.system("clear")
    if completed_lines:
        print("\n".join(completed_lines))
    print("_" * 140)
    pct = 100.0 if chunk_total == 0 else (chunk_processed / chunk_total) * 100.0
    display_total = max(total_target, completed_count + failed_count)
    status_line = (
        f"Chunk Progress {_language_progress_bar(pct)}   /   "
        f"Detected {completed_count}/{display_total}   /   "
        f"Failed {failed_count}/{display_total}   /   "
        f"{state_text}   /"
    )
    print(status_line)
    lines = list(active_lines or [])
    if not lines:
        lines = [_worker_line(0, current_song, current_action)]
    while len(lines) < LANGUAGE_WORKERS:
        lines.append(_idle_worker_line(len(lines)))
    for line in lines[:LANGUAGE_WORKERS]:
        print(line)


def _load_source_matched_rows(source_csv_path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with source_csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            song_name = str(row.get("song_name", "")).strip()
            artist_name = str(row.get("artist_name", "")).strip()
            lyrics_url = str(row.get("lyrics_url", "")).strip()
            if not song_name or not artist_name or not lyrics_url:
                continue
            rows.append(
                {
                    "song_name": song_name,
                    "artist_name": artist_name,
                    "lyrics_url": lyrics_url,
                    "languages": [],
                }
            )
    return rows


def _load_language_rows_from_output_json(json_path: Path) -> Dict[Tuple[str, str], Dict[str, Any]]:
    if not json_path.exists():
        return {}
    try:
        raw = json.loads(json_path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    if not isinstance(raw, list):
        return {}
    rows: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for row in raw:
        if not isinstance(row, dict):
            continue
        song_name = str(row.get("song_name", "")).strip()
        artist_name = str(row.get("artist_name", "")).strip()
        if not song_name or not artist_name:
            continue
        rows[(song_name.lower(), artist_name.lower())] = dict(row)
    return rows


def _load_language_rows_from_output_csv(csv_path: Path) -> Dict[Tuple[str, str], Dict[str, Any]]:
    if not csv_path.exists():
        return {}
    rows: Dict[Tuple[str, str], Dict[str, Any]] = {}
    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                song_name = str(row.get("song_name", "")).strip()
                artist_name = str(row.get("artist_name", "")).strip()
                if not song_name or not artist_name:
                    continue
                languages_text = str(row.get("languages", "")).strip()
                rows[(song_name.lower(), artist_name.lower())] = {
                    "song_name": song_name,
                    "artist_name": artist_name,
                    "lyrics_url": str(row.get("lyrics_url", "")).strip(),
                    "languages": [item for item in languages_text.split("|") if item],
                }
    except Exception:
        return {}
    return rows


def _load_existing_language_rows(rows_cache_path: Path, output_dir: Path) -> Tuple[Dict[Tuple[str, str], Dict[str, Any]], Optional[str]]:
    rows = load_rows_by_key(rows_cache_path)
    if rows:
        return rows, "rows_cache.json"
    json_rows = _load_language_rows_from_output_json(output_dir / "language_ready_matches.json")
    if json_rows:
        return json_rows, "language_ready_matches.json"
    csv_rows = _load_language_rows_from_output_csv(output_dir / "language_ready_matches.csv")
    if csv_rows:
        return csv_rows, "language_ready_matches.csv"
    return {}, None


def _merge_working_rows(
    source_rows: List[Dict[str, Any]],
    existing_rows_by_key: Dict[Tuple[str, str], Dict[str, Any]],
) -> List[Dict[str, Any]]:
    merged: List[Dict[str, Any]] = []
    for row in source_rows:
        song_name = row["song_name"]
        artist_name = row["artist_name"]
        key = (song_name.lower(), artist_name.lower())
        existing = existing_rows_by_key.get(key)
        merged_row = {
            "song_name": song_name,
            "artist_name": artist_name,
            "lyrics_url": row["lyrics_url"],
            "languages": [],
        }
        if existing:
            merged_row["lyrics_url"] = str(existing.get("lyrics_url", "")).strip() or row["lyrics_url"]
            languages_value = existing.get("languages", [])
            if isinstance(languages_value, list):
                merged_row["languages"] = [str(item).strip() for item in languages_value if str(item).strip()]
            elif languages_value not in (None, ""):
                merged_row["languages"] = [str(languages_value).strip()]
        merged.append(merged_row)
    return normalize_language_rows(merged)


def _get_completed_count(rows: List[Dict[str, Any]]) -> int:
    return sum(1 for row in rows if row.get("languages"))


def _get_failed_count(state: Dict[str, Any]) -> int:
    return len(state.get("skipped_songs", []))


def _get_detector() -> Any:
    global _DETECTOR
    if _DETECTOR is not None:
        return _DETECTOR
    if LanguageDetectorBuilder is None:
        return None
    detector_builder = LanguageDetectorBuilder.from_all_languages()
    if hasattr(detector_builder, "with_preloaded_language_models"):
        detector_builder = detector_builder.with_preloaded_language_models()
    _DETECTOR = detector_builder.build()
    return _DETECTOR


def _language_display(language: Any) -> str:
    name = str(getattr(language, "name", language)).replace("_", " ").title()
    code_value = ""
    iso = getattr(language, "iso_code_639_1", None)
    if iso is not None:
        code_value = str(getattr(iso, "name", "") or getattr(iso, "value", "")).lower()
    return f"{name} ({code_value})" if code_value else name


def _normalize_lyrics_for_detection(lyrics_text: str) -> str:
    cleaned_lines: List[str] = []
    for raw_line in lyrics_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r"^\d+\s+Contributors?(?:Translations.*)?$", "", line, flags=re.IGNORECASE).strip()
        line = re.sub(r"^Contributors?(?:Translations.*)?$", "", line, flags=re.IGNORECASE).strip()
        line = re.sub(r'^[“"\'`].*?[”"\'`]\s+Lyrics$', "", line, flags=re.IGNORECASE).strip()
        line = re.sub(r"^.*\s+Lyrics$", "", line, flags=re.IGNORECASE).strip()
        if not line:
            continue
        if re.fullmatch(r"\[[^\]]+\]", line):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


def _is_digit_heavy_unclassifiable_text(lyrics_text: str) -> bool:
    tokens = re.findall(r"\b\w+\b", lyrics_text, flags=re.UNICODE)
    if not tokens:
        return False
    embedded_digit_tokens = [
        token
        for token in tokens
        if re.search(r"[A-Za-zÀ-ÿ]", token) and re.search(r"\d", token)
    ]
    distinct_embedded = {token.lower() for token in embedded_digit_tokens}
    return (
        len(embedded_digit_tokens) >= 18
        and (len(embedded_digit_tokens) / len(tokens)) >= 0.12
        and len(distinct_embedded) >= 8
    )


def _top_confidence(detector: Any, text: str) -> float:
    try:
        values = detector.compute_language_confidence_values(text) or []
    except Exception:
        return 0.0
    if not values:
        return 0.0
    return float(getattr(values[0], "value", 0.0) or 0.0)


def _extract_detected_languages(detector: Any, lyrics_text: str) -> List[str]:
    if detector is None:
        return []

    normalized_lyrics = _normalize_lyrics_for_detection(lyrics_text)
    if not normalized_lyrics:
        return []

    def detect_one(text: str) -> Optional[str]:
        candidate = text.strip()
        if not candidate:
            return None
        try:
            language = detector.detect_language_of(candidate)
        except Exception:
            return None
        if language is None:
            return None
        display = _language_display(language)
        if display.lower() == "unknown":
            return None
        return display

    overall = detect_one(normalized_lyrics)
    if not overall:
        return []

    if _top_confidence(detector, normalized_lyrics) >= 0.90:
        return [overall]

    qualifying_lines: List[str] = []
    for raw_line in normalized_lyrics.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        word_count = len(re.findall(r"\b\w+\b", line, flags=re.UNICODE))
        letter_count = len(re.findall(r"[A-Za-zÀ-ÿ]", line, flags=re.UNICODE))
        if word_count < 3 or letter_count < 12:
            continue
        qualifying_lines.append(line)

    line_counts: Dict[str, int] = {}
    for line in qualifying_lines:
        detected = detect_one(line)
        if not detected:
            continue
        line_counts[detected] = line_counts.get(detected, 0) + 1

    final_languages = [overall]
    total_lines = len(qualifying_lines)
    if total_lines == 0:
        return final_languages

    extras = sorted(
        (
            (language, count)
            for language, count in line_counts.items()
            if language != overall and count >= 3 and (count / total_lines) >= 0.30
        ),
        key=lambda item: (-item[1], item[0]),
    )
    for language, _count in extras:
        final_languages.append(language)
    return final_languages


def _clean_lyrics_html(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\r", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def fetch_lyrics_payload(lyrics_url: str, timeout: int = 25) -> Dict[str, Any]:
    response = requests.get(lyrics_url, headers=_browser_headers(), timeout=timeout, allow_redirects=True)
    response.raise_for_status()
    html_text = response.text or ""
    if not html_text:
        return {"lyrics_text": "", "is_instrumental": False}

    lower_html = html_text.lower()
    if "this song is an instrumental" in lower_html:
        return {"lyrics_text": "", "is_instrumental": True, "status": "instrumental"}
    if "lyrics for this song have yet to be transcribed" in lower_html:
        return {"lyrics_text": "", "is_instrumental": False, "status": "not_yet_transcribed"}

    if BeautifulSoup is not None:
        try:
            soup = BeautifulSoup(html_text, "html.parser")
            containers = soup.select('div[data-lyrics-container="true"]')
            parts: List[str] = []
            for container in containers:
                for excluded in container.select('[data-exclude-from-selection="true"]'):
                    excluded.decompose()
                text = container.get_text("\n", strip=True)
                if text:
                    parts.append(text)
            if parts:
                return {
                    "lyrics_text": _clean_lyrics_html("\n".join(parts)),
                    "is_instrumental": False,
                    "status": "ok",
                }
        except Exception:
            pass

    matches = re.findall(r'<div data-lyrics-container="true"[^>]*>(.*?)</div>', html_text, flags=re.DOTALL)
    if matches:
        return {
            "lyrics_text": _clean_lyrics_html("\n".join(matches)),
            "is_instrumental": False,
            "status": "ok",
        }

    script_match = re.search(r'"lyrics":"(.*?)","', html_text, flags=re.DOTALL)
    if script_match:
        return {
            "lyrics_text": _clean_lyrics_html(script_match.group(1).encode("utf-8").decode("unicode_escape")),
            "is_instrumental": False,
            "status": "ok",
        }

    return {"lyrics_text": "", "is_instrumental": False, "status": "no_usable_lyrics"}


def _resolve_no_language_reason(lyrics_payload: Dict[str, Any], lyrics_text: str) -> str:
    status = str(lyrics_payload.get("status", "")).strip().lower()
    if status == "not_yet_transcribed":
        return NOT_YET_TRANSCRIBED_REASON
    if status == "no_usable_lyrics":
        return NO_USABLE_LYRICS_REASON
    normalized_lyrics = _normalize_lyrics_for_detection(lyrics_text)
    if not normalized_lyrics:
        return NO_USABLE_LYRICS_REASON
    if _is_digit_heavy_unclassifiable_text(normalized_lyrics):
        return UNCLASSIFIABLE_LANGUAGE_REASON
    return "Language detector returned no languages"


def sync_failure_log(
    failure_log_path: Path,
    skipped_rows: List[Dict[str, Any]],
    row_lookup: Dict[Tuple[str, str], Dict[str, Any]],
) -> None:
    failure_log_path.parent.mkdir(parents=True, exist_ok=True)
    ordered_payloads: List[Dict[str, Any]] = []
    seen_keys = set()
    for item in skipped_rows:
        song_name = str(item.get("song_name", "")).strip()
        artist_name = str(item.get("artist_name", "")).strip()
        if not song_name or not artist_name:
            continue
        key = (song_name.lower(), artist_name.lower())
        if key in seen_keys:
            continue
        seen_keys.add(key)
        row = row_lookup.get(key, {})
        ordered_payloads.append(
            {
                "song_name": song_name,
                "artist_name": artist_name,
                "lyrics_url": str(row.get("lyrics_url", "")).strip(),
                "reason": str(item.get("skip_reason", "")).strip(),
                "updated_at": str(item.get("updated_at", "")).strip() or now_iso(),
            }
        )
    with failure_log_path.open("w", encoding="utf-8") as f:
        for payload in ordered_payloads:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def _resolve_language_targets(mode: str, rows: List[Dict[str, Any]], state: Dict[str, Any]) -> Tuple[List[int], int]:
    if mode == "retry_failed":
        failed_lookup = {
            (
                str(item.get("song_name", "")).strip().lower(),
                str(item.get("artist_name", "")).strip().lower(),
            )
            for item in state.get("skipped_songs", [])
            if item.get("song_name") and item.get("artist_name")
        }
        indices = [
            index
            for index, row in enumerate(rows)
            if (row["song_name"].lower(), row["artist_name"].lower()) in failed_lookup
        ]
        return indices, 0

    if mode == "resume":
        next_index = int(state.get("next_index", 0) or 0)
        indices = [
            index
            for index in range(max(next_index, 0), len(rows))
            if not rows[index].get("languages")
        ]
        return indices, max(next_index, 0)

    indices = list(range(len(rows)))
    return indices, 0


def _advance_next_index(rows: List[Dict[str, Any]], current_next_index: int) -> int:
    next_index = max(int(current_next_index or 0), 0)
    while next_index < len(rows) and rows[next_index].get("languages"):
        next_index += 1
    return next_index


def run_language_lookup(row: Dict[str, Any]) -> Dict[str, Any]:
    detector = _get_detector()
    if detector is None:
        raise RuntimeError(
            "Missing required dependency: lingua-language-detector. Install tool requirements before running this option."
        )
    lyrics_url = str(row.get("lyrics_url", "")).strip()
    lyrics_payload = fetch_lyrics_payload(lyrics_url)
    if bool(lyrics_payload.get("is_instrumental")):
        return {
            "song_name": row["song_name"],
            "artist_name": row["artist_name"],
            "lyrics_url": lyrics_url,
            "languages": [INSTRUMENTAL_LANGUAGE_VALUE],
        }
    lyrics_text = str(lyrics_payload.get("lyrics_text", "")).strip()
    if not lyrics_text:
        raise RuntimeError(_resolve_no_language_reason(lyrics_payload, lyrics_text))
    normalized_lyrics = _normalize_lyrics_for_detection(lyrics_text)
    if not normalized_lyrics:
        raise RuntimeError(_resolve_no_language_reason(lyrics_payload, lyrics_text))
    if _is_digit_heavy_unclassifiable_text(normalized_lyrics):
        raise RuntimeError(UNCLASSIFIABLE_LANGUAGE_REASON)
    languages = _extract_detected_languages(detector, lyrics_text)
    if not languages:
        raise RuntimeError(_resolve_no_language_reason(lyrics_payload, lyrics_text))
    return {
        "song_name": row["song_name"],
        "artist_name": row["artist_name"],
        "lyrics_url": lyrics_url,
        "languages": languages,
    }


def run_language_getter(mode: str, limit: int = 0) -> int:
    output_dir, state_dir, state_path, rows_cache_path, failure_log_path = resolve_language_runtime_paths()
    ensure_language_dirs(output_dir, state_dir)

    source_csv_path = output_dir / SOURCE_OUTPUT_NAME
    if not source_csv_path.exists():
        print(f"Source Genius Web output not found: {source_csv_path}")
        return 1

    source_rows = _load_source_matched_rows(source_csv_path)
    if not source_rows:
        print("No matched Genius lyric URL rows were found in enriched_songs.csv.")
        return 1

    if mode == "begin":
        state = default_state()
        existing_rows_by_key: Dict[Tuple[str, str], Dict[str, Any]] = {}
        resume_source = None
        if failure_log_path.exists():
            failure_log_path.unlink()
    else:
        state = load_state(state_path)
        existing_rows_by_key, resume_source = _load_existing_language_rows(rows_cache_path, output_dir)
    working_rows = _merge_working_rows(source_rows, existing_rows_by_key)

    state["input_path"] = str(source_csv_path)
    state["input_total_rows"] = len(working_rows)
    state["source"] = LANGUAGE_SOURCE
    state["mode"] = mode

    row_lookup = {
        (row["song_name"].lower(), row["artist_name"].lower()): row
        for row in working_rows
    }
    save_rows(rows_cache_path, working_rows)
    write_language_outputs(output_dir, working_rows)
    sync_failure_log(failure_log_path, state.get("skipped_songs", []), row_lookup)
    save_state(state_path, state)

    target_indices, resolved_start_index = _resolve_language_targets(mode, working_rows, state)
    state["next_index"] = _advance_next_index(working_rows, resolved_start_index)
    if limit > 0:
        target_indices = target_indices[:limit]

    total_target = len(target_indices)
    completed_count = _get_completed_count(working_rows)
    failed_count = _get_failed_count(state)

    print(f"[source] Using Genius Web output: {source_csv_path}")
    print(f"[source] Matched rows with lyrics_url: {len(working_rows)}")
    if resume_source:
        print(f"[resume] Existing language runtime data source: {resume_source}")
    if mode == "resume":
        print(f"[resume] Effective next index: {resolved_start_index}")

    if _get_detector() is None:
        print("Missing required dependency: lingua-language-detector. Install tool requirements before running this option.")
        return 1

    if total_target == 0:
        print("Nothing to process for the selected mode.")
        return 0

    target_cursor = 0
    while target_cursor < len(target_indices):
        chunk_indices = target_indices[target_cursor : target_cursor + LANGUAGE_CHUNK_SIZE]
        chunk_completed_lines: List[str] = []
        chunk_processed = 0
        chunk_total = len(chunk_indices)
        active_lines = [_idle_worker_line(slot) for slot in range(LANGUAGE_WORKERS)]

        render_language_live_section(
            chunk_completed_lines,
            chunk_processed,
            chunk_total,
            completed_count,
            failed_count,
            total_target,
            "Waiting...",
            "Starting chunk",
            "In Progress",
            active_lines=active_lines,
        )

        queued_rows: List[Tuple[int, Dict[str, Any], str]] = []
        for row_index in chunk_indices:
            row = working_rows[row_index]
            song_label = f"{row['song_name']} by {row['artist_name']}"
            if mode != "retry_failed" and row.get("languages"):
                chunk_processed += 1
                chunk_completed_lines.append(f"[ALREADY COMPLETE] {song_label}")
                continue
            queued_rows.append((row_index, row, song_label))

        future_to_meta: Dict[Future, Dict[str, Any]] = {}
        queued_cursor = 0
        executor = ThreadPoolExecutor(max_workers=LANGUAGE_WORKERS)

        def submit_next(slot_index: int) -> bool:
            nonlocal queued_cursor
            if queued_cursor >= len(queued_rows):
                active_lines[slot_index] = _idle_worker_line(slot_index)
                return False
            row_index, row, song_label = queued_rows[queued_cursor]
            queued_cursor += 1
            active_lines[slot_index] = _worker_line(slot_index, song_label, "Fetching lyrics + detecting languages")
            future = executor.submit(run_language_lookup, dict(row))
            future_to_meta[future] = {
                "slot_index": slot_index,
                "row_index": row_index,
                "song_label": song_label,
                "song_name": row["song_name"],
                "artist_name": row["artist_name"],
            }
            return True

        try:
            for slot_index in range(LANGUAGE_WORKERS):
                submit_next(slot_index)

            while future_to_meta:
                done, _ = wait(list(future_to_meta.keys()), return_when=FIRST_COMPLETED)
                for future in done:
                    meta = future_to_meta.pop(future)
                    slot_index = int(meta["slot_index"])
                    row_index = int(meta["row_index"])
                    song_label = str(meta["song_label"])
                    song_name = str(meta["song_name"])
                    artist_name = str(meta["artist_name"])
                    reason = ""
                    try:
                        result_row = future.result()
                        working_rows[row_index] = result_row
                        remove_from_skipped(state, song_name, artist_name)
                        chunk_completed_lines.append(f"[DONE] {song_label}")
                    except Exception as exc:
                        reason = str(exc)
                        working_rows[row_index]["languages"] = []
                        add_or_update_skipped(state, song_name, artist_name, reason, ["lyrics_fetch", "language_detect"])
                        chunk_completed_lines.append(f"[FAILED] {song_label} | {reason}")

                    active_lines[slot_index] = _idle_worker_line(slot_index)
                    chunk_processed += 1
                    completed_count = _get_completed_count(working_rows)
                    failed_count = _get_failed_count(state)
                    state["last_completed_index"] = row_index
                    state["next_index"] = _advance_next_index(working_rows, state.get("next_index", 0))
                    state["source"] = LANGUAGE_SOURCE
                    state["mode"] = mode
                    save_rows(rows_cache_path, working_rows)
                    write_language_outputs(output_dir, working_rows)
                    sync_failure_log(failure_log_path, state.get("skipped_songs", []), row_lookup)
                    save_state(state_path, state)
                    submit_next(slot_index)
                    render_language_live_section(
                        chunk_completed_lines,
                        chunk_processed,
                        chunk_total,
                        completed_count,
                        failed_count,
                        total_target,
                        song_label,
                        "Writing state/output cache" if not reason else "Recorded failure + wrote cache",
                        "Done",
                        active_lines=active_lines,
                    )
        finally:
            executor.shutdown(wait=True)

        target_cursor += chunk_total
        completed_count = _get_completed_count(working_rows)
        failed_count = _get_failed_count(state)
        render_language_live_section(
            chunk_completed_lines,
            chunk_processed,
            chunk_total,
            completed_count,
            failed_count,
            total_target,
            "Chunk complete",
            "Chunk finalized",
            "Done",
            active_lines=active_lines,
        )

    save_rows(rows_cache_path, working_rows)
    write_language_outputs(output_dir, working_rows)
    sync_failure_log(failure_log_path, state.get("skipped_songs", []), row_lookup)
    save_state(state_path, state)
    print(f"Run complete. Wrote {len(working_rows)} rows to {output_dir}")
    return 0
