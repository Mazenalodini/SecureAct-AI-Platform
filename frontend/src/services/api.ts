import {
  HealthStatus,
  ModelInfo,
  MetricsData,
  PredictResponse,
  DemoCase,
  DemoBatchResponse,
  ScanUrlResponse,
  BatchScanResponse
} from '../types';

const API_BASE = ''; // Uses relative path (proxied by Vite in dev or served directly in prod/Vercel)

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE}/api/model-info`);
  if (!res.ok) {
    throw new Error(`Failed to load model info: HTTP ${res.status}`);
  }
  return res.json();
}

export async function getMetrics(): Promise<MetricsData> {
  const res = await fetch(`${API_BASE}/api/metrics`);
  if (!res.ok) {
    throw new Error(`Failed to load metrics: HTTP ${res.status}`);
  }
  return res.json();
}

export async function predictContent(content: string): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = typeof data.detail === 'string' ? data.detail : (data.detail?.detail || data.error || `Prediction failed: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return data;
}

export async function predictFile(file: File): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/predict/file`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = typeof data.detail === 'string' ? data.detail : (data.detail?.detail || data.error || `File analysis failed: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return data;
}

export async function scanUrl(url: string): Promise<ScanUrlResponse> {
  const res = await fetch(`${API_BASE}/api/scan-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = typeof data.detail === 'string' ? data.detail : (data.detail?.detail || data.error || `URL scan failed: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return data;
}

export async function scanBatch(urls: string[]): Promise<BatchScanResponse> {
  const res = await fetch(`${API_BASE}/api/scan-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ urls })
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = typeof data.detail === 'string' ? data.detail : (data.detail?.detail || data.error || `Batch scan failed: HTTP ${res.status}`);
    throw new Error(errorMsg);
  }
  return data;
}

export async function getDemoCases(): Promise<DemoCase[]> {
  const res = await fetch(`${API_BASE}/api/demo/cases`);
  if (!res.ok) {
    throw new Error(`Failed to load demo cases: HTTP ${res.status}`);
  }
  return res.json();
}

export async function runDemoBatch(): Promise<DemoBatchResponse> {
  const res = await fetch(`${API_BASE}/api/demo/batch`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Failed to run demo batch: HTTP ${res.status}`);
  }
  return res.json();
}

