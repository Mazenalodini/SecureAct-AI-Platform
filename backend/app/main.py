"""FastAPI main application module for SecureAct AI."""
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .config import (
    MODEL_NAME,
    MAX_UPLOAD_FILE_BYTES,
    MAX_TEXT_UNICODE_CHARS,
    MIN_TEXT_UNICODE_CHARS,
    ALLOWED_EXTENSIONS,
    ALLOWED_ORIGINS,
    URL_BATCH_MAX,
)
from .schemas import (
    PredictRequest,
    PredictResponse,
    ModelInfoResponse,
    MetricsResponse,
    HealthResponse,
    DemoBatchResponse,
    DemoResultItem,
    DemoCase,
    ScanUrlRequest,
    ScanUrlResponse,
    BatchScanRequest,
    BatchScanResponse,
)
from .model_service import ModelService, ModelSecurityError
from .middleware import RequestSizeLimitMiddleware, RateLimitMiddleware
from .demo_data import DEMO_CASES
from .url_scanner import fetch_url, fetch_urls_batch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("secureact.api")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SecureAct AI Platform API...")
    try:
        service = ModelService.get_instance()
        logger.info(f"Model loaded: {service.is_loaded}, SHA-256 verified: {service.sha256_verified}")
    except Exception as e:
        logger.critical(f"Critical failure during model startup: {e}")
    yield

# Initialize FastAPI application
app = FastAPI(
    title="SecureAct AI Platform API",
    description="Production-grade API for Prompt Injection detection in HTML and web content.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Environment and CORS settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
cors_origins = list(ALLOWED_ORIGINS)
extra_origin = os.getenv("ALLOWED_ORIGIN")
if extra_origin and extra_origin not in cors_origins:
    cors_origins.append(extra_origin)

# Add Middleware in correct order:
# Outer: CORS - restricted to configured origins + vercel deployment subdomains
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$" if ENVIRONMENT == "production" else None,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"]
)

# Request body size limiter (1 MiB)
app.add_middleware(RequestSizeLimitMiddleware)

# Rate limiter (30 req/min)
app.add_middleware(RateLimitMiddleware)


# Dependency to access ModelService singleton
def get_model_service() -> ModelService:
    try:
        return ModelService.get_instance()
    except Exception as e:
        logger.error(f"Model service dependency failure: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"SecureAct AI model service is unavailable: {str(e)}"
        )



@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """System health check endpoint verifying model readiness."""
    try:
        service = ModelService.get_instance()
        if not service.is_loaded or not service.sha256_verified:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "degraded",
                    "model_loaded": False,
                    "model_name": MODEL_NAME,
                    "version": "2.0.0",
                    "sha256_verified": False,
                    "detail": "Model artifact failed to load or hash verification failed."
                }
            )
        return HealthResponse(
            status="healthy",
            model_loaded=True,
            model_name=MODEL_NAME,
            version="2.0.0",
            sha256_verified=True
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "model_loaded": False,
                "model_name": MODEL_NAME,
                "version": "2.0.0",
                "sha256_verified": False,
                "detail": str(e)
            }
        )


@app.get("/api/model-info", response_model=ModelInfoResponse, tags=["Model"])
async def get_model_info(service: ModelService = Depends(get_model_service)):
    """Retrieve verified metadata, parameter contract, and training provenance."""
    info = service.get_model_info()
    return ModelInfoResponse(**info)


@app.get("/api/metrics", response_model=MetricsResponse, tags=["Model"])
async def get_metrics(service: ModelService = Depends(get_model_service)):
    """Retrieve authentic benchmark evaluation metrics for v2 test split and v1 baseline."""
    metrics_data = service.get_metrics()
    return MetricsResponse(**metrics_data)


@app.post("/api/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_content(
    payload: PredictRequest,
    service: ModelService = Depends(get_model_service)
):
    """
    Perform real-time prompt injection detection on text/HTML content.
    - Decoded length strictly enforced (1 to 100,000 Unicode characters).
    - HTTP 400 returned if length constraints violated.
    """
    text = payload.content
    if text is None:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "validation_error",
                "detail": "حقل المحتوى مطلوب."
            }
        )

    char_count = len(text)
    if char_count < MIN_TEXT_UNICODE_CHARS:
        return JSONResponse(
            status_code=400,
            content={
                "error": "validation_error",
                "detail": "المحتوى فارغ. يرجى إدخال نص أو كود HTML صالح للتحليل.",
                "limit_chars": MAX_TEXT_UNICODE_CHARS,
                "actual_chars": 0
            }
        )

    if char_count > MAX_TEXT_UNICODE_CHARS:
        return JSONResponse(
            status_code=400,
            content={
                "error": "validation_error",
                "detail": f"طول النص ({char_count:,} حرف) يتجاوز الحد المسموح به ({MAX_TEXT_UNICODE_CHARS:,} حرف Unicode).",
                "limit_chars": MAX_TEXT_UNICODE_CHARS,
                "actual_chars": char_count
            }
        )

    try:
        result = service.predict(text)
        return PredictResponse(**result)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/api/predict/file", response_model=PredictResponse, tags=["Inference"])
async def predict_file(
    file: UploadFile = File(...),
    service: ModelService = Depends(get_model_service)
):
    """
    Perform prompt injection detection on an uploaded .html or .txt file.
    - File size strictly limited to 100 KiB (102,400 bytes).
    - Text length strictly limited to 100,000 Unicode characters.
    """
    filename = file.filename or "uploaded_file"
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={
                "error": "invalid_file_type",
                "detail": f"نوع الملف '{suffix}' غير مدعوم. الملفات المدعومة هي فقط: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
                "allowed_extensions": list(ALLOWED_EXTENSIONS),
                "actual_extension": suffix
            }
        )

    file_bytes = await file.read()
    actual_size = len(file_bytes)

    if actual_size > MAX_UPLOAD_FILE_BYTES:
        return JSONResponse(
            status_code=413,
            content={
                "error": "file_too_large",
                "detail": f"حجم الملف ({actual_size:,} بايت / {actual_size/1024:.1f} KiB) يتجاوز الحد المسموح (100 KiB / {MAX_UPLOAD_FILE_BYTES:,} بايت).",
                "limit_kib": 100,
                "actual_kib": round(actual_size / 1024, 2)
            }
        )

    if actual_size == 0:
        return JSONResponse(
            status_code=400,
            content={
                "error": "validation_error",
                "detail": "الملف المرفوع فارغ تماماً.",
                "limit_chars": MAX_TEXT_UNICODE_CHARS,
                "actual_chars": 0
            }
        )

    # Decode bytes with fallback encoding detection
    text = ""
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1256"):
        try:
            text = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if not text:
        return JSONResponse(
            status_code=400,
            content={
                "error": "decoding_error",
                "detail": "تعذر فك ترميز محتوى الملف كنص قابل للقراءة."
            }
        )

    char_count = len(text)
    if char_count > MAX_TEXT_UNICODE_CHARS:
        return JSONResponse(
            status_code=400,
            content={
                "error": "validation_error",
                "detail": f"طول النص بعد فك الترميز ({char_count:,} حرف) يتجاوز الحد المسموح به ({MAX_TEXT_UNICODE_CHARS:,} حرف Unicode).",
                "limit_chars": MAX_TEXT_UNICODE_CHARS,
                "actual_chars": char_count
            }
        )

    try:
        prediction = service.predict(text)
        prediction["filename"] = filename
        return PredictResponse(**prediction)
    except Exception as e:
        logger.error(f"File prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"File analysis error: {str(e)}")


@app.post("/api/scan-url", response_model=ScanUrlResponse, tags=["Inference"])
async def scan_single_url(
    payload: ScanUrlRequest,
    service: ModelService = Depends(get_model_service)
):
    """
    Safely fetch a public web page URL with strict SSRF protection and classify its
    HTML content using the SecureAct AI model.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    fetch_res = await fetch_url(payload.url)

    if not fetch_res.success:
        error_code = fetch_res.error_code or "unknown_error"
        warning_map = {
            "dns_error": "تعذر حل اسم النطاق المطلوب عبر خوادم DNS. اسم الموقع غير مسجل أو غير موجود على شبكة الإنترنت.",
            "redirect_dns_error": "تعذر حل اسم نطاق إعادة التوجيه عبر خوادم DNS.",
            "connect_timeout": "انتهت مهلة محاولة الاتصال بالخادم المضيف (Connection timed out). تعذر فتح اتصال TCP بالموقع المطلوب.",
            "read_timeout": "انتهت مهلة قراءة استجابة الخادم أثناء تنزيل المحتوى (Read timeout).",
            "connect_error": "تعذر إنشاء اتصال بالخادم المضيف (Connect error). قد يكون الخادم غير متصل أو يرفض الوصول.",
            "ssrf_blocked": "تم حظر الرابط بنظام الحماية SSRF: العنوان يشير إلى شبكة محلية أو نطاق محظور.",
            "redirect_ssrf_blocked": "تم حظر إعادة التوجيه بنظام الحماية SSRF: الرابط المحوّل إليه يوجّه إلى نطاق محظور.",
            "too_many_redirects": "تجاوز الرابط الحد الأقصى المسموح به لعمليات إعادة التوجيه (5 تحويلات).",
            "unsupported_content_type": f"نوع المحتوى المسترجع ({fetch_res.content_type or 'unknown'}) غير مدعوم للتحليل. تدعم المنصة صفحات HTML والنصوص فقط.",
            "response_too_large": "حجم استجابة الموقع يتجاوز الحد المسموح به (2 ميجابايت).",
            "empty_content": "استجاب الموقع بصفحة فارغة لا تحتوي على أي نص للتحليل.",
            "decode_error": "تعذر فك ترميز نص الصفحة المسترجعة كنص مقروء.",
            "http_error": f"استجاب الخادم برمز خطأ HTTP {fetch_res.status_code}.",
            "invalid_url": f"تنسيق الرابط غير صالح: {fetch_res.error or 'Invalid URL'}",
        }
        warning_msg = warning_map.get(
            error_code,
            "تعذر جلب محتوى الصفحة للتحليل. لم يتم استدعاء نموذج الذكاء الاصطناعي لعدم توفر محتوى مسترجع."
        )

        return ScanUrlResponse(
            url=fetch_res.url,
            final_url=fetch_res.final_url,
            fetch_status="failed",
            status_code=fetch_res.status_code,
            content_type=fetch_res.content_type,
            content_length=fetch_res.content_length,
            char_count=fetch_res.char_count,
            fetch_time_ms=fetch_res.fetch_time_ms,
            error=fetch_res.error,
            error_code=fetch_res.error_code,
            redirects_followed=fetch_res.redirects_followed,
            prediction=None,
            scan_time_iso=now_iso,
            js_rendered=False,
            warning=warning_msg
        )

    # Successful fetch -> run prediction
    try:
        pred = service.predict(fetch_res.html_content or "")
        prediction_resp = PredictResponse(**pred)
    except Exception as e:
        logger.error(f"Prediction failed for fetched URL {fetch_res.url}: {e}")
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

    # Detect if content has client-side SPA cues with sparse static HTML
    warning = None
    html_text = fetch_res.html_content or ""
    if fetch_res.char_count and fetch_res.char_count < 300 and ("id=\"root\"" in html_text or "id=\"app\"" in html_text or "noscript" in html_text):
        warning = "قد تعتمد هذه الصفحة على JavaScript لعرض المحتوى الكامل ديناميكياً (SPA). تم فحص كود HTML الأولي المسترجع فقط."

    return ScanUrlResponse(
        url=fetch_res.url,
        final_url=fetch_res.final_url,
        fetch_status="success",
        status_code=fetch_res.status_code,
        content_type=fetch_res.content_type,
        content_length=fetch_res.content_length,
        char_count=fetch_res.char_count,
        fetch_time_ms=fetch_res.fetch_time_ms,
        error=None,
        error_code=None,
        redirects_followed=fetch_res.redirects_followed,
        prediction=prediction_resp,
        scan_time_iso=now_iso,
        js_rendered=False,
        warning=warning
    )


@app.post("/api/scan-batch", response_model=BatchScanResponse, tags=["Inference"])
async def scan_batch_urls(
    payload: BatchScanRequest,
    service: ModelService = Depends(get_model_service)
):
    """
    Safely scan a batch of up to 10 URLs with SSRF protection, deduplication,
    and isolated failure handling.
    """
    start_batch = time.monotonic()
    now_iso = datetime.now(timezone.utc).isoformat()

    raw_urls = payload.urls or []
    if not raw_urls:
        raise HTTPException(
            status_code=400,
            detail="قائمة الروابط فارغة. يرجى تقديم رابط واحد على الأقل."
        )

    urls_to_scan = raw_urls[:URL_BATCH_MAX]
    fetch_results = await fetch_urls_batch(urls_to_scan)

    items: List[ScanUrlResponse] = []
    completed = 0
    failed = 0
    flagged = 0

    for f_res in fetch_results:
        if not f_res.success:
            failed += 1
            items.append(ScanUrlResponse(
                url=f_res.url,
                final_url=f_res.final_url,
                fetch_status="failed",
                status_code=f_res.status_code,
                content_type=f_res.content_type,
                content_length=f_res.content_length,
                char_count=f_res.char_count,
                fetch_time_ms=f_res.fetch_time_ms,
                error=f_res.error,
                error_code=f_res.error_code,
                redirects_followed=f_res.redirects_followed,
                prediction=None,
                scan_time_iso=now_iso,
                warning="فشل جلب الصفحة"
            ))
        else:
            try:
                pred = service.predict(f_res.html_content or "")
                prediction_resp = PredictResponse(**pred)
                completed += 1
                if pred.get("is_injection"):
                    flagged += 1

                items.append(ScanUrlResponse(
                    url=f_res.url,
                    final_url=f_res.final_url,
                    fetch_status="success",
                    status_code=f_res.status_code,
                    content_type=f_res.content_type,
                    content_length=f_res.content_length,
                    char_count=f_res.char_count,
                    fetch_time_ms=f_res.fetch_time_ms,
                    error=None,
                    error_code=None,
                    redirects_followed=f_res.redirects_followed,
                    prediction=prediction_resp,
                    scan_time_iso=now_iso
                ))
            except Exception as e:
                logger.error(f"Batch prediction error for {f_res.url}: {e}")
                failed += 1
                items.append(ScanUrlResponse(
                    url=f_res.url,
                    final_url=f_res.final_url,
                    fetch_status="failed",
                    status_code=f_res.status_code,
                    content_type=f_res.content_type,
                    content_length=f_res.content_length,
                    char_count=f_res.char_count,
                    fetch_time_ms=f_res.fetch_time_ms,
                    error=f"Prediction failure: {str(e)}",
                    error_code="prediction_error",
                    redirects_followed=f_res.redirects_followed,
                    prediction=None,
                    scan_time_iso=now_iso
                ))

    total_time = round((time.monotonic() - start_batch) * 1000, 2)
    return BatchScanResponse(
        total_urls=len(items),
        completed=completed,
        failed=failed,
        flagged=flagged,
        batch_time_ms=total_time,
        results=items
    )



@app.get("/api/demo/cases", response_model=List[DemoCase], tags=["Demo"])
async def list_demo_cases():
    """Retrieve the curated suite of real-world demo test cases."""
    return DEMO_CASES


@app.post("/api/demo/batch", response_model=DemoBatchResponse, tags=["Demo"])
async def run_demo_batch(service: ModelService = Depends(get_model_service)):
    """
    Execute real-time model inference across all curated demo test cases.
    Returns live computed decision scores, classifications, and agreement with target labels.
    """
    results: List[DemoResultItem] = []
    correct_count = 0

    for case in DEMO_CASES:
        pred = service.predict(case.content)
        pred_label = "injection" if pred["is_injection"] else "benign"
        is_correct = bool(pred_label == case.target_label)
        if is_correct:
            correct_count += 1

        results.append(
            DemoResultItem(
                id=case.id,
                title_ar=case.title_ar,
                title_en=case.title_en,
                category=case.category,
                target_label=case.target_label,
                score=pred["score"],
                threshold=pred["threshold"],
                classification=pred["classification"],
                is_injection=pred["is_injection"],
                is_correct=is_correct,
                margin=pred["margin"]
            )
        )

    total = len(DEMO_CASES)
    accuracy = (correct_count / total * 100.0) if total > 0 else 0.0

    return DemoBatchResponse(
        total_cases=total,
        evaluated_cases=total,
        correct_cases=correct_count,
        accuracy_on_demo=round(accuracy, 2),
        results=results
    )
