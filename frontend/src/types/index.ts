export interface PredictResponse {
  score: number;
  threshold: number;
  classification: 'potential_injection' | 'benign';
  is_injection: boolean;
  margin: number;
  char_count: number;
  byte_size: number;
  model_name: string;
  disclaimer: string;
  filename?: string;
}

export interface ModelInfo {
  model_name: string;
  phase: string;
  dataset: string;
  dataset_revision: string;
  candidate_name: string;
  estimator: string;
  feature_description: string;
  threshold: number;
  sha256_hash: string;
  sha256_verified: boolean;
  train_pairs: number;
  train_pages: number;
  python_version: string;
  scikit_learn_version: string;
  numpy_version: string;
  source_provenance: string;
  test_partition_is_blind: boolean;
  model_loaded: boolean;
}

export interface ComparisonItem {
  metric: string;
  v1_baseline: string;
  v2_model: string;
  delta: string;
  status: 'improved' | 'same' | 'degraded';
}

export interface MetricsData {
  v2_test_metrics: {
    n_pages: number;
    threshold: number;
    accuracy: number;
    balanced_accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    specificity: number;
    false_positive_rate: number;
    average_precision: number;
    roc_auc: number;
    confusion_matrix_labels_0_no_1_yes: number[][];
    pair_metrics: {
      n_pairs: number;
      attack_recall_at_pair_level: number;
      benign_control_specificity_at_pair_level: number;
      both_pages_correct_rate: number;
      at_least_one_page_in_pair_correct_rate: number;
    };
    clustered_bootstrap_95pct_ci?: {
      intervals: {
        f1: [number, number];
        recall: [number, number];
        false_positive_rate: [number, number];
        average_precision: [number, number];
        both_pages_correct_rate: [number, number];
      };
    };
  };
  v1_development_metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    specificity: number;
    false_positive_rate: number;
    roc_auc: number;
    average_precision: number;
    confusion_matrix_labels_0_no_1_yes: number[][];
  };
  comparison_summary: ComparisonItem[];
  methodology_notes: {
    evaluation_scope: string;
    v1_source_note: string;
    threshold_calibration: string;
  };
}

export interface DemoCase {
  id: string;
  title_ar: string;
  title_en: string;
  category: string;
  target_label: 'injection' | 'benign';
  content: string;
  description_ar: string;
  description_en: string;
  explanation_ar: string;
  explanation_en: string;
}

export interface DemoResultItem {
  id: string;
  title_ar: string;
  title_en: string;
  category: string;
  target_label: string;
  score: number;
  threshold: number;
  classification: string;
  is_injection: boolean;
  is_correct: boolean;
  margin: number;
}

export interface DemoBatchResponse {
  total_cases: number;
  evaluated_cases: number;
  correct_cases: number;
  accuracy_on_demo: number;
  results: DemoResultItem[];
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  model_name: string;
  version: string;
  sha256_verified: boolean;
  detail?: string;
}

export interface ScanUrlResponse {
  url: string;
  final_url?: string;
  fetch_status: 'success' | 'failed';
  status_code?: number;
  content_type?: string;
  content_length?: number;
  char_count?: number;
  fetch_time_ms?: number;
  error?: string;
  error_code?: string;
  redirects_followed: number;
  prediction?: PredictResponse;
  scan_time_iso: string;
  js_rendered: boolean;
  warning?: string;
}

export interface BatchScanResponse {
  total_urls: number;
  completed: number;
  failed: number;
  flagged: number;
  batch_time_ms: number;
  results: ScanUrlResponse[];
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  type: 'url' | 'batch' | 'text' | 'file';
  target: string;
  status: 'success' | 'failed';
  classification?: 'potential_injection' | 'benign';
  is_injection?: boolean;
  score?: number;
  threshold?: number;
  margin?: number;
  fetch_time_ms?: number;
  char_count?: number;
  content_type?: string;
  error?: string;
  warning?: string;
  final_url?: string;
  raw_details?: any;
}

