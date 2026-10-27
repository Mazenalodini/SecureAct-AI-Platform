"""Pydantic request and response schemas for SecureAct AI."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    content: str = Field(..., description="Text or HTML content to analyze")

class PredictResponse(BaseModel):
    score: float = Field(..., description="Raw decision_function score from LinearSVC")
    threshold: float = Field(..., description="Decision threshold (-0.23754153513923493)")
    classification: str = Field(..., description="'potential_injection' if score >= threshold else 'benign'")
    is_injection: bool = Field(..., description="Boolean flag: True if potential_injection")
    margin: float = Field(..., description="Distance from threshold: score - threshold")
    char_count: int = Field(..., description="Number of Unicode characters in the input")
    byte_size: int = Field(..., description="Byte length in UTF-8")
    model_name: str = Field("SecureAct_AI_v2", description="Model identifier")
    filename: Optional[str] = Field(None, description="Optional uploaded filename")
    disclaimer: str = Field(
        "SecureAct AI v2 is a research security classifier based on LinearSVC TF-IDF. "
        "A positive score indicates potential prompt injection indicators but does not guarantee intent. "
        "The model exhibits a 6.03% false positive rate on local test benchmarks and should be used as part of "
        "a defense-in-depth security strategy rather than a sole security gate.",
        description="Scientific limitations and FPR disclaimer"
    )

class ModelInfoResponse(BaseModel):
    model_name: str
    phase: str
    dataset: str
    dataset_revision: str
    candidate_name: str
    estimator: str
    feature_description: str
    threshold: float
    sha256_hash: str
    sha256_verified: bool
    train_pairs: int
    train_pages: int
    python_version: str
    scikit_learn_version: str
    numpy_version: str
    source_provenance: str
    test_partition_is_blind: bool
    model_loaded: bool

class MetricsResponse(BaseModel):
    v2_test_metrics: Dict[str, Any]
    v1_development_metrics: Optional[Dict[str, Any]] = None
    comparison_summary: List[Dict[str, Any]]
    methodology_notes: Dict[str, str]

class DemoCase(BaseModel):
    id: str
    title_ar: str
    title_en: str
    category: str
    target_label: str  # 'injection' or 'benign'
    content: str
    description_ar: str
    description_en: str
    explanation_ar: str
    explanation_en: str

class DemoResultItem(BaseModel):
    id: str
    title_ar: str
    title_en: str
    category: str
    target_label: str
    score: float
    threshold: float
    classification: str
    is_injection: bool
    is_correct: bool
    margin: float

class DemoBatchResponse(BaseModel):
    total_cases: int
    evaluated_cases: int
    correct_cases: int
    accuracy_on_demo: float
    results: List[DemoResultItem]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    version: str
    sha256_verified: bool


class ScanUrlRequest(BaseModel):
    url: str = Field(..., description="Public web page URL to fetch and analyze")


class ScanUrlResponse(BaseModel):
    url: str
    final_url: Optional[str] = None
    fetch_status: str = Field(..., description="'success' or 'failed'")
    status_code: Optional[int] = None
    content_type: Optional[str] = None
    content_length: Optional[int] = None
    char_count: Optional[int] = None
    fetch_time_ms: Optional[float] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
    redirects_followed: int = 0
    prediction: Optional[PredictResponse] = None
    scan_time_iso: str
    js_rendered: bool = False
    warning: Optional[str] = None


class BatchScanRequest(BaseModel):
    urls: List[str] = Field(..., description="List of public URLs to scan (max 10)")


class BatchScanResponse(BaseModel):
    total_urls: int
    completed: int
    failed: int
    flagged: int
    batch_time_ms: float
    results: List[ScanUrlResponse]

