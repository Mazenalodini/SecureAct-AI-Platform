import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ArrowDown } from 'lucide-react';

interface DecisionGaugeProps {
  score: number;
  threshold: number;
  isInjection: boolean;
  margin: number;
  language?: 'ar' | 'en';
}

export const DecisionGauge: React.FC<DecisionGaugeProps> = ({
  score,
  threshold,
  isInjection,
  margin,
  language = 'ar'
}) => {
  const isAr = language === 'ar';

  // Normalize score between -2.5 and +2.5 for a 0-100% visual meter
  const minRange = -2.5;
  const maxRange = 2.5;
  const clampedScore = Math.max(minRange, Math.min(maxRange, score));
  const scorePercent = ((clampedScore - minRange) / (maxRange - minRange)) * 100;
  
  const clampedThreshold = Math.max(minRange, Math.min(maxRange, threshold));
  const thresholdPercent = ((clampedThreshold - minRange) / (maxRange - minRange)) * 100;

  // Determine state
  const isBorderline = isInjection && margin < 0.25;
  const statusColor = !isInjection ? '#10b981' : isBorderline ? '#f59e0b' : '#f43f5e';

  return (
    <div style={{
      marginTop: '16px',
      marginBottom: '20px',
      padding: '16px 20px',
      borderRadius: '14px',
      background: 'rgba(13, 18, 31, 0.75)',
      border: '1px solid var(--border-subtle)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isInjection ? (
            isBorderline ? <AlertTriangle size={17} color="#fbbf24" /> : <ShieldAlert size={17} color="#fb7185" />
          ) : (
            <ShieldCheck size={17} color="#34d399" />
          )}
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
            {isAr ? 'مقياس طيف القرار الأمني (Decision Boundary Spectrum)' : 'Security Decision Boundary Spectrum'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
          <span style={{ color: 'var(--text-dim)' }}>{isAr ? 'المسافة عن العتبة:' : 'Threshold Margin:'}</span>
          <span className="font-mono" style={{ fontWeight: 800, color: statusColor }}>
            {(margin >= 0 ? '+' : '') + margin.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Meter Bar Container */}
      <div style={{ position: 'relative', margin: '22px 0 14px 0' }}>
        {/* Background track */}
        <div style={{
          height: '10px',
          borderRadius: '5px',
          background: 'linear-gradient(90deg, #10b981 0%, #10b981 40%, #f59e0b 50%, #f43f5e 65%, #e11d48 100%)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
          position: 'relative'
        }} />

        {/* Threshold Cutoff Marker */}
        <div
          title={`${isAr ? 'عتبة القرار المعتمدة' : 'Operational Threshold'}: ${threshold.toFixed(6)}`}
          style={{
            position: 'absolute',
            left: `${thresholdPercent}%`,
            top: '-6px',
            bottom: '-6px',
            width: '2px',
            background: '#ffffff',
            boxShadow: '0 0 8px #ffffff',
            zIndex: 2,
            transform: 'translateX(-50%)'
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--accent-cyan)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            whiteSpace: 'nowrap',
            fontWeight: 700
          }}>
            {threshold.toFixed(3)}
          </div>
        </div>

        {/* Current Score Indicator (Pointer) */}
        <div
          style={{
            position: 'absolute',
            left: `${scorePercent}%`,
            top: '-2px',
            zIndex: 3,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'left 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: statusColor,
            border: '2px solid #ffffff',
            boxShadow: `0 0 10px ${statusColor}`
          }} />
          <ArrowDown size={14} color={statusColor} style={{ marginTop: '-2px' }} />
          <div style={{
            marginTop: '2px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1px solid ${statusColor}`,
            padding: '2px 7px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#ffffff',
            fontWeight: 800,
            whiteSpace: 'nowrap'
          }}>
            {score.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Spectrum Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-dim)',
        marginTop: '28px',
        padding: '0 2px'
      }}>
        <span style={{ color: '#34d399', fontWeight: 600 }}>
          {isAr ? '← منطقة السلامة (Safe)' : '← Safe Zone'}
        </span>
        <span style={{ color: '#fbbf24', fontWeight: 600 }}>
          {isAr ? 'منطقة الحذر الإحصائي (FPR)' : 'Borderline / FPR Window'}
        </span>
        <span style={{ color: '#fb7185', fontWeight: 600 }}>
          {isAr ? 'منطقة التهديد الصريح (Threat) →' : 'Threat Zone →'}
        </span>
      </div>
    </div>
  );
};
export default DecisionGauge;

