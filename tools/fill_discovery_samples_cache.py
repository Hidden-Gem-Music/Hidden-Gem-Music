#!/usr/bin/env python3
"""Fill the backend Discovery samples cache through local API endpoints.

Start the backend first, then run this from the repo root:

  python3 tools/fill_discovery_samples_cache.py --base-url http://localhost:5140

The backend writes results to:
  backend/Capstone.API/Data/discovery_samples_cache.json
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]
CACHE_PATH = REPO_ROOT / "backend" / "Capstone.API" / "Data" / "discovery_samples_cache.json"


def request_json(base_url: str, path: str, timeout: int) -> Any:
    url = f"{base_url.rstrip('/')}{path}"
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def chunks(values: list[str], size: int) -> Iterable[list[str]]:
    for index in range(0, len(values), size):
        yield values[index:index + size]


def load_cache() -> dict[str, dict[str, Any]]:
    if not CACHE_PATH.exists():
        return {}

    with CACHE_PATH.open(encoding="utf-8") as file:
        rows = json.load(file)

    cache: dict[str, dict[str, Any]] = {}
    for row in rows:
        country_code = str(row.get("countryCode", "")).strip().upper()
        year = int(row.get("year", 0) or 0)
        if country_code and year:
            cache[f"{country_code}::{year}"] = row
    return cache


def has_values(cache: dict[str, dict[str, Any]], country_code: str, year: int, field: str) -> bool:
    row = cache.get(f"{country_code.upper()}::{year}", {})
    values = row.get(field, [])
    return isinstance(values, list) and any(str(value).strip() for value in values)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fill backend Discovery genre/language sample cache.")
    parser.add_argument("--base-url", default="http://localhost:5140", help="Backend base URL.")
    parser.add_argument("--years", nargs="*", type=int, help="Optional year list. Defaults to /api/metadata/years.")
    parser.add_argument("--batch-size", type=int, default=8, help="Country codes per endpoint call. Max endpoint cap is 16.")
    parser.add_argument("--timeout", type=int, default=120, help="HTTP timeout seconds.")
    parser.add_argument("--sleep", type=float, default=0.1, help="Pause between endpoint calls.")
    parser.add_argument("--force", action="store_true", help="Request samples even when cache already has values.")
    parser.add_argument("--languages-only", action="store_true", help="Only fill language samples.")
    parser.add_argument("--genres-only", action="store_true", help="Only fill genre samples.")
    parser.add_argument("--favorite-artists-only", action="store_true", help="Only fill favorite artist samples.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    mode_flags = [args.languages_only, args.genres_only, args.favorite_artists_only]
    if sum(1 for enabled in mode_flags if enabled) > 1:
        raise SystemExit("Use only one of --languages-only, --genres-only, or --favorite-artists-only.")

    batch_size = max(1, min(args.batch_size, 16))
    years = args.years or [int(value) for value in request_json(args.base_url, "/api/metadata/years", args.timeout)]
    years = sorted(set(years))

    print(f"[cache] {CACHE_PATH}")
    print(f"[years] {', '.join(str(year) for year in years)}")

    for year in years:
        countries = request_json(args.base_url, f"/api/discovery/countries?year={year}", args.timeout)
        codes = sorted({
            str(row.get("countryCode", "")).strip().upper()
            for row in countries
            if str(row.get("countryCode", "")).strip()
        })
        cache = load_cache()
        missing_genres = [code for code in codes if args.force or not has_values(cache, code, year, "genres")]
        missing_languages = [code for code in codes if args.force or not has_values(cache, code, year, "languages")]
        missing_favorite_artists = [code for code in codes if args.force or not has_values(cache, code, year, "favoriteArtists")]

        print(
            f"[year {year}] countries={len(codes)} "
            f"missing_genres={len(missing_genres)} "
            f"missing_languages={len(missing_languages)} "
            f"missing_favorite_artists={len(missing_favorite_artists)}"
        )

        if not args.languages_only and not args.favorite_artists_only:
            for group in chunks(missing_genres, batch_size):
                query = urllib.parse.urlencode({"year": year, "codes": ",".join(group)})
                print(f"  [genres] {','.join(group)}")
                request_json(args.base_url, f"/api/country/genre-samples?{query}", args.timeout)
                time.sleep(args.sleep)

        if not args.genres_only and not args.favorite_artists_only:
            for group in chunks(missing_languages, batch_size):
                query = urllib.parse.urlencode({"year": year, "codes": ",".join(group)})
                print(f"  [languages] {','.join(group)}")
                request_json(args.base_url, f"/api/country/language-samples?{query}", args.timeout)
                time.sleep(args.sleep)

        if not args.genres_only and not args.languages_only:
            for code in missing_favorite_artists:
                print(f"  [favorite-artists] {code}")
                request_json(args.base_url, f"/api/country/{code}?year={year}", args.timeout)
                time.sleep(args.sleep)

    print("[done] Discovery samples cache fill requested.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        raise SystemExit(f"Backend request failed: {exc}") from exc
