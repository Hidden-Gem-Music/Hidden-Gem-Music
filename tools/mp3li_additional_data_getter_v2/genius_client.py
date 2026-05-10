from __future__ import annotations

import re
import unicodedata
import time
import random
import threading
from collections import deque
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests

GENIUS_BASE = "https://api.genius.com"
GENIUS_MAX_REQUESTS = 1
GENIUS_WINDOW_SECONDS = 1.0
GENIUS_WEB_MAX_REQUESTS = 0
GENIUS_WEB_WINDOW_SECONDS = 1.0


class GeniusBackoffStop(RuntimeError):
    def __init__(self, message: str, approx_retry_at: str) -> None:
        self.message = message
        self.approx_retry_at = approx_retry_at
        super().__init__(message)


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._timestamps: deque[float] = deque()
        self._lock = threading.Lock()

    def wait_for_slot(self) -> None:
        if self.max_requests <= 0:
            return
        while True:
            with self._lock:
                now = time.time()
                while self._timestamps and now - self._timestamps[0] >= self.window_seconds:
                    self._timestamps.popleft()
                if len(self._timestamps) < self.max_requests:
                    self._timestamps.append(now)
                    return
                wait_for = self.window_seconds - (now - self._timestamps[0])
            time.sleep(max(wait_for, 0.01))


def normalize_text(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value


def simplify_for_search(value: str) -> str:
    value = normalize_text(value)
    value = re.sub(r"[^\w\s]", " ", value, flags=re.UNICODE)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def _slug_for_genius(value: str, punctuation_as_separator: bool = False) -> str:
    value = (value or "").strip().lower()
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("&", " and ")
    if not punctuation_as_separator:
        value = re.sub(r"['’`\"]", "", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value


def _clean_song_title_for_fallback(value: str) -> str:
    value = (value or "").strip()
    value = re.sub(r"\s+(?:feat\.?|ft\.?|featuring)\s+.+$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\((?:feat\.?|ft\.?|featuring)[^)]*\)", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\[(?:feat\.?|ft\.?|featuring)[^\]]*\]", "", value, flags=re.IGNORECASE)
    value = re.sub(r"\([^)]*\)", "", value)
    value = re.sub(r"\[[^\]]*\]", "", value)
    value = re.split(r"\s+[-–—]\s+", value, maxsplit=1)[0]
    value = re.sub(r"\s+", " ", value).strip(" -–—,")
    return value


def _first_artist_for_fallback(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    parts = re.split(r"\s*(?:,|&|/| x | X | feat\.? | ft\.? | featuring )\s*", value, maxsplit=1, flags=re.IGNORECASE)
    return parts[0].strip()


def _all_artists_slug_fallback(value: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    parts = [
        part.strip()
        for part in re.split(r"\s*(?:,|&|/| x | X | feat\.? | ft\.? | featuring )\s*", value, flags=re.IGNORECASE)
        if part.strip()
    ]
    if not parts:
        return ""
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return f"{parts[0]} and {parts[1]}"
    return " ".join(parts[:-1]) + " and " + parts[-1]


def build_genius_web_candidates(song_name: str, artist_name: str) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    seen_urls: set[str] = set()

    def add_candidate_variant(
        candidate_song: str,
        candidate_artist: str,
        match_strategy: str,
        attempt_label: str,
        punctuation_as_separator: bool,
    ) -> None:
        artist_slug = _slug_for_genius(candidate_artist, punctuation_as_separator=punctuation_as_separator)
        song_slug = _slug_for_genius(candidate_song, punctuation_as_separator=punctuation_as_separator)
        if not artist_slug or not song_slug:
            return
        lyrics_url = f"https://genius.com/{artist_slug}-{song_slug}-lyrics"
        if lyrics_url in seen_urls:
            return
        seen_urls.add(lyrics_url)
        candidates.append(
            {
                "song_name": song_name,
                "artist_name": artist_name,
                "source": "genius_web",
                "lyrics_url": lyrics_url,
                "match_strategy": match_strategy,
                "attempt_label": attempt_label,
                "candidate_song_name": candidate_song,
                "candidate_artist_name": candidate_artist,
            }
        )

    def add_candidate(candidate_song: str, candidate_artist: str, match_strategy: str, attempt_label: str) -> None:
        add_candidate_variant(
            candidate_song,
            candidate_artist,
            match_strategy,
            attempt_label,
            punctuation_as_separator=False,
        )
        add_candidate_variant(
            candidate_song,
            candidate_artist,
            f"{match_strategy}_punctuation_separator",
            f"{attempt_label}_punctuation_separator",
            punctuation_as_separator=True,
        )

    cleaned_song_name = _clean_song_title_for_fallback(song_name)
    fallback_artist_name = _first_artist_for_fallback(artist_name)
    full_artist_slug_fallback = _all_artists_slug_fallback(artist_name)

    add_candidate(song_name, artist_name, "constructed_slug", "slug_build_full")
    if full_artist_slug_fallback and full_artist_slug_fallback != artist_name:
        add_candidate(
            song_name,
            full_artist_slug_fallback,
            "constructed_slug_all_artists",
            "slug_build_full_all_artists",
        )
    if cleaned_song_name and cleaned_song_name != song_name:
        add_candidate(cleaned_song_name, artist_name, "constructed_slug_clean_title", "slug_build_clean_title")
        if full_artist_slug_fallback and full_artist_slug_fallback != artist_name:
            add_candidate(
                cleaned_song_name,
                full_artist_slug_fallback,
                "constructed_slug_clean_title_all_artists",
                "slug_build_clean_title_all_artists",
            )
    if fallback_artist_name and fallback_artist_name != artist_name:
        add_candidate(
            cleaned_song_name or song_name,
            fallback_artist_name,
            "constructed_slug_clean_title_first_artist",
            "slug_build_clean_title_first_artist",
        )

    return candidates


def build_genius_web_row(song_name: str, artist_name: str) -> Dict[str, Any]:
    candidates = build_genius_web_candidates(song_name, artist_name)
    if not candidates:
        return {
            "song_name": song_name,
            "artist_name": artist_name,
            "source": "genius_web",
            "skipped": True,
            "skip_reason": "Unable to construct Genius URL slug from song/artist text",
            "attempt_trail": ["slug_build"],
            "updated_at": datetime.now().isoformat(),
        }
    row = dict(candidates[0])
    row.update(
        {
            "attempt_trail": [str(candidates[0].get("attempt_label", "slug_build_full"))],
            "skipped": False,
            "skip_reason": "",
            "updated_at": datetime.now().isoformat(),
        }
    )
    return row


def _browser_headers() -> Dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://genius.com/",
    }


def _norm_compare(value: str) -> str:
    value = normalize_text(value)
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = re.sub(r"[^\w\s]", " ", value, flags=re.UNICODE)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def validate_genius_lyrics_url(
    session: requests.Session,
    limiter: RateLimiter,
    lyrics_url: str,
    song_name: str,
    artist_name: str,
) -> Tuple[bool, str]:
    if not lyrics_url:
        return False, "Constructed Genius URL was empty"

    limiter.wait_for_slot()
    # Light jitter to look less robotic when iterating large lists.
    time.sleep(random.uniform(0.05, 0.18))
    response = session.get(lyrics_url, headers=_browser_headers(), timeout=25, allow_redirects=True)
    if response.status_code == 429:
        return False, "Genius returned rate limit while validating URL"
    if response.status_code >= 400:
        return False, f"Genius URL returned HTTP {response.status_code}"

    html = response.text
    if not html:
        return False, "Genius page returned empty body"

    song_ok = _norm_compare(song_name) in _norm_compare(html)
    artist_ok = _norm_compare(artist_name) in _norm_compare(html)
    if song_ok and artist_ok:
        return True, ""
    return False, "Constructed Genius URL page text did not match song+artist"


def request_json(session: requests.Session, limiter: RateLimiter, url: str, params: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    limiter.wait_for_slot()
    response = session.get(url, params=params, headers=headers, timeout=25)
    if response.status_code == 429:
        retry_after_header = response.headers.get("Retry-After", "").strip()
        retry_seconds = int(retry_after_header) if retry_after_header.isdigit() else 60
        warning = response.text.strip() or "Rate limit warning from Genius"
        retry_at = datetime.now() + timedelta(seconds=retry_seconds)
        raise GeniusBackoffStop(warning, retry_at.strftime("%Y-%m-%d %H:%M:%S"))
    body = response.text.lower()
    if "backoff" in body or "rate limit" in body:
        retry_at = (datetime.now() + timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
        raise GeniusBackoffStop(response.text.strip() or "Backoff warning from Genius", retry_at)
    response.raise_for_status()
    return response.json()


def fetch_genius_row(session: requests.Session, limiter: RateLimiter, genius_token: str, song_name: str, artist_name: str) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {genius_token}"}
    queries = [
        f"{song_name} {artist_name}",
        f"{simplify_for_search(song_name)} {simplify_for_search(artist_name)}",
    ]

    hit = None
    for query in queries:
        payload = request_json(session, limiter, f"{GENIUS_BASE}/search", {"q": query}, headers)
        hits = ((payload.get("response") or {}).get("hits")) or []
        if not hits:
            continue

        wanted_song = normalize_text(song_name)
        wanted_artist = normalize_text(artist_name)
        wanted_song_simple = simplify_for_search(song_name)
        wanted_artist_simple = simplify_for_search(artist_name)

        for h in hits:
            result = h.get("result") or {}
            title = normalize_text(result.get("title", ""))
            artist = normalize_text((result.get("primary_artist") or {}).get("name", ""))
            if title == wanted_song and artist == wanted_artist:
                hit = result
                break
        if hit:
            break

        for h in hits:
            result = h.get("result") or {}
            title = simplify_for_search(result.get("title", ""))
            artist = simplify_for_search((result.get("primary_artist") or {}).get("name", ""))
            if title == wanted_song_simple and artist == wanted_artist_simple:
                hit = result
                break
        if hit:
            break

        hit = (hits[0].get("result") or None)
        if hit:
            break

    if not hit:
        return {
            "song_name": song_name,
            "artist_name": artist_name,
            "source": "genius",
            "skipped": True,
            "skip_reason": "No Genius match found",
            "attempt_trail": ["exact", "simplified"],
            "updated_at": datetime.now().isoformat(),
        }

    return {
        "song_name": song_name,
        "artist_name": artist_name,
        "source": "genius",
        "lyrics_url": hit.get("url", ""),
        "match_strategy": "exact_or_simplified",
        "attempt_trail": ["exact", "simplified"],
        "skipped": False,
        "skip_reason": "",
        "raw_track_json": hit,
        "updated_at": datetime.now().isoformat(),
    }
