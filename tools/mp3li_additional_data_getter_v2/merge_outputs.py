#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Tuple

from writers import write_outputs


def _key(row: Dict[str, Any]) -> Tuple[str, str]:
    return (
        str(row.get("song_name", "")).strip().lower(),
        str(row.get("artist_name", "")).strip().lower(),
    )


def _load_rows(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Merge Deezer + Genius rows by song_name/artist_name")
    parser.add_argument("--deezer-rows", default="state/rows_cache.json")
    parser.add_argument("--genius-rows", default="state_genius_web/rows_cache.json")
    parser.add_argument("--out-dir", default="output_merged")
    args = parser.parse_args()

    deezer_rows = _load_rows(Path(args.deezer_rows))
    genius_rows = _load_rows(Path(args.genius_rows))
    merged: Dict[Tuple[str, str], Dict[str, Any]] = {}

    for row in deezer_rows:
        merged[_key(row)] = dict(row)

    for grow in genius_rows:
        k = _key(grow)
        if k not in merged:
            merged[k] = dict(grow)
            continue
        base = merged[k]
        lyrics_url = str(grow.get("lyrics_url", "")).strip()
        if lyrics_url:
            base["lyrics_url"] = lyrics_url
        if base.get("skipped") and not grow.get("skipped"):
            base["skipped"] = False
            base["skip_reason"] = ""
        merged[k] = base

    out_rows = list(merged.values())
    write_outputs(Path(args.out_dir), out_rows)
    print(f"Merged {len(deezer_rows)} deezer + {len(genius_rows)} genius rows -> {len(out_rows)} rows in {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

