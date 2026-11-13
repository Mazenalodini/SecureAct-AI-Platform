import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FlaggedSnippet } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  AlertTriangle, 
  Search,
  Sparkles,
  Maximize2,
  Minimize2,
  Terminal,
  Zap,
  Info
} from 'lucide-react';

interface ContentThreatInspectorProps {
  contentPreview?: string | null;
  extractedText?: string | null;
  flaggedSnippets?: FlaggedSnippet[];
  targetUrl?: string | null;
  isInjection?: boolean;
}

export const ContentThreatInspector: React.FC<ContentThreatInspectorProps> = ({
  contentPreview,
  extractedText,
  flaggedSnippets = [],
  targetUrl,
  isInjection = false
}) => {
  const { t, language } = useLanguage();

  const hasSnippets = flaggedSnippets && flaggedSnippets.length > 0;
  const [activeTab, setActiveTab] = useState<'threats' | 'extracted' | 'raw'>(
    isInjection || hasSnippets ? 'threats' : 'extracted'
  );

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Content normalization
  const cleanText = extractedText || contentPreview || '';
  const rawHtml = contentPreview || '';

  // Stats
  const lineCount = cleanText ? cleanText.split('\n').length : 0;
  const charCount = cleanText ? cleanText.length : 0;
  const wordCount = cleanText ? cleanText.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleCopySnippet = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFull = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Helper to render text with search highlight and threat snippet highlights
  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    // Search term highlight takes precedence if active
    if (searchTerm.trim()) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={i} style={{
            backgroundColor: 'rgba(245, 158, 11, 0.45)',
            color: '#fef08a',
            padding: '2px 4px',
            borderRadius: '4px',
            fontWeight: 700
          }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    }

    // Otherwise, highlight flagged snippets if present
    if (flaggedSnippets && flaggedSnippets.length > 0) {
      // Find matches for each snippet text
      const regexPatterns = flaggedSnippets
        .map(s => s.text.trim())
        .filter(t => t.length > 5)
        .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

      if (regexPatterns.length > 0) {
        const combinedRegex = new RegExp(`(${regexPatterns.join('|')})`, 'gi');
        const parts = text.split(combinedRegex);
        return parts.map((part, i) => {
          const isMatch = regexPatterns.some(p => new RegExp(`^${p}$`, 'i').test(part));
          return isMatch ? (
            <mark key={i} style={{
              backgroundColor: 'rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
              border: '1px solid rgba(244, 63, 94, 0.6)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 700,
              boxShadow: '0 0 12px rgba(244, 63, 94, 0.4)'
            }}>
              {part}
            </mark>
          ) : (
            part
          );
        });
      }
    }

    return text;
  };

  return (
    <div className="glass-panel" style={{
      marginTop: '28px',
      overflow: 'hidden',
      border: isInjection 
        ? '1px solid rgba(244, 63, 94, 0.45)' 
        : '1px solid var(--border-glow)',
      boxShadow: isInjection 
        ? '0 12px 40px rgba(244, 63, 94, 0.15)' 
        : '0 12px 40px rgba(6, 182, 212, 0.12)'
    }}>
      {/* Top Banner Header */}
      <div className="inspector-header" style={{
        background: isInjection 
          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(13, 18, 31, 0.85) 100%)' 
          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(13, 18, 31, 0.85) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Title & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isInjection ? 'rgba(244, 63, 94, 0.2)' : 'rgba(6, 182, 212, 0.15)',
            border: `1px solid ${isInjection ? 'rgba(244, 63, 94, 0.4)' : 'rgba(6, 182, 212, 0.35)'}`,
            color: isInjection ? '#fb7185' : '#38bdf8',
            boxShadow: isInjection ? '0 0 20px rgba(244, 63, 94, 0.3)' : '0 0 20px rgba(6, 182, 212, 0.25)',
            flexShrink: 0
          }}>
            {isInjection ? <ShieldAlert size={24} /> : <Terminal size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {t('inspector_title')}
              </h3>
              {hasSnippets ? (
                <span className="badge badge-danger">
                  <Zap size={13} />
                  <span>{flaggedSnippets.length} {t('threat_snippets_detected')}</span>
                </span>
              ) : isInjection ? (
                <span className="badge badge-amber">
                  <AlertTriangle size={13} />
                  <span>{language === 'ar' ? 'مؤشر إحصائي عام للنموذج (نمط متفرق)' : 'Elevated Global Model Signal'}</span>
                </span>
              ) : (
                <span className="badge badge-success">
                  <ShieldCheck size={13} />
                  <span>{language === 'ar' ? 'سليم من مؤشرات الحقن' : 'Clean / Benign'}</span>
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {t('inspector_subtitle')}
            </p>
          </div>
        </div>

        {/* Real-time Document Metadata Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            <span style={{ color: 'var(--text-dim)' }}>{t('inspector_chars')}: </span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{charCount.toLocaleString()}</span>
          </div>

          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            <span style={{ color: 'var(--text-dim)' }}>{t('inspector_words')}: </span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{wordCount.toLocaleString()}</span>
          </div>

          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            <span style={{ color: 'var(--text-dim)' }}>{t('inspector_lines')}: </span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>{lineCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Controls Navigation Bar */}
      <div className="inspector-tabs" style={{
        background: 'rgba(10, 15, 29, 0.65)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('threats')}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.86rem',
              borderRadius: '9px',
              background: activeTab === 'threats'
                ? (isInjection ? 'rgba(244, 63, 94, 0.2)' : 'rgba(56, 189, 248, 0.15)')
                : 'transparent',
              color: activeTab === 'threats' 
                ? (isInjection ? '#fb7185' : '#38bdf8') 
                : 'var(--text-muted)',
              border: activeTab === 'threats' 
                ? (isInjection ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid var(--border-glow)') 
                : '1px solid transparent',
              fontWeight: activeTab === 'threats' ? 700 : 500
            }}
          >
            <ShieldAlert size={16} />
            <span>{t('tab_flagged_snippets')}</span>
            {hasSnippets ? (
              <span style={{
                background: '#e11d48',
                color: '#ffffff',
                fontSize: '0.7rem',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontWeight: 800
              }}>
                {flaggedSnippets.length}
              </span>
            ) : isInjection ? (
              <span style={{
                background: '#d97706',
                color: '#ffffff',
                fontSize: '0.7rem',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontWeight: 800
              }}>
                {language === 'ar' ? 'إحصائي' : 'Global'}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('extracted')}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.86rem',
              borderRadius: '9999px',
              background: activeTab === 'extracted' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: activeTab === 'extracted' ? '#38bdf8' : 'var(--text-muted)',
              border: activeTab === 'extracted' ? '1px solid var(--border-glow)' : '1px solid transparent',
              fontWeight: activeTab === 'extracted' ? 700 : 500
            }}
          >
            <FileText size={16} />
            <span>{language === 'ar' ? 'النص المستخرج والتحليل' : 'Extracted Text & Analysis'}</span>
          </button>

          {rawHtml && (
            <button
              onClick={() => setActiveTab('raw')}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.86rem',
                borderRadius: '9px',
                background: activeTab === 'raw' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: activeTab === 'raw' ? '#818cf8' : 'var(--text-muted)',
                border: activeTab === 'raw' ? '1px solid var(--border-glow)' : '1px solid transparent',
                fontWeight: activeTab === 'raw' ? 700 : 500
              }}
            >
              <FileCode size={16} />
              <span>{t('tab_raw_html')}</span>
            </button>
          )}
        </div>

        {/* Search, Expand, and Copy Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {activeTab !== 'threats' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '4px 10px',
              gap: '6px'
            }}>
              <Search size={14} color="var(--text-dim)" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'بحث في النص...' : 'Search in text...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '140px'
                }}
              />
            </div>
          )}

          {activeTab !== 'threats' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
              title={isExpanded ? 'Collapse viewer' : 'Expand full height'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          <button
            onClick={() => handleCopyFull(activeTab === 'raw' ? rawHtml : cleanText)}
            className="btn btn-secondary"
            style={{ padding: '7px 14px', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            {copiedAll ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedAll ? t('copied_success') : t('copy_content')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="inspector-body">
        {/* ========================================================= */}
        {/* TAB 1: THREAT SNIPPETS & EXPLAINABLE AI                   */}
        {/* ========================================================= */}
        {activeTab === 'threats' && (
          <div>
            {!hasSnippets ? (
              isInjection ? (
                /* Diffuse / Statistical Signal Advisory Card */
                <div style={{
                  textAlign: 'center',
                  padding: '40px 24px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.1)'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: '#fbbf24',
                    boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
                  }}>
                    <AlertTriangle size={30} />
                  </div>
                  <h4 style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>
                    {language === 'ar' ? 'مؤشر إحصائي عام للنموذج (نمط مفردات متفرق)' : 'Elevated Global Statistical Score (Diffuse Pattern)'}
                  </h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
                    {language === 'ar' 
                      ? 'سجل نموذج الذكاء الاصطناعي درجة قرار إجمالية أعلى من العتبة المعايرة نتيجة التوزيع التراكمي لمفردات الأمن السيبراني عبر كامل محتوى الصفحة، دون وجود أوامر تجاوز صريحة أو نصوص مخفية منفردة. في المقالات التقنية الطويلة، يُعد هذا السلوك متسقاً مع معدل الإنذار الكاذب المرجعي للنموذج (6.03%).'
                      : 'The AI model recorded an aggregate decision score above the calibrated threshold due to cumulative cybersecurity vocabulary across the page, without single explicit override commands or hidden payloads. For long technical articles, this is consistent with the benchmark 6.03% False Positive Rate.'}
                  </p>
                </div>
              ) : (
                /* Benign Verified State */
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: '#34d399',
                    boxShadow: '0 0 25px rgba(16, 185, 129, 0.25)'
                  }}>
                    <ShieldCheck size={32} />
                  </div>
                  <h4 style={{ color: '#34d399', fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>
                    {language === 'ar' ? 'اجتاز الفحص الاستباقي: المحتوى سليم' : 'Passed Preemptive Security Inspection'}
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
                    {t('no_snippets_found')}
                  </p>
                </div>
              )
            ) : (
              /* Flagged Threats Feed */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {flaggedSnippets.map((snippet, idx) => {
                  const isHigh = snippet.risk_level === 'high';
                  return (
                    <div 
                      key={idx}
                      style={{
                        padding: '18px 20px',
                        borderRadius: '12px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: isHigh ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                        boxShadow: isHigh ? '0 6px 24px rgba(244, 63, 94, 0.12)' : '0 6px 24px rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Card Header */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background: isHigh 
                                ? 'rgba(244, 63, 94, 0.2)' 
                                : snippet.risk_level === 'medium' 
                                  ? 'rgba(245, 158, 11, 0.2)' 
                                  : 'rgba(56, 189, 248, 0.15)',
                              color: isHigh 
                                ? '#fb7185' 
                                : snippet.risk_level === 'medium' 
                                  ? '#fcd34d' 
                                  : '#38bdf8',
                              border: `1px solid ${isHigh ? 'rgba(244, 63, 94, 0.35)' : snippet.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.3)'}`,
                              letterSpacing: '0.02em'
                            }}>
                              {isHigh ? t('risk_high') : snippet.risk_level === 'medium' ? t('risk_medium') : t('risk_low')}
                            </span>

                            <span style={{
                              fontSize: '0.74rem',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {snippet.category}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopySnippet(snippet.text, idx)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: '6px' }}
                            title="Copy snippet"
                          >
                            {copiedIndex === idx ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            <span>{copiedIndex === idx ? t('copied_success') : (language === 'ar' ? 'نسخ المقطع' : 'Copy')}</span>
                          </button>
                        </div>

                        {snippet.score !== undefined && snippet.score !== null && (
                          <div style={{
                            fontSize: '0.78rem',
                            color: '#38bdf8',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700
                          }}>
                            Decision Score: {snippet.score > 0 ? `+${snippet.score}` : snippet.score}
                          </div>
                        )}
                      </div>

                      {/* Snippet Code Terminal Box */}
                      <div style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: 'rgba(7, 9, 14, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        color: isHigh ? '#fda4af' : '#fef08a',
                        wordBreak: 'break-word',
                        direction: 'ltr',
                        textAlign: 'left'
                      }}>
                        {snippet.text}
                      </div>

                      {/* AI Rationale / Explanation */}
                      <div style={{
                        fontSize: '0.86rem',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <Sparkles size={16} color="#38bdf8" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.5 }}>
                          {language === 'ar' ? snippet.reason_ar : snippet.reason_en}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CLEAN EXTRACTED TEXT WITH INLINE HIGHLIGHTING      */}
        {/* ========================================================= */}
        {activeTab === 'extracted' && (
          <div>
            <div style={{
              maxHeight: isExpanded ? '850px' : '440px',
              overflowY: 'auto',
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'rgba(7, 9, 14, 0.75)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.86rem',
              lineHeight: 1.7,
              color: 'var(--text-main)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              direction: language === 'ar' ? 'rtl' : 'ltr',
              textAlign: 'start',
              transition: 'max-height 0.3s ease-in-out'
            }}>
              {cleanText ? (
                renderHighlightedText(cleanText)
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  {language === 'ar' ? 'لا يوجد نص مستخرج للعرض' : 'No extracted text available.'}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '10px',
              fontSize: '0.76rem',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span>{t('preview_truncated_notice')}</span>
              {hasSnippets && (
                <span style={{ color: '#fb7185', fontWeight: 600 }}>
                  * {language === 'ar' ? 'المقاطع المشبوهة مظللة باللون الأحمر داخل النص' : 'Suspicious injection triggers highlighted in red inside text'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: RAW HTML SOURCE CODE                               */}
        {/* ========================================================= */}
        {activeTab === 'raw' && (
          <div>
            <div style={{
              maxHeight: isExpanded ? '850px' : '440px',
              overflowY: 'auto',
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'rgba(7, 9, 14, 0.85)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: '#93c5fd',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              direction: 'ltr',
              textAlign: 'left',
              transition: 'max-height 0.3s ease-in-out'
            }}>
              {rawHtml ? (
                renderHighlightedText(rawHtml)
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  {language === 'ar' ? 'لا يوجد كود HTML أولي للعرض' : 'No raw HTML available.'}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '10px',
              fontSize: '0.76rem',
              color: 'var(--text-dim)',
              textAlign: 'center'
            }}>
              {t('preview_truncated_notice')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
