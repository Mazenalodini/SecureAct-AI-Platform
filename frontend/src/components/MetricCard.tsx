import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtext?: string;
  badge?: string;
  badgeType?: 'success' | 'danger' | 'cyan' | 'amber';
  icon?: LucideIcon;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  badge,
  badgeType = 'cyan',
  icon: Icon,
  accentColor = '#06b6d4'
}) => {
  return (
    <div className="glass-panel glass-panel-interactive" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow highlight */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '120px',
        height: '120px',
        background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: `${accentColor}15`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
        <span className="font-mono" style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
          {value}
        </span>
        {badge && (
          <span className={`badge badge-${badgeType}`} style={{ fontSize: '0.74rem' }}>
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          {subtext}
        </div>
      )}
    </div>
  );
};
