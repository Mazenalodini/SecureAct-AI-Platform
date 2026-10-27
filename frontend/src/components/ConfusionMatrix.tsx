import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ConfusionMatrixProps {
  matrix?: number[][];
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  matrix = [[670, 43], [36, 677]]
}) => {
  const { t } = useLanguage();

  const tn = matrix[0]?.[0] ?? 670;
  const fp = matrix[0]?.[1] ?? 43;
  const fn = matrix[1]?.[0] ?? 36;
  const tp = matrix[1]?.[1] ?? 677;

  const totalSafe = tn + fp; // 713
  const totalAttack = fn + tp; // 713
  const totalAll = totalSafe + totalAttack; // 1426

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          {t('cm_title')}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          N = {totalAll.toLocaleString()} pages evaluated on the authoritative local test split
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 1fr',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Header Row */}
        <div />
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8' }}>
          {t('cm_pred_safe')}
        </div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#f43f5e' }}>
          {t('cm_pred_attack')}
        </div>

        {/* Row 1: Actual Benign */}
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399' }}>
          {t('cm_actual_safe')}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>
            ({totalSafe})
          </div>
        </div>

        {/* Cell: TN */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '20px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, marginBottom: '4px' }}>
            {t('cm_true_negative')}
          </div>
          <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>
            {tn}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {((tn / totalSafe) * 100).toFixed(2)}%
          </div>
        </div>

        {/* Cell: FP (False Alarm) */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '12px',
          padding: '20px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>
            {t('cm_false_positive')}
          </div>
          <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>
            {fp}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>
            FPR: {((fp / totalSafe) * 100).toFixed(2)}%
          </div>
        </div>

        {/* Row 2: Actual Attack */}
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fb7185' }}>
          {t('cm_actual_attack')}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>
            ({totalAttack})
          </div>
        </div>

        {/* Cell: FN (Missed) */}
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.35)',
          borderRadius: '12px',
          padding: '20px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', fontWeight: 600, marginBottom: '4px' }}>
            {t('cm_false_negative')}
          </div>
          <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>
            {fn}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Miss: {((fn / totalAttack) * 100).toFixed(2)}%
          </div>
        </div>

        {/* Cell: TP */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '20px 16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, marginBottom: '4px' }}>
            {t('cm_true_positive')}
          </div>
          <div className="font-mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc' }}>
            {tp}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
            Recall: {((tp / totalAttack) * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};
