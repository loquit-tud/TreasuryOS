from __future__ import annotations

from fastapi import HTTPException, Request

from app.config import get_settings


def require_api_key(request: Request) -> None:
    """
    Lightweight auth for productization.

    - If API_KEYS is unset, this is a no-op (dev/demo).
    - If API_KEYS is set, require X-API-Key to match one of them.
    """

    settings = get_settings()
    allowed = settings.api_key_set
    if not allowed:
        return

    presented = (request.headers.get("x-api-key") or "").strip()
    if not presented or presented not in allowed:
        raise HTTPException(status_code=401, detail="Unauthorized")

