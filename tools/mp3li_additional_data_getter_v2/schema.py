from __future__ import annotations

from typing import Any, Dict, List

CANONICAL_FIELDS = [
    "song_name",
    "artist_name",
    "skipped",
    "skip_reason",
    "track_id",
    "album_id",
    "preview_url",
    "preview_live_pull_endpoint",
    "lyrics_url",
    "release_date",
    "genres",
    "record_type",
    "contributors",
    "explicit_lyrics",
    "explicit_content_cover",
    "album_object",
    "artist_object",
    "artist_top_5_tracks",
    "endpoints_header",
    "endpoint_tracklist",
    "endpoint_album_tracks",
    "endpoint_artist_albums",
    "endpoint_artist_related",
    "source",
    "match_strategy",
    "attempt_trail",
    "updated_at",
]

LIST_FIELDS = {
    "genres",
    "contributors",
    "attempt_trail",
}

RAW_JSON_FIELDS = {
    "album_object",
    "artist_object",
    "artist_top_5_tracks",
}


def normalize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for field in CANONICAL_FIELDS:
        value = row.get(field)
        if field in LIST_FIELDS:
            out[field] = value if isinstance(value, list) else ([] if value in (None, "") else [str(value)])
        elif field in RAW_JSON_FIELDS:
            if value in (None, ""):
                out[field] = {}
            else:
                out[field] = value
        elif field == "skipped":
            out[field] = bool(value)
        else:
            out[field] = "" if value is None else value
    return out


def normalize_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [normalize_row(row) for row in rows]
