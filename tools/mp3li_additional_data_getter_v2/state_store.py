from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def default_state() -> Dict[str, Any]:
    return {
        "last_completed_index": -1,
        "next_index": 0,
        "source": "",
        "mode": "",
        "updated_at": "",
        "skipped_songs": [],
    }


def load_state(state_path: Path) -> Dict[str, Any]:
    if not state_path.exists():
        return default_state()
    try:
        return json.loads(state_path.read_text(encoding="utf-8"))
    except Exception:
        return default_state()


def save_state(state_path: Path, state: Dict[str, Any]) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state["updated_at"] = now_iso()
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def load_rows_by_key(rows_path: Path) -> Dict[Tuple[str, str], Dict[str, Any]]:
    if not rows_path.exists():
        return {}
    data = json.loads(rows_path.read_text(encoding="utf-8"))
    out: Dict[Tuple[str, str], Dict[str, Any]] = {}
    for row in data:
        key = (str(row.get("song_name", "")).strip().lower(), str(row.get("artist_name", "")).strip().lower())
        out[key] = row
    return out


def save_rows(rows_path: Path, rows: List[Dict[str, Any]]) -> None:
    rows_path.parent.mkdir(parents=True, exist_ok=True)
    rows_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")


def add_or_update_skipped(state: Dict[str, Any], song_name: str, artist_name: str, reason: str, attempt_trail: List[str]) -> None:
    key_song = song_name.strip().lower()
    key_artist = artist_name.strip().lower()
    items = state.setdefault("skipped_songs", [])
    for item in items:
        if item.get("song_name", "").strip().lower() == key_song and item.get("artist_name", "").strip().lower() == key_artist:
            item["skip_reason"] = reason
            item["attempt_trail"] = attempt_trail
            item["updated_at"] = now_iso()
            return
    items.append(
        {
            "song_name": song_name,
            "artist_name": artist_name,
            "skip_reason": reason,
            "attempt_trail": attempt_trail,
            "updated_at": now_iso(),
        }
    )


def remove_from_skipped(state: Dict[str, Any], song_name: str, artist_name: str) -> None:
    key_song = song_name.strip().lower()
    key_artist = artist_name.strip().lower()
    items = state.setdefault("skipped_songs", [])
    state["skipped_songs"] = [
        item
        for item in items
        if not (
            item.get("song_name", "").strip().lower() == key_song
            and item.get("artist_name", "").strip().lower() == key_artist
        )
    ]
