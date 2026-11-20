"""Pydantic request and response schemas for SecureAct AI."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class FlaggedSnippet(BaseModel):
    text: str = Field(..., description="The suspicious snippet text")
    start_pos: int = Field(0, description="Character start index")
    end_pos: int = Field(0, description="Character end index")
    category: str = Field("pattern_match", description="Category: system_override, identity_hijack, delimiter, model_signal, etc.")
    risk_level: str = Field("high", description="'high' | 'medium' | 'low'")
    reason_ar: str = Field(..., description="Arabic explanation")
    reason_en: str = Field(..., description="English explanation")
    score: Optional[float] = Field(None, description="Local inference score if evaluated")

class PredictRequest(BaseModel):
    content: str = Field(..., description="Text or HTML content to analyze")

class PredictResponse(BaseModel):
    score: float = Field(..., description="Decision probability (0.0 to 1.0) or model score")
    probability: Optional[float] = Field(None, description="Calculated threat probability from Horizon ModernBERT")
    threshold: float = Field(..., description="Operational decision threshold")
    classification: str = Field(..., description="'potential_injection' if score >= threshold else 'benign'")
    is_injection: bool = Field(..., description="Boolean flag: True if potential_injection")
    margin: float = Field(..., description="Distance from threshold: score - threshold")
    threat_tier: Optional[str] = Field("safe", description="'threat' | 'caution' | 'safe'")
    char_count: int = Field(..., description="Number of Unicode characters in the input")
    byte_size: int = Field(..., description="Byte length in UTF-8")
    model_name: str = Field("SecureAct_Horizon_v3 (ModernBERT Multi-Task 141M)", description="Model identifier")
    filename: Optional[str] = Field(None, description="Optional uploaded filename")
    flagged_snippets: List[FlaggedSnippet] = Field(default_factory=list, description="Suspicious prompt injection segments detected in content")
    deepshield: Optional[Dict[str, Any]] = Field(None, description="DeepShield Horizon multi-task evaluation")
    threat_intelligence: Optional[Dict[str, Any]] = Field(None, description="6 cyber forensic threat heads")
    forensic_profile: Optional[Dict[str, Any]] = Field(None, description="Detailed bilingual threat intelligence profile")
    latency_ms: Optional[float] = Field(None, description="Inference latency in milliseconds")
    disclaimer: str = Field(
        "SecureAct Horizon v3 utilizes ModernBERT 141M with chunk-attention pooling and 6 cyber forensic heads for semantic prompt injection detection. "
        "Delivers high-recall detection with verified low false-positive specificity on benign web pages.",
        description="Scientific capabilities and model disclaimer"
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
    content_preview: Optional[str] = Field(None, description="Raw content preview from web page")
    extracted_text_preview: Optional[str] = Field(None, description="Clean stripped text preview without HTML tags")
    flagged_snippets: List[FlaggedSnippet] = Field(default_factory=list, description="Suspicious prompt injection segments detected in content")


class BatchScanRequest(BaseModel):
    urls: List[str] = Field(..., description="List of public URLs to scan (max 10)")


class BatchScanResponse(BaseModel):
    total_urls: int
    completed: int
    failed: int
    flagged: int
    batch_time_ms: float
    results: List[ScanUrlResponse]

