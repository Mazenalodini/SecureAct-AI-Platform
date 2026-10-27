import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DemoCase, DemoResultItem, DemoBatchResponse } from '../types';
import { getDemoCases, runDemoBatch, predictContent } from '../services/api';
import { Play, PlayCircle, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';

export const DemoCases: React.FC = () => {
  const { t, language } = useLanguage();

  const [cases, setCases] = useState<DemoCase[]>([]);
  const [results, setResults] = useState<{ [id: string]: DemoResultItem }>({});
  const [batchSummary, setBatchSummary] = useState<DemoBatchResponse | null>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState<boolean>(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    getDemoCases()
      .then((data) => setCases(data))
      .catch((err) => console.error('Failed to load demo cases', err));
  }, []);

  const handleRunAll = async () => {
    setIsLoadingBatch(true);
    try {
      const batchRes = await runDemoBatch();
      setBatchSummary(batchRes);
      const resMap: { [id: string]: DemoResultItem } = {};
      batchRes.results.forEach((r) => {
        resMap[r.id] = r;
      });
      setResults(resMap);
    } catch (err) {
      console.error('Batch run failed', err);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleRunSingle = async (demoCase: DemoCase) => {
    setRunningId(demoCase.id);
    try {
      const pred = await predictContent(demoCase.content);
      const predLabel = pred.is_injection ? 'injection' : 'benign';
      const isCorrect = predLabel === demoCase.target_label;

      const item: DemoResultItem = {
        id: demoCase.id,
        title_ar: demoCase.title_ar,
        title_en: demoCase.title_en,
        category: demoCase.category,
        target_label: demoCase.target_label,
        score: pred.score,
        threshold: pred.threshold,
        classification: pred.classification,
        is_injection: pred.is_injection,
        is_correct: isCorrect,
        margin: pred.margin
      };

      setResults((prev) => ({ ...prev, [demoCase.id]: item }));
    } catch (err) {
      console.error('Single case run failed', err);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Title & Batch Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="heading-gradient" style={{ fontSize: '2.1rem', marginBottom: '8px' }}>
            {t('demo_title')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem' }}>
            {t('demo_desc')}
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isLoadingBatch}
          className="btn btn-primary"
          style={{ minWidth: '200px' }}
        >
          {isLoadingBatch ? (
            <>
              <div className="live-indicator" style={{ animationDuration: '0.8s' }} />
              <span>{t('btn_running_batch')}</span>
            </>
          ) : (
            <>
              <PlayCircle size={18} />
              <span>{t('btn_run_all')}</span>
            </>
          )}
        </button>
      </div>

      {/* Batch Summary Banner */}
      {batchSummary && (
        <div className="glass-panel" style={{
          padding: '20px 24px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          background: 'rgba(56, 189, 248, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8' }}>
              {t('demo_batch_summary')}
            </span>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-main)', margin: '0 8px' }}>
              {batchSummary.correct_cases} / {batchSummary.total_cases} {t('demo_summary_stat')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
              {batchSummary.accuracy_on_demo}%
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
              Empirical Agreement
            </span>
          </div>
        </div>
      )}

      {/* Demo Cases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {cases.map((c) => {
          const res = results[c.id];
          const isRunning = runningId === c.id;
          const isTargetInjection = c.target_label === 'injection';

          return (
            <div key={c.id} className="glass-panel" style={{ padding: '26px' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className={`badge ${isTargetInjection ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.72rem' }}>
                      {t('demo_target')} {isTargetInjection ? t('demo_injection_label') : t('demo_benign_label')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Category: {c.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {language === 'ar' ? c.title_ar : c.title_en}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {language === 'ar' ? c.description_ar : c.description_en}
                  </p>
                </div>

                <button
                  onClick={() => handleRunSingle(c)}
                  disabled={isRunning || isLoadingBatch}
                  className="btn btn-secondary"
                  style={{ minWidth: '130px', padding: '8px 14px', fontSize: '0.84rem' }}
                >
                  {isRunning ? (
                    <div className="live-indicator" />
                  ) : (
                    <>
                      <Play size={14} />
                      <span>فحص مباشر</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Snippet Box */}
              <div style={{
                background: 'rgba(7, 9, 14, 0.7)',
                borderRadius: '10px',
                padding: '14px 18px',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.84rem',
                color: '#94a3b8',
                maxHeight: '140px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                marginBottom: '16px'
              }}>
                {c.content}
              </div>

              {/* Live Output Section */}
              {res && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: res.is_correct ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: res.is_correct ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {res.is_correct ? (
                      <CheckCircle2 size={22} color="#10b981" />
                    ) : (
                      <AlertTriangle size={22} color="#f59e0b" />
                    )}

                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {t('demo_model_pred')}
                        <span style={{ color: res.is_injection ? '#fb7185' : '#34d399', margin: '0 6px' }}>
                          {res.is_injection ? t('demo_injection_label') : t('demo_benign_label')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {language === 'ar' ? c.explanation_ar : c.explanation_en}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                      <div style={{ color: 'var(--text-dim)' }}>
                        {t('demo_score_label')} <span className="font-mono" style={{ color: 'var(--text-main)', fontWeight: 700 }}>{res.score.toFixed(4)}</span>
                      </div>
                      <div style={{ color: 'var(--text-dim)' }}>
                        {t('demo_threshold_label')} <span className="font-mono">{res.threshold.toFixed(4)}</span>
                      </div>
                    </div>

                    <span className={`badge ${res.is_correct ? 'badge-success' : 'badge-amber'}`} style={{ fontSize: '0.74rem' }}>
                      {res.is_correct ? t('demo_status_match') : t('demo_status_mismatch')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
