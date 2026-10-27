"""Tests for input validation, boundary constraints, and size limits."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import (
    MAX_TEXT_UNICODE_CHARS,
    MAX_UPLOAD_FILE_BYTES,
    MAX_REQUEST_BODY_BYTES
)

client = TestClient(app)


def test_empty_predict_content():
    """Verify HTTP 400 when content is empty."""
    response = client.post("/api/predict", json={"content": ""})
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"] == "validation_error"


def test_unicode_character_limit_exceeded():
    """Verify HTTP 400 when text length exceeds 100,000 Unicode characters."""
    long_text = "أ" * (MAX_TEXT_UNICODE_CHARS + 10)
    response = client.post("/api/predict", json={"content": long_text})
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "validation_error"
    assert data["actual_chars"] == MAX_TEXT_UNICODE_CHARS + 10
    assert data["limit_chars"] == MAX_TEXT_UNICODE_CHARS


def test_arabic_multibyte_within_unicode_limit():
    """
    Verify Arabic text of 25,000 characters (~50 KB bytes) passes Unicode limit (< 100k)
    and passes request body limit (< 1 MiB).
    """
    arabic_text = "هذا نص تجريبي باللغة العربية لاختبار كفاءة المعالجة وحساب الأحرف بدقة. " * 350
    char_len = len(arabic_text)
    assert char_len < MAX_TEXT_UNICODE_CHARS
    assert len(arabic_text.encode("utf-8")) > char_len  # Multi-byte UTF-8

    response = client.post("/api/predict", json={"content": arabic_text})
    assert response.status_code == 200
    data = response.json()
    assert data["char_count"] == char_len


def test_file_upload_allowed_types():
    """Verify .html and .txt uploads succeed."""
    html_content = b"<html><body><h1>Test HTML</h1></body></html>"
    response = client.post(
        "/api/predict/file",
        files={"file": ("sample.html", html_content, "text/html")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "classification" in data

    txt_content = b"Plain text file content."
    response = client.post(
        "/api/predict/file",
        files={"file": ("sample.txt", txt_content, "text/plain")}
    )
    assert response.status_code == 200


def test_file_upload_disallowed_type():
    """Verify non-supported extension returns HTTP 400."""
    pdf_content = b"%PDF-1.4 dummy pdf content"
    response = client.post(
        "/api/predict/file",
        files={"file": ("document.pdf", pdf_content, "application/pdf")}
    )
    assert response.status_code == 400
    data = response.json()
    assert data["error"] == "invalid_file_type"


def test_file_upload_size_limit_exceeded():
    """Verify file exceeding 100 KiB returns HTTP 413."""
    oversized_bytes = b"A" * (MAX_UPLOAD_FILE_BYTES + 1024)  # > 100 KiB
    response = client.post(
        "/api/predict/file",
        files={"file": ("large.html", oversized_bytes, "text/html")}
    )
    assert response.status_code == 413
    data = response.json()
    assert data["error"] == "file_too_large"
    assert data["limit_kib"] == 100


def test_request_body_size_limit_exceeded():
    """Verify request body exceeding 1 MiB returns HTTP 413 via middleware."""
    # 1.1 MiB payload
    oversized_body = {"content": "x" * (MAX_REQUEST_BODY_BYTES + 1024)}
    response = client.post("/api/predict", json=oversized_body)
    assert response.status_code == 413
    data = response.json()
    assert data["error"] == "payload_too_large"
