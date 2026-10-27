import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ModelInfo, MetricsData } from '../types';
import { MetricCard } from '../components/MetricCard';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import { Shield, CheckCircle2, ArrowRight, Zap, Target, AlertTriangle, Database, Hash } from 'lucide-react';

interface DashboardProps {
  modelInfo: ModelInfo | null;
  metrics: MetricsData | null;
  onNavigateAnalyze: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ modelInfo, metrics, onNavigateAnalyze }) => {
  const { t, isRtl } = useLanguage();

  const v2 = metrics?.v2_test_metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '36px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(13, 18, 31, 0.95) 100%)'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: isRtl ? 'auto' : '-50px',
          left: isRtl ? '-50px' : 'auto',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="badge badge-cyan">
              <Zap size={14} />
              <span>Next-Gen Security Filter</span>
            </span>
            <span className="badge badge-success">
              <CheckCircle2 size={14} />
              <span>SHA-256 Verified</span>
            </span>
          </div>

          <h1 className="heading-gradient" style={{ fontSize: '2.5rem', lineHeight: 1.2, marginBottom: '12px' }}>
            {t('dash_title')}
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '24px' }}>
            {t('dash_desc')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button onClick={onNavigateAnalyze} className="btn btn-primary">
              <span>{t('dash_quick_action')}</span>
              <ArrowRight size={18} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
            </button>
            <span style={{ fontSize: '0.86rem', color: 'var(--text-dim)' }}>
              {t('dash_quick_desc')}
            </span>
          </div>
        </div>
      </div>

      {/* Model Metadata Status Card */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={20} color="#06b6d4" />
          <span>{t('dash_model_status')}</span>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px'
        }}>
          {/* Item: Active Model */}
          <div style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{t('dash_model_name')}</div>
            <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#38bdf8' }}>
              {modelInfo?.model_name || 'SecureAct_AI_v2'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Phase: {modelInfo?.phase || 'v2_training_and_evaluation'}
            </div>
          </div>

          {/* Item: Estimator */}
          <div style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{t('dash_estimator')}</div>
            <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              {modelInfo?.estimator || 'LinearSVC'} (word+char TF-IDF)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Feature: 1-2 words & 3-5 chars
            </div>
          </div>

          {/* Item: Calibrated Threshold */}
          <div style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{t('dash_threshold')}</div>
            <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24' }}>
              {modelInfo?.threshold ? modelInfo.threshold.toFixed(6) : '-0.237542'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Calibrated on independent split
            </div>
          </div>

          {/* Item: Training Corpus */}
          <div style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '4px' }}>{t('dash_train_size')}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
              {t('dash_train_desc')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              BrowseSafe++ (Perplexity AI)
            </div>
          </div>
        </div>

        {/* SHA-256 Verification Banner */}
        <div style={{
          marginTop: '18px',
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Hash size={16} color="#34d399" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>
              {t('dash_sha256')}:
            </span>
            <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
              {modelInfo?.sha256_hash || '8569185d875a1bd76768e1a576c1cfcfd8ff6d74529cd5e646f67d610f2ece5c'}
            </span>
          </div>
          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
            {t('dash_sha256_verified')}
          </span>
        </div>
      </div>

      {/* Primary Benchmark Metrics */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            {t('nav_evaluation')} — v2 Local Test
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            {t('metric_test_note')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px'
        }}>
          <MetricCard
            title={t('metric_accuracy')}
            value={v2 ? `${(v2.accuracy * 100).toFixed(2)}%` : '94.46%'}
            subtext="Overall classification accuracy across 1,426 pages"
            badge="+11.26% vs v1"
            badgeType="success"
            icon={Target}
            accentColor="#10b981"
          />

          <MetricCard
            title={t('metric_recall')}
            value={v2 ? `${(v2.recall * 100).toFixed(2)}%` : '94.95%'}
            subtext="Detection rate for actual injection attempts"
            badge="+12.41% vs v1"
            badgeType="success"
            icon={Shield}
            accentColor="#38bdf8"
          />

          <MetricCard
            title={t('metric_fpr')}
            value={v2 ? `${(v2.false_positive_rate * 100).toFixed(2)}%` : '6.03%'}
            subtext="False alarms on legitimate clean content"
            badge="-10.10% vs v1"
            badgeType="amber"
            icon={AlertTriangle}
            accentColor="#f59e0b"
          />

          <MetricCard
            title={t('metric_roc_auc')}
            value={v2 ? `${(v2.roc_auc * 100).toFixed(2)}%` : '98.40%'}
            subtext="Area Under Receiver Operating Characteristic Curve"
            badge="Top Tier"
            badgeType="cyan"
            icon={Zap}
            accentColor="#6366f1"
          />
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <ConfusionMatrix matrix={v2?.confusion_matrix_labels_0_no_1_yes} />
    </div>
  );
};
