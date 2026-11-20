import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Download, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { ScanUrlResponse } from '../types';
import { ContentThreatInspector } from './ContentThreatInspector';
import { DecisionGauge } from './DecisionGauge';
import { DeepShieldInspector } from './DeepShieldInspector';

export interface SingleUrlReportCardProps {
  result: ScanUrlResponse;
  language: 'ar' | 'en';
  t: (key: any) => string;
  getErrorDetails: (errorCode?: string | null, errorMsg?: string | null) => {
    title: string;
    desc: string;
    badge: string;
    color: string;
  };
  onRescan?: () => void;
  rescanLoading?: boolean;
  copySummary: (data: any, title: string) => void;
  downloadJson: (data: any, filename: string) => void;
  itemNumber?: number;
  totalItems?: number;
}

export const SingleUrlReportCard: React.FC<SingleUrlReportCardProps> = ({
  result,
  language,
  t,
  getErrorDetails,
  onRescan,
  rescanLoading = false,
  copySummary,
  downloadJson,
  itemNumber,
  totalItems
}) => {
  const isAttack = Boolean(result.prediction?.is_injection);
  const isFailed = result.fetch_status === 'failed';

  return (
    <div className="glass-panel" style={{ padding: '28px', marginBottom: '28px' }}>
      {/* Header & Verdict */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '16px'
      }}>
        <div style={{ maxWidth: '75%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {itemNumber && totalItems && (
              <span className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
                {language === 'ar' ? `الرابط ${itemNumber} من ${totalItems}` : `URL ${itemNumber} of ${totalItems}`}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {t('result_title')}
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', wordBreak: 'break-all', overflowWrap: 'anywhere', margin: 0 }}>
            {result.url}
          </h3>
        </div>

        {/* Verdict Badge */}
        {isFailed ? (
          <span className="badge badge-danger" style={{ padding: '8px 16px', fontSize: '0.92rem' }}>
            <XCircle size={18} />
            <span>{getErrorDetails(result.error_code, result.error).badge}</span>
          </span>
        ) : isAttack ? (
          <span className="badge badge-danger" style={{ padding: '8px 16px', fontSize: '0.92rem' }}>
            <ShieldAlert size={18} />
            <span>{t('res_injection_alert')}</span>
          </span>
        ) : (
          <span className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.92rem' }}>
            <ShieldCheck size={18} />
            <span>{t('res_safe_clear')}</span>
          </span>
        )}
      </div>

      {/* FETCH FAILURE: Comprehensive Pipeline Audit */}
      {isFailed && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(13, 18, 31, 0.7) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fb7185', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} />
              <span>{getErrorDetails(result.error_code, result.error).title}</span>
            </div>
            <div style={{ fontSize: '0.92rem', color: '#ffffff', marginBottom: '8px', lineHeight: 1.6 }}>
              {result.warning || getErrorDetails(result.error_code, result.error).desc}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
              {result.error ? `Error Details: ${result.error}` : ''}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '10px' }}>
              {language === 'ar' ? 'سجل مراحل الفحص والتحليل:' : 'Scan Pipeline Execution Audit:'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px'
            }}>
              {/* Stage 1: Validation & SSRF */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                    {language === 'ar' ? '1. فحص الرابط وSSRF' : '1. URL & SSRF Validation'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {result.error_code === 'ssrf_blocked' 
                    ? (language === 'ar' ? 'تم الحظر أمنياً (SSRF)' : 'Blocked (SSRF)')
                    : result.error_code === 'dns_error'
                      ? (language === 'ar' ? 'تعذر إيجاد اسم النطاق' : 'Domain not found')
                      : (language === 'ar' ? 'اجتاز الفحص الأمني بنجاح' : 'Passed security checks')}
                </div>
              </div>

              {/* Stage 2: Network Fetch */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <XCircle size={16} color="#fb7185" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                    {language === 'ar' ? '2. الاتصال بالشبكة والجلب' : '2. Network Fetch'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#fb7185' }}>
                  {result.error_code === 'connect_timeout' ? (language === 'ar' ? 'انتهت المهلة (10 ثوانٍ)' : 'Timeout (10s)') : (result.error || 'Fetch Failed')}
                </div>
              </div>

              {/* Stage 3: Extraction */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-subtle)',
                opacity: 0.7
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Clock size={16} color="var(--text-dim)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                    {language === 'ar' ? '3. استخراج المحتوى' : '3. Content Extraction'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'ar' ? 'لم يُنفّذ (0 بايت مسترجعة)' : 'Skipped (0 bytes)'}
                </div>
              </div>

              {/* Stage 4: Model Inference */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--border-subtle)',
                opacity: 0.7
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Clock size={16} color="var(--text-dim)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                    {language === 'ar' ? '4. استدلال نموذج Horizon v3' : '4. Horizon v3 Inference'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {language === 'ar' ? 'لم يُستدعَ (يتطلب محتوى)' : 'Not invoked (No content)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* METRIC KPI CARDS (if prediction exists) */}
      {result.prediction && (
        <>
          <div className="grid-cols-4" style={{
            gap: '14px',
            marginBottom: '24px'
          }}>
            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {result.prediction.threshold <= 1.0 ? (language === 'ar' ? 'احتمالية التهديد المحسوبة' : 'Threat Probability') : t('res_score')}
              </div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: result.prediction.is_injection ? '#fb7185' : '#34d399' }}>
                {result.prediction.score <= 1.0 ? `${(result.prediction.score * 100).toFixed(1)}%` : result.prediction.score.toFixed(4)}
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('res_threshold')}</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {result.prediction.threshold <= 1.0 ? `${(result.prediction.threshold * 100).toFixed(1)}%` : result.prediction.threshold.toFixed(4)}
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('res_margin')}</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: result.prediction.margin >= 0 ? '#fb7185' : '#34d399' }}>
                {result.prediction.threshold <= 1.0 
                  ? `${result.prediction.margin >= 0 ? '+' : ''}${(result.prediction.margin * 100).toFixed(1)}%`
                  : (result.prediction.margin >= 0 ? '+' : '') + result.prediction.margin.toFixed(4)}
              </div>
            </div>

            <div className="kpi-card" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('res_fetch_time')}</div>
              <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                {result.fetch_time_ms ? `${result.fetch_time_ms} ms` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Interactive Decision Boundary Spectrum Gauge */}
          <DecisionGauge
            score={result.prediction.score}
            threshold={result.prediction.threshold}
            isInjection={result.prediction.is_injection}
            margin={result.prediction.margin}
            language={language}
          />

          {/* SecureAct DeepShield Multi-Task Deep Learning Model Result */}
          {result.prediction.deepshield && (
            <DeepShieldInspector 
              deepshield={result.prediction.deepshield} 
              language={language} 
            />
          )}

          {/* Technical Fetch Metadata Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(13, 18, 31, 0.4)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px',
            fontSize: '0.86rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>{t('res_final_url')}: </span>
              <span className="font-mono" style={{ color: '#ffffff', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{result.final_url || result.url}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>HTTP Status: </span>
              <span className="font-mono" style={{ color: '#ffffff' }}>{result.status_code || 200} OK</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>{t('res_chars')}: </span>
              <span className="font-mono" style={{ color: '#ffffff' }}>{result.char_count?.toLocaleString()}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Content-Type: </span>
              <span className="font-mono" style={{ color: '#ffffff' }}>{result.content_type || 'text/html'}</span>
            </div>
          </div>

          {/* SPA Warning if present */}
          {result.warning && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fbbf24',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={18} />
              <span>{result.warning}</span>
            </div>
          )}

          {/* Content & Threat Inspector */}
          <ContentThreatInspector 
            contentPreview={result.content_preview}
            extractedText={result.extracted_text_preview}
            flaggedSnippets={result.flagged_snippets || result.prediction?.flagged_snippets || []}
            targetUrl={result.url}
            isInjection={result.prediction?.is_injection}
          />
        </>
      )}

      {/* Action Toolbar */}
      <div className="action-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
        {onRescan && (
          <button
            onClick={onRescan}
            disabled={rescanLoading}
            className="btn btn-primary"
          >
            <RefreshCw size={16} />
            <span>{result.fetch_status === 'failed' ? t('btn_retry') : t('btn_rescan')}</span>
          </button>
        )}
        <button
          onClick={() => copySummary(result, result.url)}
          className="btn btn-secondary"
        >
          <Copy size={16} />
          <span>{t('btn_copy_summary')}</span>
        </button>
        <button
          onClick={() => downloadJson(result, 'secureact_url_scan')}
          className="btn btn-secondary"
        >
          <Download size={16} />
          <span>{t('btn_download_json')}</span>
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          <Printer size={16} />
          <span>{t('btn_print_report')}</span>
        </button>
      </div>
    </div>
  );
};
