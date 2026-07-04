"""
Persistent job store (SQLite via stdlib sqlite3).

The in-memory `compression_jobs` dict remains the fast path for the live
request flow; this store persists completed jobs so the Library page (and
downloads) survive backend restarts. Everything is stored in one table with
the display metrics as a JSON blob plus a small thumbnail data URL.
"""
import json
import sqlite3
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..config import settings

_DB_PATH = settings.upload_dir.parent / "jobs.db"
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _lock, _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at REAL NOT NULL,
                completed_at REAL,
                original_size INTEGER,
                compressed_size INTEGER,
                savings_percent REAL,
                filepath TEXT,
                compressed_path TEXT,
                metrics_json TEXT,
                thumbnail TEXT
            )
            """
        )


def save_upload(job_id: str, filename: str, filepath: str) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO jobs (job_id, filename, status, created_at, filepath)
            VALUES (?, ?, 'uploaded', ?, ?)
            """,
            (job_id, filename, time.time(), filepath),
        )


def save_completed(
    job_id: str,
    original_size: int,
    compressed_size: int,
    savings_percent: float,
    compressed_path: str,
    metrics: Dict[str, Any],
    thumbnail: str,
) -> None:
    with _lock, _connect() as conn:
        conn.execute(
            """
            UPDATE jobs SET
                status = 'completed',
                completed_at = ?,
                original_size = ?,
                compressed_size = ?,
                savings_percent = ?,
                compressed_path = ?,
                metrics_json = ?,
                thumbnail = ?
            WHERE job_id = ?
            """,
            (
                time.time(),
                original_size,
                compressed_size,
                savings_percent,
                compressed_path,
                json.dumps(metrics),
                thumbnail,
                job_id,
            ),
        )


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with _lock, _connect() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
    if row is None:
        return None
    job = dict(row)
    if job.get("metrics_json"):
        job["metrics"] = json.loads(job["metrics_json"])
    job.pop("metrics_json", None)
    return job


def list_completed(limit: int = 100) -> List[Dict[str, Any]]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            """
            SELECT job_id, filename, completed_at, original_size, compressed_size,
                   savings_percent, thumbnail
            FROM jobs
            WHERE status = 'completed'
            ORDER BY completed_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def delete_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Remove a job row; returns the row (for file cleanup) or None."""
    job = get_job(job_id)
    if job is not None:
        with _lock, _connect() as conn:
            conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
    return job


init_db()
