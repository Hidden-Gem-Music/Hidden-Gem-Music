#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Set


def _collect_paths(value: Any, prefix: str, out: Set[str]) -> None:
    if isinstance(value, dict):
        if not value:
            out.add(prefix + "{}")
            return
        for k, v in value.items():
            p = f"{prefix}.{k}" if prefix else str(k)
            _collect_paths(v, p, out)
    elif isinstance(value, list):
        if not value:
            out.add(prefix + "[]")
            return
        out.add(prefix + "[]")
        for item in value:
            _collect_paths(item, prefix + "[]", out)
    else:
        out.add(prefix)


def _paths_from_rows(rows: List[Dict[str, Any]], field: str) -> List[str]:
    out: Set[str] = set()
    for row in rows:
        v = row.get(field)
        if v in (None, ""):
            continue
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except Exception:
                continue
        _collect_paths(v, "", out)
    return sorted(out)


def _first_non_empty(rows: List[Dict[str, Any]], key: str) -> str:
    for r in rows:
        v = r.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""


def build_doc(rows: List[Dict[str, Any]]) -> str:
    tracklist_url_example = _first_non_empty(rows, "tracklist_url")
    album_tracks_url_example = _first_non_empty(rows, "album_tracks_endpoint_url")
    artist_albums_url_example = _first_non_empty(rows, "artist_albums_endpoint_url")
    artist_related_url_example = _first_non_empty(rows, "artist_related_endpoint_url")

    album_tracks_paths = _paths_from_rows(rows, "raw_album_tracks_json")
    artist_albums_paths = _paths_from_rows(rows, "raw_artist_albums_json")
    artist_related_paths = _paths_from_rows(rows, "raw_artist_related_json")
    artist_paths = _paths_from_rows(rows, "raw_artist_json")

    lines: List[str] = []
    lines.append("# UI Live Pull Map (Auto-generated)")
    lines.append("")
    lines.append("This map is for endpoints you flagged for live UI pulls (instead of storing large static payloads in dataset rows).")
    lines.append("")
    lines.append("## 1) tracklist URL")
    lines.append("- Field in dataset: `tracklist_url`")
    lines.append("- Endpoint format: `GET https://api.deezer.com/album/{album_id}/tracks`")
    if tracklist_url_example:
        lines.append(f"- Example from current data: `{tracklist_url_example}`")
    lines.append("- Everything observed in response (key paths):")
    for p in album_tracks_paths:
        lines.append(f"  - `{p}`")
    lines.append("")

    lines.append("## 2) album/{id}/tracks")
    lines.append("- Endpoint format: `GET https://api.deezer.com/album/{album_id}/tracks`")
    if album_tracks_url_example:
        lines.append(f"- Example from current data: `{album_tracks_url_example}`")
    lines.append("- Field->key path map:")
    lines.append("  - Track ID -> `data[].id`")
    lines.append("  - Preview URL -> `data[].preview`")
    lines.append("  - Explicit flags -> `data[].explicit_lyrics`, `data[].explicit_content_cover`, `data[].explicit_content_lyrics`")
    lines.append("  - Artist object -> `data[].artist.*`")
    lines.append("  - Album object -> `data[].album.*`")
    lines.append("- Everything observed in response (key paths):")
    for p in album_tracks_paths:
        lines.append(f"  - `{p}`")
    lines.append("")

    lines.append("## 3) nb_album")
    lines.append("- Canonical endpoint format: `GET https://api.deezer.com/artist/{artist_id}`")
    lines.append("- Field path: `nb_album`")
    lines.append("- Everything observed in artist response (key paths):")
    for p in artist_paths:
        lines.append(f"  - `{p}`")
    lines.append("")

    lines.append("## 4) artist/{id}/albums")
    lines.append("- Endpoint format: `GET https://api.deezer.com/artist/{artist_id}/albums`")
    if artist_albums_url_example:
        lines.append(f"- Example from current data: `{artist_albums_url_example}`")
    lines.append("- Everything observed in response (key paths):")
    for p in artist_albums_paths:
        lines.append(f"  - `{p}`")
    lines.append("")

    lines.append("## 5) artist/{id}/related")
    lines.append("- Endpoint format: `GET https://api.deezer.com/artist/{artist_id}/related`")
    if artist_related_url_example:
        lines.append(f"- Example from current data: `{artist_related_url_example}`")
    lines.append("- Everything observed in response (key paths):")
    for p in artist_related_paths:
        lines.append(f"  - `{p}`")
    lines.append("")

    lines.append("## Notes")
    lines.append("- This file updates from real payloads seen so far; as more songs process, new key paths can appear.")
    lines.append("- If an endpoint has no successful rows yet, key paths may be sparse until data arrives.")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Build UI live pull endpoint map from current rows cache")
    parser.add_argument("--rows-cache", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    rows_path = Path(args.rows_cache)
    out_path = Path(args.out)
    if not rows_path.exists():
        return 0

    try:
        rows = json.loads(rows_path.read_text(encoding="utf-8"))
    except Exception:
        return 0

    doc = build_doc(rows)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(doc, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
