"""Redis Streams feed for constitutional decisions (optional when REDIS_URL is unset)."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import redis

from app.config import get_settings

logger = logging.getLogger(__name__)

STREAM_KEY = "treasuryos:decisions"
_MAXLEN = "~5000"

_client: redis.Redis | None = None


def _get_client() -> redis.Redis | None:
    global _client
    settings = get_settings()
    if not settings.redis_url:
        return None
    if _client is None:
        _client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    return _client


def publish_decision_event(
    *,
    vault_id: str,
    proposal_id: str,
    verdict: str,
    reasons: list[str],
) -> None:
    """Append one decision to the stream (no-op if Redis is not configured)."""
    client = _get_client()
    if client is None:
        return
    fields = {
        "vault_id": vault_id,
        "proposal_id": proposal_id,
        "verdict": verdict,
        "reasons": json.dumps(reasons),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    try:
        client.xadd(STREAM_KEY, fields, maxlen=_MAXLEN, approximate=True)
    except redis.RedisError as exc:
        logger.warning("Redis XADD failed: %s", exc)


def fetch_recent_decisions(limit: int = 100) -> tuple[list[dict[str, Any]], bool]:
    """Return newest decision events first. Second value is whether Redis is configured."""
    client = _get_client()
    if client is None:
        return [], False
    try:
        entries = client.xrevrange(STREAM_KEY, count=max(1, min(limit, 500)))
    except redis.RedisError as exc:
        logger.warning("Redis XREVRANGE failed: %s", exc)
        return [], True
    out: list[dict[str, Any]] = []
    for entry_id, fields in entries:
        row = dict(fields)
        row["id"] = entry_id
        reasons_raw = row.get("reasons", "[]")
        try:
            row["reasons"] = json.loads(reasons_raw) if isinstance(reasons_raw, str) else reasons_raw
        except json.JSONDecodeError:
            row["reasons"] = []
        out.append(row)
    return out, True
