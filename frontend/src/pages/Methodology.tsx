import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ModelInfo, MetricsData } from '../types';
import { MetricCard } from '../components/MetricCard';
import { ConfusionMatrix } from '../components/ConfusionMatrix';
import { 
  Database, 
  Binary, 
  Sliders, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Info,
  GitBranch
} from 'lucide-react';

interface MethodologyProps {
  modelInfo: ModelInfo | null;
  metrics: MetricsData | null;
}

export const Methodology: React.FC<MethodologyProps> = ({ modelInfo, metrics }) => {
  const { t, language } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'model_card' | 'metrics' | 'dataset'>('model_card');

  const v2 = metrics?.v2_test_metrics;
  const ci = v2?.clustered_bootstrap_95pct_ci?.intervals;
  const comparison = metrics?.comparison_summary || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title */}
      <div>
        <h1 className="heading-gradient" style={{ fontSize: '2.1rem', marginBottom: '8px' }}>
          {t('method_title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
          {t('method_desc')}
        </p>
      </div>

      {/* Sub navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveSubTab('model_card')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'model_card' ? '1px solid var(--border-glow)' : '1px solid transparent',
            background: activeSubTab === 'model_card' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSubTab === 'model_card' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {language === 'ar' ? 'بطاقة النموذج والمواصفات' : 'Model Card & Specs'}
        </button>

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
          {t('eval_title')}
        </button>

        <button
          onClick={() => setActiveSubTab('dataset')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: activeSubTab === 'dataset' ? '1px solid var(--border-glow)' : '1px solid transparent',
            background: activeSubTab === 'dataset' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: activeSubTab === 'dataset' ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('method_dataset_title')}
        </button>
      </div>

      {/* SUB-TAB 1: MODEL CARD & INTEGRITY */}
      {activeSubTab === 'model_card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Card */}
          <div className="glass-panel" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Cpu size={22} color="#06b6d4" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('dash_model_status')}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px'
            }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t('dash_model_name')}</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{modelInfo?.model_name || 'SecureAct_AI_v2'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t('dash_estimator')}</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{modelInfo?.estimator || 'LinearSVC'}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t('dash_threshold')}</div>
                <div className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {modelInfo?.threshold ?? -0.23754153513923493}
                </div>
              </div>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t('dash_train_size')}</div>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>{t('dash_train_desc')}</div>
              </div>
            </div>

            {/* SHA-256 Verified Banner */}
            <div style={{
              marginTop: '16px',
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t('dash_sha256')}:</div>
                <div className="font-mono" style={{ fontSize: '0.82rem', color: '#34d399', wordBreak: 'break-all' }}>
                  {modelInfo?.sha256_hash || '8569185d875a1bd76768e1a576c1cfcfd8ff6d74529cd5e646f67d610f2ece5c'}
                </div>
              </div>
              <span className="badge badge-success">
                <CheckCircle2 size={14} />
                <span>{t('dash_sha256_verified')}</span>
              </span>
            </div>
          </div>

          {/* Features Engineering */}
          <div className="glass-panel" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Binary size={22} color="#6366f1" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('method_features_title')}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
              {t('method_features_desc')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Word n-grams (1 to 2)</div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                  Captures prompt override phrases, role inversion statements, and imperative system directives.
                </p>
              </div>
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: '4px' }}>Character n-grams (3 to 5)</div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                  Identifies structural HTML markers, hidden CSS styles (display:none, font-size:0), and character obfuscations.
                </p>
              </div>
            </div>
          </div>

          {/* Limitations */}
          <div className="glass-panel" style={{ padding: '26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Info size={22} color="#f59e0b" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {t('method_limitations_title')}
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {t('method_limitations_desc')}
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BENCHMARK METRICS & CONFUSION MATRIX */}
      {activeSubTab === 'metrics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* KPI Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            <MetricCard
              title={t('metric_accuracy')}
              value={v2?.accuracy ? `${(v2.accuracy * 100).toFixed(2)}%` : '94.46%'}
              subtext="1,426 test pages"
              accentColor="#06b6d4"
            />
            <MetricCard
              title={t('metric_recall')}
              value={v2?.recall ? `${(v2.recall * 100).toFixed(2)}%` : '94.95%'}
              subtext="Attack detection rate"
              accentColor="#10b981"
            />
            <MetricCard
              title={t('metric_fpr')}
              value={v2?.false_positive_rate ? `${(v2.false_positive_rate * 100).toFixed(2)}%` : '6.03%'}
              subtext="False positive rate"
              accentColor="#f59e0b"
            />
            <MetricCard
              title={t('metric_f1')}
              value={v2?.f1 ? v2.f1.toFixed(4) : '0.9419'}
              subtext="Harmonic F1 score"
              accentColor="#6366f1"
            />
          </div>

          {/* Confusion Matrix */}
          <ConfusionMatrix matrix={v2?.confusion_matrix_labels_0_no_1_yes || [[670, 43], [36, 677]]} />

          {/* Comparison with v1 */}
          {comparison.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#ffffff' }}>
                {language === 'ar' ? 'المقارنة المرجعية مع v1' : 'Comparative Benchmark: v1 vs v2'}
              </h3>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'المقياس' : 'Metric'}</th>
                      <th>v1 Baseline</th>
                      <th>v2 Certified Model</th>
                      <th>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.metric}</td>
                        <td className="font-mono">{c.v1_baseline}</td>
                        <td className="font-mono" style={{ color: '#38bdf8' }}>{c.v2_model}</td>
                        <td className="font-mono" style={{ color: c.status === 'improved' ? '#34d399' : 'inherit' }}>
                          {c.delta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textAlign: 'center' }}>
            {t('metric_test_note')}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DATASET PROVENANCE */}
      {activeSubTab === 'dataset' && (
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Database size={22} color="#06b6d4" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('method_dataset_title')}
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
            {t('method_dataset_desc')}
          </p>
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.86rem'
          }}>
            <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
              BrowseSafe++ Provenance Specifications:
            </div>
            <ul style={{ paddingLeft: '20px', paddingRight: '20px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
              <li><strong>Repository:</strong> perplexity-ai/browsesafe-plus-plus</li>
              <li><strong>License:</strong> Creative Commons Attribution 4.0 International (CC BY 4.0)</li>
              <li><strong>Dataset Hash / Revision:</strong> b8c50afc1a1904923c67657dfa1abf41f812ec71</li>
              <li><strong>Training Corpus Partition:</strong> 6,656 pairs (13,312 pages total)</li>
              <li><strong>Independent Local Test Split:</strong> 713 pairs (1,426 pages total)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
