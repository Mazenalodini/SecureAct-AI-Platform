"""Application configuration and constants."""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
REF_DIR = BASE_DIR / "reference_inputs"

def resolve_path(primary: Path, fallback: Path) -> Path:
    if primary.exists():
        return primary
    if fallback.exists():
        return fallback
    return primary

MODEL_PATH = resolve_path(
    MODELS_DIR / "secureact_ai_v2_model.joblib",
    REF_DIR / "secureact_ai_v2_model (1).joblib"
)

METADATA_PATH = resolve_path(
    MODELS_DIR / "model_metadata.json",
    REF_DIR / "secureact_ai_v2_model_metadata_corrected (1).json"
)

TEST_METRICS_PATH = resolve_path(
    MODELS_DIR / "local_test_metrics.json",
    REF_DIR / "v2_local_test_metrics(1).json"
)

TRAINING_SUMMARY_PATH = resolve_path(
    MODELS_DIR / "training_summary.json",
    REF_DIR / "v2_training_summary.json"
)

# Model constants
EXPECTED_MODEL_SHA256 = "8569185d875a1bd76768e1a576c1cfcfd8ff6d74529cd5e646f67d610f2ece5c"
DEFAULT_THRESHOLD = -0.23754153513923493
MODEL_NAME = "SecureAct_AI_v2"
CANDIDATE_NAME = "html_word_char_linear_svc"

# Input limits
MAX_UPLOAD_FILE_BYTES = 100 * 1024       # 100 KiB (102,400 bytes)
MAX_REQUEST_BODY_BYTES = 1024 * 1024     # 1 MiB (1,048,576 bytes)
MAX_TEXT_UNICODE_CHARS = 100000          # 100,000 Unicode characters
MIN_TEXT_UNICODE_CHARS = 1               # 1 character
ALLOWED_EXTENSIONS = {".html", ".txt"}

# Rate limits
RATE_LIMIT_REQUESTS = 30                 # requests per window
RATE_LIMIT_WINDOW_SECONDS = 60           # 1 minute window

# CORS settings
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# URL Scanner configuration (calibrated to fit within Vercel's 30s serverless execution window)
URL_CONNECT_TIMEOUT = float(os.getenv("URL_CONNECT_TIMEOUT", "8.0"))        # seconds
URL_READ_TIMEOUT = float(os.getenv("URL_READ_TIMEOUT", "12.0"))            # seconds
URL_MAX_RESPONSE_BYTES = int(os.getenv("URL_MAX_RESPONSE_BYTES", str(5 * 1024 * 1024))) # 5 MiB max download
URL_MAX_REDIRECTS = int(os.getenv("URL_MAX_REDIRECTS", "3"))              # max redirects followed
URL_ALLOWED_PORTS = {80, 443, 8080, 8443}                                  # allowed web ports
URL_BATCH_MAX = int(os.getenv("URL_BATCH_MAX", "10"))                      # max URLs per batch
URL_BATCH_CONCURRENCY = int(os.getenv("URL_BATCH_CONCURRENCY", "3"))       # concurrent fetches

