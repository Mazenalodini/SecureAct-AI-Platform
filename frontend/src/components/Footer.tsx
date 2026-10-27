import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer style={{
      marginTop: '80px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 14, 0.95)',
      padding: '40px 0 30px 0',
      color: 'var(--text-muted)',
      fontSize: '0.88rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', marginBottom: '10px' }}>
              <ShieldCheck size={18} color="#06b6d4" />
              <span>SecureAct AI Platform v2</span>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-dim)' }}>
              {t('footer_text')}
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', marginBottom: '10px' }}>
              <Info size={18} color="#6366f1" />
              <span>{t('res_explanation_title')}</span>
            </div>
            <p style={{ lineHeight: 1.6, color: 'var(--text-dim)' }}>
              {t('footer_disclaimer')}
            </p>
          </div>

          {/* Col 3 */}
          <div>
            <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', marginBottom: '10px' }}>
              {t('dash_model_status')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Architecture: LinearSVC TF-IDF (word+char)</span>
              <span style={{ color: 'var(--text-dim)' }}>Threshold: -0.2375415</span>
              <span style={{ color: 'var(--text-dim)' }}>Corpus: BrowseSafe++ (CC BY 4.0)</span>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)'
        }}>
          <div>{t('footer_rights')}</div>
          <div>SecureAct AI &copy; 2026 — Research & Academic Defense Platform</div>
        </div>
      </div>
    </footer>
  );
};
