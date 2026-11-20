import React from 'react';
import { DeepShieldResult } from '../types';
import { ShieldCheck, ShieldAlert, Cpu, Target, AlertTriangle, Layers, Zap, CheckCircle2, Crosshair, Terminal, FileCode } from 'lucide-react';

interface DeepShieldInspectorProps {
  deepshield?: DeepShieldResult;
  language?: 'ar' | 'en';
}

export const DeepShieldInspector: React.FC<DeepShieldInspectorProps> = ({
  deepshield,
  language = 'ar'
}) => {
  if (!deepshield) return null;

  const isAr = language === 'ar';
  const isThreat = deepshield.is_injection;
  const prob = (deepshield.probability * 100).toFixed(1);
  const rawProb = (deepshield.raw_probability * 100).toFixed(1);
  const thresh = (deepshield.threshold * 100).toFixed(1);

  const fp = deepshield.forensic_profile;

  const getLabel = (task: string): string => {
    if (fp && fp[task]) {
      return isAr ? fp[task].label_ar : fp[task].label_en;
    }
    const val = (deepshield as any)[task] || (deepshield.raw_task_predictions as any)?.[task];
    if (!val || val === 'unknown') return isAr ? 'غير محدد بدقة' : 'Unspecified';
    return val.replace(/_/g, ' ').replace(/-/g, ' ');
  };

  const getConf = (task: string): number | null => {
    if (fp && fp[task]?.confidence !== undefined) return fp[task].confidence;
    return deepshield.task_confidences?.[task] ?? null;
  };

  return (
    <div style={{
      marginTop: '20px',
      marginBottom: '24px',
      padding: '22px 24px',
      borderRadius: '16px',
      background: isThreat 
        ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.09) 0%, rgba(15, 23, 42, 0.95) 100%)' 
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: isThreat ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '14px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: isThreat ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isThreat ? '#fb7185' : '#818cf8',
            border: isThreat ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.12rem', color: '#ffffff' }}>
                SecureAct Horizon v3
              </span>
              <span className="badge badge-indigo" style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.25)', border: '1px solid rgba(129, 140, 248, 0.4)' }}>
                ModernBERT Multi-Task (141M)
              </span>
            </div>
            <div style={{ fontSize: '0.80rem', color: 'var(--text-dim)' }}>
              {isAr 
                ? 'نظام الاستخبارات الدلالي متعدد المهام المتقدم (ModernBERT 22-Layers + 6 Cyber Forensic Heads)' 
                : 'Advanced Multi-Task Cyber Forensic Intelligence (ModernBERT 22-Layers + 6 Cyber Forensic Heads)'}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.80rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={14} color="#38bdf8" />
            <span>{deepshield.duration_ms} ms</span>
          </span>
          <span className={`badge ${isThreat ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.88rem', padding: '6px 16px' }}>
            {isThreat ? (
              <>
                <ShieldAlert size={16} />
                <span>{isAr ? 'تهديد حقن تعليمات مكتشف' : 'Injection Threat Detected'}</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>{isAr ? 'محتوى سليم وفق التحليل الدلالي' : 'Clean / Benign Content'}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Probabilities and Threshold KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: isThreat ? '20px' : '14px'
      }}>
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
            {isAr ? 'احتمالية التهديد المحسوبة' : 'Calibrated Threat Probability'}
          </div>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: isThreat ? '#fb7185' : '#34d399' }}>
            {prob}%
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
            {isAr ? 'العتبة التشغيلية المعتمدة' : 'Operational Decision Threshold'}
          </div>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {thresh}%
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(13, 18, 31, 0.6)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
            {isAr ? 'فارق الأمان عن العتبة (Margin)' : 'Safety Margin'}
          </div>
          <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: isThreat ? '#f43f5e' : '#38bdf8' }}>
            {isThreat ? `+${(deepshield.margin * 100).toFixed(1)}%` : `${(deepshield.margin * 100).toFixed(1)}%`}
          </div>
        </div>
      </div>

      {/* SECTION A: BENIGN VERIFICATION (When Content is Safe) */}
      {!isThreat && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.07)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <CheckCircle2 size={26} color="#34d399" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff', marginBottom: '2px' }}>
              {isAr ? 'فحص دلالي سليم وموثوق (Verified Benign)' : 'Clean Semantic Scan — Verified Benign'}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {isAr 
                ? 'أكد النموذج خلو المحتوى من أي تكتيكات لتجاوز التعليمات، أو انتحال الأدوار، أو استدراج الصلاحيات، أو دس أوامر في ذيل الصفحة أو وسوم HTML.'
                : 'ModernBERT neural evaluation confirmed absence of instruction override tactics, roleplay jailbreaks, tool manipulation, or hidden document injections.'}
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: 6 CYBER THREAT FORENSIC HEADS (When Threat is Detected) */}
      {isThreat && (
        <div>
          <div style={{
            fontSize: '0.90rem',
            fontWeight: 800,
            color: '#f8fafc',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px'
          }}>
            <Crosshair size={18} color="#fb7185" />
            <span>{isAr ? 'التوصيف الجنائي والاستخباراتي للتهديد (Threat Intelligence & Forensic Profile):' : 'Threat Intelligence & Forensic Profile:'}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px'
          }}>
            {/* Card 1: Attack Technique */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(13, 18, 31, 0.65)',
              border: '1px solid rgba(244, 63, 94, 0.25)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={14} color="#fb7185" />
                <span style={{ fontWeight: 600 }}>{isAr ? 'تكتيك وأسلوب الهجوم' : 'Attack Technique'}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', wordBreak: 'break-word', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {getLabel('attack_type')}
              </div>
              {getConf('attack_type') !== null && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                  {isAr ? 'نسبة ثقة التصنيف:' : 'Confidence:'} {(getConf('attack_type')! * 100).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Card 2: Attacker Goal */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(13, 18, 31, 0.65)',
              border: '1px solid rgba(245, 158, 11, 0.25)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} color="#fbbf24" />
                <span style={{ fontWeight: 600 }}>{isAr ? 'الغاية الخبيثة للمهاجم' : "Attacker's Intent"}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', wordBreak: 'break-word', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {getLabel('goal_class')}
              </div>
              {getConf('goal_class') !== null && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                  {isAr ? 'نسبة ثقة التصنيف:' : 'Confidence:'} {(getConf('goal_class')! * 100).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Card 3: Security Risk Impact */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(13, 18, 31, 0.65)',
              border: '1px solid rgba(225, 29, 72, 0.25)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={14} color="#f43f5e" />
                <span style={{ fontWeight: 600 }}>{isAr ? 'نطاق الخطورة الأمنية' : 'Security Risk Profile'}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', wordBreak: 'break-word', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {getLabel('risk_category')}
              </div>
              {getConf('risk_category') !== null && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                  {isAr ? 'نسبة ثقة التصنيف:' : 'Confidence:'} {(getConf('risk_category')! * 100).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Card 4: Injection Vector */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(13, 18, 31, 0.65)',
              border: '1px solid rgba(6, 182, 212, 0.25)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#22d3ee" />
                <span style={{ fontWeight: 600 }}>{isAr ? 'طريقة ومكان التسلل' : 'Injection Vector / Delivery'}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', wordBreak: 'break-word', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {getLabel('injection_strategy')}
              </div>
              {getConf('injection_strategy') !== null && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                  {isAr ? 'نسبة ثقة التصنيف:' : 'Confidence:'} {(getConf('injection_strategy')! * 100).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Card 5: Linguistic Style */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(13, 18, 31, 0.65)',
              border: '1px solid rgba(168, 85, 247, 0.25)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={14} color="#c084fc" />
                <span style={{ fontWeight: 600 }}>{isAr ? 'الأسلوب والصياغة اللغوية' : 'Linguistic Style Pattern'}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', wordBreak: 'break-word', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {getLabel('linguistic_style')}
              </div>
              {getConf('linguistic_style') !== null && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                  {isAr ? 'نسبة ثقة التصنيف:' : 'Confidence:'} {(getConf('linguistic_style')! * 100).toFixed(1)}%
                </div>
              )}
            </div>

            {/* Card 6: Tool Target */}
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(13, 18, 31, 0.65)',
              border: '1px solid rgba(234, 179, 8, 0.25)'
            }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} color="#facc15" />
                <span style={{ fontWeight: 600 }}>{isAr ? 'استهداف أدوات وبرمجيات النظام' : 'Targeting Action Tools'}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff', wordBreak: 'break-word', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                {getLabel('requires_action_tools')}
              </div>
              {getConf('requires_action_tools') !== null && (
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '6px' }}>
                  {isAr ? 'نسبة ثقة التصنيف:' : 'Confidence:'} {(getConf('requires_action_tools')! * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepShieldInspector;
