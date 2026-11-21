FROM python:3.11-slim

WORKDIR /app

# Install system utilities and curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU first to optimize image size
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code and baseline models
COPY backend ./backend
COPY models ./models

# Setup non-root user per Hugging Face Spaces security standards
RUN useradd -m -u 1000 user && \
    mkdir -p /home/user/.cache && \
    chown -R user:user /home/user /app
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONPATH=/app \
    HF_HOME=/home/user/.cache/huggingface \
    HF_MODEL_REPO=lufy77/secureact-horizon-v3 \
    PORT=7860

EXPOSE 7860

# Run FastAPI server on port 7860
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
