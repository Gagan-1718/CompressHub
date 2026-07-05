"""
Persistent library store (SQLite via stdlib sqlite3).

Saving is opt-in: nothing is persisted automatically. When the user confirms
"save to library", a completed compression job (kind='compressed') or an edited
image from the Enhance studio (kind='enhanced') is written here so it survives
backend restarts and shows up in the Library.
"""
import json
import sqlite3
import threading
import time
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
                kind TEXT NOT NULL DEFAULT 'compressed',
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
        # Migrate older DBs that predate the `kind` column
        cols = {r[1] for r in conn.execute("PRAGMA table_info(jobs)").fetchall()}
        if "kind" not in cols:
            conn.execute("ALTER TABLE jobs ADD COLUMN kind TEXT NOT NULL DEFAULT 'compressed'")


def save_compressed(
    job_id: str,
    filename: str,
    original_size: int,
    compressed_size: int,
    savings_percent: float,
    filepath: Optional[str],
    compressed_path: str,
    metrics: Dict[str, Any],
    thumbnail: str,
) -> None:
    """Persist a completed compression job (upsert)."""
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO jobs
                (job_id, kind, filename, status, created_at, completed_at,
                 original_size, compressed_size, savings_percent, filepath,
                 compressed_path, metrics_json, thumbnail)
            VALUES (?, 'compressed', ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                job_id, filename, time.time(), time.time(),
                original_size, compressed_size, savings_percent, filepath,
                compressed_path, json.dumps(metrics), thumbnail,
            ),
        )


def save_enhanced(
    job_id: str,
    filename: str,
    file_size: int,
    image_path: str,
    thumbnail: str,
) -> None:
    """Persist an edited image from the Enhance studio."""
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO jobs
                (job_id, kind, filename, status, created_at, completed_at,
                 original_size, compressed_size, savings_percent, filepath,
                 compressed_path, metrics_json, thumbnail)
            VALUES (?, 'enhanced', ?, 'completed', ?, ?, ?, ?, NULL, NULL, ?, NULL, ?)
            """,
            (
                job_id, filename, time.time(), time.time(),
                file_size, file_size, image_path, thumbnail,
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


def list_completed(kind: Optional[str] = None, limit: int = 200) -> List[Dict[str, Any]]:
    query = (
        "SELECT job_id, kind, filename, completed_at, original_size, compressed_size, "
        "savings_percent, thumbnail FROM jobs WHERE status = 'completed'"
    )
    params: list = []
    if kind:
        query += " AND kind = ?"
        params.append(kind)
    query += " ORDER BY completed_at DESC LIMIT ?"
    params.append(limit)
    with _lock, _connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(row) for row in rows]


def delete_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Remove a job row; returns the row (for file cleanup) or None."""
    job = get_job(job_id)
    if job is not None:
        with _lock, _connect() as conn:
            conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
    return job


init_db()
