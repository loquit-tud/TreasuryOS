from __future__ import annotations

import json
import logging
import time
import uuid

from fastapi import Request

logger = logging.getLogger("treasuryos.api")


def _json_log(payload: dict) -> None:
    # Railway and most PaaS log collectors handle single-line JSON well.
    logger.info(json.dumps(payload, separators=(",", ":"), ensure_ascii=False))


def get_or_create_request_id(request: Request) -> str:
    incoming = (request.headers.get("x-request-id") or "").strip()
    if incoming:
        return incoming[:128]
    return uuid.uuid4().hex


async def log_request(request: Request, response, elapsed_ms: int, request_id: str) -> None:
    _json_log(
        {
            "event": "http_request",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query": request.url.query,
            "status": getattr(response, "status_code", None),
            "elapsed_ms": elapsed_ms,
            "client": getattr(request.client, "host", None) if request.client else None,
        }
    )


def start_timer() -> float:
    return time.perf_counter()


def elapsed_ms(start: float) -> int:
    return int((time.perf_counter() - start) * 1000)

