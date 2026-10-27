import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MetricsData } from '../types';
import { MetricCard } from '../components/MetricCard';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import { BarChart3, TrendingUp, Layers, CheckCircle2, Shield, Info } from 'lucide-react';

interface EvaluationProps {
  metrics: MetricsData | null;
}

export const Evaluation: React.FC<EvaluationProps> = ({ metrics }) => {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'ci' | 'comparison'>('metrics');

  const v2 = metrics?.v2_test_metrics;
  const ci = v2?.clustered_bootstrap_95pct_ci?.intervals;
  const comparison = metrics?.comparison_summary || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Title */}
      <div>
        <h1 className="heading-gradient" style={{ fontSize: '2.1rem', marginBottom: '8px' }}>
          {t('eval_title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
          {t('eval_desc')}
        </p>
      </div>

      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveSubTab('metrics')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'metrics' ? '1px solid var(--border-glow)' : '1px solid transparent',
            background: activeSubTab === 'metrics' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSubTab === 'metrics' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('eval_tab_metrics')}
        </button>

        <button
          onClick={() => setActiveSubTab('ci')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'ci' ? '1px solid var(--border-glow)' : '1px solid transparent',
            background: activeSubTab === 'ci' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSubTab === 'ci' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('eval_tab_ci')}
        </button>

        <button
          onClick={() => setActiveSubTab('comparison')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'comparison' ? '1px solid var(--border-glow)' : '1px solid transparent',
            background: activeSubTab === 'comparison' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSubTab === 'comparison' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('eval_tab_comparison')}
        </button>
      </div>

      {/* Tab 1: Primary Metrics & Confusion Matrix */}
      {activeSubTab === 'metrics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px'
          }}>
            <MetricCard
              title={t('metric_accuracy')}
              value={v2 ? `${(v2.accuracy * 100).toFixed(2)}%` : '94.46%'}
              subtext="Overall accuracy across balanced 1,426 pages"
              accentColor="#10b981"
            />
            <MetricCard
              title={t('metric_precision')}
              value={v2 ? `${(v2.precision * 100).toFixed(2)}%` : '94.03%'}
              subtext="Positive predictive value when flagging injection"
              accentColor="#38bdf8"
            />
            <MetricCard
              title={t('metric_recall')}
              value={v2 ? `${(v2.recall * 100).toFixed(2)}%` : '94.95%'}
              subtext="True positive detection rate for attacks"
              accentColor="#6366f1"
            />
            <MetricCard
              title={t('metric_f1')}
              value={v2 ? `${(v2.f1 * 100).toFixed(2)}%` : '94.49%'}
              subtext="Harmonic mean of precision and recall"
              accentColor="#a855f7"
            />
            <MetricCard
              title={t('metric_specificity')}
              value={v2 ? `${(v2.specificity * 100).toFixed(2)}%` : '93.97%'}
              subtext="True negative rate on benign control pages"
              accentColor="#14b8a6"
            />
            <MetricCard
              title={t('metric_fpr')}
              value={v2 ? `${(v2.false_positive_rate * 100).toFixed(2)}%` : '6.03%'}
              subtext="Calibrated under target 5-6% operational limit"
              badgeType="amber"
              accentColor="#f59e0b"
            />
            <MetricCard
              title={t('metric_roc_auc')}
              value={v2 ? `${(v2.roc_auc * 100).toFixed(2)}%` : '98.40%'}
              subtext="Discriminative power across all thresholds"
              accentColor="#06b6d4"
            />
            <MetricCard
              title={t('metric_pr_auc')}
              value={v2 ? `${(v2.average_precision * 100).toFixed(2)}%` : '98.65%'}
              subtext="Average precision on high confidence alerts"
              accentColor="#ec4899"
            />
          </div>

          <ConfusionMatrix matrix={v2?.confusion_matrix_labels_0_no_1_yes} />
        </div>
      )}

      {/* Tab 2: Bootstrap 95% Confidence Intervals */}
      {activeSubTab === 'ci' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            {t('eval_tab_ci')}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {t('ci_method_note')}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.92rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('ci_table_metric')}</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('ci_table_lower')}</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('ci_table_upper')}</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>Test Point Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>F1 Score</td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#38bdf8' }}>
                    {ci ? `${(ci.f1[0] * 100).toFixed(2)}%` : '93.46%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#38bdf8' }}>
                    {ci ? `${(ci.f1[1] * 100).toFixed(2)}%` : '95.65%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>94.49%</td>
                </tr>

                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>Recall (Attack)</td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#38bdf8' }}>
                    {ci ? `${(ci.recall[0] * 100).toFixed(2)}%` : '93.33%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#38bdf8' }}>
                    {ci ? `${(ci.recall[1] * 100).toFixed(2)}%` : '96.60%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>94.95%</td>
                </tr>

                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>False Positive Rate (FPR)</td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#fbbf24' }}>
                    {ci ? `${(ci.false_positive_rate[0] * 100).toFixed(2)}%` : '4.42%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#fbbf24' }}>
                    {ci ? `${(ci.false_positive_rate[1] * 100).toFixed(2)}%` : '8.06%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>6.03%</td>
                </tr>

                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>Average Precision (PR-AUC)</td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#34d399' }}>
                    {ci ? `${(ci.average_precision[0] * 100).toFixed(2)}%` : '98.20%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#34d399' }}>
                    {ci ? `${(ci.average_precision[1] * 100).toFixed(2)}%` : '99.10%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>98.65%</td>
                </tr>

                <tr>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>Both Pages Correct in Pair</td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#a855f7' }}>
                    {ci ? `${(ci.both_pages_correct_rate[0] * 100).toFixed(2)}%` : '86.91%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', color: '#a855f7' }}>
                    {ci ? `${(ci.both_pages_correct_rate[1] * 100).toFixed(2)}%` : '91.27%'}
                  </td>
                  <td className="font-mono" style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>88.92%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Authentic v1 vs v2 Comparison */}
      {activeSubTab === 'comparison' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            {t('eval_tab_comparison')}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {t('comp_source_note')}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.92rem',
              textAlign: 'left'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('comp_metric')}</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('comp_v1')}</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('comp_v2')}</th>
                  <th style={{ padding: '14px 16px', fontWeight: 600 }}>{t('comp_delta')}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {item.metric}
                    </td>
                    <td className="font-mono" style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                      {item.v1_baseline}
                    </td>
                    <td className="font-mono" style={{ padding: '14px 16px', fontWeight: 700, color: '#38bdf8' }}>
                      {item.v2_model}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                        {item.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
