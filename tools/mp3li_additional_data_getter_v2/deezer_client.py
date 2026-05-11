from __future__ import annotations

import re
import time
from collections import deque
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests

DEEZER_BASE = "https://api.deezer.com"
DEEZER_MAX_REQUESTS = 50
DEEZER_WINDOW_SECONDS = 3.5


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._timestamps: deque[float] = deque()

    def wait_for_slot(self) -> None:
        while True:
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


def request_json(session: requests.Session, limiter: RateLimiter, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    limiter.wait_for_slot()
    response = session.get(url, params=params, timeout=25)
    response.raise_for_status()
    return response.json()


def choose_image_url(obj: Dict[str, Any], key_prefix: str) -> str:
    return str(obj.get(f"{key_prefix}_xl") or obj.get(f"{key_prefix}_big") or obj.get(f"{key_prefix}_medium") or "")


def find_track_with_strategy(
    session: requests.Session,
    limiter: RateLimiter,
    song_title: str,
    artist_name: str,
    mode: str = "begin",
) -> Tuple[Optional[Dict[str, Any]], List[str], str]:
    exact_query = f'track:"{song_title}" artist:"{artist_name}"'
    simple_song = simplify_for_search(song_title)
    simple_artist = simplify_for_search(artist_name)
    simplified_query = f'track:"{simple_song}" artist:"{simple_artist}"'

    if mode == "retry_skipped":
        query_plan = [
            ("exact_1", exact_query),
            ("simplified", simplified_query),
            ("exact_2", exact_query),
        ]
    else:
        query_plan = [
            ("exact", exact_query),
            ("simplified", simplified_query),
        ]

    attempts: List[str] = []
    for label, query in query_plan:
        attempts.append(label)
        payload = request_json(session, limiter, f"{DEEZER_BASE}/search", {"q": query})
        tracks = (payload or {}).get("data") or []
        if not tracks:
            continue

        wanted_song = normalize_text(song_title)
        wanted_artist = normalize_text(artist_name)
        wanted_song_simple = simplify_for_search(song_title)
        wanted_artist_simple = simplify_for_search(artist_name)

        for item in tracks:
            t = normalize_text(item.get("title", ""))
            a = normalize_text((item.get("artist") or {}).get("name", ""))
            if t == wanted_song and a == wanted_artist:
                return item, attempts, label

        for item in tracks:
            t = simplify_for_search(item.get("title", ""))
            a = simplify_for_search((item.get("artist") or {}).get("name", ""))
            if t and a and t == wanted_song_simple and a == wanted_artist_simple:
                return item, attempts, label

    return None, attempts, ""


def fetch_track(session: requests.Session, limiter: RateLimiter, track_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/track/{track_id}", {})


def fetch_album(session: requests.Session, limiter: RateLimiter, album_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/album/{album_id}", {})


def fetch_album_tracks(session: requests.Session, limiter: RateLimiter, album_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/album/{album_id}/tracks", {})


def fetch_artist(session: requests.Session, limiter: RateLimiter, artist_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/artist/{artist_id}", {})


def fetch_artist_albums(session: requests.Session, limiter: RateLimiter, artist_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/artist/{artist_id}/albums", {})


def fetch_artist_top(session: requests.Session, limiter: RateLimiter, artist_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/artist/{artist_id}/top", {"limit": 5})


def fetch_artist_related(session: requests.Session, limiter: RateLimiter, artist_id: int) -> Optional[Dict[str, Any]]:
    return request_json(session, limiter, f"{DEEZER_BASE}/artist/{artist_id}/related", {})


def compact_album_object(album: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not album:
        return {}
    return {
        "id": album.get("id", ""),
        "title": album.get("title", ""),
        "cover": album.get("cover", ""),
        "cover_small": album.get("cover_small", ""),
        "cover_medium": album.get("cover_medium", ""),
        "cover_big": album.get("cover_big", ""),
        "cover_xl": album.get("cover_xl", ""),
    }


def compact_artist_object(artist: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not artist:
        return {}
    return {
        "id": artist.get("id", ""),
        "name": artist.get("name", ""),
        "picture": artist.get("picture", ""),
        "picture_small": artist.get("picture_small", ""),
        "picture_medium": artist.get("picture_medium", ""),
        "picture_big": artist.get("picture_big", ""),
        "picture_xl": artist.get("picture_xl", ""),
    }


def compact_artist_top(artist_top: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    data = (artist_top or {}).get("data") or []
    compacted: List[Dict[str, Any]] = []
    for item in data:
        compacted.append(
            {
                "id": item.get("id", ""),
                "title": item.get("title", ""),
                "preview": item.get("preview", ""),
                "duration": item.get("duration", ""),
                "rank": item.get("rank", ""),
            }
        )
    return compacted


def build_row_from_deezer(
    song_name: str,
    artist_name: str,
    match_strategy: str,
    attempts: List[str],
    track: Dict[str, Any],
    album: Optional[Dict[str, Any]],
    artist: Optional[Dict[str, Any]],
    artist_top: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    album_obj = track.get("album") or {}
    artist_obj = track.get("artist") or {}
    genres = []
    if album:
        genres = [g.get("name", "") for g in ((album.get("genres") or {}).get("data") or []) if g.get("name")]

    contributors = []
    if album:
        contributors = [c.get("name", "") for c in (album.get("contributors") or []) if c.get("name")]

    now_text = datetime.now().isoformat()
    track_id = track.get("id", "")
    album_id = album_obj.get("id", "")
    artist_id = artist_obj.get("id", "")
    tracklist_url = (album or {}).get("tracklist") or (f"https://api.deezer.com/album/{album_id}/tracks" if album_id else "")

    return {
        "song_name": song_name,
        "artist_name": artist_name,
        "skipped": False,
        "skip_reason": "",
        "track_id": track_id,
        "album_id": album_id,
        "preview_url": track.get("preview", ""),
        "preview_live_pull_endpoint": f"https://api.deezer.com/track/{track_id}" if track_id else "",
        "lyrics_url": "",
        "release_date": (album or {}).get("release_date", ""),
        "genres": genres,
        "record_type": (album or {}).get("record_type", ""),
        "contributors": contributors,
        "explicit_lyrics": track.get("explicit_lyrics", ""),
        "explicit_content_cover": (album or {}).get("explicit_content_cover", ""),
        "album_object": compact_album_object(album),
        "artist_object": compact_artist_object(artist),
        "artist_top_5_tracks": compact_artist_top(artist_top),
        "endpoints_header": "DOCUMENTED LIVE PULL ENDPOINTS",
        "endpoint_tracklist": tracklist_url,
        "endpoint_album_tracks": f"https://api.deezer.com/album/{album_id}/tracks" if album_id else "",
        "endpoint_artist_albums": f"https://api.deezer.com/artist/{artist_id}/albums" if artist_id else "",
        "endpoint_artist_related": f"https://api.deezer.com/artist/{artist_id}/related" if artist_id else "",
        "source": "deezer",
        "match_strategy": match_strategy,
        "attempt_trail": attempts,
        "updated_at": now_text,
    }
