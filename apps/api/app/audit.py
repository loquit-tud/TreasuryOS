from __future__ import annotations

import hashlib

from fastapi import Request


def auth_subject(request: Request) -> str:
    """
    Stable, non-secret identifier for the caller.

    - If X-API-Key is present: hash it and keep a short prefix.
    - Otherwise: mark as public/unknown.
    """

    key = (request.headers.get("x-api-key") or "").strip()
    if not key:
        return "public"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return f"key:{digest[:12]}"


def request_id(request: Request) -> str | None:
    rid = getattr(request.state, "request_id", None)
    return str(rid) if rid else None

