"""Security and rate-limiting middleware for SecureAct AI."""
import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .config import (
    MAX_REQUEST_BODY_BYTES,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS
)


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Enforces strict 1 MiB limit on incoming HTTP request bodies."""

    async def dispatch(self, request: Request, call_next):
        # 1. Check Content-Length header if provided
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > MAX_REQUEST_BODY_BYTES:
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": "payload_too_large",
                            "detail": f"حجم الطلب ({length} بايت) يتجاوز الحد المسموح (1 MiB / {MAX_REQUEST_BODY_BYTES} بايت)",
                            "limit_bytes": MAX_REQUEST_BODY_BYTES,
                            "actual_bytes": length
                        }
                    )
            except ValueError:
                pass

        # 2. For POST/PUT requests, stream-check body size
        if request.method in ("POST", "PUT", "PATCH"):
            body = await request.body()
            actual_size = len(body)
            if actual_size > MAX_REQUEST_BODY_BYTES:
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": "payload_too_large",
                        "detail": f"حجم الطلب ({actual_size} بايت) يتجاوز الحد المسموح (1 MiB / {MAX_REQUEST_BODY_BYTES} بايت)",
                        "limit_bytes": MAX_REQUEST_BODY_BYTES,
                        "actual_bytes": actual_size
                    }
                )

        response = await call_next(request)
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding window rate limiter: 30 requests/minute per client IP."""

    def __init__(self, app):
        super().__init__(app)
        self.requests_log: Dict[str, List[float]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        # Check X-Forwarded-For if behind proxy
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        if request.client and request.client.host:
            return request.client.host
        return "127.0.0.1"

    async def dispatch(self, request: Request, call_next):
        # Skip health checks
        if request.url.path in ("/health", "/"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        now = time.time()
        window_start = now - RATE_LIMIT_WINDOW_SECONDS

        # Prune older entries
        recent = [t for t in self.requests_log[client_ip] if t > window_start]
        self.requests_log[client_ip] = recent

        if len(recent) >= RATE_LIMIT_REQUESTS:
            oldest = recent[0]
            retry_after = int(RATE_LIMIT_WINDOW_SECONDS - (now - oldest)) + 1
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "detail": "تم تجاوز حد الطلبات المسموح (30 طلباً في الدقيقة). يرجى الانتظار والمحاولة لاحقاً.",
                    "limit_requests": RATE_LIMIT_REQUESTS,
                    "window_seconds": RATE_LIMIT_WINDOW_SECONDS,
                    "retry_after_seconds": retry_after
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(RATE_LIMIT_REQUESTS),
                    "X-RateLimit-Remaining": "0"
                }
            )

        self.requests_log[client_ip].append(now)
        remaining = max(0, RATE_LIMIT_REQUESTS - len(self.requests_log[client_ip]))

        response: Response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_REQUESTS)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
