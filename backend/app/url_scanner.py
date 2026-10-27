"""Secure URL scanner with comprehensive SSRF protection.

Fetches web page content for analysis by the SecureAct AI model,
with strict controls against Server-Side Request Forgery (SSRF).
"""
import ipaddress
import logging
import socket
import time
import urllib.parse
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

import httpx

from .config import (
    MAX_TEXT_UNICODE_CHARS,
    URL_CONNECT_TIMEOUT,
    URL_READ_TIMEOUT,
    URL_MAX_RESPONSE_BYTES,
    URL_MAX_REDIRECTS,
    URL_ALLOWED_PORTS,
    URL_BATCH_MAX,
    URL_BATCH_CONCURRENCY,
)

logger = logging.getLogger("secureact.url_scanner")

# ---------------------------------------------------------------------------
# SSRF Protection: Blocked IP networks
# ---------------------------------------------------------------------------
BLOCKED_NETWORKS = [
    # IPv4 private / reserved
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),       # Carrier-grade NAT
    ipaddress.ip_network("127.0.0.0/8"),          # Loopback
    ipaddress.ip_network("169.254.0.0/16"),       # Link-local
    ipaddress.ip_network("172.16.0.0/12"),        # Private
    ipaddress.ip_network("192.0.0.0/24"),         # IETF protocol assignments
    ipaddress.ip_network("192.0.2.0/24"),         # TEST-NET-1
    ipaddress.ip_network("192.88.99.0/24"),       # 6to4 relay
    ipaddress.ip_network("192.168.0.0/16"),       # Private
    ipaddress.ip_network("198.18.0.0/15"),        # Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),      # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),       # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),          # Multicast
    ipaddress.ip_network("240.0.0.0/4"),          # Reserved
    ipaddress.ip_network("255.255.255.255/32"),   # Broadcast
    # IPv6
    ipaddress.ip_network("::1/128"),              # Loopback
    ipaddress.ip_network("::/128"),               # Unspecified
    ipaddress.ip_network("fc00::/7"),             # Unique local
    ipaddress.ip_network("fe80::/10"),            # Link-local
    ipaddress.ip_network("ff00::/8"),             # Multicast
    # Cloud metadata endpoints
    ipaddress.ip_network("169.254.169.254/32"),   # AWS/GCP/Azure metadata
    ipaddress.ip_network("fd00:ec2::254/128"),    # AWS IMDSv2 IPv6
]

ALLOWED_SCHEMES: Set[str] = {"http", "https"}
ALLOWED_CONTENT_TYPES: Set[str] = {
    "text/html",
    "application/xhtml+xml",
    "text/plain",
    "application/xml",
    "text/xml",
}


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------
@dataclass
class FetchResult:
    """Result of a URL fetch operation."""
    success: bool
    url: str
    final_url: Optional[str] = None
    status_code: Optional[int] = None
    content_type: Optional[str] = None
    html_content: Optional[str] = None
    content_length: Optional[int] = None
    char_count: Optional[int] = None
    fetch_time_ms: Optional[float] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    redirects_followed: int = 0
    js_rendered: bool = False


@dataclass
class ScanResult:
    """Combined fetch + model prediction result."""
    url: str
    fetch: FetchResult
    prediction: Optional[Dict[str, Any]] = None
    scan_time_iso: str = ""


@dataclass
class BatchScanResult:
    """Result of scanning multiple URLs."""
    total_urls: int = 0
    completed: int = 0
    failed: int = 0
    flagged: int = 0
    results: List[ScanResult] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
def validate_url(raw_url: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate URL format and scheme.
    Returns: (is_valid, normalized_url, error_message)
    """
    raw_url = raw_url.strip()
    if not raw_url:
        return False, None, "URL is empty."

    # Check if an explicit scheme is present (e.g. ftp:, javascript:, data:, file:)
    if ":" in raw_url:
        scheme_candidate = raw_url.split(":", 1)[0].strip().lower()
        # If it looks like a scheme (alphanumeric letters) and not an allowed scheme, reject
        if scheme_candidate.isalnum() and scheme_candidate not in ALLOWED_SCHEMES:
            return False, None, f"Scheme '{scheme_candidate}' is not allowed. Only HTTP and HTTPS are permitted."

    # Add default scheme if no scheme indicator is present
    if "://" not in raw_url:
        raw_url = "https://" + raw_url

    try:
        parsed = urllib.parse.urlparse(raw_url)
    except Exception:
        return False, None, "Invalid URL format."

    # Scheme check
    if not parsed.scheme or parsed.scheme.lower() not in ALLOWED_SCHEMES:
        return False, None, f"Scheme '{parsed.scheme}' is not allowed. Only HTTP and HTTPS are permitted."

    # Reject embedded credentials (user:pass@host)
    if parsed.username or parsed.password:
        return False, None, "URLs with embedded credentials are not allowed."

    # Host check
    if not parsed.hostname:
        return False, None, "URL has no valid hostname."

    hostname = parsed.hostname.lower()

    # Reject empty or whitespace-only hostnames
    if not hostname or hostname.isspace():
        return False, None, "URL has an empty hostname."

    # Port check
    try:
        port = parsed.port
    except ValueError:
        return False, None, "Invalid port number in URL."

    if port is None:
        port = 443 if parsed.scheme == "https" else 80
    if port not in URL_ALLOWED_PORTS:
        return False, None, f"Port {port} is not allowed. Permitted ports: {sorted(URL_ALLOWED_PORTS)}."

    return True, raw_url, None


def is_ip_blocked(ip_str: str) -> bool:
    """Check if an IP address falls within any blocked network."""
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError:
        return True  # If we can't parse it, block it

    for network in BLOCKED_NETWORKS:
        if addr in network:
            return True

    # Additional checks
    if addr.is_private or addr.is_loopback or addr.is_reserved:
        return True
    if addr.is_link_local or addr.is_multicast:
        return True
    if isinstance(addr, ipaddress.IPv6Address) and addr.is_site_local:
        return True

    return False


def resolve_and_validate_host(hostname: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Resolve hostname via DNS and validate all resulting IPs.
    Returns: (is_safe, first_safe_ip, error_message)
    """
    # Check if hostname is a raw IP
    try:
        addr = ipaddress.ip_address(hostname)
        if is_ip_blocked(str(addr)):
            return False, None, "Direct IP address points to a blocked network."
        return True, str(addr), None
    except ValueError:
        pass  # Not a raw IP, proceed with DNS resolution

    try:
        addrinfos = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror as e:
        return False, None, f"DNS resolution failed for '{hostname}': {e}"
    except Exception as e:
        return False, None, f"DNS resolution error: {e}"

    if not addrinfos:
        return False, None, f"No DNS records found for '{hostname}'."

    resolved_ips = set()
    for family, _, _, _, sockaddr in addrinfos:
        ip = sockaddr[0]
        resolved_ips.add(ip)

    # ALL resolved IPs must be safe
    for ip in resolved_ips:
        if is_ip_blocked(ip):
            return False, None, f"Resolved IP address is in a blocked network range."

    return True, list(resolved_ips)[0], None


# ---------------------------------------------------------------------------
# URL Fetcher
# ---------------------------------------------------------------------------
async def fetch_url(url: str) -> FetchResult:
    """
    Fetch URL content with SSRF protection.
    Validates DNS before connecting, controls redirects manually.
    """
    start_time = time.monotonic()

    # Step 1: Validate URL format
    is_valid, normalized_url, error = validate_url(url)
    if not is_valid:
        return FetchResult(
            success=False, url=url,
            error=error, error_code="invalid_url",
            fetch_time_ms=_elapsed_ms(start_time),
        )
    url = normalized_url

    parsed = urllib.parse.urlparse(url)
    hostname = parsed.hostname

    # Step 2: DNS resolution and SSRF check
    is_safe, resolved_ip, error = resolve_and_validate_host(hostname)
    if not is_safe:
        is_dns_err = bool(error and ("dns resolution" in error.lower() or "no dns records" in error.lower()))
        return FetchResult(
            success=False, url=url,
            error=error,
            error_code="dns_error" if is_dns_err else "ssrf_blocked",
            fetch_time_ms=_elapsed_ms(start_time),
        )

    # Step 3: Fetch with controlled redirects
    redirects_followed = 0
    current_url = url

    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=URL_CONNECT_TIMEOUT,
                read=URL_READ_TIMEOUT,
                write=5.0,
                pool=5.0,
            ),
            follow_redirects=False,
            max_redirects=0,
            verify=True,
            headers={
                "User-Agent": "SecureActAI-Scanner/2.0 (Security Research)",
                "Accept": "text/html,application/xhtml+xml,text/plain",
                "Accept-Language": "en-US,en;q=0.5,ar;q=0.3",
            },
        ) as client:
            while True:
                response = await client.get(current_url)

                # Handle redirects manually
                if response.status_code in (301, 302, 303, 307, 308):
                    redirects_followed += 1
                    if redirects_followed > URL_MAX_REDIRECTS:
                        return FetchResult(
                            success=False, url=url, final_url=current_url,
                            status_code=response.status_code,
                            error=f"Too many redirects (limit: {URL_MAX_REDIRECTS}).",
                            error_code="too_many_redirects",
                            redirects_followed=redirects_followed,
                            fetch_time_ms=_elapsed_ms(start_time),
                        )

                    location = response.headers.get("location")
                    if not location:
                        return FetchResult(
                            success=False, url=url, final_url=current_url,
                            status_code=response.status_code,
                            error="Redirect without Location header.",
                            error_code="invalid_redirect",
                            redirects_followed=redirects_followed,
                            fetch_time_ms=_elapsed_ms(start_time),
                        )

                    # Resolve relative redirect
                    redirect_url = urllib.parse.urljoin(current_url, location)

                    # Validate redirect target
                    is_valid, redirect_url, r_err = validate_url(redirect_url)
                    if not is_valid:
                        return FetchResult(
                            success=False, url=url, final_url=redirect_url,
                            error=f"Redirect blocked: {r_err}",
                            error_code="redirect_blocked",
                            redirects_followed=redirects_followed,
                            fetch_time_ms=_elapsed_ms(start_time),
                        )

                    redirect_parsed = urllib.parse.urlparse(redirect_url)
                    r_safe, _, r_err = resolve_and_validate_host(redirect_parsed.hostname)
                    if not r_safe:
                        is_dns_r = bool(r_err and ("dns resolution" in r_err.lower() or "no dns records" in r_err.lower()))
                        return FetchResult(
                            success=False, url=url, final_url=redirect_url,
                            error=f"Redirect target failed: {r_err}",
                            error_code="redirect_dns_error" if is_dns_r else "redirect_ssrf_blocked",
                            redirects_followed=redirects_followed,
                            fetch_time_ms=_elapsed_ms(start_time),
                        )

                    current_url = redirect_url
                    continue

                # Non-redirect response
                break

        # Step 4: Check HTTP status
        if response.status_code >= 400:
            return FetchResult(
                success=False, url=url, final_url=current_url,
                status_code=response.status_code,
                error=f"HTTP {response.status_code} error from server.",
                error_code="http_error",
                redirects_followed=redirects_followed,
                fetch_time_ms=_elapsed_ms(start_time),
            )

        # Step 5: Check content type
        content_type_raw = response.headers.get("content-type", "")
        content_type = content_type_raw.split(";")[0].strip().lower()
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            return FetchResult(
                success=False, url=url, final_url=current_url,
                status_code=response.status_code,
                content_type=content_type,
                error=f"Content type '{content_type}' is not supported for analysis.",
                error_code="unsupported_content_type",
                redirects_followed=redirects_followed,
                fetch_time_ms=_elapsed_ms(start_time),
            )

        # Step 6: Check response size
        raw_bytes = response.content
        if len(raw_bytes) > URL_MAX_RESPONSE_BYTES:
            return FetchResult(
                success=False, url=url, final_url=current_url,
                status_code=response.status_code,
                content_type=content_type,
                content_length=len(raw_bytes),
                error=f"Response size ({len(raw_bytes):,} bytes) exceeds limit ({URL_MAX_RESPONSE_BYTES:,} bytes).",
                error_code="response_too_large",
                redirects_followed=redirects_followed,
                fetch_time_ms=_elapsed_ms(start_time),
            )

        # Step 7: Decode content
        # Try charset from content-type header first
        charset = "utf-8"
        if "charset=" in content_type_raw.lower():
            try:
                charset = content_type_raw.lower().split("charset=")[1].split(";")[0].strip()
            except Exception:
                charset = "utf-8"

        html_content = None
        for enc in (charset, "utf-8", "utf-8-sig", "latin-1"):
            try:
                html_content = raw_bytes.decode(enc)
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if html_content is None:
            return FetchResult(
                success=False, url=url, final_url=current_url,
                status_code=response.status_code,
                content_type=content_type,
                content_length=len(raw_bytes),
                error="Failed to decode response content as text.",
                error_code="decode_error",
                redirects_followed=redirects_followed,
                fetch_time_ms=_elapsed_ms(start_time),
            )

        # Step 8: Enforce Unicode char limit
        char_count = len(html_content)
        if char_count > MAX_TEXT_UNICODE_CHARS:
            # Truncate to limit rather than reject entirely
            html_content = html_content[:MAX_TEXT_UNICODE_CHARS]
            char_count = MAX_TEXT_UNICODE_CHARS

        if char_count < 1:
            return FetchResult(
                success=False, url=url, final_url=current_url,
                status_code=response.status_code,
                content_type=content_type,
                content_length=len(raw_bytes),
                char_count=0,
                error="Page returned empty content.",
                error_code="empty_content",
                redirects_followed=redirects_followed,
                fetch_time_ms=_elapsed_ms(start_time),
            )

        return FetchResult(
            success=True,
            url=url,
            final_url=current_url if current_url != url else None,
            status_code=response.status_code,
            content_type=content_type,
            html_content=html_content,
            content_length=len(raw_bytes),
            char_count=char_count,
            redirects_followed=redirects_followed,
            fetch_time_ms=_elapsed_ms(start_time),
        )

    except httpx.ConnectTimeout:
        return FetchResult(
            success=False, url=url, error="Connection timed out.",
            error_code="connect_timeout", fetch_time_ms=_elapsed_ms(start_time),
        )
    except httpx.ReadTimeout:
        return FetchResult(
            success=False, url=url, error="Read timed out while downloading content.",
            error_code="read_timeout", fetch_time_ms=_elapsed_ms(start_time),
        )
    except httpx.ConnectError as e:
        return FetchResult(
            success=False, url=url, error="Failed to connect to server.",
            error_code="connect_error", fetch_time_ms=_elapsed_ms(start_time),
        )
    except httpx.TooManyRedirects:
        return FetchResult(
            success=False, url=url, error="Too many redirects.",
            error_code="too_many_redirects", fetch_time_ms=_elapsed_ms(start_time),
        )
    except Exception as e:
        logger.error(f"Unexpected fetch error for {url}: {e}")
        return FetchResult(
            success=False, url=url,
            error="An unexpected error occurred during fetch.",
            error_code="internal_error",
            fetch_time_ms=_elapsed_ms(start_time),
        )


# ---------------------------------------------------------------------------
# Batch scanner
# ---------------------------------------------------------------------------
async def fetch_urls_batch(urls: List[str]) -> List[FetchResult]:
    """Fetch multiple URLs with concurrency control."""
    import asyncio

    # Deduplicate while preserving order
    seen: Set[str] = set()
    unique_urls: List[str] = []
    for u in urls:
        normalized = u.strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_urls.append(normalized)

    if len(unique_urls) > URL_BATCH_MAX:
        unique_urls = unique_urls[:URL_BATCH_MAX]

    semaphore = asyncio.Semaphore(URL_BATCH_CONCURRENCY)

    async def _fetch_with_semaphore(url: str) -> FetchResult:
        async with semaphore:
            return await fetch_url(url)

    tasks = [_fetch_with_semaphore(u) for u in unique_urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    fetch_results: List[FetchResult] = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            fetch_results.append(FetchResult(
                success=False,
                url=unique_urls[i],
                error=f"Internal error: {type(r).__name__}",
                error_code="internal_error",
            ))
        else:
            fetch_results.append(r)

    return fetch_results


def _elapsed_ms(start: float) -> float:
    return round((time.monotonic() - start) * 1000, 2)
