from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, List

LANGUAGE_FIELDS = [
    "song_name",
    "artist_name",
    "lyrics_url",
    "languages",
]

CSV_LANGUAGE_DELIMITER = "|"
OUTPUT_BASENAME = "language_ready_matches"


def normalize_language_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    for row in rows:
        song_name = str(row.get("song_name", "")).strip()
        artist_name = str(row.get("artist_name", "")).strip()
        lyrics_url = str(row.get("lyrics_url", "")).strip()
        languages_value = row.get("languages")
        if isinstance(languages_value, list):
            languages = [str(item).strip() for item in languages_value if str(item).strip()]
        elif languages_value in (None, ""):
            languages = []
        else:
            languages = [str(languages_value).strip()]
        normalized.append(
            {
                "song_name": song_name,
                "artist_name": artist_name,
                "lyrics_url": lyrics_url,
                "languages": languages,
            }
        )
    return normalized


def write_language_outputs(output_dir: Path, rows: List[Dict[str, Any]]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    normalized = normalize_language_rows(rows)

    csv_path = output_dir / f"{OUTPUT_BASENAME}.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=LANGUAGE_FIELDS)
        writer.writeheader()
        for row in normalized:
            writer.writerow(
                {
                    "song_name": row["song_name"],
                    "artist_name": row["artist_name"],
                    "lyrics_url": row["lyrics_url"],
                    "languages": CSV_LANGUAGE_DELIMITER.join(row["languages"]),
                }
            )

    json_path = output_dir / f"{OUTPUT_BASENAME}.json"
    json_path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")

    txt_path = output_dir / f"{OUTPUT_BASENAME}.txt"
    lines: List[str] = []
    for index, row in enumerate(normalized, start=1):
        lines.append(f"BEGIN SONG {index}")
        lines.append("-" * 80)
        lines.append(f"song_name: {row['song_name']}")
        lines.append(f"artist_name: {row['artist_name']}")
        lines.append(f"lyrics_url: {row['lyrics_url']}")
        lines.append(f"languages: {', '.join(row['languages'])}")
        lines.append("-" * 80)
        lines.append(f"END SONG {index}")
        lines.append("")
        lines.append("")
    txt_path.write_text("\n".join(lines), encoding="utf-8")
