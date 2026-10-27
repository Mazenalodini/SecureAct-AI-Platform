import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ScanHistoryItem } from '../types';
import { 
  History, 
  Trash2, 
  RefreshCw, 
  Eye, 
  Layers, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  X, 
  FileText, 
  Globe, 
  Clock, 
  ArrowLeftRight, 
  AlertCircle 
} from 'lucide-react';

interface HistoryPageProps {
  history: ScanHistoryItem[];
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onRescanTarget: (target: { type: 'url' | 'text'; value: string }) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  history,
  onDeleteItem,
  onClearHistory,
  onRescanTarget
}) => {
  const { t, language } = useLanguage();

  // Selected item for details modal
  const [inspectItem, setInspectItem] = useState<ScanHistoryItem | null>(null);

  // Comparison selection (IDs of up to 2 items)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filter
  const [filterType, setFilterType] = useState<'all' | 'url' | 'batch' | 'text' | 'file'>('all');

  const filteredHistory = history.filter(item => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const toggleCompareSelect = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(i => i !== id));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const getCompareItems = () => {
    const item1 = history.find(h => h.id === compareIds[0]);
    const item2 = history.find(h => h.id === compareIds[1]);
    return { item1, item2 };
  };

  const downloadItemJson = (item: ScanHistoryItem) => {
    const jsonStr = JSON.stringify(item.raw_details || item, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secureact_scan_${item.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container" style={{ padding: '36px 20px 80px 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={26} color="#38bdf8" />
            <h1 className="heading-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
              {t('history_title')}
            </h1>
          </div>
          <p className="heading-sub" style={{ marginTop: '6px' }}>
            {t('history_desc')}
          </p>
        </div>

        {history.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {compareIds.length === 2 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                <ArrowLeftRight size={16} />
                <span>{t('btn_compare_now')} (2)</span>
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(t('confirm_clear_history'))) {
                  onClearHistory();
                }
              }}
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '0.88rem' }}
            >
              <Trash2 size={16} />
              <span>{t('btn_clear_history')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Chips */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {(['all', 'url', 'batch', 'text', 'file'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                background: filterType === type ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                border: filterType === type ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                color: filterType === type ? '#38bdf8' : 'var(--text-muted)'
              }}
            >
              {type === 'all' && (language === 'ar' ? 'الكل' : 'All')}
              {type === 'url' && (language === 'ar' ? 'روابط URL' : 'URLs')}
              {type === 'batch' && (language === 'ar' ? 'فحص جماعي' : 'Batch')}
              {type === 'text' && (language === 'ar' ? 'نص مباشر' : 'Direct Text')}
              {type === 'file' && (language === 'ar' ? 'ملفات مرفوعة' : 'Files')}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <History size={48} color="var(--text-dim)" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#ffffff' }}>
            {t('history_empty')}
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto' }}>
            {language === 'ar'
              ? 'تُحفظ عمليات الفحص محلياً في متصفحك بشكل آمن دون تخزين أي نصوص حساسة أو كامل صفحات الويب.'
              : 'Scans are safely indexed locally in your browser without persisting bulky HTML payloads.'}
          </p>
        </div>
      ) : (
        /* History Table */
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>{t('col_timestamp')}</th>
                  <th>{t('col_type')}</th>
                  <th>{t('col_target')}</th>
                  <th>{t('col_decision')}</th>
                  <th>{t('col_score')}</th>
                  <th style={{ textAlign: 'center' }}>{t('col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => {
                  const isSelectedForCompare = compareIds.includes(item.id);
                  const isUrl = item.type === 'url';

                  return (
                    <tr 
                      key={item.id}
                      style={{
                        background: isSelectedForCompare ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                        transition: 'var(--transition)'
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelectedForCompare}
                          onChange={() => toggleCompareSelect(item.id)}
                          title={t('btn_compare_select')}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(item.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </td>
                      <td>
                        <span className="badge badge-cyan" style={{ fontSize: '0.74rem' }}>
                          {item.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.86rem', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.target}
                      </td>
                      <td>
                        {item.status === 'failed' ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.74rem' }}>
                            {item.error || 'Failed'}
                          </span>
                        ) : item.is_injection ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.74rem' }}>
                            <ShieldAlert size={12} />
                            <span>{language === 'ar' ? 'مؤشر حقن' : 'Injection'}</span>
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>
                            <ShieldCheck size={12} />
                            <span>{language === 'ar' ? 'سليم' : 'Benign'}</span>
                          </span>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.86rem' }}>
                        {item.score !== undefined ? item.score.toFixed(4) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* View details */}
                          <button
                            onClick={() => setInspectItem(item)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            title={t('btn_view_details')}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Re-scan */}
                          {(item.type === 'url' || item.type === 'text') && (
                            <button
                              onClick={() => onRescanTarget({ type: item.type === 'url' ? 'url' : 'text', value: item.target })}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title={t('btn_rescan')}
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                            title={t('btn_delete_item')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: VIEW FULL DETAILS */}
      {/* ========================================================= */}
      {inspectItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative'
          }}>
            <button
              onClick={() => setInspectItem(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: language === 'ar' ? 'auto' : '20px',
                left: language === 'ar' ? '20px' : 'auto',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              {t('result_title')}
            </h3>

            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.7)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Target:</div>
              <div className="font-mono" style={{ fontSize: '0.95rem', wordBreak: 'break-all', color: '#38bdf8' }}>
                {inspectItem.target}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.5)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Decision: </span>
                <span style={{ fontWeight: 700, color: inspectItem.is_injection ? '#fb7185' : '#34d399' }}>
                  {inspectItem.classification || inspectItem.status}
                </span>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.5)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Score: </span>
                <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                  {inspectItem.score !== undefined ? inspectItem.score.toFixed(6) : 'N/A'}
                </span>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.5)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Threshold: </span>
                <span className="font-mono" style={{ color: '#ffffff' }}>
                  {inspectItem.threshold ?? -0.237541}
                </span>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.5)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Timestamp: </span>
                <span style={{ color: '#ffffff', fontSize: '0.82rem' }}>
                  {new Date(inspectItem.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            {inspectItem.warning && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', fontSize: '0.84rem', marginBottom: '20px' }}>
                {inspectItem.warning}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => downloadItemJson(inspectItem)}
                className="btn btn-secondary"
              >
                <Download size={16} />
                <span>{t('btn_download_json')}</span>
              </button>
              <button
                onClick={() => setInspectItem(null)}
                className="btn btn-primary"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: COMPARISON OF TWO SCANS */}
      {/* ========================================================= */}
      {showCompareModal && compareIds.length === 2 && (() => {
        const { item1, item2 } = getCompareItems();
        if (!item1 || !item2) return null;

        const scoreDelta = (item2.score !== undefined && item1.score !== undefined) 
          ? (item2.score - item1.score) 
          : null;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="glass-panel" style={{
              maxWidth: '780px',
              width: '100%',
              padding: '28px',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowCompareModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: language === 'ar' ? 'auto' : '20px',
                  left: language === 'ar' ? '20px' : 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={22} />
              </button>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: '#ffffff' }}>
                {t('compare_modal_title')}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px'
              }}>
                {/* Item 1 */}
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <span className="badge badge-cyan" style={{ marginBottom: '10px' }}>{t('compare_time_prev')}</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Target:</div>
                  <div className="font-mono" style={{ fontSize: '0.86rem', color: '#ffffff', marginBottom: '12px', wordBreak: 'break-all' }}>
                    {item1.target}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Decision: </span>
                    <span style={{ fontWeight: 700, color: item1.is_injection ? '#fb7185' : '#34d399' }}>
                      {item1.classification}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Score: </span>
                    <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                      {item1.score?.toFixed(6) ?? 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {new Date(item1.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Item 2 */}
                <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(13, 18, 31, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <span className="badge badge-cyan" style={{ marginBottom: '10px' }}>{t('compare_time_curr')}</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Target:</div>
                  <div className="font-mono" style={{ fontSize: '0.86rem', color: '#ffffff', marginBottom: '12px', wordBreak: 'break-all' }}>
                    {item2.target}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Decision: </span>
                    <span style={{ fontWeight: 700, color: item2.is_injection ? '#fb7185' : '#34d399' }}>
                      {item2.classification}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Score: </span>
                    <span className="font-mono" style={{ fontWeight: 700, color: '#ffffff' }}>
                      {item2.score?.toFixed(6) ?? 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {new Date(item2.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Delta Comparison */}
              {scoreDelta !== null && (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {t('compare_score_delta')}
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: scoreDelta > 0 ? '#fb7185' : '#34d399' }}>
                    {(scoreDelta > 0 ? '+' : '') + scoreDelta.toFixed(6)}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="btn btn-primary"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
