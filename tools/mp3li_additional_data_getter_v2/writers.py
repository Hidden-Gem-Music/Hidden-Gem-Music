from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, List

from schema import CANONICAL_FIELDS, normalize_rows


def _compact_row_for_output(row: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(row)
    track_id = out.get("track_id")
    if track_id:
        out["preview_live_pull_endpoint"] = f"https://api.deezer.com/track/{track_id}"
    else:
        out["preview_live_pull_endpoint"] = ""
    out["endpoints_header"] = "DOCUMENTED LIVE PULL ENDPOINTS"
    album = out.get("album_object") if isinstance(out.get("album_object"), dict) else {}
    artist = out.get("artist_object") if isinstance(out.get("artist_object"), dict) else {}
    album_id = out.get("album_id") or album.get("id")
    artist_id = artist.get("id")
    out["endpoint_tracklist"] = f"https://api.deezer.com/album/{album_id}/tracks" if album_id else ""
    out["endpoint_album_tracks"] = f"https://api.deezer.com/album/{album_id}/tracks" if album_id else ""
    out["endpoint_artist_albums"] = f"https://api.deezer.com/artist/{artist_id}/albums" if artist_id else ""
    out["endpoint_artist_related"] = f"https://api.deezer.com/artist/{artist_id}/related" if artist_id else ""

    album = out.get("album_object")
    if isinstance(album, dict):
        out["album_object"] = {
            "id": album.get("id", ""),
            "title": album.get("title", ""),
            "cover": album.get("cover", ""),
            "cover_small": album.get("cover_small", ""),
            "cover_medium": album.get("cover_medium", ""),
            "cover_big": album.get("cover_big", ""),
            "cover_xl": album.get("cover_xl", ""),
        }

    artist = out.get("artist_object")
    if isinstance(artist, dict):
        out["artist_object"] = {
            "id": artist.get("id", ""),
            "name": artist.get("name", ""),
            "picture": artist.get("picture", ""),
            "picture_small": artist.get("picture_small", ""),
            "picture_medium": artist.get("picture_medium", ""),
            "picture_big": artist.get("picture_big", ""),
            "picture_xl": artist.get("picture_xl", ""),
        }

    top = out.get("artist_top_5_tracks")
    if isinstance(top, dict):
        data = top.get("data") or []
        out["artist_top_5_tracks"] = [
            {
                "id": item.get("id", ""),
                "title": item.get("title", ""),
                "preview": item.get("preview", ""),
                "duration": item.get("duration", ""),
                "rank": item.get("rank", ""),
            }
            for item in data
        ]
    elif not isinstance(top, list):
        out["artist_top_5_tracks"] = []

    return out


def _csv_ready(row: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for key, value in row.items():
        if isinstance(value, list):
            out[key] = "|".join(str(v) for v in value)
        elif isinstance(value, dict):
            out[key] = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        elif isinstance(value, bool):
            out[key] = "True" if value else "False"
        else:
            out[key] = value
    return out


def write_outputs(output_dir: Path, rows: List[Dict[str, Any]]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    normalized = [_compact_row_for_output(row) for row in normalize_rows(rows)]

    csv_path = output_dir / "enriched_songs.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CANONICAL_FIELDS)
        writer.writeheader()
        for row in normalized:
            writer.writerow(_csv_ready(row))

    def _display_row(row: Dict[str, Any]) -> Dict[str, Any]:
        if bool(row.get("skipped")):
            return {
                "song_name": row.get("song_name", ""),
                "artist_name": row.get("artist_name", ""),
                "skipped": True,
                "skip_reason": row.get("skip_reason", ""),
            }
        return row

    display_rows = [_display_row(row) for row in normalized]
    wrapped_rows = [
        {
            "entry_number": i,
            "entry": row,
        }
        for i, row in enumerate(display_rows, start=1)
    ]

    json_path = output_dir / "enriched_songs.json"
    json_text = json.dumps(wrapped_rows, ensure_ascii=False, indent=2)
    # Keep valid JSON while adding visual spacing between objects.
    json_text = json_text.replace("},\n  {", "},\n\n\n  {")
    json_path.write_text(json_text, encoding="utf-8")

    txt_path = output_dir / "enriched_songs.txt"
    lines: List[str] = []
    for i, row in enumerate(display_rows, start=1):
        lines.append(f"BEGIN SONG {i}")
        lines.append("-" * 80)
        fields = list(row.keys())
        for field in fields:
            value = row.get(field)
            if isinstance(value, list):
                rendered = ", ".join(str(v) for v in value)
            elif isinstance(value, dict):
                rendered = json.dumps(value, ensure_ascii=False, indent=2)
            else:
                rendered = str(value)
            lines.append(f"{field}: {rendered}")
        lines.append("-" * 80)
        lines.append(f"END SONG {i}")
        lines.append("")
        lines.append("")
    txt_path.write_text("\n".join(lines), encoding="utf-8")
