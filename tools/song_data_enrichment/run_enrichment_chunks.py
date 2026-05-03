#!/usr/bin/env python3
"""Chunked enrichment runner with checkpoint logs, stall handling, and integrity checks."""

from __future__ import annotations

import argparse
import csv
import json
import os
import select
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def count_csv_rows(path: Path) -> int:
    if not path.exists():
        return 0
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return max(sum(1 for _ in f) - 1, 0)


def count_input_dedup_rows(path: Path) -> int:
    seen = set()
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        first = True
        for row in reader:
            if not row or len(row) < 2:
                continue
            c1 = (row[0] or "").strip()
            c2 = (row[1] or "").strip()
            # header support
            if first:
                first = False
                if c1.lower() == "song_title" and c2.lower() == "artist_name":
                    continue
            if c1.upper() == "NULL" or c2.upper() == "NULL" or not c1 or not c2:
                continue
            key = (c1.strip().lower(), c2.strip().lower())
            seen.add(key)
    return len(seen)


def append_jsonl(path: Path, event: Dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def output_stats(csv_path: Path) -> Dict[str, int]:
    if not csv_path.exists():
        return {"rows": 0, "matched": 0, "skipped": 0}
    rows = 0
    matched = 0
    skipped = 0
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows += 1
            deezer = str(row.get("deezer_found", "")).strip().lower() == "true"
            genius = str(row.get("genius_found", "")).strip().lower() == "true"
            if deezer or genius:
                matched += 1
            else:
                skipped += 1
    return {"rows": rows, "matched": matched, "skipped": skipped}


def last_success_offset(checkpoint_path: Path) -> int:
    if not checkpoint_path.exists():
        return 0
    last = 0
    with checkpoint_path.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            if e.get("event") == "chunk_done" and e.get("exit_code") == 0:
                processed = (e.get("summary") or {}).get("processed") or e.get("attempt_limit") or 0
                if isinstance(processed, int):
                    last = max(last, int(e.get("offset", 0)) + processed)
    return last


def last_run_source_mode(checkpoint_path: Path) -> Optional[str]:
    if not checkpoint_path.exists():
        return None
    latest_mode: Optional[str] = None
    with checkpoint_path.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                e = json.loads(line)
            except json.JSONDecodeError:
                continue
            mode = e.get("source_mode")
            if mode in ("both", "deezer-only"):
                latest_mode = mode
    return latest_mode


def build_unmatched_input(output_csv: Path, dest_csv: Path) -> int:
    rows: List[Dict[str, str]] = []
    if output_csv.exists():
        with output_csv.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                deezer = str(row.get("deezer_found", "")).strip().lower() == "true"
                genius = str(row.get("genius_found", "")).strip().lower() == "true"
                if deezer or genius:
                    continue
                song = (row.get("song_name") or "").strip()
                artist = (row.get("artist_name") or "").strip()
                if song and artist:
                    rows.append({"song_title": song, "artist_name": artist})
    dedup = {}
    for r in rows:
        dedup[(r["song_title"].lower(), r["artist_name"].lower())] = r
    out_rows = list(dedup.values())
    dest_csv.parent.mkdir(parents=True, exist_ok=True)
    with dest_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["song_title", "artist_name"])
        writer.writeheader()
        writer.writerows(out_rows)
    return len(out_rows)


def run_chunk(
    repo_root: Path,
    offset: int,
    limit: int,
    timeout_sec: int,
    output_dir: Path,
    deezer_only: bool,
) -> Dict:
    cmd = [
        "python3",
        "tools/song_data_enrichment/enrich_songs.py",
        "--offset",
        str(offset),
        "--limit",
        str(limit),
        "--merge-output",
        "--live-progress",
        "--output-dir",
        str(output_dir),
    ]
    if deezer_only:
        cmd.append("--deezer-only")

    started_at = now_iso()
    start_time = time.time()
    proc = subprocess.Popen(
        cmd,
        cwd=str(repo_root),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    raw_output = ""
    timed_out = False
    while True:
        if time.time() - start_time > timeout_sec:
            timed_out = True
            proc.kill()
            break
        if proc.stdout is None:
            break
        fd = proc.stdout.fileno()
        ready, _, _ = select.select([fd], [], [], 1.0)
        if ready:
            chunk = os.read(fd, 4096)
            if chunk:
                text = chunk.decode("utf-8", errors="replace")
                print(text, end="", flush=True)
                raw_output += text
        if proc.poll() is not None:
            rest = b""
            if proc.stdout is not None:
                try:
                    rest = os.read(proc.stdout.fileno(), 65536)
                except Exception:
                    rest = b""
            if rest:
                text = rest.decode("utf-8", errors="replace")
                print(text, end="", flush=True)
                raw_output += text
            break
    return_code = proc.wait()
    duration = round(time.time() - start_time, 2)
    summary: Optional[Dict] = None
    stdout = raw_output
    stderr = ""
    parsed_lines = [ln.strip() for ln in raw_output.splitlines() if ln.strip()]

    for i, ln in enumerate(parsed_lines):
        if ln.startswith("{"):
            blob = "\n".join(parsed_lines[i:])
            try:
                summary = json.loads(blob)
                break
            except json.JSONDecodeError:
                pass

    return {
        "offset_started": offset,
        "offset_completed": offset + limit,
        "limit": limit,
        "started_at": started_at,
        "ended_at": now_iso(),
        "duration_seconds": duration,
        "exit_code": (-9 if timed_out else return_code),
        "summary": summary,
        "stdout": stdout,
        "stderr": stderr,
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run enrichment in checkpointed chunks")
    p.add_argument("--input", default="tools/song_data_enrichment/input_songs.csv")
    p.add_argument("--output-dir", default="tools/song_data_enrichment/output")
    p.add_argument("--chunk-size", type=int, default=500)
    p.add_argument("--start-offset", type=int, default=0)
    p.add_argument("--max-chunks", type=int, default=0, help="0 means run to completion")
    p.add_argument("--stall-timeout-sec", type=int, default=1800)
    p.add_argument("--retry-on-stall", type=int, default=1)
    p.add_argument("--reduced-chunk-on-second-stall", type=int, default=200)
    p.add_argument(
        "--checkpoint-log",
        default="tools/song_data_enrichment/output/chunk_checkpoints.jsonl",
    )
    p.add_argument(
        "--mode",
        choices=["begin", "resume", "unmatched"],
        default=None,
        help="Run mode: begin from 0, resume from last success, or unmatched-only second pass.",
    )
    p.add_argument(
        "--source-mode",
        choices=["both", "deezer-only"],
        default=None,
        help="Data source mode: both Deezer+Genius, or Deezer-only.",
    )
    return p.parse_args()


def ensure_outputs_exist(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)


def main() -> int:
    args = parse_args()
    repo_root = Path.cwd()
    input_path = repo_root / args.input
    output_dir = repo_root / args.output_dir
    checkpoint_path = repo_root / args.checkpoint_log
    csv_out = output_dir / "enriched_songs.csv"
    json_out = output_dir / "enriched_songs.json"
    txt_out = output_dir / "enriched_songs.txt"

    ensure_outputs_exist(output_dir)

    mode = args.mode
    source_mode = args.source_mode
    deezer_only = False

    if mode is None and sys.stdin.isatty():
        print("")
        print("Choose run mode:")
        print("1) Start from beginning")
        print("2) Resume where last successful chunk ended")
        print("3) Second pass: unmatched/skipped only")
        choice = input("Enter 1, 2, or 3: ").strip()
        mode = {"1": "begin", "2": "resume", "3": "unmatched"}.get(choice, "resume")
    if mode is None:
        mode = "resume"

    checkpoint_source_mode = last_run_source_mode(checkpoint_path)
    if mode == "resume":
        if source_mode is None and checkpoint_source_mode in ("both", "deezer-only"):
            source_mode = checkpoint_source_mode
            print(
                "[runner] resume mode detected; reusing checkpoint source mode: "
                f"{'Deezer-only' if source_mode == 'deezer-only' else 'Deezer + Genius'}"
            )
        elif source_mode in ("both", "deezer-only") and checkpoint_source_mode and source_mode != checkpoint_source_mode:
            print(
                "[runner] source mode mismatch in resume mode: "
                f"checkpoint={checkpoint_source_mode} requested={source_mode}"
            )
            print(
                "[runner] refusing to continue to prevent accidental mode flip. "
                "Use --mode begin for a fresh run or choose the checkpoint mode."
            )
            return 2

    if source_mode is None and sys.stdin.isatty():
        print("")
        print("Choose source mode:")
        print("1) Deezer + Genius")
        print("2) Deezer-only (skip Genius)")
        source_choice = input("Enter 1 or 2: ").strip()
        source_mode = "deezer-only" if source_choice == "2" else "both"

    if source_mode is None:
        source_mode = "both"
    deezer_only = source_mode == "deezer-only"

    if mode == "begin":
        offset = 0
    elif mode == "resume":
        offset = last_success_offset(checkpoint_path)
    else:
        unmatched_input = repo_root / "tools/song_data_enrichment/output/unmatched_input.csv"
        count = build_unmatched_input(csv_out, unmatched_input)
        print(f"[runner] built unmatched-only input: {count} rows")
        input_path = unmatched_input
        offset = 0

    if not input_path.exists():
        print(f"Input CSV not found: {input_path}")
        return 2

    total_dedup = count_input_dedup_rows(input_path)
    stats = output_stats(csv_out)
    print(
        f"[runner] matched so far: {stats['matched']}/{total_dedup} | "
        f"skipped so far: {stats['skipped']}/{total_dedup}"
    )
    print(f"[runner] source mode: {'Deezer-only' if deezer_only else 'Deezer + Genius'}")
    print(f"[runner] deduped input rows: {total_dedup}")
    if args.start_offset != 0:
        offset = args.start_offset
    print(f"[runner] effective start offset: {offset}")
    chunks_run = 0
    target_chunks = args.max_chunks if args.max_chunks > 0 else None

    while offset < total_dedup:
        if target_chunks is not None and chunks_run >= target_chunks:
            print("[runner] reached max chunks for this invocation.")
            break

        before_rows = count_csv_rows(csv_out)
        chunk_size = args.chunk_size

        event_start = {
            "event": "chunk_start",
            "timestamp": now_iso(),
            "offset": offset,
            "chunk_size": chunk_size,
            "before_output_rows": before_rows,
            "source_mode": source_mode,
        }
        append_jsonl(checkpoint_path, event_start)
        print(
            "[runner] start "
            f"offset={offset} size={chunk_size} before_rows={before_rows} "
            f"source_mode={'Deezer-only' if deezer_only else 'Deezer + Genius'}"
        )

        try:
            result = run_chunk(
                repo_root=repo_root,
                offset=offset,
                limit=chunk_size,
                timeout_sec=args.stall_timeout_sec,
                output_dir=output_dir,
                deezer_only=deezer_only,
            )
        except subprocess.TimeoutExpired:
            result = {
                "offset_started": offset,
                "offset_completed": offset + chunk_size,
                "limit": chunk_size,
                "started_at": now_iso(),
                "ended_at": now_iso(),
                "duration_seconds": args.stall_timeout_sec,
                "exit_code": -9,
                "summary": None,
                "stdout": "",
                "stderr": f"Timed out after {args.stall_timeout_sec} seconds",
            }

        if result["exit_code"] == -9:
            append_jsonl(
                checkpoint_path,
                {
                    "event": "chunk_stall",
                    "timestamp": now_iso(),
                    "offset": offset,
                    "chunk_size": chunk_size,
                    "message": result["stderr"],
                },
            )

            retried = False
            for _ in range(args.retry_on_stall):
                retried = True
                print(f"[runner] stall at offset={offset}; retrying same chunk once")
                try:
                    result = run_chunk(
                        repo_root=repo_root,
                        offset=offset,
                        limit=chunk_size,
                        timeout_sec=args.stall_timeout_sec,
                        output_dir=output_dir,
                        deezer_only=deezer_only,
                    )
                except subprocess.TimeoutExpired:
                    result = {
                        "offset_started": offset,
                        "offset_completed": offset + chunk_size,
                        "limit": chunk_size,
                        "started_at": now_iso(),
                        "ended_at": now_iso(),
                        "duration_seconds": args.stall_timeout_sec,
                        "exit_code": -9,
                        "summary": None,
                        "stdout": "",
                        "stderr": f"Timed out after {args.stall_timeout_sec} seconds",
                    }

                if result["exit_code"] == 0:
                    break

            if result["exit_code"] == -9 and retried:
                reduced = min(args.reduced_chunk_on_second_stall, chunk_size)
                if reduced < chunk_size:
                    print(
                        f"[runner] second stall at offset={offset}; reducing chunk size to {reduced}"
                    )
                    try:
                        result = run_chunk(
                            repo_root=repo_root,
                            offset=offset,
                            limit=reduced,
                            timeout_sec=args.stall_timeout_sec,
                            output_dir=output_dir,
                            deezer_only=deezer_only,
                        )
                        result["limit"] = reduced
                        result["offset_completed"] = offset + reduced
                    except subprocess.TimeoutExpired:
                        pass

        after_rows = count_csv_rows(csv_out)
        outputs_ok = csv_out.exists() and json_out.exists() and txt_out.exists()
        row_delta = after_rows - before_rows
        dedupe_stable = row_delta >= 0

        event_done = {
            "event": "chunk_done",
            "timestamp": now_iso(),
            "offset": offset,
            "attempt_limit": result.get("limit", chunk_size),
            "source_mode": source_mode,
            "exit_code": result["exit_code"],
            "duration_seconds": result["duration_seconds"],
            "before_output_rows": before_rows,
            "after_output_rows": after_rows,
            "row_delta": row_delta,
            "outputs_ok": outputs_ok,
            "dedupe_stable": dedupe_stable,
            "summary": result.get("summary"),
            "stderr_tail": (result.get("stderr") or "")[-1000:],
        }
        append_jsonl(checkpoint_path, event_done)

        print(
            "[runner] done "
            f"offset={offset} exit={result['exit_code']} "
            f"rows_before={before_rows} rows_after={after_rows} delta={row_delta}"
        )

        if result["exit_code"] != 0:
            print("[runner] chunk failed; stopping.")
            print(result.get("stdout", ""))
            print(result.get("stderr", ""))
            return 1

        if not outputs_ok or not dedupe_stable:
            print("[runner] integrity check failed; stopping.")
            return 1

        processed = (result.get("summary") or {}).get("processed") or result.get("limit", chunk_size)
        if not isinstance(processed, int) or processed <= 0:
            processed = result.get("limit", chunk_size)
        offset += processed
        chunks_run += 1

    print("[runner] complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
