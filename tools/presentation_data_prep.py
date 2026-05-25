#!/usr/bin/env python3
"""Warm backend data needed for the presentation demo.

Start the backend first, then run this from the repo root:

  python3 tools/presentation_data_prep.py --base-url http://localhost:5140

The tool prompts for the screen area, country range, and years to prep.
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

AVAILABLE_YEAR_CHOICES = [2025, 2024, 2023, 2021, 2020, 2019, 2018, 2017]
COUNTRY_RANGE_SIZE = 10


def request_json(base_url: str, path: str, timeout: int) -> Any:
    url = f"{base_url.rstrip('/')}{path}"
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Warm presentation data for selected countries and years.")
    parser.add_argument("--base-url", default="http://localhost:5140", help="Backend base URL.")
    parser.add_argument("--hidden-gems-pages", type=int, default=3, help="Hidden Gems pages to warm per country/year.")
    parser.add_argument("--hidden-gems-page-size", type=int, default=13, help="Hidden Gems page size used by the UI.")
    parser.add_argument("--country-song-page-size", type=int, default=50, help="Country page shared/unique song page size.")
    parser.add_argument("--timeout", type=int, default=180, help="HTTP timeout seconds.")
    parser.add_argument("--sleep", type=float, default=0.15, help="Pause between endpoint calls.")
    return parser.parse_args()


def unique_country_codes(rows: list[Any]) -> list[str]:
    codes: list[str] = []
    seen: set[str] = set()
    for row in rows:
        code = str(row.get("countryCode", "")).strip().upper() if isinstance(row, dict) else ""
        if len(code) != 2 or code in seen:
            continue
        seen.add(code)
        codes.append(code)
    return codes


def request_samples(base_url: str, year: int, codes: list[str], timeout: int, sleep: float) -> None:
    if not codes:
        return

    query = urllib.parse.urlencode({"year": year, "codes": ",".join(codes)})
    print(f"  [genre-samples] {','.join(codes)}")
    request_json(base_url, f"/api/country/genre-samples?{query}", timeout)
    time.sleep(sleep)

    print(f"  [language-samples] {','.join(codes)}")
    request_json(base_url, f"/api/country/language-samples?{query}", timeout)
    time.sleep(sleep)


def warm_discovery_map(args: argparse.Namespace, year: int, codes: list[str]) -> None:
    request_samples(args.base_url, year, codes, args.timeout, args.sleep)


def warm_country_pages(args: argparse.Namespace, year: int, code: str) -> None:
    print(f"  [country-profile] {code}")
    request_json(args.base_url, f"/api/country/{code}?year={year}", args.timeout)
    time.sleep(args.sleep)

    for list_type in ("unique", "shared"):
        query = urllib.parse.urlencode({
            "year": year,
            "listType": list_type,
            "page": 1,
            "pageSize": args.country_song_page_size,
        })
        print(f"  [country-songs:{list_type}] {code}")
        request_json(args.base_url, f"/api/country/{code}/songs?{query}", args.timeout)
        time.sleep(args.sleep)

    preview_query = urllib.parse.urlencode({"year": year, "limit": args.hidden_gems_page_size})
    print(f"  [country-hidden-gems-preview] {code}")
    request_json(args.base_url, f"/api/country/{code}/hidden-gems/preview?{preview_query}", args.timeout)
    time.sleep(args.sleep)


def warm_hidden_gems(args: argparse.Namespace, year: int, code: str) -> None:
    for page in range(1, max(1, args.hidden_gems_pages) + 1):
        query = urllib.parse.urlencode({
            "year": year,
            "minCountries": 2,
            "page": page,
            "pageSize": args.hidden_gems_page_size,
        })
        print(f"  [hidden-gems:p{page}] {code}")
        request_json(args.base_url, f"/api/hidden-gems/{code}?{query}", args.timeout)
        time.sleep(args.sleep)


def print_welcome() -> None:
    print()
    print("Welcome to mp3li's Presentation Data Prep Tool")
    print()


def ask_number(prompt: str, valid_choices: set[int]) -> int:
    while True:
        value = input(prompt).strip()
        try:
            choice = int(value)
        except ValueError:
            print("Please enter one of the listed numbers.")
            continue

        if choice in valid_choices:
            return choice

        print("Please enter one of the listed numbers.")


def ask_prep_mode() -> int:
    print("1: Prep Discovery Map")
    print("2: Prep Country Pages")
    print("3: Prep Hidden Gems")
    print()
    return ask_number("Pick one: ", {1, 2, 3})


def ask_country_range(max_country_count: int) -> int:
    option_count = max(1, (max_country_count + COUNTRY_RANGE_SIZE - 1) // COUNTRY_RANGE_SIZE)
    print()
    print("Which countries?")
    print()
    print("0: All countries (will take a long time)")
    for option in range(1, option_count + 1):
        start = (option - 1) * COUNTRY_RANGE_SIZE
        end = min(start + COUNTRY_RANGE_SIZE, max_country_count)
        if start == 0:
            print(f"{option}: First {end}")
        else:
            print(f"{option}: {start}th to {end}th")
    print()
    return ask_number("Pick one: ", set(range(0, option_count + 1)))


def ask_years() -> list[int]:
    print()
    print("Which years:")
    print()
    print("0: All years (Will take a long time)")
    for index, year in enumerate(AVAILABLE_YEAR_CHOICES, start=1):
        print(f"{index}: {year}")
    print()
    choice = ask_number("Pick one: ", set(range(0, len(AVAILABLE_YEAR_CHOICES) + 1)))
    if choice == 0:
        return AVAILABLE_YEAR_CHOICES
    return [AVAILABLE_YEAR_CHOICES[choice - 1]]


def select_country_codes(codes: list[str], range_choice: int) -> list[str]:
    if range_choice == 0:
        return codes

    start = (range_choice - 1) * COUNTRY_RANGE_SIZE
    end = start + COUNTRY_RANGE_SIZE
    return codes[start:end]


def load_country_count_for_menu(args: argparse.Namespace) -> int:
    countries = request_json(args.base_url, f"/api/discovery/countries?year={AVAILABLE_YEAR_CHOICES[0]}", args.timeout)
    codes = unique_country_codes(countries if isinstance(countries, list) else [])
    return len(codes)


def main() -> int:
    args = parse_args()
    print_welcome()
    prep_mode = ask_prep_mode()
    max_country_count = load_country_count_for_menu(args)
    country_range = ask_country_range(max_country_count)
    years = ask_years()

    mode_label = {
        1: "Discovery Map",
        2: "Country Pages",
        3: "Hidden Gems",
    }[prep_mode]

    print()
    print(f"[presentation-data-prep] {mode_label}")
    print(f"[years] {', '.join(str(year) for year in years)}")

    for year in years:
        countries = request_json(args.base_url, f"/api/discovery/countries?year={year}", args.timeout)
        all_codes = unique_country_codes(countries if isinstance(countries, list) else [])
        codes = select_country_codes(all_codes, country_range)
        print(f"[year {year}] {','.join(codes)}")

        if prep_mode == 1:
            warm_discovery_map(args, year, codes)
            continue

        for code in codes:
            if prep_mode == 2:
                warm_country_pages(args, year, code)
            elif prep_mode == 3:
                warm_hidden_gems(args, year, code)

    print("[done] Presentation data prep requests completed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as exc:
        raise SystemExit(f"Backend request failed: {exc}") from exc
